package com.shivansh.EliteCode.dto.request.auth;

import jakarta.validation.constraints.NotBlank;

public record GoogleOAuthRequest(
        @NotBlank(message = "idToken is required")
        String idToken,
        String totpCode
) {
}

