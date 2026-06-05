package com.shivansh.EliteCode.service.impl;

import com.shivansh.EliteCode.dto.response.execution.AiFeedbackResponse;
import com.shivansh.EliteCode.exception.CustomExceptions;
import com.shivansh.EliteCode.mapper.AiFeedbackMapper;
import com.shivansh.EliteCode.model.Attempt;
import com.shivansh.EliteCode.model.Feedback;
import com.shivansh.EliteCode.model.Mode;
import com.shivansh.EliteCode.repository.AttemptRepository;
import com.shivansh.EliteCode.repository.FeedbackRepository;
import com.shivansh.EliteCode.service.AiService;
import com.shivansh.EliteCode.service.FeedbackService;
import com.shivansh.EliteCode.util.CodeSanitizer;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Async;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final AttemptRepository attemptRepository;
    private final AiService aiService;
    private final AiFeedbackMapper aiFeedbackMapper;

    private void createForAttempt(UUID attemptId) {
        feedbackRepository.findByAttemptId(attemptId)
                .map(aiFeedbackMapper::toResponse)
                .orElseGet(() -> {
                    Attempt attempt = attemptRepository.findById(attemptId)
                            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Attempt not found"));

                    Feedback feedback = new Feedback();
                    feedback.setAttempt(attempt);
                    feedback.setScore(scoreFor(attempt));
                    feedback.setAiFeedback(aiService.ask(
                            attempt.getProblem().getId(),
                            Mode.STANDARD,
                            buildContext(attempt)
                    ));
                    feedback = feedbackRepository.save(feedback);
                    return aiFeedbackMapper.toResponse(feedback);
                });
    }

    @Override
    @Async("evaluationExecutor")
    public void createForAttemptAsync(UUID attemptId) {
        try {
            createForAttempt(attemptId);
        } catch (Exception ex) {
            log.error("Failed to generate feedback for attempt {}", attemptId, ex);
        }
    }

    private int scoreFor(Attempt attempt) {
        return switch (attempt.getResult() == null ? Attempt.AttemptResult.COMPILATION_ERROR : attempt.getResult()) {
            case ACCEPTED -> 100;
            case WRONG_ANSWER -> 65;
            case TIME_LIMIT_EXCEEDED -> 45;
            case MEMORY_LIMIT_EXCEEDED -> 50;
            case RUNTIME_ERROR -> 35;
            case COMPILATION_ERROR -> 20;
        };
    }

    private String buildContext(Attempt attempt) {
        return "Attempt status: " + attempt.getStatus()
                + "\nResult: " + attempt.getResult()
                + "\nCode:\n" + CodeSanitizer.sanitizeCode(attempt.getCode());
    }

    @Override
    @Transactional(readOnly = true)
    public AiFeedbackResponse getByAttemptIdForUser(UUID attemptId, UUID userId) {
        Feedback feedback = feedbackRepository.findByAttemptId(attemptId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Feedback not found"));
        if (!feedback.getAttempt().getUser().getId().equals(userId)) {
            throw new CustomExceptions.BadRequestException("Access denied to feedback");
        }
        return aiFeedbackMapper.toResponse(feedback);
    }
}
