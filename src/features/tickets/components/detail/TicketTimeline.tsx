// Comments and activity log, followed by the comment box.
import { personById } from '@/data/people';
import type { Ticket, TicketEvent } from '@/domain/ticket';
import { STATUS_LABEL, formatDateTime, formatRelative } from '@/domain/ticket';
import { Composer } from '@/features/tickets/components/detail/Composer';
import { Avatar } from '@/features/tickets/components/TicketBits';

function systemText(e: TicketEvent): string {
  if (e.kind === 'status') return `chuyển sang “${STATUS_LABEL[e.toStatus ?? 'todo']}”`;
  if (e.kind === 'created') return e.toAssigneeId ? `đã báo lỗi và giao cho ${personById(e.toAssigneeId)?.name}` : 'đã báo lỗi';
  return e.text.charAt(0).toLowerCase() + e.text.slice(1);
}

interface Props {
  ticket: Ticket;
  events: TicketEvent[];
  now: number;
  actorId: string;
}

export function TicketTimeline({ ticket, events, now, actorId }: Props) {
  const comments = events.filter((e) => e.kind === 'comment').length;
  return (
    <section className="card" aria-labelledby="conv-title">
      <div className="card-head">
        <h2 id="conv-title">Trao đổi</h2>
        <span className="muted">{comments} bình luận</span>
      </div>
      <div className="timeline">
        {events.map((e) => {
          const actor = personById(e.actorId);
          if (e.kind === 'comment') {
            return (
              <div key={e.id} className="tl-item">
                <Avatar person={actor} size={34} />
                <div className="tl-body">
                  <div className="tl-meta">
                    <b>{actor?.name}</b>
                    {e.actorId === ticket.reporterId && <span>Người báo</span>}
                    {e.actorId === ticket.assigneeId && <span>Người làm</span>}
                    <span title={formatDateTime(e.at)}>{formatRelative(e.at, now)}</span>
                  </div>
                  <div className="bubble">{e.text}</div>
                </div>
              </div>
            );
          }
          return (
            <div key={e.id} className="tl-sys">
              <span>
                <b style={{ color: 'var(--ux-ink-2)' }}>{actor?.name}</b> {systemText(e)} · <span title={formatDateTime(e.at)}>{formatRelative(e.at, now)}</span>
              </span>
            </div>
          );
        })}
      </div>
      <Composer ticket={ticket} actorId={actorId} />
    </section>
  );
}
