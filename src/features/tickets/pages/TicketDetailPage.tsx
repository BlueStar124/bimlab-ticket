import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCurrentUser } from '@/data/session';
import { useStore } from '@/data/store';
import { AgentActions } from '@/features/tickets/components/detail/AgentActions';
import { ConfirmResolution } from '@/features/tickets/components/detail/ConfirmResolution';
import { TicketInfo } from '@/features/tickets/components/detail/TicketInfo';
import { TicketSummary } from '@/features/tickets/components/detail/TicketSummary';
import { TicketTimeline } from '@/features/tickets/components/detail/TicketTimeline';
import { useNow } from '@/shared/hooks/useNow';
import { Icon } from '@/shared/ui/Icon';
import '../ticket-detail.css';

export function TicketDetailPage() {
  const { id } = useParams();
  const me = useCurrentUser();
  const ticket = useStore((s) => s.tickets.find((t) => t.id === id));
  const allEvents = useStore((s) => s.events);
  const now = useNow();
  const isAgent = me.role === 'agent';
  // Requesters never see internal notes.
  const events = useMemo(
    () => allEvents.filter((e) => e.ticketId === id && (isAgent || !e.internal)).sort((a, b) => a.at.localeCompare(b.at)),
    [allEvents, id, isAgent],
  );

  if (!ticket || (!isAgent && ticket.requesterId !== me.id)) {
    return (
      <main className="page">
        <div className="card empty">
          <Icon name="lock" size={40} />
          <p>Không tìm thấy yêu cầu hoặc bạn không có quyền xem.</p>
          <Link to="/" className="btn btn-secondary">
            Về trang chủ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <Link to={isAgent ? '/it/hang-doi' : '/yeu-cau'} className="crumb">
        <Icon name="arrowLeft" size={16} /> {isAgent ? 'Hàng đợi' : 'Yêu cầu của tôi'}
      </Link>

      <div className="grid-2">
        <div className="stack">
          <TicketSummary ticket={ticket} />
          {!isAgent && ticket.status === 'resolved' && <ConfirmResolution ticket={ticket} actorId={me.id} />}
          {ticket.rating && (
            <div className="card rating-line">
              <Icon name="star" size={22} />
              <span>
                <b style={{ color: 'var(--ux-ink)' }}>Người gửi đánh giá {ticket.rating}/5</b>
                {ticket.ratingComment && <span className="muted"> · “{ticket.ratingComment}”</span>}
              </span>
            </div>
          )}
          <TicketTimeline ticket={ticket} events={events} now={now} actorId={me.id} isAgent={isAgent} />
        </div>

        <aside className="stack">
          <TicketInfo ticket={ticket} now={now} actorId={me.id} isAgent={isAgent} />
          {isAgent && <AgentActions ticket={ticket} actorId={me.id} />}
        </aside>
      </div>
    </main>
  );
}
