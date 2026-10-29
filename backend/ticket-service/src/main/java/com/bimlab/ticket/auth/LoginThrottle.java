package com.bimlab.ticket.auth;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Locks a username for a while after repeated failed sign-ins. In memory: one service instance. */
@Component
class LoginThrottle {
    static final int MAX_FAILURES = 5;
    static final Duration LOCK = Duration.ofMinutes(5);

    private record Failures(int count, Instant lockedUntil) {}

    private final Map<String, Failures> failures = new ConcurrentHashMap<>();
    private final Clock clock;

    LoginThrottle(Clock clock) { this.clock = clock; }

    void checkAllowed(String username) {
        Failures current = failures.get(username);
        if (current != null && current.lockedUntil() != null && clock.instant().isBefore(current.lockedUntil())) {
            throw new AuthExceptions.TooManyAttempts();
        }
    }

    void recordFailure(String username) {
        failures.compute(username, (key, current) -> {
            int count = (current == null || current.lockedUntil() != null ? 0 : current.count()) + 1;
            return count >= MAX_FAILURES ? new Failures(0, clock.instant().plus(LOCK)) : new Failures(count, null);
        });
    }

    void recordSuccess(String username) { failures.remove(username); }
}
