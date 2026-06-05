package com.shivansh.EliteCode.dto.response.auth;

import java.util.UUID;

public record AccessTokenResponse(
        String accessToken,
        String tokenType,
        Long expiresIn,
        UUID userId,
        String email,
        String firstName,
        String lastName
) {}
