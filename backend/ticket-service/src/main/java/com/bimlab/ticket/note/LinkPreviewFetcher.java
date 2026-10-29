package com.bimlab.ticket.note;

import okhttp3.Dns;
import okhttp3.HttpUrl;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.net.URI;
import java.net.UnknownHostException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Fetches a page's title and description for a pasted link. Users choose the URL, so the server must not become a
 * way into the internal network: only http/https on ports 80/443, no proxy, hostnames that resolve to any non-public
 * address are refused before connecting, and every hop (including redirects and IP-literal URLs) is checked again
 * against the address actually connected to. Reads at most {@link #MAX_BYTES} of HTML within a few seconds.
 */
@Component
class LinkPreviewFetcher {
    private static final Logger logger = LoggerFactory.getLogger(LinkPreviewFetcher.class);
    static final int MAX_BYTES = 512 * 1024;
    private static final Pattern TITLE = Pattern.compile("(?is)<title[^>]*>(.*?)</title>");
    private static final Pattern META = Pattern.compile("(?is)<meta\\s[^>]*>");
    private static final Pattern ATTRIBUTE = Pattern.compile("(?is)([a-z][a-z0-9:_-]*)\\s*=\\s*(\"([^\"]*)\"|'([^']*)'|([^\\s>]+))");
    private static final Pattern NUMERIC_ENTITY = Pattern.compile("&#(x?)([0-9a-fA-F]+);");

    record PagePreview(String title, String description, String siteName) {}

    private final OkHttpClient client;

    LinkPreviewFetcher() { this(Dns.SYSTEM); }

    LinkPreviewFetcher(Dns resolver) {
        this.client = new OkHttpClient.Builder()
                .proxy(Proxy.NO_PROXY)
                .dns(publicOnly(resolver))
                .addNetworkInterceptor(chain -> {
                    HttpUrl url = chain.request().url();
                    if (url.port() != 80 && url.port() != 443) throw new IOException("Cổng không được phép: " + url.port());
                    var connection = chain.connection();
                    InetSocketAddress target = connection == null ? null : connection.route().socketAddress();
                    if (target == null || !isPublic(target.getAddress())) throw new IOException("Địa chỉ không công khai");
                    return chain.proceed(chain.request());
                })
                .connectTimeout(Duration.ofSeconds(3))
                .readTimeout(Duration.ofSeconds(4))
                .callTimeout(Duration.ofSeconds(6))
                .followRedirects(true)
                .followSslRedirects(true)
                .build();
    }

    Optional<PagePreview> fetch(URI uri) {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!scheme.equals("http") && !scheme.equals("https")) return Optional.empty();
        if (uri.getPort() != -1 && uri.getPort() != 80 && uri.getPort() != 443) return Optional.empty();
        HttpUrl url = HttpUrl.parse(uri.toString());
        if (url == null) return Optional.empty();
        Request request = new Request.Builder().url(url)
                .header("User-Agent", "BIMLabTicketLinkPreview/1.0")
                .header("Accept", "text/html,application/xhtml+xml")
                .build();
        try (Response response = client.newCall(request).execute()) {
            ResponseBody body = response.body();
            MediaType type = body.contentType();
            if (!response.isSuccessful() || type == null || !type.subtype().contains("html")) return Optional.empty();
            Charset charset = type.charset(StandardCharsets.UTF_8);
            return Optional.of(parse(new String(readLimited(body.byteStream()), charset)));
        } catch (IOException | RuntimeException exception) {
            logger.debug("Link preview failed for {}: {}", url.host(), exception.getMessage());
            return Optional.empty();
        }
    }

    private static byte[] readLimited(InputStream in) throws IOException {
        return in.readNBytes(MAX_BYTES);
    }

    static PagePreview parse(String html) {
        int headEnd = html.toLowerCase(Locale.ROOT).indexOf("</head>");
        String head = headEnd > 0 ? html.substring(0, headEnd) : html;
        Map<String, String> meta = new HashMap<>();
        Matcher tags = META.matcher(head);
        while (tags.find()) {
            Map<String, String> attributes = new HashMap<>();
            Matcher attribute = ATTRIBUTE.matcher(tags.group());
            while (attribute.find()) {
                String value = attribute.group(3) != null ? attribute.group(3) : attribute.group(4) != null ? attribute.group(4) : attribute.group(5);
                attributes.put(attribute.group(1).toLowerCase(Locale.ROOT), value);
            }
            String key = attributes.getOrDefault("property", attributes.get("name"));
            String content = attributes.get("content");
            if (key != null && content != null) meta.putIfAbsent(key.toLowerCase(Locale.ROOT), content);
        }
        Matcher title = TITLE.matcher(head);
        String pageTitle = title.find() ? title.group(1) : null;
        return new PagePreview(
                clean(first(meta.get("og:title"), meta.get("twitter:title"), pageTitle), 200),
                clean(first(meta.get("og:description"), meta.get("description"), meta.get("twitter:description")), 500),
                clean(meta.get("og:site_name"), 100));
    }

    private static String first(String... values) {
        for (String value : values) if (value != null && !value.isBlank()) return value;
        return null;
    }

    private static String clean(String value, int max) {
        if (value == null) return null;
        String text = unescape(value).replaceAll("\\s+", " ").trim();
        if (text.isEmpty()) return null;
        return text.length() > max ? text.substring(0, max - 1).trim() + "…" : text;
    }

    private static String unescape(String value) {
        Matcher numeric = NUMERIC_ENTITY.matcher(value);
        StringBuilder out = new StringBuilder();
        while (numeric.find()) {
            String replacement;
            try {
                int code = Integer.parseInt(numeric.group(2), numeric.group(1).isEmpty() ? 10 : 16);
                replacement = Character.isValidCodePoint(code) ? new String(Character.toChars(code)) : "";
            } catch (NumberFormatException exception) {
                replacement = "";
            }
            numeric.appendReplacement(out, Matcher.quoteReplacement(replacement));
        }
        numeric.appendTail(out);
        return out.toString().replace("&quot;", "\"").replace("&#39;", "'").replace("&apos;", "'")
                .replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;", " ").replace("&amp;", "&");
    }

    static Dns publicOnly(Dns resolver) {
        return hostname -> {
            List<InetAddress> addresses = resolver.lookup(hostname);
            if (addresses.isEmpty() || !addresses.stream().allMatch(LinkPreviewFetcher::isPublic)) {
                throw new UnknownHostException("Không lấy xem trước cho địa chỉ nội bộ: " + hostname);
            }
            return addresses;
        };
    }

    /** True only for globally routable unicast addresses. */
    static boolean isPublic(InetAddress address) {
        if (address == null || address.isAnyLocalAddress() || address.isLoopbackAddress() || address.isLinkLocalAddress()
                || address.isSiteLocalAddress() || address.isMulticastAddress()) return false;
        byte[] b = address.getAddress();
        if (address instanceof Inet4Address) return isPublicV4(b);
        if (address instanceof Inet6Address) {
            int first = b[0] & 0xff;
            if ((first & 0xfe) == 0xfc) return false;                  // fc00::/7 unique local
            if (first == 0x20 && (b[1] & 0xff) == 0x01 && (b[2] & 0xff) == 0x0d && (b[3] & 0xff) == 0xb8) return false; // 2001:db8::/32
            boolean nat64 = first == 0x00 && (b[1] & 0xff) == 0x64 && (b[2] & 0xff) == 0xff && (b[3] & 0xff) == 0x9b; // 64:ff9b::/96
            boolean compatible = true;                                    // ::a.b.c.d and ::ffff:a.b.c.d
            for (int i = 0; i < 10; i++) compatible &= b[i] == 0;
            boolean mapped = compatible && (((b[10] & 0xff) == 0xff && (b[11] & 0xff) == 0xff) || (b[10] == 0 && b[11] == 0));
            if (nat64 || mapped) return isPublicV4(new byte[] {b[12], b[13], b[14], b[15]});
            return (first & 0xe0) == 0x20;                               // only 2000::/3 is global unicast
        }
        return false;
    }

    private static boolean isPublicV4(byte[] b) {
        int a0 = b[0] & 0xff, a1 = b[1] & 0xff, a2 = b[2] & 0xff;
        if (a0 == 0 || a0 == 10 || a0 == 127 || a0 >= 224) return false;  // this-network, private, loopback, multicast/reserved
        if (a0 == 100 && a1 >= 64 && a1 <= 127) return false;              // 100.64.0.0/10 carrier-grade NAT
        if (a0 == 169 && a1 == 254) return false;                          // link-local, cloud metadata
        if (a0 == 172 && a1 >= 16 && a1 <= 31) return false;
        if (a0 == 192 && a1 == 168) return false;
        if (a0 == 192 && a1 == 0 && (a2 == 0 || a2 == 2)) return false;    // IETF protocol assignments, TEST-NET-1
        if (a0 == 198 && (a1 == 18 || a1 == 19)) return false;             // benchmarking
        if (a0 == 198 && a1 == 51 && a2 == 100) return false;              // TEST-NET-2
        if (a0 == 203 && a1 == 0 && a2 == 113) return false;               // TEST-NET-3
        return true;
    }
}
