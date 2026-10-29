package com.bimlab.ticket.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public final class ChatRequests {
    private ChatRequests() {}
    public record Send(@NotBlank @Size(max = 2000) String text, UUID replyToId) {}
    public record MarkRead(@NotBlank String readAt) {}
}
