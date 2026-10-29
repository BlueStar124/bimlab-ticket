package com.bimlab.ticket.ticket;

import java.time.Instant;
import java.util.UUID;

public final class TicketResponses {
    private TicketResponses() {}

    public record Ticket(UUID id, String code, String title, String description, String areaId,
                         TicketEnvironment environment, TicketPriority priority, TicketStatus status,
                         String reporterId, String assigneeId, Instant createdAt, Instant updatedAt,
                         Instant startedAt, Instant doneAt) {
        public static Ticket from(TicketRecord ticket) {
            return new Ticket(ticket.getId(), ticket.getCode(), ticket.getTitle(), ticket.getDescription(),
                    ticket.getAreaId(), ticket.getEnvironment(), ticket.getPriority(), ticket.getStatus(),
                    ticket.getReporterId(), ticket.getAssigneeId(), ticket.getCreatedAt(), ticket.getUpdatedAt(),
                    ticket.getStartedAt(), ticket.getDoneAt());
        }
    }

    public record Event(UUID id, UUID ticketId, Instant at, String actorId, String kind, String text,
                        TicketStatus toStatus, String toAssigneeId, TicketPriority toPriority) {
        public static Event from(TicketEventRecord event) {
            return new Event(event.getId(), event.getTicketId(), event.getAt(), event.getActorId(), event.getKind(),
                    event.getText(), event.getToStatus(), event.getToAssigneeId(), event.getToPriority());
        }
    }
}
