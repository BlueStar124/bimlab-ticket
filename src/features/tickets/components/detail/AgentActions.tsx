// IT-side actions on a ticket: pick it up and move it through the workflow.
import { assign, changeStatus } from '@/data/ticketActions';
import type { Ticket, TicketStatus } from '@/domain/ticket';
import { STATUS_LABEL, allowedTransitions } from '@/domain/ticket';
import { toast } from '@/shared/lucian/Toaster';
import { Icon } from '@/shared/ui/Icon';

const AGENT_ACTION: Record<TicketStatus, string> = {
  new: '',
  in_progress: 'Bắt đầu xử lý',
  waiting: 'Chờ người dùng phản hồi',
  resolved: 'Đánh dấu đã giải quyết',
  closed: 'Đóng yêu cầu',
};

export function AgentActions({ ticket, actorId }: { ticket: Ticket; actorId: string }) {
  const next = allowedTransitions(ticket.status, 'agent');
  if (!next.length) return null;
  return (
    <section className="card" aria-labelledby="act-title">
      <div className="card-head">
        <h2 id="act-title">Xử lý</h2>
      </div>
      <div className="actions">
        {!ticket.assigneeId && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              assign(ticket.id, actorId, actorId);
              toast({ kind: 'ok', title: `Bạn đã nhận ${ticket.code}` });
            }}
          >
            <Icon name="userPlus" size={18} /> Nhận xử lý
          </button>
        )}
        {next.map((to) => (
          <button
            key={to}
            type="button"
            className={`btn ${to === 'resolved' ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => {
              changeStatus(ticket.id, to, actorId);
              toast({ kind: 'ok', title: `${ticket.code}: ${STATUS_LABEL[to]}`, detail: to === 'waiting' ? 'SLA tạm dừng cho đến khi người dùng phản hồi' : undefined });
            }}
          >
            {ticket.status === 'resolved' && to === 'in_progress' ? 'Mở lại' : AGENT_ACTION[to]}
          </button>
        ))}
        <small className="muted">Mẹo: viết hướng dẫn cho người dùng ở ô Trao đổi trước khi đánh dấu đã giải quyết.</small>
      </div>
    </section>
  );
}
