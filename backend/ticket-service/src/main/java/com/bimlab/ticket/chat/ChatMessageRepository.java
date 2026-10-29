package com.bimlab.ticket.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessageRecord, UUID> {
    List<ChatMessageRecord> findTop200ByOrderByAtDesc();
    long countByAuthorIdNotAndAtAfter(String authorId, Instant at);
    long countByAuthorIdNot(String authorId);
}
