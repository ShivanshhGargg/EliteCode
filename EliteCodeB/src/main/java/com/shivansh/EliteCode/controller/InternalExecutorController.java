package com.shivansh.EliteCode.controller;

import com.shivansh.EliteCode.execution.CodeExecutor;
import com.shivansh.EliteCode.execution.ExecutionResult;
import com.shivansh.EliteCode.model.Language;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/internal")
@RequiredArgsConstructor
public class InternalExecutorController {

    @Qualifier("wandboxCodeExecutor")
    private final CodeExecutor executor;

    @PostMapping("/execute")
    public Map<String, String> executeCode(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        String input = request.getOrDefault("input", "");
        String langStr = request.getOrDefault("language", "PYTHON");
        Language language = Language.valueOf(langStr);

        ExecutionResult result = executor.execute(code, input, language, 5L);
        return Map.of(
                "output", result.output() != null ? result.output() : "",
                "error", result.error() != null ? result.error() : "",
                "success", String.valueOf(result.success())
        );
    }
}