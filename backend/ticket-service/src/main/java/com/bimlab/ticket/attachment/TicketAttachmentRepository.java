package com.bimlab.ticket.attachment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface TicketAttachmentRepository extends JpaRepository<TicketAttachmentRecord, UUID> {
    List<TicketAttachmentRecord> findAllByTicketIdOrderByCreatedAtAsc(UUID ticketId);
    List<TicketAttachmentRecord> findAllByOrderByCreatedAtAsc();
    Optional<TicketAttachmentRecord> findByIdAndTicketId(UUID id, UUID ticketId);
}
