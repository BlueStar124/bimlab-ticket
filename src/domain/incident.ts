// Incident notices posted manually by the IT team (no monitoring system behind them).
// Pure rules only — storage lives in store/ticketStore.ts.

export type IncidentStatus = 'investigating' | 'monitoring' | 'resolved';
export type IncidentSeverity = 'partial' | 'major';

export interface Incident {
  id: string;
  title: string;
  detail: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  investigating: 'Đang xử lý',
  monitoring: 'Đang theo dõi',
  resolved: 'Đã khắc phục',
};

export const INCIDENT_SEVERITY_LABEL: Record<IncidentSeverity, { title: string; hint: string }> = {
  partial: { title: 'Gián đoạn một phần', hint: 'Chậm hoặc lỗi với một số người' },
  major: { title: 'Gián đoạn nghiêm trọng', hint: 'Không dùng được, ảnh hưởng nhiều người' },
};

/** How long a resolved notice stays visible to staff after it is closed. */
export const RESOLVED_VISIBLE_MS = 24 * 3_600_000;

export const INCIDENT_NEXT: Record<IncidentStatus, IncidentStatus[]> = {
  investigating: ['monitoring', 'resolved'],
  monitoring: ['investigating', 'resolved'],
  resolved: [],
};

export function isActive(incident: Incident): boolean {
  return incident.status !== 'resolved';
}

/** Returns the notice with its status (and resolution time) updated. Throws on an invalid move. */
export function withIncidentStatus(incident: Incident, to: IncidentStatus, at: string): Incident {
  if (!INCIDENT_NEXT[incident.status].includes(to)) {
    throw new Error('Không thể chuyển thông báo sang trạng thái này');
  }
  return { ...incident, status: to, updatedAt: at, resolvedAt: to === 'resolved' ? at : null };
}

/**
 * What staff should see: active notices (major first, newest first) and notices resolved
 * within the last 24 hours (newest first). Older resolved notices are hidden.
 */
export function visibleIncidents(all: Incident[], now: number): { active: Incident[]; recent: Incident[] } {
  const active = all
    .filter(isActive)
    .sort((a, b) => Number(b.severity === 'major') - Number(a.severity === 'major') || b.createdAt.localeCompare(a.createdAt));
  const recent = all
    .filter((i) => i.resolvedAt && now - Date.parse(i.resolvedAt) <= RESOLVED_VISIBLE_MS)
    .sort((a, b) => (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? ''));
  return { active, recent };
}
