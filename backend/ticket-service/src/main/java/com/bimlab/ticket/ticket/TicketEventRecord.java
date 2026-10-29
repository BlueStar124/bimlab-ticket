package com.bimlab.ticket.ticket;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ticket_events")
public class TicketEventRecord {
    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "ticket_id", nullable = false)
    private UUID ticketId;

    @Column(name = "actor_id", nullable = false, length = 120)
    private String actorId;

    @Column(nullable = false, length = 20)
    private String kind;

    @Column(nullable = false, columnDefinition = "text")
    private String text;

    @Column(name = "occurred_at", nullable = false)
    private Instant at;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", length = 20)
    private TicketStatus toStatus;

    @Column(name = "to_assignee_id", length = 120)
    private String toAssigneeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_priority", length = 20)
    private TicketPriority toPriority;

    protected TicketEventRecord() {}

    TicketEventRecord(UUID ticketId, String actorId, String kind, String text, Instant at,
                      TicketStatus toStatus, String toAssigneeId, TicketPriority toPriority) {
        this.ticketId = ticketId;
        this.actorId = actorId;
        this.kind = kind;
        this.text = text;
        this.at = at;
        this.toStatus = toStatus;
        this.toAssigneeId = toAssigneeId;
        this.toPriority = toPriority;
    }

    public UUID getId() { return id; }
    public UUID getTicketId() { return ticketId; }
    public String getActorId() { return actorId; }
    public String getKind() { return kind; }
    public String getText() { return text; }
    public Instant getAt() { return at; }
    public TicketStatus getToStatus() { return toStatus; }
    public String getToAssigneeId() { return toAssigneeId; }
    public TicketPriority getToPriority() { return toPriority; }
}
