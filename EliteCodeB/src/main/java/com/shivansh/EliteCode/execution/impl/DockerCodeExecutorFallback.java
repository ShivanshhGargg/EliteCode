package com.shivansh.EliteCode.execution.impl;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.model.Bind;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.Ulimit;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.transport.DockerHttpClient;
import com.github.dockerjava.zerodep.ZerodepDockerHttpClient;
import com.shivansh.EliteCode.execution.CodeExecutor;
import com.shivansh.EliteCode.execution.ExecutionResult;
import com.shivansh.EliteCode.model.Language;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service("dockerCodeExecutorFallback")
@Slf4j
public class DockerCodeExecutorFallback implements CodeExecutor {

    private volatile DockerClient dockerClient;
    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 1000;

    private DockerClient getDockerClient() {
        if (dockerClient != null) {
            return dockerClient;
        }
        synchronized (this) {
            if (dockerClient == null) {
                for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                    try {
                        String dockerHost = System.getenv("DOCKER_HOST");
                        if (dockerHost == null || dockerHost.isBlank()) {
                            dockerHost = "unix:///var/run/docker.sock";
                        }
                        DockerClientConfig config = DefaultDockerClientConfig.createDefaultConfigBuilder()
                                .withDockerHost(dockerHost)
                                .build();
                        ZerodepDockerHttpClient.Builder httpClientBuilder = new ZerodepDockerHttpClient.Builder()
                                .dockerHost(URI.create(dockerHost));
                        // Optional: add connect timeout if available; skip if not to avoid compilation error
                        // httpClientBuilder.connectTimeout(Duration.ofSeconds(5));
                        DockerHttpClient httpClient = httpClientBuilder.build();
                        dockerClient = DockerClientImpl.getInstance(config, httpClient);
                        dockerClient.pingCmd().exec();
                        log.info("Docker client initialized on attempt {}", attempt);
                        break;
                    } catch (Exception ex) {
                        log.warn("Docker init attempt {} failed: {}", attempt, ex.getMessage());
                        if (attempt == MAX_RETRIES) {
                            log.error("Failed to initialize Docker client after {} attempts", MAX_RETRIES, ex);
                        } else {
                            try { Thread.sleep(RETRY_DELAY_MS); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                        }
                    }
                }
            }
        }
        return dockerClient;
    }

    @Override
    public ExecutionResult execute(String code, String input, Language language, long timeoutSeconds) {
        DockerClient client = getDockerClient();
        if (client == null) {
            return new ExecutionResult(null, "Docker client unavailable", 0, false, false);
        }
        String sessionId = UUID.randomUUID().toString();
        Path hostWorkDir = null;
        String containerId = null;

        try {
            hostWorkDir = Files.createTempDirectory("elitecode-" + sessionId);
            String filename = language.getFileName() + language.getFileExtension();
            Path codeFile = hostWorkDir.resolve(filename);
            Files.writeString(codeFile, code);

            if (input != null && !input.isBlank()) {
                Files.writeString(hostWorkDir.resolve("input.txt"), input);
            }

            String runCmd = language.getRunCommand();
            if (input != null && !input.isBlank()) {
                runCmd = runCmd + " < input.txt";
            }

            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withBinds(Bind.parse(hostWorkDir.toAbsolutePath() + ":/code"))
                    .withMemory(256L * 1024 * 1024)
                    .withCpuCount(1L)
                    .withNetworkMode("none")
                    .withUlimits(List.of(new Ulimit("nproc", 64L, 64L))); // fixed: pass list

            CreateContainerResponse container = client.createContainerCmd(language.getDockerImage())
                    .withHostConfig(hostConfig)
                    .withWorkingDir("/code")
                    .withCmd("sh", "-c", runCmd)
                    .exec();

            containerId = container.getId();
            long startNs = System.nanoTime();
            client.startContainerCmd(containerId).exec();

            boolean finished = client.waitContainerCmd(containerId)
                    .start()
                    .awaitCompletion(timeoutSeconds, TimeUnit.SECONDS);

            long execTimeMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startNs);

            if (!finished) {
                client.killContainerCmd(containerId).exec();
                return new ExecutionResult(null, "Time limit exceeded", execTimeMs, false, true);
            }

            ByteArrayOutputStream stdout = new ByteArrayOutputStream();
            ByteArrayOutputStream stderr = new ByteArrayOutputStream();

            // Explicit generic type to avoid inference issues
            com.github.dockerjava.api.async.ResultCallback.Adapter<com.github.dockerjava.api.model.Frame> callback =
                    new com.github.dockerjava.api.async.ResultCallback.Adapter<>() {
                        @Override
                        public void onNext(com.github.dockerjava.api.model.Frame frame) {
                            if (frame.getStreamType() == com.github.dockerjava.api.model.StreamType.STDOUT) {
                                stdout.writeBytes(frame.getPayload());
                            } else if (frame.getStreamType() == com.github.dockerjava.api.model.StreamType.STDERR) {
                                stderr.writeBytes(frame.getPayload());
                            }
                        }
                    };

            client.logContainerCmd(containerId)
                    .withStdOut(true)
                    .withStdErr(true)
                    .exec(callback)
                    .awaitCompletion();

            String output = stdout.toString(StandardCharsets.UTF_8);
            String error = stderr.toString(StandardCharsets.UTF_8);
            boolean success = error == null || error.isBlank();

            return new ExecutionResult(output, error, execTimeMs, success, false);

        } catch (Exception e) {
            log.error("Docker execution failed", e);
            return new ExecutionResult(null, e.getMessage(), 0, false, false);
        } finally {
            try {
                if (containerId != null) {
                    try { client.killContainerCmd(containerId).exec(); } catch (Exception ignored) {}
                    try { client.removeContainerCmd(containerId).withForce(true).exec(); } catch (Exception ignored) {}
                }
                if (hostWorkDir != null) {
                    Files.walk(hostWorkDir)
                            .sorted((a, b) -> -a.compareTo(b))
                            .forEach(path -> {
                                try { Files.deleteIfExists(path); } catch (Exception ignored) {}
                            });
                }
            } catch (Exception e) {
                log.warn("Cleanup failed", e);
            }
        }
    }
}