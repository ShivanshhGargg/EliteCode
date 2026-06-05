package com.shivansh.EliteCode.dto.response.user;

import com.shivansh.EliteCode.model.Account;
import java.time.LocalDateTime;
import java.util.UUID;

public record AccountResponse(
        UUID id,
        String provider,
        String providerId,
        Account.Role role,
        boolean emailVerified,
        boolean twoFactorEnabled,
        LocalDateTime createdAt,
        LocalDateTime lastLoginAt
) {
}
