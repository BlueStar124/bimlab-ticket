package com.bimlab.ticket.note;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SharedNoteRepository extends JpaRepository<SharedNoteRecord, UUID> {
    List<SharedNoteRecord> findAllByOrderByUpdatedAtDesc();
}
