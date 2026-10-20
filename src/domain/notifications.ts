// Who gets notified about which ticket activity. Pure rule over tickets and events.
import type { Ticket, TicketEvent } from '@/domain/ticket';
import { isOpen } from '@/domain/ticket';

const MAX_ITEMS = 20;

/** Activity by others that concerns the person, newest first. */
export function notificationsFor(tickets: Ticket[], events: TicketEvent[], personId: string): TicketEvent[] {
  const byId = new Map(tickets.map((t) => [t.id, t]));
  return events
    .filter((e) => {
      const t = byId.get(e.ticketId);
      if (!t || e.actorId === personId) return false;
      // A new ticket without an assignee goes to the whole team until someone picks it up.
      if (e.kind === 'created') return e.toAssigneeId ? e.toAssigneeId === personId : isOpen(t.status) && (!t.assigneeId || t.assigneeId === personId);
      if (e.kind === 'assign') return e.toAssigneeId === personId || t.reporterId === personId;
      // Status, priority and comments: the reporter and the current assignee.
      return t.reporterId === personId || t.assigneeId === personId;
    })
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, MAX_ITEMS);
}
