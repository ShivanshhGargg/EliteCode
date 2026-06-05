package com.shivansh.EliteCode.controller;

import com.shivansh.EliteCode.dto.request.execution.CodeExecutionRequest;
import com.shivansh.EliteCode.dto.response.common.PageResponse;
import com.shivansh.EliteCode.dto.response.execution.AttemptResponse;
import com.shivansh.EliteCode.security.UserPrincipal;
import com.shivansh.EliteCode.service.AttemptService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attempts")
@RequiredArgsConstructor
public class AttemptController {

    private final AttemptService attemptService;

    @PostMapping
    @Operation(summary = "Submit code for evaluation")
    @ApiResponse(responseCode = "200", description = "Attempt created")
    public ResponseEntity<AttemptResponse> submitCode(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CodeExecutionRequest request) {
        return ResponseEntity.ok(attemptService.submitCode(currentUser.getId(), request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get attempt by id")
    @ApiResponse(responseCode = "200", description = "Attempt retrieved")
    public ResponseEntity<AttemptResponse> getById(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("id") java.util.UUID id) {
        return ResponseEntity.ok(attemptService.getByIdForUser(id, currentUser.getId()));
    }

    @GetMapping
    @Operation(summary = "List user attempts")
    @ApiResponse(responseCode = "200", description = "Attempts retrieved")
    public ResponseEntity<PageResponse<AttemptResponse>> listAttempts(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(attemptService.listUserAttempts(currentUser.getId(), page, size));
    }
}
