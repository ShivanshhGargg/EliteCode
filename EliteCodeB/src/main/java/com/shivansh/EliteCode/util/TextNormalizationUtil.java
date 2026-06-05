package com.shivansh.EliteCode.util;

public final class TextNormalizationUtil {
    private TextNormalizationUtil() {
    }

    public static String normalize(String text) {
        if (text == null) {
            return null;
        }
        String trimmed = text.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        return trimmed.replaceAll("\\s+", " ");
    }
}

