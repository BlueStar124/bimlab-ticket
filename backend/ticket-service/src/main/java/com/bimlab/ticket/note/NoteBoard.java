package com.bimlab.ticket.note;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Topic board a link is pinned to. */
public enum NoteBoard {
    FRONTEND("frontend"),
    BACKEND("backend"),
    DEVOPS("devops"),
    AI("ai"),
    INTERNAL("internal");

    private final String value;

    NoteBoard(String value) { this.value = value; }

    @JsonValue
    public String value() { return value; }

    @JsonCreator
    public static NoteBoard fromValue(String value) {
        for (NoteBoard board : values()) {
            if (board.value.equalsIgnoreCase(value)) return board;
        }
        throw new IllegalArgumentException("Bảng không hợp lệ");
    }
}
