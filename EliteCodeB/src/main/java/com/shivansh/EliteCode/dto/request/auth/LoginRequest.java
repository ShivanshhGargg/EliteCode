package com.shivansh.EliteCode.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank @Email(message = "Invalid email format") String email,
        @NotBlank(message = "Password is required") String password,
        String totpCode
) {
}
