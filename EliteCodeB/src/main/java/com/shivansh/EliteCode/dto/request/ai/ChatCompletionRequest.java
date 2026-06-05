package com.shivansh.EliteCode.dto.request.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record ChatCompletionRequest(
        String model,
        List<Message> messages,
        @JsonProperty("max_tokens") Integer maxTokens,
        Double temperature
) {
    public static record Message(String role, String content) {}
}