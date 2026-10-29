package com.bimlab.ticket.auth;

/** Errors the API maps to 401, 403 and 429; messages are shown to the user as-is. */
public final class AuthExceptions {
    private AuthExceptions() {}

    public static class AuthenticationRequired extends RuntimeException {
        public AuthenticationRequired(String message) { super(message); }
    }

    public static class PasswordChangeRequired extends RuntimeException {
        public PasswordChangeRequired() { super("Cần đổi mật khẩu trước khi tiếp tục"); }
    }

    public static class TooManyAttempts extends RuntimeException {
        public TooManyAttempts() { super("Sai mật khẩu quá nhiều lần, thử lại sau ít phút"); }
    }
}
