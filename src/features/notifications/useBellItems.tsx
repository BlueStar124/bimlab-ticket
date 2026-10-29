// Turns the server's notifications (ticket activity and channel mentions) into notification-bell rows.
import { type ReactNode, useMemo } from 'react';
import { personById } from '@/data/people';
import { useStore } from '@/data/store';
import type { AppNotification } from '@/domain/notifications';
import { PRIORITY_LABEL, STATUS_LABEL, formatRelative } from '@/domain/ticket';
import { PRIORITY_COLOR, STATUS_COLOR } from '@/features/tickets/components/TicketBits';
import { useNow } from '@/shared/hooks/useNow';
import type { BellItem } from '@/shared/lucian/NotificationBell';
import { Icon } from '@/shared/ui/Icon';

function quote(text: string) {
  return `“${text.slice(0, 70)}${text.length > 70 ? '…' : ''}”`;
}

function describe(n: AppNotification, personId: string): { text: string; icon: ReactNode; color: string } {
  switch (n.kind) {
    case 'mention':
      return { text: `nhắc bạn trong kênh: ${quote(n.text)}`, icon: <Icon name="chat" size={18} />, color: 'var(--ux-accent)' };
    case 'created':
      return { text: n.toAssigneeId === personId ? 'đã báo lỗi và giao cho bạn' : 'đã báo lỗi mới, chưa ai nhận', icon: <Icon name="ticket" size={18} />, color: 'var(--st-new)' };
    case 'comment':
      return { text: `đã bình luận: ${quote(n.text)}`, icon: <Icon name="chat" size={18} />, color: 'var(--st-progress)' };
    case 'assign':
      return { text: n.toAssigneeId === personId ? 'đã giao việc cho bạn' : n.text.toLowerCase(), icon: <Icon name="userPlus" size={18} />, color: 'var(--st-progress)' };
    case 'priority':
      return { text: `đổi ưu tiên sang “${PRIORITY_LABEL[n.toPriority ?? 'medium'].title}”`, icon: <Icon name="alert" size={18} />, color: PRIORITY_COLOR[n.toPriority ?? 'medium'] };
    case 'status':
      return { text: `chuyển sang “${STATUS_LABEL[n.toStatus ?? 'todo']}”`, icon: <Icon name="refresh" size={18} />, color: STATUS_COLOR[n.toStatus ?? 'todo'] };
  }
}

/** Bell rows plus where each one leads (a ticket, or the team channel). */
export function useBellItems(personId: string): { items: BellItem[]; hrefOf: Map<string, string> } {
  const tickets = useStore((s) => s.tickets);
  const notifications = useStore((s) => s.notifications);
  const now = useNow(60_000);
  return useMemo(() => {
    const codes = new Map(tickets.map((t) => [t.id, t.code]));
    const hrefOf = new Map<string, string>();
    const items: BellItem[] = notifications.map((n) => {
      const d = describe(n, personId);
      hrefOf.set(n.id, n.ticketId ? `/ticket/${n.ticketId}` : '/tin-nhan');
      const code = n.ticketId ? ` · ${codes.get(n.ticketId) ?? ''}` : '';
      return {
        id: n.id,
        actor: personById(n.actorId)?.name ?? 'Thành viên cũ',
        text: `${d.text}${code}`,
        icon: d.icon,
        color: d.color,
        time: formatRelative(n.at, now),
        unread: !n.read,
      };
    });
    return { items, hrefOf };
  }, [tickets, notifications, personId, now]);
}
