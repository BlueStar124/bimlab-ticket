package com.bimlab.ticket.ticket;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<TicketRecord, UUID> {
    Optional<TicketRecord> findByCode(String code);
    List<TicketRecord> findAllByOrderByCreatedAtDesc();
}
