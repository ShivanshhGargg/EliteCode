package com.shivansh.EliteCode.dto.request.execution;

import com.shivansh.EliteCode.model.Language;
import com.shivansh.EliteCode.model.Mode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CodeExecutionRequest(
        @NotNull UUID problemId,
        @NotNull Mode mode,
        @NotNull Language language,   // new
        @NotBlank String code,
        String input
) {}
