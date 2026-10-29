package com.bimlab.ticket.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification_reads")
@IdClass(NotificationRead.Key.class)
public class NotificationRead {
    @Id
    @Column(name = "user_id", length = 120)
    private String userId;
    @Id
    @Column(name = "source_type", length = 20)
    private String sourceType;
    @Id
    @Column(name = "source_id")
    private UUID sourceId;
    @Column(name = "read_at", nullable = false)
    private Instant readAt;

    protected NotificationRead() {}
    NotificationRead(String userId, String sourceType, UUID sourceId, Instant readAt) {
        this.userId = userId; this.sourceType = sourceType; this.sourceId = sourceId; this.readAt = readAt;
    }
    UUID getSourceId() { return sourceId; }

    public static class Key implements Serializable {
        private String userId;
        private String sourceType;
        private UUID sourceId;
        public Key() {}
        @Override public boolean equals(Object value) {
            if (this == value) return true;
            if (!(value instanceof Key key)) return false;
            return java.util.Objects.equals(userId, key.userId)
                    && java.util.Objects.equals(sourceType, key.sourceType)
                    && java.util.Objects.equals(sourceId, key.sourceId);
        }
        @Override public int hashCode() { return java.util.Objects.hash(userId, sourceType, sourceId); }
    }
}
