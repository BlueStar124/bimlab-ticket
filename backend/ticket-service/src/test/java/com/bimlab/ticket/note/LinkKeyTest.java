package com.bimlab.ticket.note;

import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

class LinkKeyTest {
    @Test
    void samePageCopiedDifferentlyHasOneKey() {
        Optional<String> key = LinkKey.of("https://tailscale.com/kb/1223/funnel");

        assertEquals(key, LinkKey.of("http://www.Tailscale.com/kb/1223/funnel/"));
        assertEquals(key, LinkKey.of("https://tailscale.com/kb/1223/funnel/?utm_source=chat&fbclid=x#setup"));
        assertEquals(key, LinkKey.of("https://tailscale.com:443/kb/1223/funnel"));
    }

    @Test
    void meaningfulQueryAndPathStillDistinguishLinks() {
        assertNotEquals(LinkKey.of("https://example.com/search?q=spring"), LinkKey.of("https://example.com/search?q=vite"));
        assertNotEquals(LinkKey.of("https://example.com/a"), LinkKey.of("https://example.com/b"));
        assertNotEquals(LinkKey.of("https://example.com:8443/a"), LinkKey.of("https://example.com/a"));
    }

    @Test
    void notesWithoutAUsableLinkHaveNoKey() {
        assertEquals(Optional.empty(), LinkKey.of(null));
        assertEquals(Optional.empty(), LinkKey.of("  "));
        assertEquals(Optional.empty(), LinkKey.of("not a url"));
    }
}
