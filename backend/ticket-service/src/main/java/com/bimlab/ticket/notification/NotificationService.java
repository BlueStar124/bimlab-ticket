package com.bimlab.ticket.notification;

import com.bimlab.ticket.chat.ChatMessageRecord;
import com.bimlab.ticket.chat.ChatMessageRepository;
import com.bimlab.ticket.people.TeamDirectory;
import com.bimlab.ticket.people.TeamMember;
import com.bimlab.ticket.ticket.TicketEventRecord;
import com.bimlab.ticket.ticket.TicketEventRepository;
import com.bimlab.ticket.ticket.TicketRecord;
import com.bimlab.ticket.ticket.TicketRepository;
import com.bimlab.ticket.ticket.TicketStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Service
public class NotificationService {
    private final TicketRepository tickets;
    private final TicketEventRepository events;
    private final ChatMessageRepository chatMessages;
    private final NotificationReadRepository reads;
    private final TeamDirectory team;
    private final Clock clock;

    NotificationService(TicketRepository tickets, TicketEventRepository events, ChatMessageRepository chatMessages,
                        NotificationReadRepository reads, TeamDirectory team, Clock clock) {
        this.tickets = tickets;
        this.events = events;
        this.chatMessages = chatMessages;
        this.reads = reads;
        this.team = team;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<Notification> forUser(String userId) {
        team.requireMemberId(userId);
        Map<UUID, TicketRecord> ticketsById = tickets.findAll().stream()
                .collect(Collectors.toMap(TicketRecord::getId, ticket -> ticket));
        List<Notification> candidates = new ArrayList<>();
        events.findAll().stream()
                .filter(event -> isRelevant(event, ticketsById.get(event.getTicketId()), userId))
                .map(Notification::fromTicket)
                .forEach(candidates::add);
        chatMessages.findTop200ByOrderByAtDesc().stream()
                .filter(message -> !userId.equals(message.getAuthorId()) && mentions(message.getText(), userId))
                .map(Notification::fromChat)
                .forEach(candidates::add);
        List<Notification> recent = candidates.stream()
                .sorted(Comparator.comparing(Notification::at).reversed()).limit(20).toList();
        Set<UUID> ticketIds = recent.stream().filter(item -> "ticket".equals(item.source()))
                .map(Notification::id).collect(Collectors.toSet());
        Set<UUID> chatIds = recent.stream().filter(item -> "chat".equals(item.source()))
                .map(Notification::id).collect(Collectors.toSet());
        Set<String> readKeys = new HashSet<>();
        reads.findAllByUserIdAndSourceTypeAndSourceIdIn(userId, "ticket", ticketIds)
                .forEach(read -> readKeys.add("ticket:" + read.getSourceId()));
        reads.findAllByUserIdAndSourceTypeAndSourceIdIn(userId, "chat", chatIds)
                .forEach(read -> readKeys.add("chat:" + read.getSourceId()));
        return recent.stream().map(item -> item.withRead(readKeys.contains(item.source() + ":" + item.id()))).toList();
    }

    @Transactional
    public void markRead(String userId, List<NotificationRef> requested) {
        team.requireMemberId(userId);
        Map<UUID, TicketRecord> ticketsById = tickets.findAll().stream()
                .collect(Collectors.toMap(TicketRecord::getId, ticket -> ticket));
        Set<UUID> relevantTicketEvents = events.findAllById(requested.stream()
                        .filter(ref -> "ticket".equals(ref.source())).map(NotificationRef::id).toList()).stream()
                .filter(event -> isRelevant(event, ticketsById.get(event.getTicketId()), userId))
                .map(TicketEventRecord::getId).collect(Collectors.toSet());
        Set<UUID> relevantChatMessages = chatMessages.findAllById(requested.stream()
                        .filter(ref -> "chat".equals(ref.source())).map(NotificationRef::id).toList()).stream()
                .filter(message -> !userId.equals(message.getAuthorId()) && mentions(message.getText(), userId))
                .map(ChatMessageRecord::getId).collect(Collectors.toSet());
        List<NotificationRead> newReads = new ArrayList<>();
        addUnreadReads(userId, "ticket", relevantTicketEvents, newReads);
        addUnreadReads(userId, "chat", relevantChatMessages, newReads);
        reads.saveAll(newReads);
    }

    private void addUnreadReads(String userId, String source, Set<UUID> sourceIds, List<NotificationRead> target) {
        Set<UUID> existingIds = reads.findAllByUserIdAndSourceTypeAndSourceIdIn(userId, source, sourceIds).stream()
                .map(NotificationRead::getSourceId).collect(Collectors.toSet());
        for (UUID sourceId : sourceIds) {
            if (!existingIds.contains(sourceId)) target.add(new NotificationRead(userId, source, sourceId, clock.instant()));
        }
    }

    private boolean mentions(String text, String userId) {
        TeamMember member = team.all().stream().filter(item -> item.id().equals(userId)).findFirst().orElseThrow();
        return text.contains("@" + member.name());
    }

    private boolean isRelevant(TicketEventRecord event, TicketRecord ticket, String userId) {
        if (ticket == null || userId.equals(event.getActorId())) return false;
        if ("created".equals(event.getKind())) {
            if (event.getToAssigneeId() != null) return userId.equals(event.getToAssigneeId());
            return ticket.getStatus() != TicketStatus.DONE
                    && (ticket.getAssigneeId() == null || userId.equals(ticket.getAssigneeId()));
        }
        if ("assign".equals(event.getKind())) {
            return userId.equals(event.getToAssigneeId()) || userId.equals(ticket.getReporterId());
        }
        return userId.equals(ticket.getReporterId()) || userId.equals(ticket.getAssigneeId());
    }

    public record Notification(UUID id, String source, UUID ticketId, String actorId, String kind, String text,
                               Instant at, String toStatus, String toAssigneeId, String toPriority,
                               UUID replyToId, boolean read) {
        static Notification fromTicket(TicketEventRecord event) {
            return new Notification(event.getId(), "ticket", event.getTicketId(), event.getActorId(), event.getKind(),
                    event.getText(), event.getAt(), event.getToStatus() == null ? null : event.getToStatus().value(),
                    event.getToAssigneeId(), event.getToPriority() == null ? null : event.getToPriority().value(), null, false);
        }
        static Notification fromChat(ChatMessageRecord message) {
            return new Notification(message.getId(), "chat", null, message.getAuthorId(), "mention", message.getText(),
                    message.getAt(), null, null, null, message.getReplyToId(), false);
        }
        Notification withRead(boolean value) {
            return new Notification(id, source, ticketId, actorId, kind, text, at, toStatus, toAssigneeId, toPriority, replyToId, value);
        }
    }

    public record NotificationRef(@NotBlank String source, @NotNull UUID id) {
        public NotificationRef {
            if (!"ticket".equals(source) && !"chat".equals(source)) {
                throw new IllegalArgumentException("Loại thông báo không hợp lệ");
            }
        }
    }
}
