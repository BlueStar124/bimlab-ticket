// Read-state for the notification bell; the server keeps it, so it follows the member across devices.
import { getState, setState } from '@/data/store';
import type { StoreState } from '@/data/store';
import { markNotificationsRead, type NotificationRef } from '@/data/ticketApi';
import { withRead } from '@/domain/notifications';

/** References the server needs for the given bell ids; ids not in the list are skipped. */
export function notificationRefs(s: Pick<StoreState, 'notifications'>, ids: string[]): NotificationRef[] {
  const wanted = new Set(ids);
  return s.notifications.filter((n) => wanted.has(n.id) && !n.read).map((n) => ({ source: n.source, id: n.id }));
}

export function markRead(ids: string[]) {
  const s = getState();
  const refs = notificationRefs(s, ids);
  if (!refs.length) return;
  setState({ ...s, notifications: withRead(s.notifications, ids) });
  void markNotificationsRead(refs).catch(() => undefined);
}
