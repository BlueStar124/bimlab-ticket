// Ticket rows shared by the IT dashboard, the queue and "my tickets", plus a compact list for side panels.
import { Link } from 'react-router-dom';
import { categoryById } from '@/domain/categories';
import { personById } from '@/domain/people';
import type { Ticket } from '@/domain/ticket';
import { PRIORITY_LABEL, STATUS_LABEL, formatRelativeShort } from '@/domain/ticket';
import { Icon } from '@/shared/ui/Icon';
import { Avatar, PRIORITY_COLOR, STATUS_COLOR, SlaMeter } from '@/features/tickets/components/TicketBits';
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
      <b>{ticket.priority}</b>
      {PRIORITY_LABEL[ticket.priority]}
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
        Chưa nhận
      </span>
    );
  }
  return (
    <span className="assignee">
      <Avatar person={person} size={26} />
      <span>{person.name.split(' ').slice(-2).join(' ')}</span>
    </span>
  );
}

interface TableProps {
  tickets: Ticket[];
  now: number;
  showRequester: boolean;
  emptyText: string;
}

export function TicketTable({ tickets, now, showRequester, emptyText }: TableProps) {
  return (
    <div className="ttable" role="table" aria-label="Danh sách yêu cầu">
      <div className="ttable-head" role="row">
        <span role="columnheader">Yêu cầu</span>
        <span role="columnheader">Ưu tiên</span>
        <span role="columnheader">Hạn xử lý</span>
        <span role="columnheader">Người xử lý</span>
      </div>
      {tickets.length === 0 && (
        <div className="empty">
          <Icon name="inbox" size={36} />
          <p>{emptyText}</p>
        </div>
      )}
      {tickets.map((t) => (
        <Link key={t.id} to={`/yeu-cau/${t.id}`} className="ttable-row" role="row">
          <span className="ttable-main" role="cell">
            <b>{t.title}</b>
            <small>
              <StatusText ticket={t} />
              <span className="code">{t.code}</span>
              <span className="ttable-who">{showRequester ? (personById(t.requesterId)?.name ?? '') : categoryById(t.categoryId).name}</span>
            </small>
          </span>
          <span role="cell">
            <PriorityPill ticket={t} />
          </span>
          <span role="cell">
            <SlaMeter ticket={t} now={now} />
          </span>
          <span role="cell">
            <Assignee ticket={t} />
          </span>
        </Link>
      ))}
    </div>
  );
}

export function TicketMiniList({ tickets, now, emptyText }: { tickets: Ticket[]; now: number; emptyText: string }) {
  if (tickets.length === 0) return <p className="empty">{emptyText}</p>;
  return (
    <ul className="mini-list">
      {tickets.map((t) => {
        const cat = categoryById(t.categoryId);
        return (
          <li key={t.id}>
            <Link to={`/yeu-cau/${t.id}`} className="mini-row" title={t.code}>
              <span className="mini-ic" aria-hidden="true">
                <Icon name={cat.icon} size={18} />
              </span>
              <span className="mini-body">
                <b>{t.title}</b>
                <small>
                  <StatusText ticket={t} />
                  <span>{formatRelativeShort(t.updatedAt, now)}</span>
                </small>
              </span>
              <Icon name="chevronRight" size={16} className="mini-go" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
