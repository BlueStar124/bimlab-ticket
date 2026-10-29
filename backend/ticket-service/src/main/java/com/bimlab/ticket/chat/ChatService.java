package com.bimlab.ticket.chat;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.ArrayList;
import java.util.Collections;
import com.bimlab.ticket.people.TeamDirectory;
import java.util.UUID;

@Service
public class ChatService {
    private final ChatMessageRepository messages;
    private final ChatReadMarkerRepository readMarkers;
    private final Clock clock;
    private final TeamDirectory team;

    ChatService(ChatMessageRepository messages, ChatReadMarkerRepository readMarkers, Clock clock, TeamDirectory team) {
        this.messages = messages; this.readMarkers = readMarkers; this.clock = clock; this.team = team;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageRecord> list() {
        List<ChatMessageRecord> recent = new ArrayList<>(messages.findTop200ByOrderByAtDesc());
        Collections.reverse(recent);
        return recent;
    }

    @Transactional
    public ChatMessageRecord send(String text, UUID replyToId, String authorId) {
        team.requireMemberId(authorId);
        String body = text.trim();
        if (body.isEmpty()) throw new IllegalArgumentException("Tin nhắn không được để trống");
        if (replyToId != null && !messages.existsById(replyToId)) {
            throw new IllegalArgumentException("Không tìm thấy tin nhắn được trả lời");
        }
        return messages.save(new ChatMessageRecord(authorId, body, clock.instant(), replyToId));
    }

    @Transactional
    public void markRead(String userId, Instant readAt) {
        team.requireMemberId(userId);
        Instant safeReadAt = readAt.isAfter(clock.instant()) ? clock.instant() : readAt;
        ChatReadMarker marker = readMarkers.findById(userId).orElse(null);
        if (marker == null) readMarkers.save(new ChatReadMarker(userId, safeReadAt));
        else marker.advanceTo(safeReadAt);
    }

    /** Newest message time the member has seen, or null when they never opened the channel. */
    @Transactional(readOnly = true)
    public Instant readAt(String userId) {
        team.requireMemberId(userId);
        return readMarkers.findById(userId).map(ChatReadMarker::getReadAt).orElse(null);
    }

    @Transactional(readOnly = true)
    public long unreadCount(String userId) {
        team.requireMemberId(userId);
        ChatReadMarker marker = readMarkers.findById(userId).orElse(null);
        return marker == null
                ? messages.countByAuthorIdNot(userId)
                : messages.countByAuthorIdNotAndAtAfter(userId, marker.getReadAt());
    }
}
