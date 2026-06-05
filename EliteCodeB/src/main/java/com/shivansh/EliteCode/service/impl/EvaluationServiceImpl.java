package com.shivansh.EliteCode.service.impl;

import com.shivansh.EliteCode.dto.response.execution.AttemptResponse;
import com.shivansh.EliteCode.exception.CustomExceptions;
import com.shivansh.EliteCode.execution.CodeExecutor;
import com.shivansh.EliteCode.execution.ExecutionResult;
import com.shivansh.EliteCode.mapper.AttemptMapper;
import com.shivansh.EliteCode.model.Attempt;
import com.shivansh.EliteCode.model.Language;
import com.shivansh.EliteCode.model.Problem;
import com.shivansh.EliteCode.repository.AttemptRepository;
import com.shivansh.EliteCode.service.EvaluationService;
import com.shivansh.EliteCode.service.ProgressService;
import com.shivansh.EliteCode.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class EvaluationServiceImpl implements EvaluationService {

    private final AttemptRepository attemptRepository;
    private final ProgressService progressService;
    private final FeedbackService feedbackService;
    private final AttemptMapper attemptMapper;
    private final CodeExecutor codeExecutor;

    @Async("evaluationExecutor")
    @Retryable(retryFor = {RuntimeException.class}, backoff = @Backoff(delay = 1000))
    @Override
    public CompletableFuture<AttemptResponse> evaluateAttemptAsync(UUID attemptId) {
        log.info("=== ASYNC EVAL STARTED for attempt {} ===", attemptId);

        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Attempt not found"));

        attempt.setStatus(Attempt.AttemptStatus.RUNNING);
        attempt = attemptRepository.save(attempt);
        log.info("Attempt {} set to RUNNING", attemptId);

        try {
            Problem problem = attempt.getProblem();
            List<Problem.TestCase> testCases = problem.getTestCases();
            Language language = attempt.getLanguage();

            log.info("Problem: {}, Language: {}, Test cases: {}",
                    problem.getId(), language, testCases == null ? 0 : testCases.size());

            if (testCases == null || testCases.isEmpty()) {
                log.warn("No test cases for problem {}", problem.getId());
                attempt.setResult(Attempt.AttemptResult.RUNTIME_ERROR);
                attempt.setStatus(Attempt.AttemptStatus.FAILED);
                attempt.setExecutionTime(0.0);
                attemptRepository.save(attempt);
                return CompletableFuture.completedFuture(attemptMapper.toResponse(attempt));
            }

            long totalExecutionTimeNanos = 0;
            Attempt.AttemptResult finalResult = Attempt.AttemptResult.ACCEPTED;

            for (int i = 0; i < testCases.size(); i++) {
                Problem.TestCase testCase = testCases.get(i);
                String input = testCase.getInput() == null ? "" : testCase.getInput();
                String expected = testCase.getExpectedOutput() == null ? "" : testCase.getExpectedOutput().trim();

                log.info("Running test case {}: input='{}', expected='{}'", i + 1, input, expected);

                ExecutionResult execResult = codeExecutor.execute(
                        attempt.getCode(),
                        input,
                        language,
                        5L
                );

                log.info("Execution result: success={}, timeout={}, output='{}', error='{}'",
                        execResult.success(), execResult.timeout(), execResult.output(), execResult.error());

                totalExecutionTimeNanos += execResult.executionTimeMs() * 1_000_000L;

                if (execResult.timeout()) {
                    finalResult = Attempt.AttemptResult.TIME_LIMIT_EXCEEDED;
                    log.warn("Test case {} timed out", i + 1);
                    break;
                }

                if (!execResult.success()) {
                    finalResult = Attempt.AttemptResult.COMPILATION_ERROR;
                    log.warn("Test case {} failed: {}", i + 1, execResult.error());
                    break;
                }

                String actualOutput = execResult.output() == null ? "" : execResult.output().trim();
                if (!actualOutput.equals(expected)) {
                    finalResult = Attempt.AttemptResult.WRONG_ANSWER;
                    log.warn("Test case {} wrong answer. Expected '{}', got '{}'", i + 1, expected, actualOutput);
                    break;
                }
            }

            double executionTimeSec = totalExecutionTimeNanos / 1_000_000_000.0;
            attempt.setExecutionTime(executionTimeSec);
            attempt.setResult(finalResult);
            attempt.setStatus(Attempt.AttemptStatus.COMPLETED);
            attempt = attemptRepository.save(attempt);
            log.info("Evaluation completed for attempt {} with result {}", attemptId, finalResult);

            progressService.updateAfterAttempt(attempt.getUser().getId(), attempt.getId());

            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    feedbackService.createForAttemptAsync(attemptId);
                }
            });

            return CompletableFuture.completedFuture(attemptMapper.toResponse(attempt));

        } catch (Exception ex) {  // <-- THIS IS THE CRITICAL FIX
            log.error("!!! FATAL ERROR in async evaluation for attempt {} !!!", attemptId, ex);
            attempt.setStatus(Attempt.AttemptStatus.FAILED);
            attempt.setResult(Attempt.AttemptResult.RUNTIME_ERROR);
            attempt.setExecutionTime(0.0);
            attemptRepository.save(attempt);
            return CompletableFuture.completedFuture(attemptMapper.toResponse(attempt));
        }
    }
}