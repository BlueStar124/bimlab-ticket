// Ticket writes: create, status changes, assignment, priority, comments.
// Every IT-team member may do every action; the checks here reject unknown people and invalid moves.
import { getState, newId, setState } from '@/data/store';
import { areaById } from '@/domain/areas';
import { isMember, personById } from '@/domain/people';
import type { Attachment, Environment, Priority, Ticket, TicketEvent, TicketStatus } from '@/domain/ticket';
import { PRIORITY_LABEL, canTransition, nextTicketCode, withStatus } from '@/domain/ticket';

function event(ticketId: string, actorId: string, kind: TicketEvent['kind'], text: string, extra: Partial<TicketEvent> = {}): TicketEvent {
  return { id: newId('e'), ticketId, at: new Date().toISOString(), actorId, kind, text, ...extra };
}

function updateTicket(id: string, fn: (t: Ticket) => Ticket, newEvents: TicketEvent[]) {
  const s = getState();
  setState({ ...s, tickets: s.tickets.map((t) => (t.id === id ? fn(t) : t)), events: [...s.events, ...newEvents] });
}

function requireTicket(id: string): Ticket {
  const ticket = getState().tickets.find((t) => t.id === id);
  if (!ticket) throw new Error(`Không tìm thấy ticket ${id}`);
  return ticket;
}

function requireMember(personId: string) {
  if (!isMember(personId)) throw new Error('Chỉ thành viên team IT mới thao tác được ticket');
}

function assignText(assigneeId: string | null, actorId: string): string {
  if (!assigneeId) return 'Đã bỏ người làm';
  if (assigneeId === actorId) return 'Đã nhận việc';
  return `Đã giao cho ${personById(assigneeId)?.name}`;
}

export interface NewTicketInput {
  title: string;
  description: string;
  areaId: string;
  environment: Environment | null;
  priority: Priority;
  assigneeId: string | null;
  attachments: Attachment[];
}

export function createTicket(input: NewTicketInput, reporterId: string): Ticket {
  requireMember(reporterId);
  if (input.assigneeId) requireMember(input.assigneeId);
  if (areaById(input.areaId).id !== input.areaId) throw new Error('Hạng mục không hợp lệ');
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
    status: 'todo',
    reporterId,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    doneAt: null,
  };
  const created = event(ticket.id, reporterId, 'created', 'Đã báo lỗi', { toAssigneeId: input.assigneeId });
  setState({ ...s, tickets: [ticket, ...s.tickets], events: [...s.events, created] });
  return ticket;
}

export function changeStatus(id: string, to: TicketStatus, actorId: string) {
  requireMember(actorId);
  const ticket = requireTicket(id);
  if (!canTransition(ticket.status, to)) throw new Error('Ticket đã ở trạng thái này');
  const at = new Date().toISOString();
  const events = [event(id, actorId, 'status', '', { toStatus: to })];
  // Starting work on an unassigned ticket makes the actor its assignee.
  const takes = to === 'in_progress' && !ticket.assigneeId;
  if (takes) events.unshift(event(id, actorId, 'assign', assignText(actorId, actorId), { toAssigneeId: actorId }));
  updateTicket(id, (t) => ({ ...withStatus(t, to, at), assigneeId: takes ? actorId : t.assigneeId }), events);
}

export function assign(id: string, assigneeId: string | null, actorId: string) {
  requireMember(actorId);
  if (assigneeId) requireMember(assigneeId);
  const ticket = requireTicket(id);
  if (ticket.assigneeId === assigneeId) return;
  const at = new Date().toISOString();
  updateTicket(id, (t) => ({ ...t, assigneeId, updatedAt: at }), [event(id, actorId, 'assign', assignText(assigneeId, actorId), { toAssigneeId: assigneeId })]);
}

export function setPriority(id: string, priority: Priority, actorId: string) {
  requireMember(actorId);
  const ticket = requireTicket(id);
  if (ticket.priority === priority) return;
  const at = new Date().toISOString();
  updateTicket(id, (t) => ({ ...t, priority, updatedAt: at }), [
    event(id, actorId, 'priority', `Đổi ưu tiên sang “${PRIORITY_LABEL[priority].title}”`, { toPriority: priority }),
  ]);
}

export function addComment(id: string, text: string, actorId: string) {
  requireMember(actorId);
  requireTicket(id);
  const body = text.trim();
  if (!body) throw new Error('Nội dung trống');
  const at = new Date().toISOString();
  updateTicket(id, (t) => ({ ...t, updatedAt: at }), [event(id, actorId, 'comment', body)]);
}
