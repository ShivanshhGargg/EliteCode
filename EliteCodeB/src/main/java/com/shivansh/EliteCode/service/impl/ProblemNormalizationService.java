package com.shivansh.EliteCode.service.impl;

import com.shivansh.EliteCode.exception.CustomExceptions;
import com.shivansh.EliteCode.model.Mode;
import com.shivansh.EliteCode.model.Problem;
import com.shivansh.EliteCode.repository.ProblemRepository;
import com.shivansh.EliteCode.service.AiService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProblemNormalizationService {

    private final ProblemRepository problemRepository;
    private final AiService aiService;

    @Value("${elitecode.ai.normalize.enabled:false}")
    private boolean normalizationEnabled;

    @Value("${elitecode.ai.normalize.prompt:Rewrite the problem statement into a clear, canonical description with concise wording.}")
    private String normalizePrompt;

    @Async("evaluationExecutor")
    @Transactional
    public void normalizeAsync(UUID problemId) {
        if (!normalizationEnabled) {
            return;
        }
        try {
            Problem problem = problemRepository.findById(problemId)
                    .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Problem not found"));
            if (problem.isDeleted()) {
                return;
            }
            String result = aiService.ask(problemId, Mode.STANDARD, normalizePrompt);
            if (result != null && !result.isBlank()) {
                problem.setNormalizedText(result.trim());
                problemRepository.save(problem);
            }
        } catch (Exception ex) {
            log.error("Failed to normalize problem {}", problemId, ex);
        }
    }
}

