// Team channel rules: message parsing (mentions, ticket codes), unread counts, mention lookup.
// Pure functions only — no React, no storage.
import type { Person } from '@/domain/ticket';

export interface ChatMessage {
  id: string;
  authorId: string;
  text: string;
  at: string;
  /** Message this one answers, shown as a quote above the text. */
  replyToId: string | null;
}

export const MAX_MESSAGE_LENGTH = 2000;

export type ChatSegment = { kind: 'text'; text: string } | { kind: 'mention'; text: string; personId: string } | { kind: 'ticket'; text: string; code: string };

const TICKET_CODE = 'BLT-\\d{4}-\\d{4}';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Splits a message into plain text, @mentions of team members and ticket codes. */
export function segmentMessage(text: string, people: Person[]): ChatSegment[] {
  // Longest names first so "@Nguyễn Hải Nam" never stops at a shorter name that shares its start.
  const byLength = [...people].sort((a, b) => b.name.length - a.name.length);
  const names = byLength.map((p) => escapeRegExp(p.name)).join('|');
  const pattern = new RegExp(names ? `(${TICKET_CODE})|@(${names})` : `(${TICKET_CODE})`, 'g');
  const segments: ChatSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    if (m.index > last) segments.push({ kind: 'text', text: text.slice(last, m.index) });
    if (m[1]) segments.push({ kind: 'ticket', text: m[0], code: m[1] });
    else segments.push({ kind: 'mention', text: m[0], personId: byLength.find((p) => p.name === m[2])!.id });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ kind: 'text', text: text.slice(last) });
  return segments;
}

export function mentionedIds(text: string, people: Person[]): string[] {
  const ids = segmentMessage(text, people).flatMap((s) => (s.kind === 'mention' ? [s.personId] : []));
  return [...new Set(ids)];
}

/** Messages by others after the person's last read time. */
export function unreadCount(messages: ChatMessage[], personId: string, readAt: string | undefined): number {
  return messages.filter((m) => m.authorId !== personId && (!readAt || m.at > readAt)).length;
}

const MAX_MENTIONS = 20;

/** Messages by others that mention the person, newest first — they feed the notification bell. */
export function mentionsOf(messages: ChatMessage[], personId: string, people: Person[]): ChatMessage[] {
  return messages
    .filter((m) => m.authorId !== personId && mentionedIds(m.text, people).includes(personId))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, MAX_MENTIONS);
}

/** The "@query" being typed right before the caret, or null when the caret is not inside one. */
export function mentionQueryAt(value: string, caret: number): { start: number; query: string } | null {
  const start = value.lastIndexOf('@', caret - 1);
  if (start < 0) return null;
  const query = value.slice(start + 1, caret);
  if (/\s/.test(query) || (start > 0 && !/\s/.test(value[start - 1]))) return null;
  return { start, query };
}

/**
 * Lowercase without Vietnamese diacritics so "duc" finds "Đức". Keeps one character per
 * (NFC) input character, so indexes into the result also point into the original.
 */
export function foldVietnamese(s: string): string {
  return Array.from(s.normalize('NFC'), (ch) => (ch === 'đ' || ch === 'Đ' ? 'd' : ch.normalize('NFD').replace(/[̀-ͯ]/g, '')))
    .join('')
    .toLowerCase();
}
