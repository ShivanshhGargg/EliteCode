package com.shivansh.EliteCode.service.impl;

import com.shivansh.EliteCode.dto.request.execution.CodeExecutionRequest;
import com.shivansh.EliteCode.dto.response.common.PageResponse;
import com.shivansh.EliteCode.dto.response.execution.AttemptResponse;
import com.shivansh.EliteCode.exception.CustomExceptions;
import com.shivansh.EliteCode.mapper.AttemptMapper;
import com.shivansh.EliteCode.model.Attempt;
import com.shivansh.EliteCode.model.Problem;
import com.shivansh.EliteCode.model.User;
import com.shivansh.EliteCode.repository.AttemptRepository;
import com.shivansh.EliteCode.repository.ProblemRepository;
import com.shivansh.EliteCode.repository.UserRepository;
import com.shivansh.EliteCode.service.AttemptService;
import com.shivansh.EliteCode.service.EvaluationService;
import com.shivansh.EliteCode.util.CodeSanitizer;
import com.shivansh.EliteCode.util.PageResponseMapper;
import java.util.UUID;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class AttemptServiceImpl implements AttemptService {

    private final AttemptRepository attemptRepository;
    private final UserRepository userRepository;
    private final ProblemRepository problemRepository;
    private final EvaluationService evaluationService;
    private final AttemptMapper attemptMapper;
    private final PageResponseMapper pageResponseMapper;

    @Override
    public AttemptResponse submitCode(UUID userId, CodeExecutionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found"));
        Problem problem = problemRepository.findById(request.problemId())
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Problem not found"));

        Attempt attempt = new Attempt();
        attempt.setUser(user);
        attempt.setProblem(problem);
        attempt.setMode(request.mode());
        attempt.setCode(CodeSanitizer.sanitizeCode(request.code()));
        attempt.setLanguage(request.language());
        attempt.setStatus(Attempt.AttemptStatus.PENDING);
        attempt.setExecutionTime(0.0);
        attempt = attemptRepository.save(attempt);

        final UUID attemptId = attempt.getId();
        log.info("Registering afterCommit synchronization for attempt {}", attemptId);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                log.info("afterCommit triggered for attempt {}", attemptId);
                evaluationService.evaluateAttemptAsync(attemptId);
            }
        });

        return attemptMapper.toResponse(attempt);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AttemptResponse> listUserAttempts(UUID userId, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return pageResponseMapper.toPageResponse(
                attemptRepository.findByUserId(userId, pageable),
                attemptMapper::toResponse
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AttemptResponse getByIdForUser(UUID attemptId, UUID userId) {
        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Attempt not found"));
        if (!attempt.getUser().getId().equals(userId)) {
            throw new CustomExceptions.BadRequestException("Access denied to this attempt");
        }
        return attemptMapper.toResponse(attempt);
    }
}
