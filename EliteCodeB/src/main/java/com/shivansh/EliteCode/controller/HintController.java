package com.shivansh.EliteCode.controller;

import com.shivansh.EliteCode.dto.request.ai.SessionTitleRequest;
import com.shivansh.EliteCode.dto.request.execution.HintRequest;
import com.shivansh.EliteCode.dto.response.ai.SessionTitleResponse;
import com.shivansh.EliteCode.dto.response.execution.HintResponse;
import com.shivansh.EliteCode.security.UserPrincipal;
import com.shivansh.EliteCode.service.HintService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hints")
@RequiredArgsConstructor
public class HintController {

    private final HintService hintService;

    @PostMapping
    @Operation(summary = "Generate hint")
    @ApiResponse(responseCode = "200", description = "Hint generated")
    public ResponseEntity<HintResponse> generateHint(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody HintRequest request) {
        return ResponseEntity.ok(hintService.generateHint(currentUser.getId(), request));
    }

    @PostMapping("/title")
    @Operation(summary = "Generate chat history title")
    @ApiResponse(responseCode = "200", description = "Title generated")
    public ResponseEntity<SessionTitleResponse> generateSessionTitle(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody SessionTitleRequest request) {
        return ResponseEntity.ok(hintService.generateSessionTitle(currentUser.getId(), request));
    }
}
