// Team channel: one conversation for the whole IT team, with replies, @mentions and ticket links.
import { useEffect, useMemo, useState } from 'react';
import { markChatRead, sendMessage } from '@/data/chatActions';
import { useCurrentUser } from '@/data/session';
import { useStore } from '@/data/store';
import type { ChatMessage } from '@/domain/chat';
import { MAX_MESSAGE_LENGTH } from '@/domain/chat';
import { TEAM, personById } from '@/domain/people';
import { formatDateTime } from '@/domain/ticket';
import { MessageText } from '@/features/chat/MessageText';
import { Avatar } from '@/features/tickets/components/TicketBits';
import { ChatComposer } from '@/shared/lucian/ChatComposer';
import { SwipeReplyThread, type ThreadItem } from '@/shared/lucian/SwipeReplyThread';
import { toast } from '@/shared/lucian/Toaster';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Icon } from '@/shared/ui/Icon';
import './chat.css';

/** Consecutive messages from one person within this gap share a single author line. */
const GROUP_GAP_MS = 5 * 60_000;

function dayLabel(iso: string, now: Date): string {
  const d = new Date(iso);
  const days = Math.round((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000);
  if (days === 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function snippet(text: string, max = 80): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function ChatPage() {
  const me = useCurrentUser();
  const messages = useStore((s) => s.messages);
  const tickets = useStore((s) => s.tickets);
  const [replyToId, setReplyToId] = useState<string | null>(null);

  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const ticketIdByCode = useMemo(() => new Map(tickets.map((t) => [t.code, t.id])), [tickets]);
  const replyTo = replyToId ? byId.get(replyToId) : undefined;

  // Reading the channel clears its unread count for the current person.
  const lastAt = messages[messages.length - 1]?.at;
  useEffect(() => {
    if (lastAt) markChatRead(me.id, lastAt);
  }, [lastAt, me.id]);

  const items: ThreadItem[] = useMemo(() => {
    const now = new Date();
    return messages.map((m, i) => {
      const prev: ChatMessage | undefined = messages[i - 1];
      const author = personById(m.authorId);
      const mine = m.authorId === me.id;
      const newDay = !prev || new Date(prev.at).toDateString() !== new Date(m.at).toDateString();
      const newGroup = newDay || prev.authorId !== m.authorId || Date.parse(m.at) - Date.parse(prev.at) > GROUP_GAP_MS;
      const quoted = m.replyToId ? byId.get(m.replyToId) : undefined;
      return {
        id: m.id,
        mine,
        label: `${author?.name ?? ''}: ${snippet(m.text, 40)}`,
        before: (newDay || newGroup) && (
          <>
            {newDay && (
              <div className="chat-day" role="separator">
                <span>{dayLabel(m.at, now)}</span>
              </div>
            )}
            {newGroup && (
              <div className={`chat-author${mine ? ' is-mine' : ''}`}>
                {!mine && <Avatar person={author} size={22} />}
                {!mine && <b>{author?.name ?? 'Thành viên cũ'}</b>}
                <time dateTime={m.at} title={formatDateTime(m.at)}>
                  {timeLabel(m.at)}
                </time>
              </div>
            )}
          </>
        ),
        quote: m.replyToId && (
          <>
            <b className="chat-quote-who">{personById(quoted?.authorId)?.name ?? 'Tin nhắn'}</b>
            {quoted ? snippet(quoted.text) : 'Tin nhắn không còn'}
          </>
        ),
        body: <MessageText text={m.text} meId={me.id} ticketIdByCode={ticketIdByCode} />,
      };
    });
  }, [messages, me.id, byId, ticketIdByCode]);

  const mentionables = useMemo(() => TEAM.filter((p) => p.id !== me.id).map((p) => ({ id: p.id, name: p.name, detail: p.title })), [me.id]);

  function send(text: string) {
    try {
      sendMessage(text, me.id, replyToId);
      setReplyToId(null);
    } catch (e) {
      toast({ kind: 'err', title: 'Chưa gửi được tin nhắn', detail: (e as Error).message });
    }
  }

  return (
    <main className="page chat-page">
      <div className="ux u078">
        <div className="u078-top">
          <i aria-hidden="true">
            <Icon name="chat" size={18} />
          </i>
          <span>
            <h1 className="chat-title">Kênh chung team IT</h1>
            <small className="chat-sub">{TEAM.length} thành viên · gõ @ để nhắc tên, dán mã BLT-… để dẫn tới ticket</small>
          </span>
        </div>
        {items.length ? (
          <SwipeReplyThread items={items} onReply={setReplyToId} ariaLabel="Tin nhắn trong kênh" />
        ) : (
          <div className="chat-empty">
            <EmptyState figure="relay" figureLabel="Tín hiệu đi qua từng chặng" title="Kênh chưa có tin nhắn" text="Gửi lời chào đầu tiên, hoặc nhắc @tên một người trong team." />
          </div>
        )}
        <ChatComposer
          replyTo={replyTo ? { author: personById(replyTo.authorId)?.name ?? '', text: replyTo.text } : null}
          onCancelReply={() => setReplyToId(null)}
          onSend={send}
          mentionables={mentionables}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Nhắn cho cả team…"
        />
      </div>
    </main>
  );
}
