package com.bimlab.ticket.auth;

import com.bimlab.ticket.people.TeamDirectory;
import com.bimlab.ticket.people.TeamMember;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;

/**
 * Sign-in for the configured IT team. A member without an account signs in once with the shared initial
 * password ({@code app.auth.initial-password}) and must then choose a personal one. Sessions are random
 * tokens; only their SHA-256 hash is stored.
 */
@Service
public class AuthService {
    static final int MIN_PASSWORD_LENGTH = 10;
    static final int MAX_PASSWORD_LENGTH = 128;
    private static final String WRONG_CREDENTIALS = "Sai tên đăng nhập hoặc mật khẩu";

    private final TeamDirectory team;
    private final TeamAccountRepository accounts;
    private final AuthSessionRepository sessions;
    private final LoginThrottle throttle;
    private final Clock clock;
    private final String initialPassword;
    private final Duration sessionTtl;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final SecureRandom random = new SecureRandom();
    // Compared against when the username is unknown, so a miss costs as much time as a wrong password.
    private final String dummyHash;

    AuthService(TeamDirectory team, TeamAccountRepository accounts, AuthSessionRepository sessions, LoginThrottle throttle,
                Clock clock, @Value("${app.auth.initial-password:}") String initialPassword,
                @Value("${app.auth.session-ttl:12h}") Duration sessionTtl) {
        this.team = team;
        this.accounts = accounts;
        this.sessions = sessions;
        this.throttle = throttle;
        this.clock = clock;
        this.initialPassword = initialPassword;
        this.sessionTtl = sessionTtl;
        this.dummyHash = encoder.encode("not-a-real-password");
    }

    public record SignedIn(String token, Duration ttl, CurrentUser user) {}

    public record CurrentUser(TeamMember member, boolean mustChangePassword) {}

    @Transactional
    public SignedIn login(String rawUsername, String password) {
        String username = rawUsername == null ? "" : rawUsername.trim().toLowerCase(Locale.ROOT);
        throttle.checkAllowed(username);
        Optional<TeamMember> member = team.find(username);
        Optional<TeamAccount> existing = member.flatMap(m -> accounts.findById(m.id()));
        boolean valid;
        if (member.isEmpty()) {
            encoder.matches(password, dummyHash);
            valid = false;
        } else if (existing.isPresent()) {
            valid = encoder.matches(password, existing.get().getPasswordHash());
        } else {
            valid = !initialPassword.isEmpty() && constantTimeEquals(password, initialPassword);
        }
        if (!valid) {
            throttle.recordFailure(username);
            throw new AuthExceptions.AuthenticationRequired(WRONG_CREDENTIALS);
        }
        throttle.recordSuccess(username);
        Instant now = clock.instant();
        TeamAccount account = existing.orElseGet(() -> accounts.save(new TeamAccount(username, encoder.encode(password), true, now)));
        sessions.deleteExpired(now);
        String token = newToken();
        sessions.save(new AuthSession(hash(token), username, now, now.plus(sessionTtl)));
        return new SignedIn(token, sessionTtl, new CurrentUser(member.get(), account.isMustChangePassword()));
    }

    /** The signed-in member for a session token, or empty when the token is unknown, expired or the member was removed. */
    @Transactional(readOnly = true)
    public Optional<CurrentUser> currentUser(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        Instant now = clock.instant();
        return sessions.findById(hash(token))
                .filter(session -> session.getExpiresAt().isAfter(now))
                .flatMap(session -> team.find(session.getUsername())
                        .flatMap(member -> accounts.findById(member.id())
                                .map(account -> new CurrentUser(member, account.isMustChangePassword()))));
    }

    @Transactional
    public void logout(String token) {
        if (token != null && !token.isBlank()) sessions.deleteById(hash(token));
    }

    /** Sets a personal password and signs out the member's other sessions; the current one stays valid. */
    @Transactional
    public CurrentUser changePassword(String username, String currentToken, String currentPassword, String newPassword) {
        TeamMember member = team.find(username).orElseThrow(() -> new AuthExceptions.AuthenticationRequired("Phiên đăng nhập không hợp lệ"));
        TeamAccount account = accounts.findById(username).orElseThrow(() -> new AuthExceptions.AuthenticationRequired("Phiên đăng nhập không hợp lệ"));
        if (!encoder.matches(currentPassword, account.getPasswordHash())) throw new IllegalArgumentException("Mật khẩu hiện tại không đúng");
        if (newPassword.length() < MIN_PASSWORD_LENGTH || newPassword.length() > MAX_PASSWORD_LENGTH) {
            throw new IllegalArgumentException("Mật khẩu mới cần từ " + MIN_PASSWORD_LENGTH + " đến " + MAX_PASSWORD_LENGTH + " ký tự");
        }
        if (newPassword.equals(currentPassword) || (!initialPassword.isEmpty() && newPassword.equals(initialPassword))) {
            throw new IllegalArgumentException("Mật khẩu mới phải khác mật khẩu hiện tại và mật khẩu ban đầu");
        }
        account.changePassword(encoder.encode(newPassword), clock.instant());
        sessions.deleteOtherSessions(username, hash(currentToken));
        return new CurrentUser(member, false);
    }

    private String newToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static boolean constantTimeEquals(String given, String expected) {
        return MessageDigest.isEqual(given.getBytes(StandardCharsets.UTF_8), expected.getBytes(StandardCharsets.UTF_8));
    }
}
