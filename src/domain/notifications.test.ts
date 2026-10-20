import { describe, expect, it } from 'vitest';
import { notificationsFor } from '@/domain/notifications';
import type { Ticket, TicketEvent } from '@/domain/ticket';

const ticket = { id: 't1', reporterId: 'it-trang', assigneeId: 'it-duc', status: 'in_progress' } as Ticket;
const ev = (id: string, actorId: string, kind: TicketEvent['kind'], minute: number, extra: Partial<TicketEvent> = {}): TicketEvent => ({
  id, ticketId: 't1', actorId, kind, text: '', at: `2026-10-20T08:${String(minute).padStart(2, '0')}:00.000Z`, ...extra,
});

describe('notificationsFor', () => {
  const events = [
    ev('created', 'it-trang', 'created', 0),
    ev('assign', 'it-nam', 'assign', 10, { toAssigneeId: 'it-duc' }),
    ev('comment-duc', 'it-duc', 'comment', 20),
    ev('status-duc', 'it-duc', 'status', 30, { toStatus: 'done' }),
  ];

  it('tells everyone about an unassigned new ticket until someone picks it up', () => {
    const unassigned = { ...ticket, assigneeId: null };
    expect(notificationsFor([unassigned], [events[0]], 'it-bao').map((e) => e.id)).toEqual(['created']);
    expect(notificationsFor([ticket], events, 'it-bao')).toEqual([]);
  });

  it('tells the reporter about work by others, newest first, never their own actions', () => {
    expect(notificationsFor([ticket], events, 'it-trang').map((e) => e.id)).toEqual(['status-duc', 'comment-duc', 'assign']);
  });

  it('tells the assignee about being assigned, but not about their own updates', () => {
    expect(notificationsFor([ticket], events, 'it-duc').map((e) => e.id)).toEqual(['assign', 'created']);
  });

  it('sends a ticket assigned at creation only to that assignee', () => {
    const assigned = [ev('created', 'it-trang', 'created', 0, { toAssigneeId: 'it-duc' })];
    expect(notificationsFor([ticket], assigned, 'it-duc')).toHaveLength(1);
    expect(notificationsFor([ticket], assigned, 'it-bao')).toHaveLength(0);
  });
});
