// Side card with requester, assignee (editable by IT), SLA, impact and asset details.
import { assign } from '@/data/ticketActions';
import { AGENTS, personById } from '@/domain/people';
import type { Ticket } from '@/domain/ticket';
import { IMPACT_LABEL, URGENCY_LABEL, formatDateTime } from '@/domain/ticket';
import { Avatar, SlaMeter } from '@/features/tickets/components/TicketBits';
import { toast } from '@/shared/lucian/Toaster';

export function TicketInfo({ ticket, now, actorId, isAgent }: { ticket: Ticket; now: number; actorId: string; isAgent: boolean }) {
  const requester = personById(ticket.requesterId);
  const assignee = personById(ticket.assigneeId);
  return (
    <section className="card" aria-labelledby="info-title">
      <div className="card-head">
        <h2 id="info-title">Thông tin</h2>
      </div>
      <dl className="props">
        <dt>Người gửi</dt>
        <dd>
          <span className="person">
            <Avatar person={requester} size={28} />
            <span>
              {requester?.name}
              <small>
                {requester?.title} · {requester?.department}
              </small>
            </span>
          </span>
        </dd>
        <dt>Người xử lý</dt>
        <dd>
          {isAgent && ticket.status !== 'closed' ? (
            <select
              className="select"
              value={ticket.assigneeId ?? ''}
              aria-label="Người xử lý"
              onChange={(e) => {
                assign(ticket.id, e.target.value || null, actorId);
                toast({ kind: 'ok', title: 'Đã cập nhật người xử lý' });
              }}
            >
              <option value="">Chưa phân công</option>
              {AGENTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.id === actorId ? ' (tôi)' : ''}
                </option>
              ))}
            </select>
          ) : (
            <span className="person">
              <Avatar person={assignee} size={28} />
              <span>{assignee?.name ?? 'Đang chờ phân công'}</span>
            </span>
          )}
        </dd>
        <dt>SLA xử lý</dt>
        <dd>
          <SlaMeter ticket={ticket} now={now} />
        </dd>
        <dt>Ảnh hưởng</dt>
        <dd>
          {IMPACT_LABEL[ticket.impact].title} · {URGENCY_LABEL[ticket.urgency].title}
        </dd>
        <dt>Tạo lúc</dt>
        <dd>{formatDateTime(ticket.createdAt)}</dd>
        {ticket.asset && (
          <>
            <dt>Thiết bị</dt>
            <dd>{ticket.asset}</dd>
          </>
        )}
        {ticket.location && (
          <>
            <dt>Vị trí</dt>
            <dd>{ticket.location}</dd>
          </>
        )}
      </dl>
    </section>
  );
}
