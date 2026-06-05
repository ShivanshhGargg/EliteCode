package com.shivansh.EliteCode.service;

import com.shivansh.EliteCode.dto.response.execution.AiFeedbackResponse;
import java.util.UUID;

public interface FeedbackService {

    void createForAttemptAsync(UUID attemptId);

    AiFeedbackResponse getByAttemptIdForUser(UUID attemptId, UUID id);
}
