// Primary moves on a ticket: take it, start, finish, reopen. Anyone in the team may use them.
import { assign, changeStatus } from '@/data/ticketActions';
import { personById } from '@/data/people';
import type { Ticket, TicketStatus } from '@/domain/ticket';
import { STATUS_LABEL, nextStatuses } from '@/domain/ticket';
import { toast } from '@/shared/lucian/Toaster';
import { celebrate } from '@/shared/motion/Celebration';
import { LottieAnimation } from '@/shared/motion/LottieAnimation';
import { Icon } from '@/shared/ui/Icon';

function actionLabel(from: TicketStatus, to: TicketStatus): string {
  if (to === 'in_progress') return from === 'done' ? 'Mở lại' : 'Bắt đầu làm';
  if (to === 'done') return 'Đánh dấu xong';
  return 'Trả về Mới';
}

export function TicketActions({ ticket, actorId }: { ticket: Ticket; actorId: string }) {
  const owner = personById(ticket.assigneeId);
  const isMine = ticket.assigneeId === actorId;

  function move(to: TicketStatus) {
    changeStatus(ticket.id, to, actorId);
    const tookIt = to === 'in_progress' && !ticket.assigneeId;
    toast({ kind: 'ok', title: `${ticket.code}: ${STATUS_LABEL[to]}`, detail: tookIt ? 'Bạn đã được gán làm người làm' : undefined });
    if (to === 'done') celebrate('confetti', `${ticket.code} xong rồi!`);
  }

  return (
    <section className="card" aria-labelledby="act-title">
      <div className="card-head">
        <h2 id="act-title">Xử lý</h2>
        {ticket.status === 'in_progress' && owner && (
          <span className="working">
            <LottieAnimation name="floorsLoader" loop deferUntilIdle stillFrame={60} className="working-art" />
            {isMine ? 'Bạn đang làm' : `${owner.name.split(' ').pop()} đang làm`}
          </span>
        )}
      </div>
      <div className="actions">
        {!isMine && ticket.status !== 'done' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              assign(ticket.id, actorId, actorId);
              toast({ kind: 'ok', title: `Bạn đã nhận ${ticket.code}` });
              celebrate('check', 'Bạn đã nhận việc');
            }}
          >
            <Icon name="userPlus" size={18} /> {owner ? `Nhận thay ${owner.name.split(' ').pop()}` : 'Nhận việc'}
          </button>
        )}
        {nextStatuses(ticket.status).map((to) => (
          <button key={to} type="button" className={`btn ${to === 'done' ? 'btn-success' : 'btn-secondary'}`} onClick={() => move(to)}>
            {to === 'done' && <Icon name="check" size={18} />}
            {actionLabel(ticket.status, to)}
          </button>
        ))}
        <small className="muted">Ghi cách đã sửa ở ô Trao đổi trước khi đánh dấu xong để người báo kiểm tra lại.</small>
      </div>
    </section>
  );
}
