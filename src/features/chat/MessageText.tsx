// Message body with @mentions highlighted and ticket codes linked to their ticket.
import { Link } from 'react-router-dom';
import { segmentMessage } from '@/domain/chat';
import { teamMembers } from '@/data/people';

export function MessageText({ text, meId, ticketIdByCode }: { text: string; meId: string; ticketIdByCode: Map<string, string> }) {
  return (
    <>
      {segmentMessage(text, teamMembers()).map((s, i) => {
        if (s.kind === 'mention') {
          return (
            <span key={i} className={`chat-at${s.personId === meId ? ' is-me' : ''}`}>
              {s.text}
            </span>
          );
        }
        if (s.kind === 'ticket') {
          const id = ticketIdByCode.get(s.code);
          return id ? (
            <Link key={i} to={`/ticket/${id}`} className="chat-ticket">
              {s.text}
            </Link>
          ) : (
            <span key={i}>{s.text}</span>
          );
        }
        return <span key={i}>{s.text}</span>;
      })}
    </>
  );
}
