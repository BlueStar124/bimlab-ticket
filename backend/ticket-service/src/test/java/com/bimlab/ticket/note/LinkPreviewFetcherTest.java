package com.bimlab.ticket.note;

import okhttp3.Dns;
import org.junit.jupiter.api.Test;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LinkPreviewFetcherTest {
    private static InetAddress ip(String literal) throws UnknownHostException { return InetAddress.getByName(literal); }

    @Test
    void onlyGloballyRoutableAddressesArePublic() throws Exception {
        for (String blocked : List.of("127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.110.146", "169.254.169.254", "100.64.0.1",
                "0.0.0.0", "224.0.0.1", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1", "64:ff9b::a00:1")) {
            assertFalse(LinkPreviewFetcher.isPublic(ip(blocked)), blocked);
        }
        for (String allowed : List.of("8.8.8.8", "140.82.112.3", "2606:4700:4700::1111")) {
            assertTrue(LinkPreviewFetcher.isPublic(ip(allowed)), allowed);
        }
    }

    @Test
    void hostnameResolvingToAnyInternalAddressIsRefusedBeforeConnecting() throws Exception {
        Dns mixed = host -> List.of(ip("140.82.112.3"), ip("10.0.0.5"));
        Dns internal = host -> List.of(ip("192.168.110.146"));
        Dns external = host -> List.of(ip("140.82.112.3"));

        assertThrows(UnknownHostException.class, () -> LinkPreviewFetcher.publicOnly(mixed).lookup("rebind.example"));
        assertThrows(UnknownHostException.class, () -> LinkPreviewFetcher.publicOnly(internal).lookup("intranet.example"));
        assertEquals(1, LinkPreviewFetcher.publicOnly(external).lookup("github.com").size());
    }

    @Test
    void nonWebSchemesAndPortsAreNotFetched() {
        LinkPreviewFetcher fetcher = new LinkPreviewFetcher(host -> { throw new AssertionError("must not resolve " + host); });

        assertTrue(fetcher.fetch(URI.create("file:///etc/passwd")).isEmpty());
        assertTrue(fetcher.fetch(URI.create("http://example.com:8080/admin")).isEmpty());
        assertTrue(fetcher.fetch(URI.create("gopher://example.com/")).isEmpty());
    }

    @Test
    void parsesOpenGraphBeforeTitleAndDecodesEntities() {
        String html = """
                <html><head>
                  <title>Fallback title</title>
                  <meta property="og:title" content="Tailscale Funnel &amp; HTTPS">
                  <meta name='description' content='Mở dịch vụ &#273;ra internet  qua HTTPS'>
                  <meta content="Tailscale" property="og:site_name">
                </head><body><meta property="og:title" content="ignored in body"></body></html>
                """;

        LinkPreviewFetcher.PagePreview preview = LinkPreviewFetcher.parse(html);

        assertEquals("Tailscale Funnel & HTTPS", preview.title());
        assertEquals("Mở dịch vụ đra internet qua HTTPS", preview.description());
        assertEquals("Tailscale", preview.siteName());
    }

    @Test
    void fallsBackToTitleTagAndToleratesMissingMeta() {
        LinkPreviewFetcher.PagePreview preview = LinkPreviewFetcher.parse("<html><head><title>\n  Vite  Guide </title></head></html>");

        assertEquals("Vite Guide", preview.title());
        assertNull(preview.description());
        assertNull(preview.siteName());
    }
}
