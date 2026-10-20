import { describe, expect, it } from 'vitest';
import type { Ticket } from '@/domain/ticket';
import { allowedTransitions, canTransition, compareForRequester, formatRelativeShort, nextTicketCode, priorityFor, slaState, withStatus } from '@/domain/ticket';

const T0 = Date.parse('2026-10-20T08:00:00.000Z');
const at = (hours: number) => new Date(T0 + hours * 3_600_000).toISOString();

function ticket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 't1', code: 'BLT-2610-0001', title: 'x', description: '', categoryId: 'other',
    impact: 'individual', urgency: 'medium', priority: 'P3', status: 'new',
    requesterId: 'u', assigneeId: null, asset: '', location: '', attachments: [],
    createdAt: at(0), updatedAt: at(0), firstResponseAt: null, resolvedAt: null, closedAt: null,
    waitingSince: null, pausedMs: 0, rating: null, ratingComment: '',
    ...overrides,
  };
}

describe('priorityFor', () => {
  it('maps impact × urgency to ITIL priorities', () => {
    expect(priorityFor('individual', 'low')).toBe('P4');
    expect(priorityFor('individual', 'high')).toBe('P2');
    expect(priorityFor('team', 'high')).toBe('P1');
    expect(priorityFor('company', 'low')).toBe('P2');
  });
});

describe('status workflow', () => {
  it('lets only the requester side confirm or reopen a resolved ticket', () => {
    expect(allowedTransitions('in_progress', 'employee')).toEqual([]);
    expect(canTransition('resolved', 'closed', 'employee')).toBe(true);
    expect(canTransition('resolved', 'in_progress', 'employee')).toBe(true);
    expect(canTransition('closed', 'in_progress', 'agent')).toBe(false);
  });
});

describe('SLA', () => {
  it('pauses the resolve clock while waiting for the requester', () => {
    const waiting = withStatus(ticket({ status: 'in_progress' }), 'waiting', at(10));
    const resumed = withStatus(waiting, 'in_progress', at(20));
    expect(resumed.pausedMs).toBe(10 * 3_600_000);
    expect(resumed.waitingSince).toBeNull();
    const sla = slaState(resumed, T0 + 30 * 3_600_000);
    // 30h elapsed − 10h paused = 20h used of a 24h P3 budget.
    expect(sla.breached).toBe(false);
    expect(sla.remainingMs).toBe(4 * 3_600_000);
  });

  it('marks a ticket breached once the budget is used and stops at resolution', () => {
    expect(slaState(ticket(), T0 + 25 * 3_600_000).breached).toBe(true);
    const resolved = withStatus(ticket(), 'resolved', at(5));
    expect(slaState(resolved, T0 + 100 * 3_600_000).breached).toBe(false);
  });

  it('clears the rating when a ticket is reopened', () => {
    const reopened = withStatus(ticket({ status: 'resolved', rating: 2, resolvedAt: at(1) }), 'in_progress', at(2));
    expect(reopened.rating).toBeNull();
    expect(reopened.resolvedAt).toBeNull();
  });
});

describe('nextTicketCode', () => {
  it('continues the running number within the month', () => {
    const d = new Date('2026-10-20T08:00:00');
    expect(nextTicketCode([], d)).toBe('BLT-2610-0001');
    expect(nextTicketCode(['BLT-2610-0009', 'BLT-2609-0050'], d)).toBe('BLT-2610-0010');
  });
});

describe('formatRelativeShort', () => {
  it('keeps only the largest unit', () => {
    const base = Date.parse('2026-10-20T10:00:00.000Z');
    expect(formatRelativeShort('2026-10-20T09:59:30.000Z', base)).toBe('Vừa xong');
    expect(formatRelativeShort('2026-10-20T09:35:00.000Z', base)).toBe('25 phút trước');
    expect(formatRelativeShort('2026-10-20T05:50:00.000Z', base)).toBe('4 giờ trước');
    expect(formatRelativeShort('2026-10-17T10:00:00.000Z', base)).toBe('3 ngày trước');
  });
});

describe('compareForRequester', () => {
  it('lists new, then waiting, then resolved; latest first within a status', () => {
    const list = [
      ticket({ id: 'resolved', status: 'resolved', updatedAt: at(9) }),
      ticket({ id: 'waiting', status: 'waiting', updatedAt: at(1) }),
      ticket({ id: 'new-old', status: 'new', updatedAt: at(2) }),
      ticket({ id: 'new-recent', status: 'new', updatedAt: at(5) }),
    ];
    expect([...list].sort(compareForRequester).map((t) => t.id)).toEqual(['new-recent', 'new-old', 'waiting', 'resolved']);
  });
});
