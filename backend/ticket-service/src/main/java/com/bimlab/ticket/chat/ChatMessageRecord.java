package com.bimlab.ticket.chat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_messages")
public class ChatMessageRecord {
    @Id @UuidGenerator
    private UUID id;
    @Column(name = "author_id", nullable = false, length = 120)
    private String authorId;
    @Column(nullable = false, length = 2000)
    private String text;
    @Column(name = "occurred_at", nullable = false)
    private Instant at;
    @Column(name = "reply_to_id")
    private UUID replyToId;

    protected ChatMessageRecord() {}
    ChatMessageRecord(String authorId, String text, Instant at, UUID replyToId) {
        this.authorId = authorId; this.text = text; this.at = at; this.replyToId = replyToId;
    }
    public UUID getId() { return id; }
    public String getAuthorId() { return authorId; }
    public String getText() { return text; }
    public Instant getAt() { return at; }
    public UUID getReplyToId() { return replyToId; }
}
