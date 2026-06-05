package com.shivansh.EliteCode.dto.response.problem;

import com.shivansh.EliteCode.model.Problem;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

public record ProblemResponse(
        UUID id,
        String title,
        String originalText,
        String normalizedText,
        String hash,
        Problem.Difficulty difficulty,
        Set<String> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
