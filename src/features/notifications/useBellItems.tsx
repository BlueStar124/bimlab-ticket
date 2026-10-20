// Turns ticket activity and channel mentions into notification-bell rows for the signed-in person.
import { type ReactNode, useMemo } from 'react';
import { useStore } from '@/data/store';
import { mentionsOf } from '@/domain/chat';
import { notificationsFor } from '@/domain/notifications';
import { TEAM, personById } from '@/domain/people';
import type { TicketEvent } from '@/domain/ticket';
import { PRIORITY_LABEL, STATUS_LABEL, formatRelative } from '@/domain/ticket';
import { PRIORITY_COLOR, STATUS_COLOR } from '@/features/tickets/components/TicketBits';
import { useNow } from '@/shared/hooks/useNow';
import type { BellItem } from '@/shared/lucian/NotificationBell';
import { Icon } from '@/shared/ui/Icon';

const MAX_ITEMS = 20;

function describe(e: TicketEvent, personId: string): { text: string; icon: ReactNode; color: string } {
  switch (e.kind) {
    case 'created':
      return { text: e.toAssigneeId === personId ? 'đã báo lỗi và giao cho bạn' : 'đã báo lỗi mới, chưa ai nhận', icon: <Icon name="ticket" size={18} />, color: 'var(--st-new)' };
    case 'comment':
      return { text: `đã bình luận: “${e.text.slice(0, 70)}${e.text.length > 70 ? '…' : ''}”`, icon: <Icon name="chat" size={18} />, color: 'var(--st-progress)' };
    case 'assign':
      return { text: e.toAssigneeId === personId ? 'đã giao việc cho bạn' : e.text.toLowerCase(), icon: <Icon name="userPlus" size={18} />, color: 'var(--st-progress)' };
    case 'priority':
      return { text: `đổi ưu tiên sang “${PRIORITY_LABEL[e.toPriority ?? 'medium'].title}”`, icon: <Icon name="alert" size={18} />, color: PRIORITY_COLOR[e.toPriority ?? 'medium'] };
    case 'status':
      return { text: `chuyển sang “${STATUS_LABEL[e.toStatus ?? 'todo']}”`, icon: <Icon name="refresh" size={18} />, color: STATUS_COLOR[e.toStatus ?? 'todo'] };
  }
}

/** Bell rows plus where each one leads (a ticket, or the team channel). */
export function useBellItems(personId: string): { items: BellItem[]; hrefOf: Map<string, string> } {
  const tickets = useStore((s) => s.tickets);
  const events = useStore((s) => s.events);
  const messages = useStore((s) => s.messages);
  const readBy = useStore((s) => s.readBy);
  const now = useNow(60_000);
  return useMemo(() => {
    const read = new Set(readBy[personId] ?? []);
    const codes = new Map(tickets.map((t) => [t.id, t.code]));
    const hrefOf = new Map<string, string>();

    const ticketRows = notificationsFor(tickets, events, personId).map((e) => {
      const d = describe(e, personId);
      hrefOf.set(e.id, `/ticket/${e.ticketId}`);
      return { at: e.at, item: { id: e.id, actor: personById(e.actorId)?.name ?? 'Hệ thống', text: `${d.text} · ${codes.get(e.ticketId) ?? ''}`, icon: d.icon, color: d.color } };
    });
    const mentionRows = mentionsOf(messages, personId, TEAM).map((m) => {
      hrefOf.set(m.id, '/tin-nhan');
      const text = `nhắc bạn trong kênh: “${m.text.slice(0, 70)}${m.text.length > 70 ? '…' : ''}”`;
      return { at: m.at, item: { id: m.id, actor: personById(m.authorId)?.name ?? 'Thành viên cũ', text, icon: <Icon name="chat" size={18} />, color: 'var(--ux-accent)' } };
    });

    const items: BellItem[] = [...ticketRows, ...mentionRows]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, MAX_ITEMS)
      .map(({ at, item }) => ({ ...item, time: formatRelative(at, now), unread: !read.has(item.id) }));
    return { items, hrefOf };
  }, [tickets, events, messages, readBy, personId, now]);
}
