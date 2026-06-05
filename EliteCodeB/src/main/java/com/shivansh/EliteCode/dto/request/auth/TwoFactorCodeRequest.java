package com.shivansh.EliteCode.dto.request.auth;

import jakarta.validation.constraints.NotBlank;

public record TwoFactorCodeRequest(
        @NotBlank(message = "TOTP code is required")
        String totpCode
) {
}

