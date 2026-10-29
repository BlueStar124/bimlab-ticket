package com.bimlab.ticket.people;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/people")
public class PeopleController {
    private final TeamDirectory team;
    public PeopleController(TeamDirectory team) { this.team = team; }
    @GetMapping
    public List<TeamMember> list() { return team.all(); }
}
