// Incident notice writes. Only IT staff may post or update notices.
import { getState, newId, setState } from '@/data/store';
import type { Incident, IncidentSeverity, IncidentStatus } from '@/domain/incident';
import { withIncidentStatus } from '@/domain/incident';
import { roleOf } from '@/domain/people';

function requireAgent(actorId: string) {
  if (roleOf(actorId) !== 'agent') throw new Error('Chỉ Phòng CNTT được đăng thông báo sự cố');
}

export function postIncident(input: { title: string; detail: string; severity: IncidentSeverity }, actorId: string): Incident {
  requireAgent(actorId);
  const s = getState();
  const at = new Date().toISOString();
  const incident: Incident = { ...input, id: newId('inc'), status: 'investigating', authorId: actorId, createdAt: at, updatedAt: at, resolvedAt: null };
  setState({ ...s, incidents: [incident, ...s.incidents] });
  return incident;
}

export function setIncidentStatus(id: string, to: IncidentStatus, actorId: string) {
  requireAgent(actorId);
  const s = getState();
  const at = new Date().toISOString();
  setState({ ...s, incidents: s.incidents.map((i) => (i.id === id ? withIncidentStatus(i, to, at) : i)) });
}
