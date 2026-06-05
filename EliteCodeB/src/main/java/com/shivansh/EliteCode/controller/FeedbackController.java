package com.shivansh.EliteCode.controller;

import com.shivansh.EliteCode.dto.response.execution.AiFeedbackResponse;
import com.shivansh.EliteCode.security.UserPrincipal;
import com.shivansh.EliteCode.service.FeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/attempts")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping("/{attemptId}/feedback")
    @Operation(summary = "Get AI feedback for attempt")
    @ApiResponse(responseCode = "200", description = "Feedback retrieved")
    public ResponseEntity<AiFeedbackResponse> getFeedback(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID attemptId) {
        return ResponseEntity.ok(feedbackService.getByAttemptIdForUser(attemptId, currentUser.getId()));
    }
}
