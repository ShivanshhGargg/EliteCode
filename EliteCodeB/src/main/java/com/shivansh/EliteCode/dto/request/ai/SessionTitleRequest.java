package com.shivansh.EliteCode.dto.request.ai;

import com.shivansh.EliteCode.model.Mode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SessionTitleRequest(
        @NotNull Mode mode,
        String problemTitle,
        @NotBlank String conversation
) {
}
