import { beforeEach, describe, expect, it } from 'vitest';
import { markChatRead, sendMessage } from '@/data/chatActions';
import { getState, resetDemoData } from '@/data/store';
import { MAX_MESSAGE_LENGTH } from '@/domain/chat';

describe('chatActions', () => {
  beforeEach(() => resetDemoData());

  it('appends a trimmed message and marks it read for its author', () => {
    const m = sendMessage('  Ai rảnh xem BLT-2610-0001 không?  ', 'it-huy', null);
    const s = getState();
    expect(s.messages[s.messages.length - 1]).toEqual(m);
    expect(m.text).toBe('Ai rảnh xem BLT-2610-0001 không?');
    expect(s.chatReadAt['it-huy']).toBe(m.at);
  });

  it('keeps a reply link to an existing message', () => {
    const first = sendMessage('Server test đầy ổ', 'it-bao', null);
    expect(sendMessage('Mình xử lý', 'it-hanh', first.id).replyToId).toBe(first.id);
  });

  it('rejects outsiders, empty or too long text and unknown replies', () => {
    expect(() => sendMessage('xin chào', 'outsider', null)).toThrow();
    expect(() => sendMessage('   ', 'it-huy', null)).toThrow();
    expect(() => sendMessage('x'.repeat(MAX_MESSAGE_LENGTH + 1), 'it-huy', null)).toThrow();
    expect(() => sendMessage('ok', 'it-huy', 'm-missing')).toThrow();
  });

  it('only moves the read marker forward', () => {
    markChatRead('it-trang', '2030-01-01T00:00:00.000Z');
    markChatRead('it-trang', '2020-01-01T00:00:00.000Z');
    expect(getState().chatReadAt['it-trang']).toBe('2030-01-01T00:00:00.000Z');
  });
});
