import { describe, expect, it } from 'vitest';
import type { Incident } from '@/domain/incident';
import { visibleIncidents, withIncidentStatus } from '@/domain/incident';

const T0 = Date.parse('2026-10-20T08:00:00.000Z');
const at = (hours: number) => new Date(T0 + hours * 3_600_000).toISOString();

function incident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: 'i1', title: 'VPN gián đoạn', detail: '', severity: 'partial', status: 'investigating',
    authorId: 'it', createdAt: at(0), updatedAt: at(0), resolvedAt: null,
    ...overrides,
  };
}

describe('visibleIncidents', () => {
  it('shows nothing when IT has posted nothing', () => {
    expect(visibleIncidents([], T0)).toEqual({ active: [], recent: [] });
  });

  it('puts major notices first and keeps resolved ones for 24 hours only', () => {
    const list = [
      incident({ id: 'partial-new', createdAt: at(3) }),
      incident({ id: 'major-old', severity: 'major', createdAt: at(1) }),
      incident({ id: 'resolved-recent', status: 'resolved', resolvedAt: at(2) }),
      incident({ id: 'resolved-old', status: 'resolved', resolvedAt: at(-30) }),
    ];
    const { active, recent } = visibleIncidents(list, T0 + 4 * 3_600_000);
    expect(active.map((i) => i.id)).toEqual(['major-old', 'partial-new']);
    expect(recent.map((i) => i.id)).toEqual(['resolved-recent']);
  });
});

describe('withIncidentStatus', () => {
  it('stamps the resolution time and refuses to reopen a resolved notice', () => {
    const resolved = withIncidentStatus(incident(), 'resolved', at(2));
    expect(resolved.resolvedAt).toBe(at(2));
    expect(() => withIncidentStatus(resolved, 'investigating', at(3))).toThrow();
  });
});
