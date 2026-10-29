package com.bimlab.ticket.auth;

import com.bimlab.ticket.people.TeamMember;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    private final SessionCookie cookie;

    AuthController(AuthService auth, SessionCookie cookie) {
        this.auth = auth;
        this.cookie = cookie;
    }

    public record LoginRequest(@NotBlank @Size(max = 120) String username, @NotBlank @Size(max = 128) String password) {}

    public record ChangePasswordRequest(@NotBlank @Size(max = 128) String currentPassword,
                                        @NotBlank @Size(max = 128) String newPassword) {}

    public record Me(TeamMember user, boolean mustChangePassword) {
        static Me from(AuthService.CurrentUser current) { return new Me(current.member(), current.mustChangePassword()); }
    }

    @PostMapping("/login")
    public Me login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthService.SignedIn signedIn = auth.login(request.username(), request.password());
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.issue(signedIn.token(), signedIn.ttl()));
        return Me.from(signedIn.user());
    }

    @GetMapping("/me")
    public Me me(@RequestAttribute(SessionInterceptor.USER_ATTRIBUTE) AuthService.CurrentUser user) {
        return Me.from(user);
    }

    @PostMapping("/password")
    public Me changePassword(@Valid @RequestBody ChangePasswordRequest request,
                             @RequestAttribute(SessionInterceptor.USER_ATTRIBUTE) AuthService.CurrentUser user,
                             @RequestAttribute(SessionInterceptor.TOKEN_ATTRIBUTE) String token) {
        return Me.from(auth.changePassword(user.member().id(), token, request.currentPassword(), request.newPassword()));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        auth.logout(cookie.read(request));
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.clear());
    }
}
