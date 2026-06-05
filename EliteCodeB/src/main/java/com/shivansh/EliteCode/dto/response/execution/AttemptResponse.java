package com.shivansh.EliteCode.dto.response.execution;

import com.shivansh.EliteCode.model.Attempt;
import com.shivansh.EliteCode.model.Mode;
import java.time.LocalDateTime;
import java.util.UUID;

public record AttemptResponse(
        UUID id,
        UUID userId,
        UUID problemId,
        Mode mode,
        Attempt.AttemptStatus status,
        Attempt.AttemptResult result,
        double executionTime,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
