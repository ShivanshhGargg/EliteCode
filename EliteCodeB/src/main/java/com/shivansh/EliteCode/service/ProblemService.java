package com.shivansh.EliteCode.service;

import com.shivansh.EliteCode.dto.response.common.PageResponse;
import com.shivansh.EliteCode.dto.response.problem.ProblemResponse;
import com.shivansh.EliteCode.dto.response.problem.ProblemSummaryResponse;
import com.shivansh.EliteCode.dto.response.problem.ProblemTestCaseResponse;
import com.shivansh.EliteCode.model.Problem.Difficulty;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.UUID;

public interface ProblemService {

    PageResponse<ProblemResponse> listProblems(int page, int size,
                                               Difficulty difficulty,
                                               List<String> tags);

    ProblemResponse getById(UUID problemId);

    List<ProblemTestCaseResponse> getTestCases(UUID problemId);

    ProblemResponse createProblem(com.shivansh.EliteCode.dto.request.problem.CreateProblemRequest request);

    ProblemResponse updateProblem(UUID problemId, com.shivansh.EliteCode.dto.request.problem.UpdateProblemRequest request);

    void deleteProblem(UUID problemId);

    PageResponse<ProblemSummaryResponse> listProblemSummaries(int page, int size,
                                                              Difficulty difficulty,
                                                              String title,
                                                              List<String> tags, Sort sort);

}