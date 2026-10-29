package com.bimlab.ticket.note;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

interface SharedNoteLikeRepository extends JpaRepository<SharedNoteLike, SharedNoteLike.Key> {
    List<SharedNoteLike> findAllByNoteIdIn(Collection<UUID> noteIds);
}
