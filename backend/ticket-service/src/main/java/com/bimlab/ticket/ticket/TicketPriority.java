package com.bimlab.ticket.ticket;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TicketPriority {
    URGENT("urgent"), HIGH("high"), MEDIUM("medium"), LOW("low");

    private final String value;

    TicketPriority(String value) { this.value = value; }

    @JsonValue
    public String value() { return value; }

    @JsonCreator
    public static TicketPriority fromValue(String value) {
        for (TicketPriority priority : values()) {
            if (priority.value.equalsIgnoreCase(value)) return priority;
        }
        throw new IllegalArgumentException("Mức ưu tiên không hợp lệ");
    }
}
