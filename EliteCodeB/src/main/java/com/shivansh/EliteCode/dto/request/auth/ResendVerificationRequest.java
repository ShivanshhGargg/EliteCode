package com.shivansh.EliteCode.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResendVerificationRequest(
        @NotBlank @Email(message = "Invalid email format")
        @Size(max = 150, message = "Email must be at most 150 characters")
        String email
) {
}

