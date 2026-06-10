package com.shivansh.EliteCode.dto.response.problem;

import com.shivansh.EliteCode.model.Problem;
import java.util.Set;
import java.util.UUID;

public record ProblemSummaryResponse(
        UUID id,
        String title,
        Problem.Difficulty difficulty,
        Set<String> tags
) {
    public static ProblemSummaryResponse from(Problem problem) {
        return new ProblemSummaryResponse(
                problem.getId(),
                problem.getTitle(),
                problem.getDifficulty(),
                problem.getTags()
        );
    }
}