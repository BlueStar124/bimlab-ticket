// Ticket rows shared by the dashboard and the ticket list.
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { areaById } from '@/domain/areas';
import { personById, shortName } from '@/domain/people';
import type { Ticket } from '@/domain/ticket';
import { ENVIRONMENT_LABEL, PRIORITY_LABEL, STATUS_LABEL, formatDateTime, formatRelativeShort } from '@/domain/ticket';
import { Icon } from '@/shared/ui/Icon';
import { Avatar, PRIORITY_COLOR, STATUS_COLOR } from '@/features/tickets/components/TicketBits';
import './ticket-table.css';

function StatusText({ ticket }: { ticket: Ticket }) {
  return (
    <span className="status-text" style={{ ['--c' as string]: STATUS_COLOR[ticket.status] }}>
      <i aria-hidden="true" />
      {STATUS_LABEL[ticket.status]}
    </span>
  );
}

function PriorityPill({ ticket }: { ticket: Ticket }) {
  return (
    <span className="pill" style={{ ['--c' as string]: PRIORITY_COLOR[ticket.priority] }}>
      <i aria-hidden="true" />
      {PRIORITY_LABEL[ticket.priority].title}
    </span>
  );
}

function Assignee({ ticket }: { ticket: Ticket }) {
  const person = personById(ticket.assigneeId);
  if (!person) {
    return (
      <span className="assignee is-empty">
        <span className="assignee-empty" aria-hidden="true">
          <Icon name="userPlus" size={14} />
        </span>
        Chưa ai nhận
      </span>
    );
  }
  return (
    <span className="assignee">
      <Avatar person={person} size={26} />
      <span>{shortName(person)}</span>
    </span>
  );
}

interface TableProps {
  tickets: Ticket[];
  now: number;
  /** Shown instead of rows when the list is empty. */
  empty: ReactNode;
}

export function TicketTable({ tickets, now, empty }: TableProps) {
  return (
    <div className="ttable" role="table" aria-label="Danh sách ticket">
      <div className="ttable-head" role="row">
        <span role="columnheader">Ticket</span>
        <span role="columnheader">Ưu tiên</span>
        <span role="columnheader">Cập nhật</span>
        <span role="columnheader">Người làm</span>
      </div>
      {tickets.length === 0 && empty}
      {tickets.map((t) => {
        const reporter = personById(t.reporterId);
        return (
          <Link key={t.id} to={`/ticket/${t.id}`} className="ttable-row" role="row">
            <span className="ttable-main" role="cell">
              <b>{t.title}</b>
              <small>
                <StatusText ticket={t} />
                <span className="code">{t.code}</span>
                <span>
                  {areaById(t.areaId).name}
                  {t.environment ? ` · ${ENVIRONMENT_LABEL[t.environment]}` : ''}
                </span>
                {reporter && <span className="ttable-who">báo bởi {shortName(reporter)}</span>}
              </small>
            </span>
            <span role="cell">
              <PriorityPill ticket={t} />
            </span>
            <span role="cell" className="ttable-time" title={formatDateTime(t.updatedAt)}>
              {formatRelativeShort(t.updatedAt, now)}
            </span>
            <span role="cell">
              <Assignee ticket={t} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
