package com.shivansh.EliteCode.controller;

import com.shivansh.EliteCode.dto.request.user.UpdateProfileRequest;
import com.shivansh.EliteCode.dto.response.common.PageResponse;
import com.shivansh.EliteCode.dto.response.user.AccountResponse;
import com.shivansh.EliteCode.dto.response.user.UserProfileResponse;
import com.shivansh.EliteCode.dto.response.user.UserProgressResponse;
import com.shivansh.EliteCode.repository.AccountRepository;
import com.shivansh.EliteCode.repository.AttemptRepository;
import com.shivansh.EliteCode.security.UserPrincipal;
import com.shivansh.EliteCode.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AccountRepository accountRepository;
    private final AttemptRepository attemptRepository;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    @ApiResponse(responseCode = "200", description = "Profile retrieved")
    public ResponseEntity<UserProfileResponse> getProfile(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(userService.getProfile(currentUser.getId()));
    }

    @PutMapping("/me")
    @Operation(summary = "Update user profile")
    @ApiResponse(responseCode = "200", description = "Profile updated")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(currentUser.getId(), request));
    }

    @GetMapping("/me/progress")
    @Operation(summary = "List user progress")
    @ApiResponse(responseCode = "200", description = "Progress retrieved")
    public ResponseEntity<PageResponse<UserProgressResponse>> getProgress(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getUserProgress(currentUser.getId(), page, size));
    }

    @DeleteMapping("/me/accounts/{accountId}")
    @Operation(summary = "Remove linked account")
    @ApiResponse(responseCode = "204", description = "Account removed")
    public ResponseEntity<Void> removeAccount(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable java.util.UUID accountId) {
        userService.removeAccount(currentUser.getId(), accountId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        userService.deleteUser(currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/accounts")
    public ResponseEntity<List<AccountResponse>> getMyAccounts(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(accountRepository.findByUserId(currentUser.getId()).stream()
                .map(acc -> new AccountResponse(
                        acc.getId(),
                        acc.getProvider(),
                        acc.getProviderId(),
                        acc.getRole(),
                        acc.isEmailVerified(),
                        acc.isTwoFactorEnabled(),
                        acc.getCreatedAt(),
                        acc.getLastLoginAt()
                ))
                .toList());
    }

    @GetMapping("/me/solved")
    public ResponseEntity<Set<UUID>> getSolvedProblemIds(@AuthenticationPrincipal UserPrincipal user) {
        Set<UUID> solved = attemptRepository.findSolvedProblemIdsByUserId(user.getId());
        return ResponseEntity.ok(solved);
    }
}
