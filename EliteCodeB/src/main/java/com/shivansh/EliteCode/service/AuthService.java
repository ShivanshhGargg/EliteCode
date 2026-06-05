package com.shivansh.EliteCode.service;

import com.shivansh.EliteCode.dto.request.auth.LoginRequest;
import com.shivansh.EliteCode.dto.request.auth.RegisterRequest;
import com.shivansh.EliteCode.dto.response.auth.TokenPair;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public interface AuthService {
    TokenPair login(LoginRequest request);
    void register(RegisterRequest request);
    TokenPair refreshToken(String refreshToken);
    void verifyEmail(String token);
    void resendVerificationEmail(String email);
    void requestPasswordReset(String email);
    void resetPassword(String token, String newPassword);
    TokenPair loginWithGoogle(String idToken, String totpCode);
    TokenPair loginWithGithub(String accessToken, String totpCode);
    com.shivansh.EliteCode.dto.response.auth.TwoFactorSetupResponse setupTwoFactor(java.util.UUID userId);
    void enableTwoFactor(java.util.UUID userId, String totpCode);
    void disableTwoFactor(java.util.UUID userId, String totpCode);
    void revokeRefreshToken(String refreshToken);
    void changePassword(UUID id, @NotBlank String s, @NotBlank @Size(min=8) String s1);
}
