package com.shivansh.EliteCode.dto.request.execution;

import com.shivansh.EliteCode.model.Mode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record HintRequest(
        UUID problemId,
        UUID attemptId,
        @NotNull Mode mode,
        @NotBlank String currentApproach,
        String specificQuestion
) {
}
