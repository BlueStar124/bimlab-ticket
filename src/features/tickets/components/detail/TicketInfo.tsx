// Side card: reporter, assignee and priority (editable by anyone in the team), work timestamps.
import { assign, setPriority } from '@/data/ticketActions';
import { teamMembers, personById } from '@/data/people';
import type { Priority, Ticket } from '@/domain/ticket';
import { PRIORITY_LABEL, PRIORITY_ORDER, formatDateTime, formatDuration } from '@/domain/ticket';
import { Avatar } from '@/features/tickets/components/TicketBits';
import { toast } from '@/shared/lucian/Toaster';

export function TicketInfo({ ticket, now, actorId }: { ticket: Ticket; now: number; actorId: string }) {
  const reporter = personById(ticket.reporterId);
  const openFor = (ticket.doneAt ? Date.parse(ticket.doneAt) : now) - Date.parse(ticket.createdAt);
  return (
    <section className="card" aria-labelledby="info-title">
      <div className="card-head">
        <h2 id="info-title">Thông tin</h2>
      </div>
      <dl className="props">
        <dt>Người làm</dt>
        <dd>
          <select
            className="select"
            value={ticket.assigneeId ?? ''}
            aria-label="Người làm"
            onChange={(e) => {
              assign(ticket.id, e.target.value || null, actorId);
              toast({ kind: 'ok', title: 'Đã cập nhật người làm' });
            }}
          >
            <option value="">Chưa ai nhận</option>
            {teamMembers().map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.id === actorId ? ' (tôi)' : ''}
              </option>
            ))}
          </select>
        </dd>
        <dt>Ưu tiên</dt>
        <dd>
          <select
            className="select"
            value={ticket.priority}
            aria-label="Mức ưu tiên"
            onChange={(e) => {
              setPriority(ticket.id, e.target.value as Priority, actorId);
              toast({ kind: 'ok', title: 'Đã đổi mức ưu tiên' });
            }}
          >
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p].title}
              </option>
            ))}
          </select>
        </dd>
        <dt>Người báo</dt>
        <dd>
          <span className="person">
            <Avatar person={reporter} size={28} />
            <span>
              {reporter?.name}
              <small>{reporter?.title}</small>
            </span>
          </span>
        </dd>
        <dt>Tạo lúc</dt>
        <dd>{formatDateTime(ticket.createdAt)}</dd>
        {ticket.startedAt && (
          <>
            <dt>Bắt đầu làm</dt>
            <dd>{formatDateTime(ticket.startedAt)}</dd>
          </>
        )}
        {ticket.doneAt && (
          <>
            <dt>Xong lúc</dt>
            <dd>{formatDateTime(ticket.doneAt)}</dd>
          </>
        )}
        <dt>{ticket.doneAt ? 'Tổng thời gian' : 'Đã mở'}</dt>
        <dd>{formatDuration(openFor)}</dd>
      </dl>
    </section>
  );
}
