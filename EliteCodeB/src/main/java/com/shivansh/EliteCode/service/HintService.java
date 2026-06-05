package com.shivansh.EliteCode.service;

import com.shivansh.EliteCode.dto.request.execution.HintRequest;
import com.shivansh.EliteCode.dto.request.ai.SessionTitleRequest;
import com.shivansh.EliteCode.dto.response.execution.HintResponse;
import com.shivansh.EliteCode.dto.response.ai.SessionTitleResponse;
import java.util.UUID;

public interface HintService {

    HintResponse generateHint(UUID userId, HintRequest request);

    SessionTitleResponse generateSessionTitle(UUID userId, SessionTitleRequest request);
}
