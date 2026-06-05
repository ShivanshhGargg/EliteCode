package com.shivansh.EliteCode.execution;

import com.shivansh.EliteCode.model.Language;

public interface CodeExecutor {
    ExecutionResult execute(String code, String input, Language language, long timeoutSeconds);
}

