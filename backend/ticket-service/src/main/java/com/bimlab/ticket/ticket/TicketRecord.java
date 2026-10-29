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
@Table(name = "tickets")
public class TicketRecord {
    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(name = "area_id", nullable = false, length = 80)
    private String areaId;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private TicketEnvironment environment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TicketPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TicketStatus status;

    @Column(name = "reporter_id", nullable = false, length = 120)
    private String reporterId;

    @Column(name = "assignee_id", length = 120)
    private String assigneeId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "done_at")
    private Instant doneAt;

    protected TicketRecord() {}

    TicketRecord(String code, String title, String description, String areaId, TicketEnvironment environment,
                 TicketPriority priority, String reporterId, String assigneeId, Instant now) {
        this.code = code;
        this.title = title;
        this.description = description;
        this.areaId = areaId;
        this.environment = environment;
        this.priority = priority;
        this.status = TicketStatus.TODO;
        this.reporterId = reporterId;
        this.assigneeId = assigneeId;
        this.createdAt = now;
        this.updatedAt = now;
    }

    void changeStatus(TicketStatus next, Instant now) {
        if (status == next) throw new TicketConflictException("Ticket đã ở trạng thái này");
        status = next;
        updatedAt = now;
        startedAt = next == TicketStatus.TODO ? null : (startedAt == null ? now : startedAt);
        doneAt = next == TicketStatus.DONE ? now : null;
    }

    void assign(String nextAssigneeId, Instant now) { assigneeId = nextAssigneeId; updatedAt = now; }
    void setPriority(TicketPriority next, Instant now) { priority = next; updatedAt = now; }
    void touch(Instant now) { updatedAt = now; }

    public UUID getId() { return id; }
    public String getCode() { return code; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getAreaId() { return areaId; }
    public TicketEnvironment getEnvironment() { return environment; }
    public TicketPriority getPriority() { return priority; }
    public TicketStatus getStatus() { return status; }
    public String getReporterId() { return reporterId; }
    public String getAssigneeId() { return assigneeId; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getDoneAt() { return doneAt; }
}
