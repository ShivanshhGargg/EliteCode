package com.shivansh.EliteCode.dto.response.execution;

import java.time.LocalDateTime;
import java.util.UUID;

public record AiFeedbackResponse(
        UUID id,
        UUID attemptId,
        String aiFeedback,
        int score,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
