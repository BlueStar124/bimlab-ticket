package com.bimlab.ticket.ticket;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.bimlab.ticket.people.TeamDirectory;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {
    private static final java.util.Set<String> AREA_IDS = java.util.Set.of(
            "cds", "hrm", "qlvt", "jobs", "platform", "digitaltwin", "ticket", "server", "ci",
            "docker", "database", "network", "access", "infra-other");
    private final TicketRepository tickets;
    private final TicketEventRepository events;
    private final TicketCodeGenerator codeGenerator;
    private final Clock clock;
    private final TeamDirectory team;

    TicketService(TicketRepository tickets, TicketEventRepository events, TicketCodeGenerator codeGenerator, Clock clock, TeamDirectory team) {
        this.tickets = tickets;
        this.events = events;
        this.codeGenerator = codeGenerator;
        this.clock = clock;
        this.team = team;
    }

    @Transactional(readOnly = true)
    public List<TicketResponses.Ticket> list() {
        return tickets.findAll().stream().sorted(this::compareQueueOrder)
                .map(TicketResponses.Ticket::from).toList();
    }

    @Transactional(readOnly = true)
    public TicketResponses.Ticket get(UUID id) { return TicketResponses.Ticket.from(requireTicket(id)); }

    @Transactional(readOnly = true)
    public List<TicketResponses.Event> history(UUID id) {
        requireTicket(id);
        return events.findAllByTicketIdOrderByAtAsc(id).stream().map(TicketResponses.Event::from).toList();
    }

    /** History of every ticket, oldest first, so a client loads all of it in one request. */
    @Transactional(readOnly = true)
    public List<TicketResponses.Event> allHistory() {
        return events.findAllByOrderByAtAsc().stream().map(TicketResponses.Event::from).toList();
    }

    @Transactional
    public TicketResponses.Ticket create(TicketRequests.Create request, String reporterId) {
        team.requireMemberId(reporterId);
        if (!AREA_IDS.contains(request.areaId())) throw new IllegalArgumentException("Hạng mục không hợp lệ");
        if (request.assigneeId() != null) team.requireMemberId(request.assigneeId());
        Instant now = clock.instant();
        TicketRecord ticket = tickets.save(new TicketRecord(codeGenerator.nextCode(), request.title().trim(),
                request.description().trim(), request.areaId(), request.environment(), request.priority(),
                reporterId, request.assigneeId(), now));
        events.save(event(ticket, reporterId, "created", "Đã báo lỗi", now, null, request.assigneeId(), null));
        return TicketResponses.Ticket.from(ticket);
    }

    @Transactional
    public TicketResponses.Ticket changeStatus(UUID id, TicketStatus status, String actorId) {
        team.requireMemberId(actorId);
        TicketRecord ticket = requireTicket(id);
        Instant now = clock.instant();
        boolean selfAssigns = status == TicketStatus.IN_PROGRESS && ticket.getAssigneeId() == null;
        if (selfAssigns) {
            ticket.assign(actorId, now);
            events.save(event(ticket, actorId, "assign", "Đã nhận việc", now, null, actorId, null));
        }
        ticket.changeStatus(status, now);
        events.save(event(ticket, actorId, "status", "", now, status, null, null));
        return TicketResponses.Ticket.from(ticket);
    }

    @Transactional
    public TicketResponses.Ticket assign(UUID id, String assigneeId, String actorId) {
        team.requireMemberId(actorId);
        if (assigneeId != null) team.requireMemberId(assigneeId);
        TicketRecord ticket = requireTicket(id);
        if (java.util.Objects.equals(ticket.getAssigneeId(), assigneeId)) return TicketResponses.Ticket.from(ticket);
        Instant now = clock.instant();
        ticket.assign(assigneeId, now);
        String text = assigneeId == null ? "Đã bỏ người làm" : assigneeId.equals(actorId) ? "Đã nhận việc" : "Đã giao ticket";
        events.save(event(ticket, actorId, "assign", text, now, null, assigneeId, null));
        return TicketResponses.Ticket.from(ticket);
    }

    @Transactional
    public TicketResponses.Ticket changePriority(UUID id, TicketPriority priority, String actorId) {
        team.requireMemberId(actorId);
        TicketRecord ticket = requireTicket(id);
        if (ticket.getPriority() == priority) return TicketResponses.Ticket.from(ticket);
        Instant now = clock.instant();
        ticket.setPriority(priority, now);
        events.save(event(ticket, actorId, "priority", "Đã đổi mức ưu tiên", now, null, null, priority));
        return TicketResponses.Ticket.from(ticket);
    }

    @Transactional
    public TicketResponses.Event addComment(UUID id, String text, String actorId) {
        team.requireMemberId(actorId);
        TicketRecord ticket = requireTicket(id);
        String body = text.trim();
        if (body.isEmpty()) throw new IllegalArgumentException("Nội dung bình luận không được để trống");
        Instant now = clock.instant();
        ticket.touch(now);
        return TicketResponses.Event.from(events.save(event(ticket, actorId, "comment", body, now, null, null, null)));
    }

    private TicketRecord requireTicket(UUID id) {
        return tickets.findById(id).orElseThrow(TicketNotFoundException::new);
    }

    private TicketEventRecord event(TicketRecord ticket, String actorId, String kind, String text, Instant at,
                                    TicketStatus status, String assigneeId, TicketPriority priority) {
        return new TicketEventRecord(ticket.getId(), actorId, kind, text, at, status, assigneeId, priority);
    }

    private int compareQueueOrder(TicketRecord first, TicketRecord second) {
        boolean firstOpen = first.getStatus() != TicketStatus.DONE;
        boolean secondOpen = second.getStatus() != TicketStatus.DONE;
        if (firstOpen != secondOpen) return firstOpen ? -1 : 1;
        if (firstOpen) {
            int priorityOrder = Integer.compare(priorityRank(first.getPriority()), priorityRank(second.getPriority()));
            return priorityOrder != 0 ? priorityOrder : first.getCreatedAt().compareTo(second.getCreatedAt());
        }
        Instant firstDoneAt = first.getDoneAt() == null ? first.getUpdatedAt() : first.getDoneAt();
        Instant secondDoneAt = second.getDoneAt() == null ? second.getUpdatedAt() : second.getDoneAt();
        return secondDoneAt.compareTo(firstDoneAt);
    }

    private int priorityRank(TicketPriority priority) {
        return switch (priority) {
            case URGENT -> 0;
            case HIGH -> 1;
            case MEDIUM -> 2;
            case LOW -> 3;
        };
    }
}
