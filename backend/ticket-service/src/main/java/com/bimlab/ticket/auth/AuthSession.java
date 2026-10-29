package com.bimlab.ticket.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "auth_sessions")
class AuthSession {
    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "token_hash", length = 64)
    private String tokenHash;
    @Column(name = "username", nullable = false, length = 120)
    private String username;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    protected AuthSession() {}

    AuthSession(String tokenHash, String username, Instant createdAt, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.username = username;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    String getTokenHash() { return tokenHash; }
    String getUsername() { return username; }
    Instant getExpiresAt() { return expiresAt; }
}
