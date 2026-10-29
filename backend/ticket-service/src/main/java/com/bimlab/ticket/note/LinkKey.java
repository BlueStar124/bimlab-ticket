package com.bimlab.ticket.note;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Identity of a link for duplicate detection: the same page copied with or without {@code www.}, {@code https},
 * a trailing slash, a {@code #fragment} or tracking parameters ({@code utm_*}, {@code fbclid}, {@code gclid}) gives the same key.
 */
final class LinkKey {
    private static final Pattern TRACKING = Pattern.compile("(?i)utm_[^=]*|fbclid|gclid");

    private LinkKey() {}

    static Optional<String> of(String url) {
        if (url == null || url.isBlank()) return Optional.empty();
        try {
            URI uri = new URI(url.trim());
            if (uri.getHost() == null) return Optional.empty();
            String host = uri.getHost().toLowerCase(Locale.ROOT).replaceFirst("^www\\.", "");
            String path = uri.getRawPath() == null ? "" : uri.getRawPath().replaceAll("/+$", "");
            String query = uri.getRawQuery() == null ? "" : Arrays.stream(uri.getRawQuery().split("&"))
                    .filter(part -> !part.isEmpty() && !TRACKING.matcher(part.split("=", 2)[0]).matches())
                    .collect(Collectors.joining("&"));
            boolean defaultPort = uri.getPort() == -1 || uri.getPort() == 80 || uri.getPort() == 443;
            return Optional.of(host + (defaultPort ? "" : ":" + uri.getPort()) + path + (query.isEmpty() ? "" : "?" + query));
        } catch (URISyntaxException exception) {
            return Optional.empty();
        }
    }
}
