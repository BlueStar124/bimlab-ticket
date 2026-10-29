package com.bimlab.ticket.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

interface AuthSessionRepository extends JpaRepository<AuthSession, String> {
    @Modifying
    @Query("delete from AuthSession s where s.expiresAt < :now")
    void deleteExpired(@Param("now") Instant now);

    @Modifying
    @Query("delete from AuthSession s where s.username = :username and s.tokenHash <> :keep")
    void deleteOtherSessions(@Param("username") String username, @Param("keep") String keepTokenHash);
}
