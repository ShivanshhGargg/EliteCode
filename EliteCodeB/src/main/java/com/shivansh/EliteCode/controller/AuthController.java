package com.shivansh.EliteCode.controller;

import com.shivansh.EliteCode.dto.request.auth.*;
import com.shivansh.EliteCode.dto.response.auth.AccessTokenResponse;
import com.shivansh.EliteCode.dto.response.auth.TokenPair;
import com.shivansh.EliteCode.dto.response.auth.TwoFactorSetupResponse;
import com.shivansh.EliteCode.exception.CustomExceptions;
import com.shivansh.EliteCode.service.AuthService;
import com.shivansh.EliteCode.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Arrays;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    @ApiResponse(responseCode = "200", description = "Login successful")
    public ResponseEntity<AccessTokenResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        TokenPair tokenPair = authService.login(request);
        setRefreshTokenCookie(response, tokenPair.refreshToken());
        return ResponseEntity.ok(toAccessTokenResponse(tokenPair));
    }

    @PostMapping("/register")
    @Operation(summary = "Register new account")
    @ApiResponse(responseCode = "204", description = "Account registered, verification email sent")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Verify email address")
    @ApiResponse(responseCode = "204", description = "Email verified")
    public ResponseEntity<Void> verifyEmail(@RequestParam("token") String token) {
        authService.verifyEmail(token);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend verification email")
    @ApiResponse(responseCode = "204", description = "Verification email resent")
    public ResponseEntity<Void> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerificationEmail(request.email());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset")
    @ApiResponse(responseCode = "204", description = "Password reset requested")
    public ResponseEntity<Void> requestPasswordReset(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request.email());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password")
    @ApiResponse(responseCode = "204", description = "Password reset completed")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    @ApiResponse(responseCode = "200", description = "Token refreshed")
    public ResponseEntity<AccessTokenResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = extractRefreshTokenFromCookie(request);
        TokenPair tokenPair = authService.refreshToken(refreshToken);
        // Only set new cookie if a new refresh token was issued (should always be the case)
        if (tokenPair.refreshToken() != null) {
            setRefreshTokenCookie(response, tokenPair.refreshToken());
        }
        return ResponseEntity.ok(toAccessTokenResponse(tokenPair));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout and revoke refresh token")
    @ApiResponse(responseCode = "204", description = "Logged out")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = extractRefreshTokenFromCookie(request);
        // call service to revoke
        authService.revokeRefreshToken(refreshToken);
        String clearCookie = "refresh_token=; Path=/api/auth; Max-Age=0; HttpOnly; Secure; SameSite=Strict";
        response.setHeader("Set-Cookie", clearCookie);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/oauth/google")
    @Operation(summary = "Login with Google (token exchange)")
    @ApiResponse(responseCode = "200", description = "OAuth login successful")
    public ResponseEntity<AccessTokenResponse> loginWithGoogle(@Valid @RequestBody GoogleOAuthRequest request,
                                                               HttpServletResponse response) {
        TokenPair tokenPair = authService.loginWithGoogle(request.idToken(), request.totpCode());
        setRefreshTokenCookie(response, tokenPair.refreshToken());
        return ResponseEntity.ok(toAccessTokenResponse(tokenPair));
    }

    @PostMapping("/oauth/github")
    @Operation(summary = "Login with GitHub (token exchange)")
    @ApiResponse(responseCode = "200", description = "OAuth login successful")
    public ResponseEntity<AccessTokenResponse> loginWithGithub(@Valid @RequestBody GithubOAuthRequest request,
                                                               HttpServletResponse response) {
        TokenPair tokenPair = authService.loginWithGithub(request.accessToken(), request.totpCode());
        setRefreshTokenCookie(response, tokenPair.refreshToken());
        return ResponseEntity.ok(toAccessTokenResponse(tokenPair));
    }

    @PostMapping("/2fa/setup")
    @Operation(summary = "Start 2FA setup")
    @ApiResponse(responseCode = "200", description = "2FA setup details generated")
    public ResponseEntity<TwoFactorSetupResponse> setupTwoFactor(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(authService.setupTwoFactor(currentUser.getId()));
    }

    @PostMapping("/2fa/enable")
    @Operation(summary = "Enable 2FA")
    @ApiResponse(responseCode = "204", description = "2FA enabled")
    public ResponseEntity<Void> enableTwoFactor(@AuthenticationPrincipal UserPrincipal currentUser,
                                                @Valid @RequestBody TwoFactorCodeRequest request) {
        authService.enableTwoFactor(currentUser.getId(), request.totpCode());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/2fa/disable")
    @Operation(summary = "Disable 2FA")
    @ApiResponse(responseCode = "204", description = "2FA disabled")
    public ResponseEntity<Void> disableTwoFactor(@AuthenticationPrincipal UserPrincipal currentUser,
                                                 @Valid @RequestBody TwoFactorCodeRequest request) {
        authService.disableTwoFactor(currentUser.getId(), request.totpCode());
        return ResponseEntity.noContent().build();
    }

    private AccessTokenResponse toAccessTokenResponse(TokenPair tokenPair) {
        return new AccessTokenResponse(
                tokenPair.accessToken(),
                tokenPair.tokenType(),
                tokenPair.expiresIn(),
                tokenPair.userId(),
                tokenPair.email()
        );
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        int maxAge = (int) Duration.ofDays(7).toSeconds();
        String cookieValue = String.format(
                "refresh_token=%s; Path=/api/auth; Max-Age=%d; HttpOnly; Secure; SameSite=Strict",
                refreshToken, maxAge
        );
        response.setHeader("Set-Cookie", cookieValue);
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            return Arrays.stream(request.getCookies())
                    .filter(c -> "refresh_token".equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElseThrow(() -> new CustomExceptions.BadRequestException("Refresh token missing"));
        }
        throw new CustomExceptions.BadRequestException("Refresh token missing");
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password (authenticated users)")
    @ApiResponse(responseCode = "204", description = "Password changed")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(currentUser.getId(), request.currentPassword(), request.newPassword());
        return ResponseEntity.noContent().build();
    }
}