package com.shivansh.EliteCode.service.impl;

import com.shivansh.EliteCode.dto.request.ai.ChatCompletionRequest;
import com.shivansh.EliteCode.dto.response.ai.ChatCompletionResponse;
import com.shivansh.EliteCode.exception.CustomExceptions;
import com.shivansh.EliteCode.model.Mode;
import com.shivansh.EliteCode.model.Problem;
import com.shivansh.EliteCode.repository.ProblemRepository;
import com.shivansh.EliteCode.service.AiService;
import com.shivansh.EliteCode.util.AiPromptBuilder;
import com.shivansh.EliteCode.util.CodeSanitizer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class AiServiceImpl implements AiService {

    private final ProblemRepository problemRepository;
    private final RestClient restClient;

    @Value("${openrouter.api.key}")
    private String apiKey;

    @Value("${openrouter.model:openai/gpt-3.5-turbo}")
    private String model;

    @Value("${openrouter.api.url:https://openrouter.ai/api/v1/chat/completions}")
    private String apiUrl;

    // Customize temperature
    private static final double TEMPERATURE = 0.7;
    private static final int MAX_TOKENS = 1000;

    // Constructor-based RestClient building (or use @Bean)
    public AiServiceImpl(ProblemRepository problemRepository,
                         @Qualifier("openRouterRestClient") RestClient restClient) {
        this.problemRepository = problemRepository;
        this.restClient = restClient;
    }

    @Override
    public String ask(UUID problemId, Mode mode, String context) {
        // 1. Fetch problem statement if problemId provided
        String problemStatement = "";
        if (problemId != null) {
            Problem problem = problemRepository.findById(problemId)
                    .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Problem not found"));
            problemStatement = problem.getOriginalText();
        }

        // 2. Build prompt using existing AiPromptBuilder
        String safeContext = CodeSanitizer.sanitizeCode(context);
        String userPrompt = AiPromptBuilder.buildPrompt(mode, problemStatement, safeContext);

        // 3. Prepare OpenRouter request
        ChatCompletionRequest request = new ChatCompletionRequest(
                model,
                List.of(new ChatCompletionRequest.Message("user", userPrompt)),
                MAX_TOKENS,
                TEMPERATURE
        );

        // 4. Call OpenRouter API
        try {
            ChatCompletionResponse response = restClient.post()
                    .uri(apiUrl)
                    .body(request)
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(), (req, res) -> {
                        String errorBody = new String(res.getBody().readAllBytes());
                        log.error("OpenRouter API error {}: {}", res.getStatusCode(), errorBody);
                        throw new CustomExceptions.BadRequestException("AI service error: " + errorBody);
                    })
                    .body(ChatCompletionResponse.class);

            if (response != null && response.choices() != null && !response.choices().isEmpty()) {
                String aiResponse = response.choices().get(0).message().content();
                log.info("AI response generated ({} tokens)", response.usage() != null ? response.usage().totalTokens() : 0);
                return aiResponse;
            } else {
                log.warn("Empty response from OpenRouter");
                return "I'm having trouble generating a response right now. Please try again.";
            }

        } catch (Exception e) {
            log.error("Failed to call OpenRouter", e);
            return "Sorry, the AI service is currently unavailable. Please try again later.";
        }
    }

    @Override
    public String generateSessionTitle(Mode mode, String problemTitle, String conversation) {
        String prompt = AiPromptBuilder.buildSessionTitlePrompt(
                mode,
                CodeSanitizer.sanitizeInput(problemTitle),
                CodeSanitizer.sanitizeInput(conversation)
        );

        ChatCompletionRequest request = new ChatCompletionRequest(
                model,
                List.of(new ChatCompletionRequest.Message("user", prompt)),
                40,
                0.2
        );

        try {
            ChatCompletionResponse response = restClient.post()
                    .uri(apiUrl)
                    .body(request)
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(), (req, res) -> {
                        String errorBody = new String(res.getBody().readAllBytes());
                        log.error("OpenRouter title error {}: {}", res.getStatusCode(), errorBody);
                        throw new CustomExceptions.BadRequestException("AI service error: " + errorBody);
                    })
                    .body(ChatCompletionResponse.class);

            if (response == null || response.choices() == null || response.choices().isEmpty()) {
                return fallbackTitle(mode, problemTitle);
            }

            return normalizeTitle(response.choices().get(0).message().content(), mode, problemTitle);
        } catch (Exception e) {
            log.error("Failed to generate session title", e);
            return fallbackTitle(mode, problemTitle);
        }
    }

    private String normalizeTitle(String title, Mode mode, String problemTitle) {
        if (title == null || title.isBlank()) {
            return fallbackTitle(mode, problemTitle);
        }

        String cleaned = title
                .replaceAll("[\\r\\n]+", " ")
                .replaceAll("^[\"'`*_\\s]+|[\"'`*_.!?:;\\s]+$", "")
                .replaceAll("\\s+", " ")
                .trim();

        if (cleaned.isBlank()) {
            return fallbackTitle(mode, problemTitle);
        }
        return cleaned.length() > 60 ? cleaned.substring(0, 60).trim() : cleaned;
    }

    private String fallbackTitle(Mode mode, String problemTitle) {
        if (problemTitle != null && !problemTitle.isBlank()) {
            return problemTitle.length() > 60 ? problemTitle.substring(0, 60).trim() : problemTitle.trim();
        }
        return switch (mode) {
            case INTERVIEW -> "Interview Practice";
            case LEARNING -> "Learning Practice";
            case STANDARD -> "Coding Help";
        };
    }
}
