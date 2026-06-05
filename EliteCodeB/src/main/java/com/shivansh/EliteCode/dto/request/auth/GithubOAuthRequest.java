package com.shivansh.EliteCode.dto.request.auth;

import jakarta.validation.constraints.NotBlank;

public record GithubOAuthRequest(
        @NotBlank(message = "accessToken is required")
        String accessToken,
        String totpCode
) {
}

