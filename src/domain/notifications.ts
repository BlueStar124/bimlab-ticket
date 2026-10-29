// A notification-bell row as the server sends it. The server decides who is notified about what
// (ticket activity for the reporter/assignee, new unassigned tickets for everyone, @mentions in the channel).
import type { Priority, TicketEventKind, TicketStatus } from '@/domain/ticket';

export interface AppNotification {
  id: string;
  source: 'ticket' | 'chat';
  /** Set for ticket activity; null for channel mentions. */
  ticketId: string | null;
  actorId: string;
  kind: TicketEventKind | 'mention';
  text: string;
  at: string;
  toStatus: TicketStatus | null;
  toAssigneeId: string | null;
  toPriority: Priority | null;
  read: boolean;
}

/** Marks the given ids read; ids that are not in the list are left alone. */
export function withRead(notifications: AppNotification[], ids: string[]): AppNotification[] {
  const marked = new Set(ids);
  return notifications.map((n) => (marked.has(n.id) && !n.read ? { ...n, read: true } : n));
}
