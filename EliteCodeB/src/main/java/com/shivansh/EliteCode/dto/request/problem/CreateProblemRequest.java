package com.shivansh.EliteCode.dto.request.problem;

import com.shivansh.EliteCode.model.Problem;
import jakarta.validation.constraints.NotBlank;
import java.util.Set;
import java.util.List;

public record CreateProblemRequest(
        @NotBlank String title,
        @NotBlank String originalText,
        String normalizedText,
        Problem.Difficulty difficulty,
        Set<String> tags,
        List<Problem.TestCase> testCases
) {
}
