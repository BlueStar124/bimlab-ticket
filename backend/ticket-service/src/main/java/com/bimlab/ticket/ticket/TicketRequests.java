package com.bimlab.ticket.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class TicketRequests {
    private TicketRequests() {}

    public record Create(
            @NotBlank @Size(max = 200) String title,
            @NotBlank @Size(max = 10000) String description,
            @NotBlank @Size(max = 80) String areaId,
            TicketEnvironment environment,
            @NotNull TicketPriority priority,
            @Size(max = 120) String assigneeId) {}

    public record ChangeStatus(@NotNull TicketStatus status) {}
    public record Assign(@Size(max = 120) String assigneeId) {}
    public record ChangePriority(@NotNull TicketPriority priority) {}
    public record AddComment(@NotBlank @Size(max = 10000) String text) {}
}
