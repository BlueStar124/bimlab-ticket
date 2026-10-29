package com.bimlab.ticket.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/** The HttpOnly cookie that carries the session token; scripts on the page never see it. */
@Component
class SessionCookie {
    static final String NAME = "TICKET_SESSION";

    private final boolean secure;

    SessionCookie(@Value("${app.auth.cookie-secure:false}") boolean secure) { this.secure = secure; }

    String read(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (NAME.equals(cookie.getName())) return cookie.getValue();
        }
        return null;
    }

    String issue(String token, Duration ttl) { return build(token, ttl); }

    String clear() { return build("", Duration.ZERO); }

    private String build(String value, Duration maxAge) {
        return ResponseCookie.from(NAME, value).httpOnly(true).secure(secure).sameSite("Lax").path("/")
                .maxAge(maxAge).build().toString();
    }
}
