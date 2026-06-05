package com.shivansh.EliteCode.service;

import com.shivansh.EliteCode.dto.request.execution.CodeExecutionRequest;
import com.shivansh.EliteCode.dto.response.common.PageResponse;
import com.shivansh.EliteCode.dto.response.execution.AttemptResponse;
import java.util.UUID;

public interface AttemptService {

    AttemptResponse submitCode(UUID userId, CodeExecutionRequest request);

    PageResponse<AttemptResponse> listUserAttempts(UUID userId, int page, int size);

    AttemptResponse getByIdForUser(UUID id, UUID id1);
}
