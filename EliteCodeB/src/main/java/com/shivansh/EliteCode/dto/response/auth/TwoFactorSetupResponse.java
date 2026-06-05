package com.shivansh.EliteCode.dto.response.auth;

public record TwoFactorSetupResponse(
        String secret,
        String otpauthUrl
) {
}

