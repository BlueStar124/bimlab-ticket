// Read-state for the notification bell.
import { getState, setState } from '@/data/store';

export function markRead(personId: string, eventIds: string[]) {
  const s = getState();
  const current = new Set(s.readBy[personId] ?? []);
  eventIds.forEach((e) => current.add(e));
  setState({ ...s, readBy: { ...s.readBy, [personId]: [...current] } });
}
