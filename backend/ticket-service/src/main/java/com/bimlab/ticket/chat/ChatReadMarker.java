package com.bimlab.ticket.chat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "chat_read_markers")
public class ChatReadMarker {
    @Id
    @Column(name = "user_id", length = 120)
    private String userId;
    @Column(name = "read_at", nullable = false)
    private Instant readAt;
    protected ChatReadMarker() {}
    ChatReadMarker(String userId, Instant readAt) { this.userId = userId; this.readAt = readAt; }
    public String getUserId() { return userId; }
    public Instant getReadAt() { return readAt; }
    void advanceTo(Instant at) { if (at.isAfter(readAt)) readAt = at; }
}
