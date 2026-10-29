package com.bimlab.ticket.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;

/**
 * Requires a valid session for every API call except sign-in. Until a member replaces the initial password,
 * only the account endpoints are open.
 */
@Component
public class SessionInterceptor implements HandlerInterceptor {
    static final String USER_ATTRIBUTE = "com.bimlab.ticket.auth.user";
    static final String TOKEN_ATTRIBUTE = "com.bimlab.ticket.auth.token";
    private static final Set<String> OPEN_DURING_PASSWORD_CHANGE = Set.of("/api/auth/me", "/api/auth/password", "/api/auth/logout");

    private final AuthService auth;
    private final SessionCookie cookie;

    SessionInterceptor(AuthService auth, SessionCookie cookie) {
        this.auth = auth;
        this.cookie = cookie;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equals(request.getMethod())) return true;
        String token = cookie.read(request);
        AuthService.CurrentUser user = auth.currentUser(token)
                .orElseThrow(() -> new AuthExceptions.AuthenticationRequired("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"));
        if (user.mustChangePassword() && !OPEN_DURING_PASSWORD_CHANGE.contains(request.getRequestURI())) {
            throw new AuthExceptions.PasswordChangeRequired();
        }
        request.setAttribute(USER_ATTRIBUTE, user);
        request.setAttribute(TOKEN_ATTRIBUTE, token);
        return true;
    }
}
