package com.bimlab.ticket.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "team_accounts")
class TeamAccount {
    @Id
    @Column(name = "username", length = 120)
    private String username;
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;
    @Column(name = "must_change_password", nullable = false)
    private boolean mustChangePassword;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected TeamAccount() {}

    TeamAccount(String username, String passwordHash, boolean mustChangePassword, Instant now) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.mustChangePassword = mustChangePassword;
        this.createdAt = now;
        this.updatedAt = now;
    }

    String getUsername() { return username; }
    String getPasswordHash() { return passwordHash; }
    boolean isMustChangePassword() { return mustChangePassword; }

    void changePassword(String newHash, Instant now) {
        this.passwordHash = newHash;
        this.mustChangePassword = false;
        this.updatedAt = now;
    }
}
