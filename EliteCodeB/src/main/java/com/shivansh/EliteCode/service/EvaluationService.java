package com.shivansh.EliteCode.service;

import com.shivansh.EliteCode.dto.response.execution.AttemptResponse;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

public interface EvaluationService {

    CompletableFuture<AttemptResponse> evaluateAttemptAsync(UUID attemptId);
}

