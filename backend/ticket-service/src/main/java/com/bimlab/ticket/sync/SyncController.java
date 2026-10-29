package com.bimlab.ticket.sync;

import com.bimlab.ticket.auth.CurrentActor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Light "realtime": clients poll a short version string every few seconds and reload data only when it
 * changes. The version covers tickets, history, attachments, chat, the link board, and the caller's read state, so a
 * change on another device also shows up. Counts catch deletions; max timestamps catch edits.
 */
@RestController
@RequestMapping("/api/sync")
public class SyncController {
    private static final String VERSION_SQL = """
            SELECT concat_ws('|',
              (SELECT count(*) || '-' || coalesce(max(updated_at)::text, '') FROM ticket.tickets),
              (SELECT count(*) || '-' || coalesce(max(occurred_at)::text, '') FROM ticket.ticket_events),
              (SELECT count(*) || '-' || coalesce(max(created_at)::text, '') FROM ticket.ticket_attachments),
              (SELECT count(*) || '-' || coalesce(max(occurred_at)::text, '') FROM ticket.chat_messages),
              (SELECT count(*) || '-' || coalesce(max(updated_at)::text, '') FROM ticket.shared_notes),
              (SELECT count(*) || '-' || coalesce(max(created_at)::text, '') FROM ticket.shared_note_likes),
              (SELECT count(*) FROM ticket.notification_reads WHERE user_id = ?),
              (SELECT coalesce(max(read_at)::text, '') FROM ticket.chat_read_markers WHERE user_id = ?))
            """;

    private final JdbcTemplate jdbc;

    public SyncController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public record Version(String version) {}

    @GetMapping("/version")
    public Version version(@CurrentActor String actorId) {
        return new Version(jdbc.queryForObject(VERSION_SQL, String.class, actorId, actorId));
    }
}
