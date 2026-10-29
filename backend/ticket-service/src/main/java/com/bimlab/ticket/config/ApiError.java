package com.bimlab.ticket.config;

import java.time.Instant;

public record ApiError(Instant timestamp, int status, String error, String message) {}
