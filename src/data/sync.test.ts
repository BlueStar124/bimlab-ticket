import { describe, expect, it } from 'vitest';
import { notificationRefs } from '@/data/notifications';
import { type StoreState, emptyState, withTicketSnapshot } from '@/data/store';
import { type AppNotification, withRead } from '@/domain/notifications';
import type { Ticket, TicketEvent } from '@/domain/ticket';

const ID_A = '11111111-1111-4111-8111-111111111111';
const ID_B = '22222222-2222-4222-8222-222222222222';
const MSG = '33333333-3333-4333-8333-333333333333';

const ticket = (id: string, title: string): Ticket => ({
  id, code: 'BLT-2610-0001', title, description: '', areaId: 'hrm', environment: null, priority: 'medium',
  status: 'todo', reporterId: 'it-nam', assigneeId: null, attachments: [],
  createdAt: '2026-10-29T00:00:00Z', updatedAt: '2026-10-29T00:00:00Z', startedAt: null, doneAt: null,
});
const event = (id: string, ticketId: string): TicketEvent => ({ id, ticketId, at: '2026-10-29T00:00:00Z', actorId: 'it-nam', kind: 'comment', text: 'x' });
const notification = (id: string, source: 'ticket' | 'chat', read = false): AppNotification => ({
  id, source, ticketId: source === 'ticket' ? ID_B : null, actorId: 'it-nam', kind: source === 'ticket' ? 'comment' : 'mention',
  text: 'x', at: '2026-10-29T00:00:00Z', toStatus: null, toAssigneeId: null, toPriority: null, read,
});

const state = (tickets: Ticket[], events: TicketEvent[]): StoreState => ({ ...emptyState(), tickets, events });

describe('withTicketSnapshot', () => {
  it('replaces the ticket and its optimistic events, leaving other tickets alone', () => {
    const before = state([ticket(ID_A, 'old'), ticket(ID_B, 'other')], [event('e-local', ID_A), event('e-b', ID_B)]);
    const after = withTicketSnapshot(before, ticket(ID_A, 'server'), [event('server-1', ID_A)]);
    expect(after.tickets.map((t) => t.title)).toEqual(['server', 'other']);
    expect(after.events.map((e) => e.id)).toEqual(['e-b', 'server-1']);
  });

  it('puts a ticket that is not loaded yet first', () => {
    const after = withTicketSnapshot(state([ticket(ID_B, 'other')], []), ticket(ID_A, 'new'), []);
    expect(after.tickets.map((t) => t.id)).toEqual([ID_A, ID_B]);
  });
});

describe('notification read state', () => {
  const notifications = [notification(ID_A, 'ticket'), notification(MSG, 'chat'), notification(ID_B, 'ticket', true)];

  it('sends each unread id once, with its source', () => {
    expect(notificationRefs({ notifications }, [ID_A, MSG, ID_B, 'unknown'])).toEqual([
      { source: 'ticket', id: ID_A },
      { source: 'chat', id: MSG },
    ]);
  });

  it('marks only the given ids read', () => {
    expect(withRead(notifications, [MSG]).map((n) => n.read)).toEqual([false, true, true]);
  });
});
