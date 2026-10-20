// Ticket writes: create, status changes, assignment, comments, rating.
import { getState, newId, setState } from '@/data/store';
import { personById, roleOf } from '@/domain/people';
import type { Attachment, Impact, Ticket, TicketEvent, TicketStatus, Urgency } from '@/domain/ticket';
import { canTransition, nextTicketCode, priorityFor, withStatus } from '@/domain/ticket';

function event(ticketId: string, actorId: string, kind: TicketEvent['kind'], text: string, extra: Partial<TicketEvent> = {}): TicketEvent {
  return { id: newId('e'), ticketId, at: new Date().toISOString(), actorId, kind, text, internal: false, ...extra };
}

function updateTicket(id: string, fn: (t: Ticket) => Ticket, newEvents: TicketEvent[]) {
  const s = getState();
  setState({ ...s, tickets: s.tickets.map((t) => (t.id === id ? fn(t) : t)), events: [...s.events, ...newEvents] });
}

function requireTicket(id: string): Ticket {
  const ticket = getState().tickets.find((t) => t.id === id);
  if (!ticket) throw new Error(`Không tìm thấy yêu cầu ${id}`);
  return ticket;
}

export interface NewTicketInput {
  title: string;
  description: string;
  categoryId: string;
  impact: Impact;
  urgency: Urgency;
  asset: string;
  location: string;
  attachments: Attachment[];
}

export function createTicket(input: NewTicketInput, requesterId: string): Ticket {
  const s = getState();
  const at = new Date();
  const now = at.toISOString();
  const ticket: Ticket = {
    ...input,
    id: newId('t'),
    code: nextTicketCode(
      s.tickets.map((t) => t.code),
      at,
    ),
    priority: priorityFor(input.impact, input.urgency),
    status: 'new',
    requesterId,
    assigneeId: null,
    createdAt: now,
    updatedAt: now,
    firstResponseAt: null,
    resolvedAt: null,
    closedAt: null,
    waitingSince: null,
    pausedMs: 0,
    rating: null,
    ratingComment: '',
  };
  setState({ ...s, tickets: [ticket, ...s.tickets], events: [...s.events, event(ticket.id, requesterId, 'created', 'Đã gửi yêu cầu')] });
  return ticket;
}

export function changeStatus(id: string, to: TicketStatus, actorId: string, note = '') {
  const ticket = requireTicket(id);
  const role = roleOf(actorId);
  if (!canTransition(ticket.status, to, role)) {
    throw new Error('Không thể chuyển sang trạng thái này');
  }
  const at = new Date().toISOString();
  updateTicket(
    id,
    (t) => {
      const next = withStatus(t, to, at);
      const firstResponseAt = role === 'agent' ? (t.firstResponseAt ?? at) : t.firstResponseAt;
      // Picking up an unassigned ticket assigns it to the agent who moved it.
      const assigneeId = role === 'agent' && !t.assigneeId ? actorId : t.assigneeId;
      return { ...next, firstResponseAt, assigneeId };
    },
    [event(id, actorId, 'status', note, { toStatus: to })],
  );
}

export function assign(id: string, assigneeId: string | null, actorId: string) {
  const name = personById(assigneeId)?.name;
  const text = !assigneeId ? 'Đã bỏ phân công' : assigneeId === actorId ? 'Đã nhận xử lý' : `Đã giao cho ${name}`;
  const at = new Date().toISOString();
  updateTicket(id, (t) => ({ ...t, assigneeId, updatedAt: at, firstResponseAt: t.firstResponseAt ?? at }), [event(id, actorId, 'assign', text)]);
}

export function addComment(id: string, text: string, actorId: string, internal: boolean) {
  const ticket = requireTicket(id);
  const role = roleOf(actorId);
  const at = new Date().toISOString();
  const events = [event(id, actorId, internal ? 'note' : 'reply', text, { internal })];
  // A requester answering a "waiting" ticket hands it back to IT and restarts the SLA clock.
  const resumes = role === 'employee' && ticket.status === 'waiting';
  if (resumes) events.push(event(id, actorId, 'status', '', { toStatus: 'in_progress' }));
  updateTicket(
    id,
    (t) => {
      const base = resumes ? withStatus(t, 'in_progress', at) : { ...t, updatedAt: at };
      const firstResponseAt = role === 'agent' && !internal ? (t.firstResponseAt ?? at) : t.firstResponseAt;
      return { ...base, firstResponseAt };
    },
    events,
  );
}

export function rateAndClose(id: string, rating: number, comment: string, actorId: string) {
  changeStatus(id, 'closed', actorId);
  const at = new Date().toISOString();
  updateTicket(id, (t) => ({ ...t, rating, ratingComment: comment, updatedAt: at }), [
    event(id, actorId, 'rating', comment ? `${rating}/5 · ${comment}` : `${rating}/5`),
  ]);
}
