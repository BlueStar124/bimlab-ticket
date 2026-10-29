// Ticket header: code, kind, system, status, priority, description and attachments.
import { areaById } from '@/domain/areas';
import type { Ticket } from '@/domain/ticket';
import { ENVIRONMENT_LABEL } from '@/domain/ticket';
import { KindTag, PriorityTag, StatusBadge } from '@/features/tickets/components/TicketBits';
import { areaFigure } from '@/features/tickets/components/detail/areaFigure';
import { Icon } from '@/shared/ui/Icon';
import { LineFigure } from '@/shared/ui/LineFigure';

export function TicketSummary({ ticket }: { ticket: Ticket }) {
  const area = areaById(ticket.areaId);
  const art = areaFigure(ticket.areaId);
  return (
    <section className="card ticket-summary">
      <LineFigure figure={art.figure} label={art.label} className="ticket-figure" />
      <div className="ticket-meta">
        <span className="code">{ticket.code}</span>
        <KindTag kind={area.kind} />
        <span>
          {area.name}
          {ticket.environment ? ` · ${ENVIRONMENT_LABEL[ticket.environment]}` : ''}
        </span>
        <StatusBadge status={ticket.status} />
        <PriorityTag priority={ticket.priority} />
      </div>
      <h1 className="ticket-h1">{ticket.title}</h1>
      <p className="desc">{ticket.description}</p>
      {ticket.attachments.length > 0 && (
        <div className="files" aria-label="File đính kèm">
          {ticket.attachments.map((a) => (
            <a key={a.id ?? a.name} className="file" href={a.id ? `/api/tickets/${ticket.id}/attachments/${a.id}` : undefined}>
              <Icon name="paperclip" size={14} /> {a.name}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
