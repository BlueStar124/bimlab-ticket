import { describe, expect, it } from 'vitest';
import { type SharedNote, boardOrder, cleanPageTitle, guessBoard, guessCategory, hostOf, hotNotes, matchesQuery, parseLink, withLikeToggled } from '@/domain/note';

const note = (id: string, extra: Partial<SharedNote> = {}): SharedNote => ({
  id, title: id, category: 'tool', customType: null, board: 'backend', pinned: false, content: '', url: null, description: null,
  tags: [], authorId: 'it-nam', likedBy: [], likesThisWeek: 0, createdAt: '2026-10-20T00:00:00Z', updatedAt: '2026-10-20T00:00:00Z', ...extra,
});

describe('parseLink', () => {
  it('accepts full and bare links, rejects text', () => {
    expect(parseLink('https://vite.dev/guide')?.href).toBe('https://vite.dev/guide');
    expect(parseLink('  vite.dev/guide ')?.href).toBe('https://vite.dev/guide');
    expect(parseLink('xem cái này nhé')).toBeNull();
    expect(parseLink('localhost')).toBeNull();
    expect(parseLink('ftp://example.com')).toBeNull();
  });

  it('reads the host without www', () => {
    expect(hostOf('https://www.figma.com/community')).toBe('figma.com');
  });
});

describe('guessCategory / guessBoard', () => {
  const g = (u: string) => guessCategory(parseLink(u)!);

  it('guesses the kind of link from its address', () => {
    expect(g('https://github.com/microsoft/playwright')).toBe('repository');
    expect(g('https://dev.bimlab.com.vn/BIMLab_Platform')).toBe('repository');
    expect(g('https://claude.ai/new')).toBe('prompt');
    expect(g('https://www.figma.com/community')).toBe('design');
    expect(g('https://youtu.be/abc')).toBe('video');
    expect(g('https://docs.spring.io/spring-boot')).toBe('resource');
    expect(g('https://tailscale.com/kb/1223/funnel')).toBe('resource');
    expect(g('https://render.com')).toBe('tool');
  });

  it('suggests a board from the kind, BIMLab domains, or the board being viewed', () => {
    expect(guessBoard('prompt', null, 'devops')).toBe('ai');
    expect(guessBoard('repository', parseLink('https://dev.bimlab.com.vn/x'), 'all')).toBe('internal');
    expect(guessBoard('tool', parseLink('https://render.com'), 'devops')).toBe('devops');
    expect(guessBoard('tool', parseLink('https://render.com'), 'all')).toBe('backend');
  });
});

describe('board ordering and ranking', () => {
  it('puts pinned links first, newest first in each group', () => {
    const { pinned, rest } = boardOrder([
      note('old', { createdAt: '2026-10-01T00:00:00Z' }),
      note('pin-old', { pinned: true, createdAt: '2026-10-02T00:00:00Z' }),
      note('new', { createdAt: '2026-10-28T00:00:00Z' }),
      note('pin-new', { pinned: true, createdAt: '2026-10-27T00:00:00Z' }),
    ]);
    expect(pinned.map((n) => n.id)).toEqual(['pin-new', 'pin-old']);
    expect(rest.map((n) => n.id)).toEqual(['new', 'old']);
  });

  it('ranks by likes this week and skips links nobody liked lately', () => {
    const hot = hotNotes([
      note('a', { likesThisWeek: 2 }),
      note('b', { likesThisWeek: 5 }),
      note('c', { likesThisWeek: 0, likedBy: ['x', 'y', 'z'] }),
      note('d', { likesThisWeek: 2, createdAt: '2026-10-25T00:00:00Z' }),
      note('e', { likesThisWeek: 1 }),
    ]);
    expect(hot.map((n) => n.id)).toEqual(['b', 'd', 'a']);
  });

  it('toggles a like both ways', () => {
    const liked = withLikeToggled(note('a', { likedBy: ['it-duc'], likesThisWeek: 1 }), 'it-nam');
    expect(liked.likedBy).toEqual(['it-duc', 'it-nam']);
    expect(liked.likesThisWeek).toBe(2);
    expect(withLikeToggled(liked, 'it-nam').likedBy).toEqual(['it-duc']);
  });
});

describe('matchesQuery', () => {
  it('matches without Vietnamese accents across title, note, domain and author', () => {
    const n = note('a', { title: 'Tailscale Funnel', content: 'Mở backend ra ngoài', url: 'https://tailscale.com/kb/1223/funnel' });
    expect(matchesQuery(n, 'mo backend', 'Phạm Gia Bảo')).toBe(true);
    expect(matchesQuery(n, 'tailscale.com', 'Phạm Gia Bảo')).toBe(true);
    expect(matchesQuery(n, 'gia bao', 'Phạm Gia Bảo')).toBe(true);
    expect(matchesQuery(n, 'kubernetes', 'Phạm Gia Bảo')).toBe(false);
  });

  it('matches every word, in any order and not necessarily adjacent', () => {
    const n = note('a', { content: 'Test E2E cho Ticket, chạy được cả Chrome có sẵn' });
    expect(matchesQuery(n, 'chay duoc chrome', '')).toBe(true);
    expect(matchesQuery(n, 'chrome  ticket', '')).toBe(true);
    expect(matchesQuery(n, 'chrome firefox', '')).toBe(false);
  });
});

describe('cleanPageTitle', () => {
  it('drops the GitHub prefix and repeated description, leaves other titles alone', () => {
    const gh = parseLink('https://github.com/microsoft/playwright')!;
    expect(cleanPageTitle('GitHub - microsoft/playwright: Playwright is a framework', gh)).toBe('microsoft/playwright');
    expect(cleanPageTitle('GitHub - microsoft/playwright', gh)).toBe('microsoft/playwright');
    expect(cleanPageTitle('Tailscale Funnel · Tailscale Docs', parseLink('https://tailscale.com/kb/1223/funnel')!)).toBe('Tailscale Funnel · Tailscale Docs');
  });
});
