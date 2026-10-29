package com.bimlab.ticket.note;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum NoteCategory {
    RESOURCE("resource"),
    REPOSITORY("repository"),
    PROMPT("prompt"),
    TOOL("tool"),
    DESIGN("design"),
    VIDEO("video"),
    GENERAL("general");

    private final String value;

    NoteCategory(String value) { this.value = value; }

    @JsonValue
    public String value() { return value; }

    @JsonCreator
    public static NoteCategory fromValue(String value) {
        for (NoteCategory category : values()) {
            if (category.value.equalsIgnoreCase(value)) return category;
        }
        throw new IllegalArgumentException("Loại ghi chú không hợp lệ");
    }
}
