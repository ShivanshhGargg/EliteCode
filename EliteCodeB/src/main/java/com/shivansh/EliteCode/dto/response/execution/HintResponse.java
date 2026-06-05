package com.shivansh.EliteCode.dto.response.execution;

import com.shivansh.EliteCode.model.Mode;
import java.time.LocalDateTime;
import java.util.UUID;

public record HintResponse(
        UUID aiResponseId,
        UUID problemId,
        UUID attemptId,
        Mode mode,
        String hint,
        LocalDateTime createdAt
) {
}
