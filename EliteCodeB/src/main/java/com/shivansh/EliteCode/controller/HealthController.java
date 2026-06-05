package com.shivansh.EliteCode.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;

@RestController
@RequestMapping("/api/public")
public class HealthController {

    @GetMapping("/ping")
    @Operation(summary = "Ping service")
    @ApiResponse(responseCode = "200", description = "Service healthy")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong - backend is running");
    }
}