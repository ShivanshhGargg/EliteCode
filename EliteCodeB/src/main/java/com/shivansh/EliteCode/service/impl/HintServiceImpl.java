package com.shivansh.EliteCode.service.impl;

import com.shivansh.EliteCode.dto.request.ai.SessionTitleRequest;
import com.shivansh.EliteCode.dto.request.execution.HintRequest;
import com.shivansh.EliteCode.dto.response.ai.SessionTitleResponse;
import com.shivansh.EliteCode.dto.response.execution.HintResponse;
import com.shivansh.EliteCode.exception.CustomExceptions;
import com.shivansh.EliteCode.mapper.HintMapper;
import com.shivansh.EliteCode.model.AIResponse;
import com.shivansh.EliteCode.model.Attempt;
import com.shivansh.EliteCode.model.Problem;
import com.shivansh.EliteCode.repository.AIResponseRepository;
import com.shivansh.EliteCode.repository.AttemptRepository;
import com.shivansh.EliteCode.repository.ProblemRepository;
import com.shivansh.EliteCode.service.AiService;
import com.shivansh.EliteCode.service.HintService;
import com.shivansh.EliteCode.util.CodeSanitizer;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class HintServiceImpl implements HintService {

    private final ProblemRepository problemRepository;
    private final AttemptRepository attemptRepository;
    private final AIResponseRepository aiResponseRepository;
    private final AiService aiService;
    private final HintMapper hintMapper;

    @Override
    public HintResponse generateHint(UUID userId, HintRequest request) {
        Problem problem = null;
        if (request.problemId() != null) {
            problem = problemRepository.findById(request.problemId())
                    .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Problem not found"));
        }

        Attempt attempt = null;
        if (request.attemptId() != null) {
            attempt = attemptRepository.findById(request.attemptId())
                    .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Attempt not found"));
            if (!attempt.getUser().getId().equals(userId)) {
                throw new CustomExceptions.BadRequestException("Attempt does not belong to the current user");
            }
        }

        String context = buildContext(request);
        String hint = aiService.ask(problem == null ? null : problem.getId(), request.mode(), context);

        AIResponse response = new AIResponse();
        response.setProblem(problem);
        response.setAttempt(attempt);
        response.setMode(request.mode());
        response.setResponse(hint);
        response = aiResponseRepository.save(response);

        return hintMapper.toResponse(response);
    }

    @Override
    public SessionTitleResponse generateSessionTitle(UUID userId, SessionTitleRequest request) {
        String title = aiService.generateSessionTitle(
                request.mode(),
                request.problemTitle(),
                request.conversation()
        );
        return new SessionTitleResponse(title);
    }

    private String buildContext(HintRequest request) {
        StringBuilder builder = new StringBuilder();
        builder.append("Current approach:\n").append(CodeSanitizer.sanitizeCode(request.currentApproach()));
        if (request.specificQuestion() != null && !request.specificQuestion().isBlank()) {
            builder.append("\nSpecific question:\n").append(CodeSanitizer.sanitizeInput(request.specificQuestion()));
        }
        return builder.toString();
    }
}
