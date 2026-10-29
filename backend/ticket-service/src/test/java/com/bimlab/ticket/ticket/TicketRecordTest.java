package com.bimlab.ticket.ticket;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TicketRecordTest {
    private static final Instant CREATED_AT = Instant.parse("2026-10-22T06:00:00Z");

    @Test
    void startingUnassignedTicketAssignsActorAndSetsStartTime() {
        TicketRecord ticket = ticket();

        ticket.assign("it-duc", CREATED_AT.plusSeconds(60));
        ticket.changeStatus(TicketStatus.IN_PROGRESS, CREATED_AT.plusSeconds(60));

        assertEquals("it-duc", ticket.getAssigneeId());
        assertEquals(CREATED_AT.plusSeconds(60), ticket.getStartedAt());
        assertEquals(CREATED_AT.plusSeconds(60), ticket.getUpdatedAt());
        assertNull(ticket.getDoneAt());
    }

    @Test
    void reopeningDoneTicketClearsWorkTimestamps() {
        TicketRecord ticket = ticket();
        Instant startedAt = CREATED_AT.plusSeconds(60);
        ticket.changeStatus(TicketStatus.IN_PROGRESS, startedAt);
        ticket.changeStatus(TicketStatus.DONE, startedAt.plusSeconds(120));
        Instant reopenedAt = startedAt.plusSeconds(240);

        ticket.changeStatus(TicketStatus.TODO, reopenedAt);

        assertEquals(TicketStatus.TODO, ticket.getStatus());
        assertNull(ticket.getStartedAt());
        assertNull(ticket.getDoneAt());
        assertEquals(reopenedAt, ticket.getUpdatedAt());
    }

    @Test
    void rejectsChangingToCurrentStatus() {
        TicketRecord ticket = ticket();

        assertThrows(TicketConflictException.class, () -> ticket.changeStatus(TicketStatus.TODO, CREATED_AT));
    }

    private TicketRecord ticket() {
        return new TicketRecord("BLT-2610-0001", "Lỗi đăng nhập", "Không thể đăng nhập", "hrm",
                TicketEnvironment.PRODUCTION, TicketPriority.HIGH, "it-nam", null, CREATED_AT);
    }
}
