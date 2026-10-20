// Turns ticket activity into notification-bell rows for the signed-in person.
import { type ReactNode, useMemo } from 'react';
import { useStore } from '@/data/store';
import { notificationsFor } from '@/domain/notifications';
import { personById } from '@/domain/people';
import type { TicketEvent } from '@/domain/ticket';
import { STATUS_LABEL, formatRelative } from '@/domain/ticket';
import { STATUS_COLOR } from '@/features/tickets/components/TicketBits';
import { useNow } from '@/shared/hooks/useNow';
import type { BellItem } from '@/shared/lucian/NotificationBell';
import { Icon } from '@/shared/ui/Icon';

function describe(e: TicketEvent): { text: string; icon: ReactNode; color: string } {
  switch (e.kind) {
    case 'created':
      return { text: 'đã gửi một yêu cầu mới', icon: <Icon name="ticket" size={18} />, color: 'var(--st-new)' };
    case 'reply':
      return { text: `đã trả lời: “${e.text.slice(0, 70)}${e.text.length > 70 ? '…' : ''}”`, icon: <Icon name="chat" size={18} />, color: 'var(--st-progress)' };
    case 'assign':
      return { text: e.text.toLowerCase(), icon: <Icon name="userPlus" size={18} />, color: 'var(--st-progress)' };
    case 'rating':
      return { text: `đã đánh giá ${e.text}`, icon: <Icon name="star" size={18} />, color: 'var(--st-waiting)' };
    case 'status':
      return { text: `chuyển sang “${STATUS_LABEL[e.toStatus ?? 'in_progress']}”`, icon: <Icon name="refresh" size={18} />, color: STATUS_COLOR[e.toStatus ?? 'in_progress'] };
    default:
      return { text: e.text, icon: <Icon name="doc" size={18} />, color: 'var(--st-closed)' };
  }
}

export function useBellItems(personId: string): { items: BellItem[]; ticketOf: Map<string, string> } {
  const tickets = useStore((s) => s.tickets);
  const events = useStore((s) => s.events);
  const readBy = useStore((s) => s.readBy);
  const now = useNow(60_000);
  return useMemo(() => {
    const read = new Set(readBy[personId] ?? []);
    const codes = new Map(tickets.map((t) => [t.id, t.code]));
    const list = notificationsFor(tickets, events, personId);
    const items: BellItem[] = list.map((e) => {
      const d = describe(e);
      return {
        id: e.id,
        actor: personById(e.actorId)?.name ?? 'Hệ thống',
        text: `${d.text} · ${codes.get(e.ticketId) ?? ''}`,
        time: formatRelative(e.at, now),
        icon: d.icon,
        color: d.color,
        unread: !read.has(e.id),
      };
    });
    return { items, ticketOf: new Map(list.map((e) => [e.id, e.ticketId])) };
  }, [tickets, events, readBy, personId, now]);
}
