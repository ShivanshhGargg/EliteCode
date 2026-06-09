package com.shivansh.EliteCode.dto.request.chat;

import com.shivansh.EliteCode.model.Mode;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateSessionRequest(
        @NotNull Mode mode,
        UUID problemId,
        String title
) {}