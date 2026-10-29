package com.bimlab.ticket.ticket;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TicketEventRepository extends JpaRepository<TicketEventRecord, UUID> {
    List<TicketEventRecord> findAllByTicketIdOrderByAtAsc(UUID ticketId);
    List<TicketEventRecord> findAllByOrderByAtAsc();
}
