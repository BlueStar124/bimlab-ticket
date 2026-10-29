package com.bimlab.ticket.ticket;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TicketEnvironment {
    PRODUCTION("production"), TEST("test"), LOCAL("local");

    private final String value;

    TicketEnvironment(String value) { this.value = value; }

    @JsonValue
    public String value() { return value; }

    @JsonCreator
    public static TicketEnvironment fromValue(String value) {
        for (TicketEnvironment environment : values()) {
            if (environment.value.equalsIgnoreCase(value)) return environment;
        }
        throw new IllegalArgumentException("Môi trường ticket không hợp lệ");
    }
}
