package com.shivansh.EliteCode.dto.request.chat;

import jakarta.validation.constraints.NotBlank;

public record TitleRequest(
        @NotBlank String title
) {}