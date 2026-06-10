package com.shivansh.EliteCode.service.impl;

import com.shivansh.EliteCode.dto.request.problem.CreateProblemRequest;
import com.shivansh.EliteCode.dto.request.problem.UpdateProblemRequest;
import com.shivansh.EliteCode.dto.response.common.PageResponse;
import com.shivansh.EliteCode.dto.response.problem.ProblemResponse;
import com.shivansh.EliteCode.dto.response.problem.ProblemSummaryResponse;
import com.shivansh.EliteCode.dto.response.problem.ProblemTestCaseResponse;
import com.shivansh.EliteCode.exception.CustomExceptions;
import com.shivansh.EliteCode.mapper.ProblemMapper;
import com.shivansh.EliteCode.model.Problem;
import com.shivansh.EliteCode.repository.ProblemRepository;
import com.shivansh.EliteCode.service.ProblemService;
import com.shivansh.EliteCode.util.HashUtil;
import com.shivansh.EliteCode.util.PageResponseMapper;
import com.shivansh.EliteCode.util.TextNormalizationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ProblemServiceImpl implements ProblemService {

    private final ProblemRepository problemRepository;
    private final ProblemMapper problemMapper;
    private final PageResponseMapper pageResponseMapper;
    private final ProblemNormalizationService problemNormalizationService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProblemResponse> listProblems(int page, int size,
                                                      Problem.Difficulty difficulty,
                                                      List<String> tags) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Problem> problemPage;

        boolean hasDifficulty = difficulty != null;
        boolean hasTags = tags != null && !tags.isEmpty();

        if (hasDifficulty && hasTags) {
            problemPage = problemRepository.findByDifficultyAndTagsIn(difficulty, tags, pageable);
        } else if (hasDifficulty) {
            problemPage = problemRepository.findByDifficultyAndDeletedFalse(difficulty, pageable);
        } else if (hasTags) {
            problemPage = problemRepository.findByTagsIn(tags, pageable);
        } else {
            problemPage = problemRepository.findAllByDeletedFalse(pageable);
        }

        return pageResponseMapper.toPageResponse(problemPage, problemMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ProblemResponse getById(UUID problemId) {
        return problemRepository.findByIdAndDeletedFalse(problemId)
                .map(problemMapper::toResponse)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Problem not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProblemTestCaseResponse> getTestCases(UUID problemId) {
        Problem problem = problemRepository.findByIdAndDeletedFalse(problemId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Problem not found"));
        List<Problem.TestCase> testCases = problem.getTestCases();
        if (testCases == null || testCases.isEmpty()) {
            return List.of();
        }
        return problemMapper.toTestCaseResponses(testCases);
    }

    @Override
    public ProblemResponse createProblem(CreateProblemRequest request) {
        Problem problem = new Problem();
        problem.setTitle(request.title());
        problem.setOriginalText(request.originalText());
        String normalizedText = request.normalizedText();
        if (normalizedText == null || normalizedText.isBlank()) {
            normalizedText = TextNormalizationUtil.normalize(request.originalText());
        }
        problem.setNormalizedText(normalizedText);
        problem.setDifficulty(request.difficulty() == null ? Problem.Difficulty.MEDIUM : request.difficulty());
        problem.setTags(request.tags() == null ? new LinkedHashSet<>() : new LinkedHashSet<>(request.tags()));
        problem.setHash(resolveHash(request));
        if (request.testCases() != null) {
            problem.setTestCases(new ArrayList<>(request.testCases()));
        }
        Problem saved = problemRepository.save(problem);
        problemNormalizationService.normalizeAsync(saved.getId());
        return problemMapper.toResponse(saved);
    }

    private String resolveHash(CreateProblemRequest request) {
        return resolveHash(request.title(), request.originalText(), request.difficulty(), request.tags());
    }

    private String resolveHash(Problem problem) {
        return resolveHash(problem.getTitle(), problem.getOriginalText(), problem.getDifficulty(), problem.getTags());
    }

    private String resolveHash(String title, String originalText, Problem.Difficulty difficulty, Set<String> tags) {
        String payload = String.join("|",
                Objects.toString(title, ""),
                Objects.toString(originalText, ""),
                Objects.toString(difficulty, ""),
                tags == null ? "" : tags.stream().sorted().reduce("", (a, b) -> a + "," + b)
        );
        return HashUtil.sha256(payload);
    }

    @Override
    public ProblemResponse updateProblem(UUID problemId, UpdateProblemRequest request) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Problem not found"));
        if (problem.isDeleted()) {
            throw new CustomExceptions.BadRequestException("Problem is deleted");
        }

        if (request.title() != null) {
            problem.setTitle(request.title());
        }
        if (request.originalText() != null) {
            problem.setOriginalText(request.originalText());
        }
        if (request.normalizedText() != null) {
            problem.setNormalizedText(request.normalizedText());
        } else if (request.originalText() != null) {
            problem.setNormalizedText(TextNormalizationUtil.normalize(request.originalText()));
        }
        if (request.difficulty() != null) {
            problem.setDifficulty(request.difficulty());
        }
        if (request.tags() != null) {
            problem.setTags(new LinkedHashSet<>(request.tags()));
        }
        if (request.testCases() != null) {
            problem.setTestCases(new ArrayList<>(request.testCases()));
        }

        problem.setHash(resolveHash(problem));
        Problem saved = problemRepository.save(problem);
        if (request.originalText() != null && (request.normalizedText() == null || request.normalizedText().isBlank())) {
            problemNormalizationService.normalizeAsync(saved.getId());
        }
        return problemMapper.toResponse(saved);
    }

    @Override
    public void deleteProblem(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Problem not found"));
        if (!problem.isDeleted()) {
            problem.setDeleted(true);
            problem.setDeletedAt(java.time.LocalDateTime.now());
            problemRepository.save(problem);
        }
    }
    
    @Override
    public PageResponse<ProblemSummaryResponse> listProblemSummaries(int page, int size,
                                                                     Problem.Difficulty difficulty,
                                                                     String title,
                                                                     List<String> tags,
                                                                     Sort sort) {
        var pageable = PageRequest.of(page, size, sort);
        Page<Problem> problemPage;

        boolean hasTitle = title != null && !title.isBlank();
        boolean hasDifficulty = difficulty != null;
        boolean hasTags = tags != null && !tags.isEmpty();

        if (hasTitle) {
            problemPage = problemRepository.findAllByFilters(difficulty, title, pageable);
        } else if (hasDifficulty && hasTags) {
            problemPage = problemRepository.findByDifficultyAndTagsIn(difficulty, tags, pageable);
        } else if (hasDifficulty) {
            problemPage = problemRepository.findByDifficultyAndDeletedFalse(difficulty, pageable);
        } else if (hasTags) {
            problemPage = problemRepository.findByTagsIn(tags, pageable);
        } else {
            problemPage = problemRepository.findAllByDeletedFalse(pageable);
        }

        return pageResponseMapper.toPageResponse(problemPage, ProblemSummaryResponse::from);
    }
}