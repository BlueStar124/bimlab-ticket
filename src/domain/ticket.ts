// Business rules for IT-team tickets: priority, status workflow, ordering, formatting.
// Pure functions only — no React, no storage — so they can be tested and moved to a backend later.

export type TicketStatus = 'todo' | 'in_progress' | 'done';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type Environment = 'production' | 'test' | 'local';

export interface Person {
  id: string;
  name: string;
  title: string;
}

export interface Attachment {
  id?: string;
  name: string;
  size: number;
}

export interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string;
  /** System or infrastructure area; the ticket kind (bug / infra) follows from it. */
  areaId: string;
  /** Where the problem happens; null when unknown or not applicable. */
  environment: Environment | null;
  priority: Priority;
  status: TicketStatus;
  reporterId: string;
  assigneeId: string | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  doneAt: string | null;
}

export type TicketEventKind = 'created' | 'status' | 'assign' | 'priority' | 'comment';

export interface TicketEvent {
  id: string;
  ticketId: string;
  at: string;
  actorId: string;
  kind: TicketEventKind;
  text: string;
  toStatus?: TicketStatus;
  /** Set on "assign" events, and on "created" when the reporter assigned someone right away. */
  toAssigneeId?: string | null;
  toPriority?: Priority;
}

export const STATUS_LABEL: Record<TicketStatus, string> = {
  todo: 'Mới',
  in_progress: 'Đang làm',
  done: 'Xong',
};

export const STATUS_ORDER: TicketStatus[] = ['todo', 'in_progress', 'done'];

export const PRIORITY_ORDER: Priority[] = ['urgent', 'high', 'medium', 'low'];

export const PRIORITY_LABEL: Record<Priority, { title: string; hint: string }> = {
  urgent: { title: 'Khẩn cấp', hint: 'Production dừng, mất hoặc sai dữ liệu' },
  high: { title: 'Cao', hint: 'Chặn công việc, chưa có cách tạm' },
  medium: { title: 'Trung bình', hint: 'Có cách làm tạm' },
  low: { title: 'Thấp', hint: 'Lỗi nhỏ, giao diện, cải thiện' },
};

export const ENVIRONMENT_LABEL: Record<Environment, string> = {
  production: 'Production',
  test: 'Test',
  local: 'Local',
};

/** The team is small and works without roles: any status can move to any other. */
export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return from !== to;
}

export function nextStatuses(from: TicketStatus): TicketStatus[] {
  return STATUS_ORDER.filter((to) => canTransition(from, to));
}

/** Returns the ticket with work timestamps updated for the new status. */
export function withStatus(ticket: Ticket, to: TicketStatus, at: string): Ticket {
  return {
    ...ticket,
    status: to,
    updatedAt: at,
    startedAt: to === 'todo' ? null : (ticket.startedAt ?? at),
    doneAt: to === 'done' ? at : null,
  };
}

/** Codes look like BLT-2610-0007: year+month, then a running number for that month. */
export function nextTicketCode(existing: string[], at: Date): string {
  const prefix = `BLT-${String(at.getFullYear()).slice(2)}${String(at.getMonth() + 1).padStart(2, '0')}-`;
  const max = existing
    .filter((code) => code.startsWith(prefix))
    .reduce((m, code) => Math.max(m, Number(code.slice(prefix.length)) || 0), 0);
  return prefix + String(max + 1).padStart(4, '0');
}

export function isOpen(status: TicketStatus): boolean {
  return status !== 'done';
}

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

/** Work order: open tickets first, by priority then the longest-waiting; finished ones by latest completion. */
export function compareForQueue(a: Ticket, b: Ticket): number {
  const openDiff = Number(isOpen(b.status)) - Number(isOpen(a.status));
  if (openDiff) return openDiff;
  if (isOpen(a.status)) {
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.createdAt.localeCompare(b.createdAt);
  }
  return (b.doneAt ?? b.updatedAt).localeCompare(a.doneAt ?? a.updatedAt);
}

const HOUR = 3_600_000;
const MINUTE = 60_000;

export function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  const d = Math.floor(abs / (24 * HOUR));
  const h = Math.floor((abs % (24 * HOUR)) / HOUR);
  const m = Math.floor((abs % HOUR) / MINUTE);
  if (d > 0) return `${d} ngày ${h} giờ`;
  if (h > 0) return `${h} giờ ${m} phút`;
  return `${Math.max(m, 1)} phút`;
}

export function formatRelative(iso: string, now: number): string {
  const diff = now - Date.parse(iso);
  if (diff < MINUTE) return 'Vừa xong';
  return `${formatDuration(diff)} trước`;
}

/** Short relative time with the largest unit only, e.g. "4 giờ trước" — for compact lists. */
export function formatRelativeShort(iso: string, now: number): string {
  const diff = Math.max(0, now - Date.parse(iso));
  if (diff < MINUTE) return 'Vừa xong';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} phút trước`;
  if (diff < 24 * HOUR) return `${Math.floor(diff / HOUR)} giờ trước`;
  return `${Math.floor(diff / (24 * HOUR))} ngày trước`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
