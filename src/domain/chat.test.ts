import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '@/domain/chat';
import { foldVietnamese, mentionQueryAt, mentionedIds, mentionsOf, segmentMessage, unreadCount } from '@/domain/chat';
import type { Person } from '@/domain/ticket';

const people: Person[] = [
  { id: 'nam', name: 'Nguyễn Hải Nam', title: '' },
  { id: 'nam2', name: 'Nguyễn Hải', title: '' },
  { id: 'duc', name: 'Đỗ Minh Đức', title: '' },
];

const msg = (id: string, authorId: string, text: string, minute: number): ChatMessage => ({
  id, authorId, text, replyToId: null, at: `2026-10-20T08:${String(minute).padStart(2, '0')}:00.000Z`,
});

describe('segmentMessage', () => {
  it('finds mentions (longest name first) and ticket codes', () => {
    expect(segmentMessage('@Nguyễn Hải Nam xem BLT-2610-0007 giúp nhé', people)).toEqual([
      { kind: 'mention', text: '@Nguyễn Hải Nam', personId: 'nam' },
      { kind: 'text', text: ' xem ' },
      { kind: 'ticket', text: 'BLT-2610-0007', code: 'BLT-2610-0007' },
      { kind: 'text', text: ' giúp nhé' },
    ]);
  });

  it('leaves unknown names and plain text alone', () => {
    expect(segmentMessage('@ai đó ơi', people)).toEqual([{ kind: 'text', text: '@ai đó ơi' }]);
  });

  it('lists each mentioned person once', () => {
    expect(mentionedIds('@Đỗ Minh Đức và @Đỗ Minh Đức', people)).toEqual(['duc']);
  });
});

describe('mentionQueryAt', () => {
  it('returns the query right after @ at a word start', () => {
    expect(mentionQueryAt('chào @Mi', 8)).toEqual({ start: 5, query: 'Mi' });
    expect(mentionQueryAt('@', 1)).toEqual({ start: 0, query: '' });
  });

  it('ignores emails and finished words', () => {
    expect(mentionQueryAt('a@b', 3)).toBeNull();
    expect(mentionQueryAt('@Minh Đức', 9)).toBeNull();
  });
});

describe('foldVietnamese', () => {
  it('drops diacritics and keeps the length so match positions line up', () => {
    expect(foldVietnamese('Đỗ Minh Đức')).toBe('do minh duc');
    expect(foldVietnamese('Nguyễn Hải Nam')).toHaveLength('Nguyễn Hải Nam'.length);
  });
});

describe('unread and mentions', () => {
  const messages = [msg('a', 'nam', 'Chào cả team', 1), msg('b', 'duc', '@Nguyễn Hải Nam xem giúp', 5), msg('c', 'nam', '@Đỗ Minh Đức ok', 6)];

  it('counts only messages by others after the read time', () => {
    expect(unreadCount(messages, 'nam', undefined)).toBe(1);
    expect(unreadCount(messages, 'duc', '2026-10-20T08:01:00.000Z')).toBe(1);
    expect(unreadCount(messages, 'duc', '2026-10-20T08:06:00.000Z')).toBe(0);
  });

  it('returns mentions of a person by others, newest first', () => {
    expect(mentionsOf(messages, 'nam', people).map((m) => m.id)).toEqual(['b']);
    expect(mentionsOf(messages, 'duc', people).map((m) => m.id)).toEqual(['c']);
  });
});
