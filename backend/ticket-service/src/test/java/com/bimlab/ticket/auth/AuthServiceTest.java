package com.bimlab.ticket.auth;

import com.bimlab.ticket.people.TeamDirectory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {
    private static final String INITIAL = "initial-pass-2026";
    private static final Instant NOW = Instant.parse("2026-10-29T08:00:00Z");

    private final Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);
    private final TeamDirectory team = new TeamDirectory("it-nam|Nguyễn Hải Nam|Trưởng nhóm IT;it-duc|Đỗ Minh Đức|Backend");
    private final TeamAccountRepository accounts = mock(TeamAccountRepository.class);
    private final AuthSessionRepository sessions = mock(AuthSessionRepository.class);
    private AuthService auth;

    @BeforeEach
    void setUp() {
        when(accounts.save(any())).thenAnswer(call -> call.getArgument(0));
        auth = new AuthService(team, accounts, sessions, new LoginThrottle(clock), clock, INITIAL, Duration.ofHours(12));
    }

    @Test
    void firstSignInWithInitialPasswordCreatesAccountThatMustChangePassword() {
        AuthService.SignedIn signedIn = auth.login(" IT-Nam ", INITIAL);

        assertEquals("it-nam", signedIn.user().member().id());
        assertTrue(signedIn.user().mustChangePassword());
        ArgumentCaptor<AuthSession> session = ArgumentCaptor.forClass(AuthSession.class);
        verify(sessions).save(session.capture());
        assertEquals(AuthService.hash(signedIn.token()), session.getValue().getTokenHash());
        assertEquals(NOW.plus(Duration.ofHours(12)), session.getValue().getExpiresAt());
    }

    @Test
    void personalPasswordReplacesInitialOne() {
        String hash = new BCryptPasswordEncoder().encode("my-own-password");
        when(accounts.findById("it-duc")).thenReturn(Optional.of(new TeamAccount("it-duc", hash, false, NOW)));

        assertFalse(auth.login("it-duc", "my-own-password").user().mustChangePassword());
        assertThrows(AuthExceptions.AuthenticationRequired.class, () -> auth.login("it-duc", INITIAL));
    }

    @Test
    void unknownUsernameIsRejectedWithoutCreatingAnything() {
        assertThrows(AuthExceptions.AuthenticationRequired.class, () -> auth.login("someone", INITIAL));
        verify(accounts, never()).save(any());
        verify(sessions, never()).save(any());
    }

    @Test
    void repeatedFailuresLockTheUsername() {
        for (int i = 0; i < LoginThrottle.MAX_FAILURES; i++) {
            assertThrows(AuthExceptions.AuthenticationRequired.class, () -> auth.login("it-nam", "wrong"));
        }
        assertThrows(AuthExceptions.TooManyAttempts.class, () -> auth.login("it-nam", INITIAL));
    }

    @Test
    void sessionOfMemberRemovedFromConfigurationIsNoLongerValid() {
        when(sessions.findById(AuthService.hash("token"))).thenReturn(Optional.of(new AuthSession(AuthService.hash("token"), "it-old", NOW, NOW.plusSeconds(60))));

        assertTrue(auth.currentUser("token").isEmpty());
    }

    @Test
    void expiredSessionIsNotValid() {
        when(sessions.findById(AuthService.hash("token"))).thenReturn(Optional.of(new AuthSession(AuthService.hash("token"), "it-nam", NOW.minusSeconds(60), NOW)));

        assertTrue(auth.currentUser("token").isEmpty());
    }

    @Test
    void newPasswordMustDifferFromInitialAndBeLongEnough() {
        String hash = new BCryptPasswordEncoder().encode(INITIAL);
        when(accounts.findById("it-nam")).thenReturn(Optional.of(new TeamAccount("it-nam", hash, true, NOW)));

        assertThrows(IllegalArgumentException.class, () -> auth.changePassword("it-nam", "token", INITIAL, "short"));
        assertThrows(IllegalArgumentException.class, () -> auth.changePassword("it-nam", "token", INITIAL, INITIAL));
        assertThrows(IllegalArgumentException.class, () -> auth.changePassword("it-nam", "token", "wrong-current", "a-new-password"));

        assertFalse(auth.changePassword("it-nam", "token", INITIAL, "a-new-password").mustChangePassword());
        verify(sessions).deleteOtherSessions("it-nam", AuthService.hash("token"));
    }
}
