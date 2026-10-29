package com.bimlab.ticket.dashboard;

import com.bimlab.ticket.auth.CurrentActor;
import com.bimlab.ticket.people.TeamDirectory;
import com.bimlab.ticket.ticket.TicketRecord;
import com.bimlab.ticket.ticket.TicketRepository;
import com.bimlab.ticket.ticket.TicketStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final TicketRepository tickets;
    private final TeamDirectory team;

    public DashboardController(TicketRepository tickets, TeamDirectory team) {
        this.tickets = tickets;
        this.team = team;
    }

    @GetMapping
    public Summary summary(@CurrentActor String actorId) {
        List<TicketRecord> all = tickets.findAll();
        String userId = team.requireMemberId(actorId);
        long open = all.stream().filter(ticket -> ticket.getStatus() != TicketStatus.DONE).count();
        long mine = all.stream().filter(ticket -> userId.equals(ticket.getAssigneeId())
                && ticket.getStatus() != TicketStatus.DONE).count();
        long unassigned = all.stream().filter(ticket -> ticket.getAssigneeId() == null
                && ticket.getStatus() != TicketStatus.DONE).count();
        Map<String, Long> byArea = all.stream().filter(ticket -> ticket.getStatus() != TicketStatus.DONE)
                .collect(Collectors.groupingBy(TicketRecord::getAreaId, Collectors.counting()));
        Map<String, Long> byAssignee = all.stream().filter(ticket -> ticket.getStatus() != TicketStatus.DONE)
                .filter(ticket -> ticket.getAssigneeId() != null)
                .collect(Collectors.groupingBy(TicketRecord::getAssigneeId, Collectors.counting()));
        return new Summary(all.size(), open, mine, unassigned, byArea, byAssignee);
    }

    public record Summary(long total, long open, long assignedToMe, long unassigned,
                          Map<String, Long> openByArea, Map<String, Long> openByAssignee) {}
}
