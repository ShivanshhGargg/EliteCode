package com.shivansh.EliteCode.dto.response.user;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserProgressResponse(
        UUID id,
        UUID userId,
        String topic,
        int attempts,
        double successRate,
        LocalDateTime lastPracticed,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
