import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/data/session';
import { useStore } from '@/data/store';
import { changeStatus } from '@/data/ticketActions';
import { areaById } from '@/domain/areas';
import { personById } from '@/data/people';
import type { Ticket, TicketStatus } from '@/domain/ticket';
import { PRIORITY_LABEL, STATUS_LABEL, STATUS_ORDER, canTransition, compareForQueue, formatRelativeShort } from '@/domain/ticket';
import { Avatar, PRIORITY_COLOR, STATUS_COLOR } from '@/features/tickets/components/TicketBits';
import { useNow } from '@/shared/hooks/useNow';
import { KanbanBoard, type KanbanColumn } from '@/shared/lucian/KanbanBoard';
import { toast } from '@/shared/lucian/Toaster';
import { celebrate } from '@/shared/motion/Celebration';
import { LineFigure } from '@/shared/ui/LineFigure';

/** Finished tickets stay on the board this long, then live only in the list. */
const DONE_VISIBLE_MS = 7 * 24 * 3_600_000;

const COLUMNS: KanbanColumn<TicketStatus>[] = STATUS_ORDER.map((key) => ({ key, label: STATUS_LABEL[key], color: STATUS_COLOR[key], done: key === 'done' }));

type Card = Ticket & { column: TicketStatus };

export function BoardPage() {
  const me = useCurrentUser();
  const navigate = useNavigate();
  const tickets = useStore((s) => s.tickets);
  const now = useNow(60_000);

  const cards: Card[] = tickets
    .filter((t) => !t.doneAt || now - Date.parse(t.doneAt) < DONE_VISIBLE_MS)
    .map((t) => ({ ...t, column: t.status }))
    .sort(compareForQueue);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>Kanban</h1>
          <p>Kéo thẻ sang cột khác để đổi trạng thái · bàn phím: Tab đến thẻ, ← → để chuyển cột, Enter để mở. Cột Xong chỉ giữ 7 ngày gần nhất.</p>
        </div>
        <LineFigure figure="slow" label="Thùng hàng chạy trên băng chuyền qua cổng" className="page-figure" />
      </div>
      <KanbanBoard<TicketStatus, Card>
        ariaLabel="Bảng ticket theo trạng thái"
        columns={COLUMNS}
        cards={cards}
        canDrop={(card, to) => canTransition(card.status, to)}
        onOpen={(card) => navigate(`/ticket/${card.id}`)}
        onMove={(card, to) => {
          changeStatus(card.id, to, me.id);
          const tookIt = to === 'in_progress' && !card.assigneeId;
          toast({ kind: 'ok', title: `${card.code} → ${STATUS_LABEL[to]}`, detail: tookIt ? 'Bạn đã được gán làm người làm' : undefined });
          if (to === 'done') celebrate('confetti', `${card.code} xong rồi!`);
        }}
        renderCard={(t) => (
          <>
            <small>
              {t.code} · {areaById(t.areaId).name}
            </small>
            <b>{t.title}</b>
            <span style={{ ['--c' as string]: PRIORITY_COLOR[t.priority] }}>{PRIORITY_LABEL[t.priority].title}</span>
            <footer>
              <span>{formatRelativeShort(t.updatedAt, now)}</span>
              <Avatar person={personById(t.assigneeId)} size={24} />
            </footer>
          </>
        )}
      />
    </main>
  );
}
