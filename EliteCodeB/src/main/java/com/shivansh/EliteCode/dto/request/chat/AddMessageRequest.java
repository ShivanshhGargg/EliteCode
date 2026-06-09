package com.shivansh.EliteCode.dto.request.chat;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;

public record AddMessageRequest(
        @NotBlank String role,
        @NotBlank String content,
        List<Map<String, Object>> problemSuggestions
) {}