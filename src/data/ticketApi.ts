// REST calls for tickets, the team channel and notifications. The server identifies the caller from the
// session cookie, so no request names its actor.
import type { ChatMessage } from '@/domain/chat';
import type { AppNotification } from '@/domain/notifications';
import type { Attachment, Ticket, TicketEvent, TicketStatus, Priority, Environment } from '@/domain/ticket';
import { apiRequest } from '@/data/apiClient';
import { listSharedNotes } from '@/data/noteApi';
import type { SharedNote } from '@/domain/note';

interface TicketDto extends Omit<Ticket, 'attachments'> {
  attachments?: Ticket['attachments'];
}
interface AttachmentDto extends Attachment { id: string; ticketId: string }

interface EventDto extends TicketEvent {}

function ticketFromApi(dto: TicketDto): Ticket {
  return { ...dto, attachments: dto.attachments ?? [] };
}

function attachmentFromApi({ id, name, size }: AttachmentDto): Attachment {
  return { id, name, size };
}

export interface RemoteState {
  tickets: Ticket[];
  events: TicketEvent[];
  messages: ChatMessage[];
  notifications: AppNotification[];
  notes: SharedNote[];
  /** Newest channel message the signed-in member has seen. */
  chatReadAt: string | null;
}

/** Whole app state in seven small requests, however many tickets there are. */
export async function loadTicketState(options?: { quiet?: boolean }): Promise<RemoteState> {
  const [ticketDtos, events, attachments, messages, notifications, marker, notes] = await Promise.all([
    apiRequest<TicketDto[]>('/api/tickets', undefined, options),
    apiRequest<EventDto[]>('/api/tickets/events', undefined, options),
    apiRequest<AttachmentDto[]>('/api/tickets/attachments', undefined, options),
    apiRequest<ChatMessage[]>('/api/chat/messages', undefined, options),
    apiRequest<AppNotification[]>('/api/notifications', undefined, options),
    apiRequest<{ readAt: string | null }>('/api/chat/messages/read-marker', undefined, options),
    listSharedNotes(options),
  ]);
  const attachmentsByTicket = new Map<string, Attachment[]>();
  for (const a of attachments) {
    const list = attachmentsByTicket.get(a.ticketId) ?? [];
    list.push(attachmentFromApi(a));
    attachmentsByTicket.set(a.ticketId, list);
  }
  return {
    tickets: ticketDtos.map((ticket) => ({ ...ticketFromApi(ticket), attachments: attachmentsByTicket.get(ticket.id) ?? [] })),
    events,
    messages,
    notifications,
    notes,
    chatReadAt: marker.readAt,
  };
}

/** One ticket with its history and attachments, used to reconcile after a write. */
export async function loadTicket(id: string): Promise<{ ticket: Ticket; events: TicketEvent[] }> {
  const [dto, events, attachments] = await Promise.all([
    apiRequest<TicketDto>(`/api/tickets/${id}`),
    apiRequest<EventDto[]>(`/api/tickets/${id}/events`),
    apiRequest<AttachmentDto[]>(`/api/tickets/${id}/attachments`),
  ]);
  return { ticket: { ...ticketFromApi(dto), attachments: attachments.map(attachmentFromApi) }, events };
}

/** Short string that changes whenever tickets, the channel or the caller's read state change. */
export async function loadSyncVersion(): Promise<string> {
  return (await apiRequest<{ version: string }>('/api/sync/version', undefined, { quiet: true })).version;
}

export async function createTicketApi(input: {
  title: string; description: string; areaId: string; environment: Environment | null;
  priority: Priority; assigneeId: string | null;
}): Promise<Ticket> {
  const dto = await apiRequest<TicketDto>('/api/tickets', { method: 'POST', body: JSON.stringify(input) });
  return ticketFromApi(dto);
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<Ticket> {
  const dto = await apiRequest<TicketDto>(`/api/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  return ticketFromApi(dto);
}

export async function updateTicketAssignee(id: string, assigneeId: string | null): Promise<Ticket> {
  const dto = await apiRequest<TicketDto>(`/api/tickets/${id}/assignee`, { method: 'PATCH', body: JSON.stringify({ assigneeId }) });
  return ticketFromApi(dto);
}

export async function updateTicketPriority(id: string, priority: Priority): Promise<Ticket> {
  const dto = await apiRequest<TicketDto>(`/api/tickets/${id}/priority`, { method: 'PATCH', body: JSON.stringify({ priority }) });
  return ticketFromApi(dto);
}

export function addTicketComment(id: string, text: string): Promise<TicketEvent> {
  return apiRequest<TicketEvent>(`/api/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) });
}

export function sendChatMessage(text: string, replyToId: string | null): Promise<ChatMessage> {
  return apiRequest<ChatMessage>('/api/chat/messages', { method: 'POST', body: JSON.stringify({ text, replyToId }) });
}

export async function uploadTicketAttachment(ticketId: string, file: File): Promise<Attachment> {
  const form = new FormData();
  form.append('file', file);
  return attachmentFromApi(await apiRequest<AttachmentDto>(`/api/tickets/${ticketId}/attachments`, { method: 'POST', body: form }));
}

export function updateChatReadMarker(readAt: string): Promise<void> {
  return apiRequest<void>('/api/chat/messages/read-marker', { method: 'POST', body: JSON.stringify({ readAt }) });
}

export interface NotificationRef {
  source: 'ticket' | 'chat';
  id: string;
}

export function markNotificationsRead(notifications: NotificationRef[]): Promise<void> {
  return apiRequest<void>('/api/notifications/read', { method: 'POST', body: JSON.stringify({ notifications }) });
}
