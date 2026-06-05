package com.shivansh.EliteCode.dto.response.auth;

import java.util.UUID;

public record TokenPair(
        String accessToken,
        String tokenType,
        Long expiresIn,
        String refreshToken,
        UUID userId,
        String email
) {}