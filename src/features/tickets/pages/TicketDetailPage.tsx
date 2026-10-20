import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCurrentUser } from '@/data/session';
import { useStore } from '@/data/store';
import { TicketActions } from '@/features/tickets/components/detail/TicketActions';
import { TicketInfo } from '@/features/tickets/components/detail/TicketInfo';
import { TicketSummary } from '@/features/tickets/components/detail/TicketSummary';
import { TicketTimeline } from '@/features/tickets/components/detail/TicketTimeline';
import { useNow } from '@/shared/hooks/useNow';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Icon } from '@/shared/ui/Icon';
import '../ticket-detail.css';

export function TicketDetailPage() {
  const { id } = useParams();
  const me = useCurrentUser();
  const ticket = useStore((s) => s.tickets.find((t) => t.id === id));
  const allEvents = useStore((s) => s.events);
  const now = useNow();
  const events = useMemo(() => allEvents.filter((e) => e.ticketId === id).sort((a, b) => a.at.localeCompare(b.at)), [allEvents, id]);

  if (!ticket) {
    return (
      <main className="page">
        <div className="card">
          <EmptyState mascot="think" title="Không tìm thấy ticket này" text="Ticket có thể đã bị xóa khỏi dữ liệu demo, hoặc đường dẫn bị sai.">
            <Link to="/ticket" className="btn btn-secondary btn-sm">
              Về danh sách
            </Link>
          </EmptyState>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <Link to="/ticket" className="crumb">
        <Icon name="arrowLeft" size={16} /> Danh sách ticket
      </Link>

      <div className="grid-2">
        <div className="stack">
          <TicketSummary ticket={ticket} />
          <TicketTimeline ticket={ticket} events={events} now={now} actorId={me.id} />
        </div>

        <aside className="stack">
          <TicketActions ticket={ticket} actorId={me.id} />
          <TicketInfo ticket={ticket} now={now} actorId={me.id} />
        </aside>
      </div>
    </main>
  );
}
