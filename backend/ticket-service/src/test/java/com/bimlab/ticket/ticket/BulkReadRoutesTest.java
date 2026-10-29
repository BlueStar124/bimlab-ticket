package com.bimlab.ticket.ticket;

import com.bimlab.ticket.attachment.TicketAttachmentController;
import com.bimlab.ticket.attachment.TicketAttachmentService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The bulk reads share the /api/tickets prefix with /{id}; they must not be routed as a ticket id. */
class BulkReadRoutesTest {
    private final TicketService tickets = mock(TicketService.class);
    private final TicketAttachmentService attachments = mock(TicketAttachmentService.class);
    private final MockMvc mvc = MockMvcBuilders
            .standaloneSetup(new TicketController(tickets), new TicketAttachmentController(attachments))
            .build();

    @Test
    void allEventsRouteReadsEveryTicketHistory() throws Exception {
        when(tickets.allHistory()).thenReturn(List.of());

        mvc.perform(get("/api/tickets/events")).andExpect(status().isOk());

        verify(tickets).allHistory();
        verify(tickets, never()).get(any());
    }

    @Test
    void allAttachmentsRouteListsEveryTicketAttachment() throws Exception {
        when(attachments.listAll()).thenReturn(List.of());

        mvc.perform(get("/api/tickets/attachments")).andExpect(status().isOk());

        verify(attachments).listAll();
        verify(tickets, never()).get(any());
    }
}
