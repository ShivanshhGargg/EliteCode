package com.shivansh.EliteCode.service;

import java.util.UUID;

public interface ProgressService {

    void updateAfterAttempt(UUID userId, UUID attemptId);
}
