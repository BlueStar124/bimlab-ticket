import { describe, expect, it } from 'vitest';
import type { Ticket } from '@/domain/ticket';
import { canTransition, compareForQueue, formatRelativeShort, nextStatuses, nextTicketCode, withStatus } from '@/domain/ticket';

const T0 = Date.parse('2026-10-20T08:00:00.000Z');
const at = (hours: number) => new Date(T0 + hours * 3_600_000).toISOString();

function ticket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 't1', code: 'BLT-2610-0001', title: 'x', description: '', areaId: 'hrm', environment: null,
    priority: 'medium', status: 'todo', reporterId: 'it-nam', assigneeId: null, attachments: [],
    createdAt: at(0), updatedAt: at(0), startedAt: null, doneAt: null,
    ...overrides,
  };
}

describe('status workflow', () => {
  it('allows moving between any two different statuses', () => {
    expect(nextStatuses('todo')).toEqual(['in_progress', 'done']);
    expect(nextStatuses('done')).toEqual(['todo', 'in_progress']);
    expect(canTransition('in_progress', 'in_progress')).toBe(false);
  });

  it('records when work started and keeps it across later moves', () => {
    const started = withStatus(ticket(), 'in_progress', at(1));
    expect(started.startedAt).toBe(at(1));
    const done = withStatus(started, 'done', at(3));
    expect(done.startedAt).toBe(at(1));
    expect(done.doneAt).toBe(at(3));
  });

  it('clears the completion time on reopen and the start time when sent back to new', () => {
    const done = withStatus(withStatus(ticket(), 'in_progress', at(1)), 'done', at(2));
    const reopened = withStatus(done, 'in_progress', at(5));
    expect(reopened.doneAt).toBeNull();
    expect(reopened.startedAt).toBe(at(1));
    expect(withStatus(reopened, 'todo', at(6)).startedAt).toBeNull();
  });
});

describe('compareForQueue', () => {
  it('puts open tickets first, by priority, then the longest-waiting', () => {
    const list = [
      ticket({ id: 'done', status: 'done', priority: 'urgent', doneAt: at(9) }),
      ticket({ id: 'low', priority: 'low', createdAt: at(0) }),
      ticket({ id: 'urgent-new', priority: 'urgent', createdAt: at(5) }),
      ticket({ id: 'urgent-old', priority: 'urgent', status: 'in_progress', createdAt: at(2) }),
    ];
    expect([...list].sort(compareForQueue).map((t) => t.id)).toEqual(['urgent-old', 'urgent-new', 'low', 'done']);
  });

  it('lists finished tickets by latest completion', () => {
    const list = [ticket({ id: 'a', status: 'done', doneAt: at(1) }), ticket({ id: 'b', status: 'done', doneAt: at(4) })];
    expect([...list].sort(compareForQueue).map((t) => t.id)).toEqual(['b', 'a']);
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
