package com.shivansh.EliteCode.execution.impl;

import com.shivansh.EliteCode.execution.CodeExecutor;
import com.shivansh.EliteCode.execution.ExecutionResult;
import com.shivansh.EliteCode.model.Language;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

@Service("wandboxCodeExecutor")
@Primary
@Slf4j
public class WandboxCodeExecutor implements CodeExecutor {

    private final RestClient restClient;

    // Map of supported languages to Wandbox compiler identifiers
    private static final Map<Language, String> COMPILER_MAP = Map.of(
            Language.JAVA, "java-17.0.2",
            Language.PYTHON, "cpython-3.10.0",
            Language.JAVASCRIPT, "nodejs-18.15.0",
            Language.CPP, "gcc-12.1.0"
    );

    public WandboxCodeExecutor() {
        this.restClient = RestClient.builder()
                .baseUrl("https://wandbox.org/api")
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    @Override
    public ExecutionResult execute(String code, String input, Language language, long timeoutSeconds) {
        String compiler = COMPILER_MAP.get(language);
        if (compiler == null) {
            log.warn("Unsupported language: {}", language);
            return new ExecutionResult(null, "Language " + language + " is not supported by Wandbox", 0, false, false);
        }

        Map<String, Object> requestBody = Map.of(
                "compiler", compiler,
                "code", code,
                "stdin", input != null ? input : "",
                "save", false
        );

        try {
            log.info("Executing code on Wandbox for language: {}", language);
            WandboxResponse response = restClient.post()
                    .uri("/compile.json")
                    .body(requestBody)
                    .retrieve()
                    .body(WandboxResponse.class);

            if (response == null) {
                return new ExecutionResult(null, "Empty response from Wandbox", 0, false, false);
            }

            if (response.compilerError != null && !response.compilerError.isBlank()) {
                log.warn("Compilation error: {}", response.compilerError);
                return new ExecutionResult(null, response.compilerError, 0, false, false);
            }

            if (response.programError != null && !response.programError.isBlank()) {
                log.warn("Runtime error: {}", response.programError);
                return new ExecutionResult(null, response.programError, 0, false, false);
            }

            String output = response.programOutput != null ? response.programOutput : "";
            boolean success = "0".equals(response.status) || response.status == null;
            log.info("Execution completed with status: {}", response.status);
            return new ExecutionResult(output, null, 0, success, false);

        } catch (RestClientException e) {
            log.error("Failed to call Wandbox API: {}", e.getMessage(), e);
            return new ExecutionResult(null, "Wandbox API error: " + e.getMessage(), 0, false, false);
        } catch (Exception e) {
            log.error("Unexpected error during Wandbox execution: {}", e.getMessage(), e);
            return new ExecutionResult(null, "Internal error: " + e.getMessage(), 0, false, false);
        }
    }

    private record WandboxResponse(
            String status,
            String signal,
            String compilerOutput,
            String compilerError,
            String compilerMessage,
            String programOutput,
            String programError,
            String programMessage
    ) {}
}