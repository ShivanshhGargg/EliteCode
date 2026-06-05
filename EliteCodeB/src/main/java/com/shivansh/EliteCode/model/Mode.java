package com.shivansh.EliteCode.model;

import com.fasterxml.jackson.annotation.JsonValue;

public enum Mode {
    INTERVIEW("INTERVIEW"),
    LEARNING("LEARNING"),
    STANDARD("STANDARD");

    private final String displayName;

    Mode(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }
}