package com.bimlab.ticket.note;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/** One member marking a shared link as useful. */
@Entity
@Table(name = "shared_note_likes")
@IdClass(SharedNoteLike.Key.class)
class SharedNoteLike {
    @Id
    @Column(name = "note_id")
    private UUID noteId;
    @Id
    @Column(name = "user_id", length = 120)
    private String userId;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected SharedNoteLike() {}

    SharedNoteLike(UUID noteId, String userId, Instant createdAt) {
        this.noteId = noteId;
        this.userId = userId;
        this.createdAt = createdAt;
    }

    UUID getNoteId() { return noteId; }
    String getUserId() { return userId; }
    Instant getCreatedAt() { return createdAt; }

    public static class Key implements Serializable {
        private UUID noteId;
        private String userId;
        public Key() {}
        Key(UUID noteId, String userId) { this.noteId = noteId; this.userId = userId; }
        @Override public boolean equals(Object value) {
            return value instanceof Key key && Objects.equals(noteId, key.noteId) && Objects.equals(userId, key.userId);
        }
        @Override public int hashCode() { return Objects.hash(noteId, userId); }
    }
}
