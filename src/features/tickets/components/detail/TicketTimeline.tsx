// Conversation and activity log, followed by the reply box (or a closed note).
import { Link } from 'react-router-dom';
import { personById } from '@/domain/people';
import type { Ticket, TicketEvent } from '@/domain/ticket';
import { STATUS_LABEL, formatDateTime, formatRelative } from '@/domain/ticket';
import { Composer } from '@/features/tickets/components/detail/Composer';
import { Avatar } from '@/features/tickets/components/TicketBits';
import { Icon } from '@/shared/ui/Icon';

function systemText(e: TicketEvent): string {
  if (e.kind === 'status') return `chuyển trạng thái sang “${STATUS_LABEL[e.toStatus ?? 'in_progress']}”${e.text ? ` — ${e.text}` : ''}`;
  if (e.kind === 'rating') return `đánh giá mức hài lòng ${e.text}`;
  return e.text.charAt(0).toLowerCase() + e.text.slice(1);
}

interface Props {
  ticket: Ticket;
  events: TicketEvent[];
  now: number;
  actorId: string;
  isAgent: boolean;
}

export function TicketTimeline({ ticket, events, now, actorId, isAgent }: Props) {
  return (
    <section className="card" aria-labelledby="conv-title">
      <div className="card-head">
        <h2 id="conv-title">Trao đổi</h2>
        <span className="muted">{events.length} hoạt động</span>
      </div>
      <div className="timeline">
        {events.map((e) => {
          const actor = personById(e.actorId);
          if (e.kind === 'reply' || e.kind === 'note' || e.kind === 'created') {
            const agentSide = actor?.role === 'agent';
            return (
              <div key={e.id} className="tl-item">
                <Avatar person={actor} size={34} />
                <div className="tl-body">
                  <div className="tl-meta">
                    <b>{actor?.name}</b>
                    <span>{agentSide ? 'Phòng CNTT' : actor?.department}</span>
                    <span title={formatDateTime(e.at)}>{formatRelative(e.at, now)}</span>
                    {e.internal && (
                      <span className="tl-tag">
                        <Icon name="lock" size={13} /> Ghi chú nội bộ
                      </span>
                    )}
                  </div>
                  <div className={`bubble${agentSide ? ' agent' : ''}${e.internal ? ' internal' : ''}`}>{e.kind === 'created' ? 'Đã gửi yêu cầu này.' : e.text}</div>
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
      {ticket.status !== 'closed' ? (
        <Composer ticket={ticket} actorId={actorId} isAgent={isAgent} />
      ) : (
        <p className="muted" style={{ marginTop: 12 }}>
          Yêu cầu đã đóng. Nếu lỗi tái diễn, hãy <Link to={`/gui-yeu-cau?nhom=${ticket.categoryId}`}>gửi yêu cầu mới</Link>.
        </p>
      )}
    </section>
  );
}
