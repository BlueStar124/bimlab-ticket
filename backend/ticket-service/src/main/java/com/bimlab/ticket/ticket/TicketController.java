package com.bimlab.ticket.ticket;

import com.bimlab.ticket.auth.CurrentActor;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {
    private final TicketService service;

    public TicketController(TicketService service) {
        this.service = service;
    }

    @GetMapping
    public List<TicketResponses.Ticket> list() { return service.list(); }

    @GetMapping("/{id}")
    public TicketResponses.Ticket get(@PathVariable UUID id) { return service.get(id); }

    @GetMapping("/events")
    public List<TicketResponses.Event> allHistory() { return service.allHistory(); }

    @GetMapping("/{id}/events")
    public List<TicketResponses.Event> history(@PathVariable UUID id) { return service.history(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponses.Ticket create(@Valid @RequestBody TicketRequests.Create request, @CurrentActor String actorId) {
        return service.create(request, actorId);
    }

    @PatchMapping("/{id}/status")
    public TicketResponses.Ticket status(@PathVariable UUID id, @Valid @RequestBody TicketRequests.ChangeStatus request, @CurrentActor String actorId) {
        return service.changeStatus(id, request.status(), actorId);
    }

    @PatchMapping("/{id}/assignee")
    public TicketResponses.Ticket assign(@PathVariable UUID id, @Valid @RequestBody TicketRequests.Assign request, @CurrentActor String actorId) {
        return service.assign(id, request.assigneeId(), actorId);
    }

    @PatchMapping("/{id}/priority")
    public TicketResponses.Ticket priority(@PathVariable UUID id, @Valid @RequestBody TicketRequests.ChangePriority request, @CurrentActor String actorId) {
        return service.changePriority(id, request.priority(), actorId);
    }

    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponses.Event comment(@PathVariable UUID id, @Valid @RequestBody TicketRequests.AddComment request, @CurrentActor String actorId) {
        return service.addComment(id, request.text(), actorId);
    }
}
