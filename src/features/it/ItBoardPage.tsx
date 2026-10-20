import { useNavigate } from 'react-router-dom';
import { KanbanBoard, type KanbanColumn } from '@/shared/lucian/KanbanBoard';
import { toast } from '@/shared/lucian/Toaster';
import { Avatar, PRIORITY_COLOR, STATUS_COLOR } from '@/features/tickets/components/TicketBits';
import { useNow } from '@/shared/hooks/useNow';
import { categoryById } from '@/domain/categories';
import { personById } from '@/domain/people';
import type { Ticket, TicketStatus } from '@/domain/ticket';
import { STATUS_LABEL, canTransition, compareForQueue, formatDuration, slaState } from '@/domain/ticket';
import { useCurrentUser } from '@/data/session';
import { changeStatus } from '@/data/ticketActions';
import { useStore } from '@/data/store';

type BoardStatus = Exclude<TicketStatus, 'closed'>;

const COLUMNS: KanbanColumn<BoardStatus>[] = [
  { key: 'new', label: STATUS_LABEL.new, color: STATUS_COLOR.new },
  { key: 'in_progress', label: STATUS_LABEL.in_progress, color: STATUS_COLOR.in_progress },
  { key: 'waiting', label: STATUS_LABEL.waiting, color: STATUS_COLOR.waiting },
  { key: 'resolved', label: STATUS_LABEL.resolved, color: STATUS_COLOR.resolved, done: true },
];

type Card = Ticket & { column: BoardStatus };

export function ItBoardPage() {
  const me = useCurrentUser();
  const navigate = useNavigate();
  const tickets = useStore((s) => s.tickets);
  const now = useNow();

  const cards: Card[] = tickets
    .filter((t): t is Card => t.status !== 'closed')
    .map((t) => ({ ...t, column: t.status as BoardStatus }))
    .sort((a, b) => compareForQueue(a, b, now));

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>Bảng Kanban</h1>
          <p>Kéo thẻ sang cột khác để đổi trạng thái · bàn phím: Tab đến thẻ, ← → để chuyển cột, Enter để mở.</p>
        </div>
      </div>
      <KanbanBoard<BoardStatus, Card>
        ariaLabel="Bảng yêu cầu theo trạng thái"
        columns={COLUMNS}
        cards={cards}
        canDrop={(card, to) => canTransition(card.status, to, 'agent')}
        onOpen={(card) => navigate(`/yeu-cau/${card.id}`)}
        onMove={(card, to) => {
          changeStatus(card.id, to, me.id);
          toast({ kind: 'ok', title: `${card.code} → ${STATUS_LABEL[to]}`, detail: card.assigneeId ? undefined : 'Bạn được gán làm người xử lý' });
        }}
        renderCard={(t) => {
          const sla = slaState(t, now);
          return (
            <>
              <small>
                {t.code} · {categoryById(t.categoryId).name}
              </small>
              <b>{t.title}</b>
              <span style={{ ['--c' as string]: PRIORITY_COLOR[t.priority] }}>{t.priority}</span>
              <footer>
                <span style={{ color: !sla.done && sla.breached ? 'var(--ux-danger)' : undefined }}>
                  {sla.done ? 'Chờ xác nhận' : sla.paused ? 'SLA tạm dừng' : sla.breached ? `Quá hạn ${formatDuration(-sla.remainingMs)}` : `Còn ${formatDuration(sla.remainingMs)}`}
                </span>
                <Avatar person={personById(t.assigneeId)} size={24} />
              </footer>
            </>
          );
        }}
      />
    </main>
  );
}
