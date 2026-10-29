package com.bimlab.ticket.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

interface NotificationReadRepository extends JpaRepository<NotificationRead, NotificationRead.Key> {
    List<NotificationRead> findAllByUserIdAndSourceTypeAndSourceIdIn(String userId, String sourceType, Collection<UUID> sourceIds);
}
