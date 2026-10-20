// Who gets notified about which ticket activity. Pure rule over tickets and events.
import { roleOf } from '@/domain/people';
import type { Ticket, TicketEvent } from '@/domain/ticket';

const MAX_ITEMS = 20;

/** Activity by others on tickets that concern the person, newest first. */
export function notificationsFor(tickets: Ticket[], events: TicketEvent[], personId: string): TicketEvent[] {
  const role = roleOf(personId);
  const byId = new Map(tickets.map((t) => [t.id, t]));
  return events
    .filter((e) => {
      const t = byId.get(e.ticketId);
      if (!t || e.actorId === personId) return false;
      // Requesters hear about everything public on their own tickets.
      if (role === 'employee') return t.requesterId === personId && !e.internal && e.kind !== 'created';
      // IT: every new ticket; replies on unassigned or own tickets; requester decisions and assignments on own tickets.
      if (e.kind === 'created') return true;
      if (e.kind === 'reply' && roleOf(e.actorId) === 'employee') return t.assigneeId === personId || !t.assigneeId;
      if (e.kind === 'rating' || (e.kind === 'status' && roleOf(e.actorId) === 'employee')) return t.assigneeId === personId;
      return e.kind === 'assign' && t.assigneeId === personId;
    })
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, MAX_ITEMS);
}
