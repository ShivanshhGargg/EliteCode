package com.shivansh.EliteCode.execution;

public record ExecutionResult(
        String output,
        String error,
        long executionTimeMs,
        boolean success,
        boolean timeout
) {}
