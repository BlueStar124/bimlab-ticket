import { describe, expect, it } from 'vitest';
import { notificationsFor } from '@/domain/notifications';
import type { Ticket, TicketEvent } from '@/domain/ticket';

const ticket = { id: 't1', requesterId: 'u-an', assigneeId: 'it-duc' } as Ticket;
const ev = (id: string, actorId: string, kind: TicketEvent['kind'], internal = false, at = '2026-10-20T08:00:00.000Z'): TicketEvent => ({
  id, ticketId: 't1', actorId, kind, internal, at, text: '',
});

describe('notificationsFor', () => {
  const events = [
    ev('created', 'u-an', 'created'),
    ev('reply-it', 'it-duc', 'reply', false, '2026-10-20T09:00:00.000Z'),
    ev('note-it', 'it-duc', 'note', true, '2026-10-20T09:30:00.000Z'),
    ev('reply-an', 'u-an', 'reply', false, '2026-10-20T10:00:00.000Z'),
  ];

  it('tells the requester about public activity by others, never internal notes or their own actions', () => {
    expect(notificationsFor([ticket], events, 'u-an').map((e) => e.id)).toEqual(['reply-it']);
  });

  it('tells the assigned agent about new tickets and requester replies, newest first', () => {
    expect(notificationsFor([ticket], events, 'it-duc').map((e) => e.id)).toEqual(['reply-an', 'created']);
  });

  it('does not tell other agents about replies on a ticket assigned to someone else', () => {
    expect(notificationsFor([ticket], events, 'it-hanh').map((e) => e.id)).toEqual(['created']);
  });
});
