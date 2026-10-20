// Business rules for IT tickets: priority matrix, SLA, status workflow.
// Pure functions only — no React, no storage — so they can be tested and moved to a backend later.

export type Role = 'employee' | 'agent';
export type TicketStatus = 'new' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type Impact = 'individual' | 'team' | 'company';
export type Urgency = 'low' | 'medium' | 'high';

export interface Person {
  id: string;
  name: string;
  title: string;
  department: string;
  role: Role;
}

export interface Attachment {
  name: string;
  size: number;
}

export interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string;
  categoryId: string;
  impact: Impact;
  urgency: Urgency;
  priority: Priority;
  status: TicketStatus;
  requesterId: string;
  assigneeId: string | null;
  asset: string;
  location: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  /** Set while the ticket waits for the requester; SLA clock is paused during that time. */
  waitingSince: string | null;
  pausedMs: number;
  rating: number | null;
  ratingComment: string;
}

export type TicketEventKind = 'created' | 'status' | 'assign' | 'reply' | 'note' | 'rating';

export interface TicketEvent {
  id: string;
  ticketId: string;
  at: string;
  actorId: string;
  kind: TicketEventKind;
  text: string;
  /** Internal notes are visible to the IT team only. */
  internal: boolean;
  toStatus?: TicketStatus;
}

export const STATUS_LABEL: Record<TicketStatus, string> = {
  new: 'Mới',
  in_progress: 'Đang xử lý',
  waiting: 'Chờ phản hồi',
  resolved: 'Đã giải quyết',
  closed: 'Đã đóng',
};

export const STATUS_ORDER: TicketStatus[] = ['new', 'in_progress', 'waiting', 'resolved', 'closed'];

export const PRIORITY_LABEL: Record<Priority, string> = {
  P1: 'Khẩn cấp',
  P2: 'Cao',
  P3: 'Trung bình',
  P4: 'Thấp',
};

export const IMPACT_LABEL: Record<Impact, { title: string; hint: string }> = {
  individual: { title: 'Chỉ mình tôi', hint: 'Một người hoặc một máy' },
  team: { title: 'Nhóm / dự án', hint: 'Một phòng ban hoặc một dự án' },
  company: { title: 'Toàn công ty', hint: 'Nhiều phòng ban cùng bị' },
};

export const URGENCY_LABEL: Record<Urgency, { title: string; hint: string }> = {
  low: { title: 'Có thể chờ', hint: 'Vẫn làm việc bình thường' },
  medium: { title: 'Ảnh hưởng công việc', hint: 'Làm chậm, có cách tạm thời' },
  high: { title: 'Ngừng làm việc', hint: 'Không thể tiếp tục công việc' },
};

const PRIORITY_MATRIX: Record<Impact, Record<Urgency, Priority>> = {
  individual: { low: 'P4', medium: 'P3', high: 'P2' },
  team: { low: 'P3', medium: 'P2', high: 'P1' },
  company: { low: 'P2', medium: 'P1', high: 'P1' },
};

/** ITIL-style priority = impact × urgency. */
export function priorityFor(impact: Impact, urgency: Urgency): Priority {
  return PRIORITY_MATRIX[impact][urgency];
}

export const SLA_TARGETS: Record<Priority, { responseMinutes: number; resolveHours: number }> = {
  P1: { responseMinutes: 15, resolveHours: 4 },
  P2: { responseMinutes: 30, resolveHours: 8 },
  P3: { responseMinutes: 120, resolveHours: 24 },
  P4: { responseMinutes: 240, resolveHours: 72 },
};

const HOUR = 3_600_000;
const MINUTE = 60_000;

export interface SlaState {
  dueAt: number;
  remainingMs: number;
  /** Share of the resolve budget already used, 0..1+ (above 1 means breached). */
  used: number;
  breached: boolean;
  paused: boolean;
  done: boolean;
}

function pausedSoFar(ticket: Ticket, now: number): number {
  const live = ticket.waitingSince ? Math.max(0, now - Date.parse(ticket.waitingSince)) : 0;
  return ticket.pausedMs + live;
}

