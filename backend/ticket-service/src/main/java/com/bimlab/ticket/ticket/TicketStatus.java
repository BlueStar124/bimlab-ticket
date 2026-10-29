package com.bimlab.ticket.ticket;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TicketStatus {
    TODO("todo"), IN_PROGRESS("in_progress"), DONE("done");

    private final String value;

    TicketStatus(String value) { this.value = value; }

    @JsonValue
    public String value() { return value; }

    @JsonCreator
    public static TicketStatus fromValue(String value) {
        for (TicketStatus status : values()) {
            if (status.value.equalsIgnoreCase(value)) return status;
        }
        throw new IllegalArgumentException("Trạng thái ticket không hợp lệ");
    }
}
