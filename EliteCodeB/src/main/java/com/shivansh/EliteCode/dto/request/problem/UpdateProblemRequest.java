package com.shivansh.EliteCode.dto.request.problem;

import com.shivansh.EliteCode.model.Problem;
import java.util.List;
import java.util.Set;

public record UpdateProblemRequest(
        String title,
        String originalText,
        String normalizedText,
        Problem.Difficulty difficulty,
        Set<String> tags,
        List<Problem.TestCase> testCases
) {
}
