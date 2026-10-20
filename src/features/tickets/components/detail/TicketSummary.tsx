// Ticket header: code, category, status, priority, progress steps, description and attachments.
import { categoryById } from '@/domain/categories';
import type { Ticket, TicketStatus } from '@/domain/ticket';
import { PriorityTag, StatusBadge } from '@/features/tickets/components/TicketBits';
import { Icon } from '@/shared/ui/Icon';

const PROGRESS: Array<{ key: TicketStatus; label: string }> = [
  { key: 'new', label: 'Đã gửi' },
  { key: 'in_progress', label: 'Đang xử lý' },
  { key: 'resolved', label: 'Đã giải quyết' },
  { key: 'closed', label: 'Đã đóng' },
];

function progressIndex(status: TicketStatus) {
  return status === 'waiting' ? 1 : PROGRESS.findIndex((p) => p.key === status);
}

export function TicketSummary({ ticket }: { ticket: Ticket }) {
  const step = progressIndex(ticket.status);
  return (
    <section className="card">
      <div className="ticket-meta">
        <span>{ticket.code}</span>
        <span>·</span>
        <span>{categoryById(ticket.categoryId).name}</span>
        <StatusBadge status={ticket.status} />
        <PriorityTag priority={ticket.priority} />
      </div>
      <h1 className="ticket-h1">{ticket.title}</h1>
      <ol className="progress" aria-label="Tiến độ">
        {PROGRESS.map((p, i) => (
          <li key={p.key} className={i < step ? 'done' : i === step ? 'done cur' : undefined} aria-current={i === step ? 'step' : undefined}>
            {i === 1 && ticket.status === 'waiting' ? 'Chờ phản hồi' : p.label}
          </li>
        ))}
      </ol>
      <p className="desc">{ticket.description}</p>
      {ticket.attachments.length > 0 && (
        <div className="files" aria-label="File đính kèm">
          {ticket.attachments.map((a) => (
            <span key={a.name} className="file">
              <Icon name="paperclip" size={14} /> {a.name}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