export function slaState(ticket: Ticket, now: number): SlaState {
  const budget = SLA_TARGETS[ticket.priority].resolveHours * HOUR;
  const start = Date.parse(ticket.createdAt);
  const stoppedAt = ticket.resolvedAt ? Date.parse(ticket.resolvedAt) : now;
  const elapsed = stoppedAt - start - pausedSoFar(ticket, stoppedAt);
  const dueAt = start + budget + pausedSoFar(ticket, now);
  return {
    dueAt,
    remainingMs: budget - elapsed,
    used: elapsed / budget,
    breached: elapsed > budget,
    paused: ticket.status === 'waiting',
    done: ticket.resolvedAt !== null,
  };
}

export function responseBreached(ticket: Ticket, now: number): boolean {
  const limit = SLA_TARGETS[ticket.priority].responseMinutes * MINUTE;
  const respondedAt = ticket.firstResponseAt ? Date.parse(ticket.firstResponseAt) : now;
  return respondedAt - Date.parse(ticket.createdAt) > limit;
}

const AGENT_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  new: ['in_progress', 'waiting', 'resolved'],
  in_progress: ['waiting', 'resolved'],
  waiting: ['in_progress', 'resolved'],
  resolved: ['in_progress', 'closed'],
  closed: [],
};

const EMPLOYEE_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  new: [],
  in_progress: [],
  waiting: [],
  // Requester confirms the fix (close) or reopens it.
  resolved: ['closed', 'in_progress'],
  closed: [],
};

export function allowedTransitions(from: TicketStatus, role: Role): TicketStatus[] {
  return role === 'agent' ? AGENT_TRANSITIONS[from] : EMPLOYEE_TRANSITIONS[from];
}

export function canTransition(from: TicketStatus, to: TicketStatus, role: Role): boolean {
  return allowedTransitions(from, role).includes(to);
}

/** Returns the ticket with timestamps and SLA pause bookkeeping updated for the new status. */
export function withStatus(ticket: Ticket, to: TicketStatus, at: string): Ticket {
  const now = Date.parse(at);
  let pausedMs = ticket.pausedMs;
  let waitingSince = ticket.waitingSince;
  if (waitingSince && to !== 'waiting') {
    pausedMs += Math.max(0, now - Date.parse(waitingSince));
    waitingSince = null;
  }
  if (to === 'waiting' && !waitingSince) waitingSince = at;

  return {
    ...ticket,
    status: to,
    pausedMs,
    waitingSince,
    updatedAt: at,
    resolvedAt: to === 'resolved' || to === 'closed' ? (ticket.resolvedAt ?? at) : null,
    closedAt: to === 'closed' ? at : null,
    rating: to === 'in_progress' ? null : ticket.rating,
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
  return status !== 'resolved' && status !== 'closed';
}

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

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const PRIORITY_RANK: Record<Priority, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };

/** Queue order: open tickets first, by priority then nearest SLA deadline; finished ones by latest update. */
export function compareForQueue(a: Ticket, b: Ticket, now: number): number {
  const openDiff = Number(isOpen(b.status)) - Number(isOpen(a.status));
  if (openDiff) return openDiff;
  if (isOpen(a.status)) {
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (p) return p;
    return slaState(a, now).dueAt - slaState(b, now).dueAt;
  }
  return b.updatedAt.localeCompare(a.updatedAt);
}

/** Short relative time with the largest unit only, e.g. "4 giờ trước" — for compact lists. */
export function formatRelativeShort(iso: string, now: number): string {
  const diff = Math.max(0, now - Date.parse(iso));
  if (diff < MINUTE) return 'Vừa xong';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} phút trước`;
  if (diff < 24 * HOUR) return `${Math.floor(diff / HOUR)} giờ trước`;
  return `${Math.floor(diff / (24 * HOUR))} ngày trước`;
}

const REQUESTER_ORDER: Record<TicketStatus, number> = { new: 0, in_progress: 1, waiting: 2, resolved: 3, closed: 4 };

/** Requester's own list: new first, then in progress, waiting, resolved, closed; latest update first within a status. */
export function compareForRequester(a: Ticket, b: Ticket): number {
  return REQUESTER_ORDER[a.status] - REQUESTER_ORDER[b.status] || b.updatedAt.localeCompare(a.updatedAt);
}
