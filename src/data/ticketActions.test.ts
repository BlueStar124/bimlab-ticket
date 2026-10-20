import { beforeEach, describe, expect, it } from 'vitest';
import { getState, resetDemoData } from '@/data/store';
import { addComment, assign, changeStatus, createTicket } from '@/data/ticketActions';

const input = { title: 'API trả 500', description: 'Gọi /employees bị lỗi 500', areaId: 'hrm', environment: 'test' as const, priority: 'high' as const, assigneeId: null, attachments: [] };

const ticketById = (id: string) => getState().tickets.find((t) => t.id === id)!;
const eventsOf = (id: string) => getState().events.filter((e) => e.ticketId === id);

describe('ticketActions', () => {
  beforeEach(() => resetDemoData());

  it('creates a new, unassigned ticket with a "created" event', () => {
    const t = createTicket(input, 'it-trang');
    expect(t.status).toBe('todo');
    expect(t.assigneeId).toBeNull();
    expect(eventsOf(t.id).map((e) => e.kind)).toEqual(['created']);
  });

  it('assigns the person who starts work on an unassigned ticket', () => {
    const t = createTicket(input, 'it-trang');
    changeStatus(t.id, 'in_progress', 'it-duc');
    expect(ticketById(t.id).assigneeId).toBe('it-duc');
    expect(ticketById(t.id).startedAt).not.toBeNull();
    expect(eventsOf(t.id).map((e) => e.kind)).toEqual(['created', 'assign', 'status']);
  });

  it('keeps the existing assignee when someone else moves the ticket', () => {
    const t = createTicket({ ...input, assigneeId: 'it-huy' }, 'it-trang');
    changeStatus(t.id, 'in_progress', 'it-nam');
    expect(ticketById(t.id).assigneeId).toBe('it-huy');
  });

  it('lets any member reassign, and ignores a no-op assignment', () => {
    const t = createTicket(input, 'it-trang');
    assign(t.id, 'it-bao', 'it-huy');
    assign(t.id, 'it-bao', 'it-huy');
    expect(ticketById(t.id).assigneeId).toBe('it-bao');
    expect(eventsOf(t.id).filter((e) => e.kind === 'assign')).toHaveLength(1);
  });

  it('rejects people outside the IT team and invalid input', () => {
    expect(() => createTicket(input, 'outsider')).toThrow();
    const t = createTicket(input, 'it-trang');
    expect(() => assign(t.id, 'outsider', 'it-trang')).toThrow();
    expect(() => changeStatus(t.id, 'todo', 'it-trang')).toThrow();
    expect(() => addComment(t.id, '   ', 'it-trang')).toThrow();
    expect(() => createTicket({ ...input, areaId: 'unknown' }, 'it-trang')).toThrow();
  });
});
