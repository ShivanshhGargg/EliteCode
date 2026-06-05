package com.shivansh.EliteCode.util;

public final class CodeSanitizer {

    private static final int MAX_CODE_LENGTH = 20_000;
    private static final int MAX_INPUT_LENGTH = 5_000;

    private CodeSanitizer() {
    }

    public static String sanitizeCode(String code) {
        if (code == null) {
            return "";
        }

        String sanitized = code.replace("\u0000", "");
        sanitized = sanitized.replaceAll("(?i)(api[_-]?key\\s*[=:]\\s*[\\\"'])[^\\\"'\\s]+", "$1***");
        sanitized = sanitized.replaceAll("(?i)(token\\s*[=:]\\s*[\\\"'])[^\\\"'\\s]+", "$1***");
        sanitized = sanitized.replaceAll("(?i)(password\\s*[=:]\\s*[\\\"'])[^\\\"'\\s]+", "$1***");

        if (sanitized.length() > MAX_CODE_LENGTH) {
            return sanitized.substring(0, MAX_CODE_LENGTH);
        }
        return sanitized;
    }

    public static String sanitizeInput(String input) {
        if (input == null) {
            return "";
        }

        String sanitized = input.replace("\u0000", "").trim();
        if (sanitized.length() > MAX_INPUT_LENGTH) {
            return sanitized.substring(0, MAX_INPUT_LENGTH);
        }
        return sanitized;
    }
}

