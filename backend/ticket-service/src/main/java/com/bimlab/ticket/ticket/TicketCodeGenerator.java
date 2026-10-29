package com.bimlab.ticket.ticket;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.YearMonth;
import java.sql.PreparedStatement;

@Component
class TicketCodeGenerator {
    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;

    TicketCodeGenerator(JdbcTemplate jdbcTemplate, Clock clock) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    String nextCode() {
        YearMonth month = YearMonth.now(clock);
        String prefix = "BLT-%02d%02d-".formatted(month.getYear() % 100, month.getMonthValue());
        jdbcTemplate.execute((org.springframework.jdbc.core.ConnectionCallback<Void>) connection -> {
            PreparedStatement statement = connection.prepareStatement("select pg_advisory_xact_lock(hashtext(?))");
            statement.setString(1, prefix);
            statement.execute();
            return null;
        });
        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from tickets where code like ?", Integer.class, prefix + "%");
        return prefix + "%04d".formatted((count == null ? 0 : count) + 1);
    }
}
