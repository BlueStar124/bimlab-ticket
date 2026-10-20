// Comment box for discussion between the reporter, the assignee and the rest of the team.
import { useState } from 'react';
import { addComment } from '@/data/ticketActions';
import type { Ticket } from '@/domain/ticket';
import { toast } from '@/shared/lucian/Toaster';
import { Icon } from '@/shared/ui/Icon';

export function Composer({ ticket, actorId }: { ticket: Ticket; actorId: string }) {
  const [text, setText] = useState('');

  function send() {
    const body = text.trim();
    if (!body) return;
    addComment(ticket.id, body, actorId);
    setText('');
    toast({ kind: 'ok', title: 'Đã gửi bình luận' });
  }

  return (
    <div className="composer">
      <label htmlFor="reply" className="sr-only">
        Bình luận
      </label>
      <textarea
        id="reply"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send();
        }}
        placeholder={ticket.status === 'done' ? 'Lỗi vẫn còn? Ghi lại rồi bấm Mở lại…' : 'Cập nhật tiến độ, nguyên nhân, cách sửa…'}
      />
      <div className="composer-bar">
        <small className="muted">Ctrl + Enter để gửi</small>
        <button type="button" className="btn btn-primary btn-sm" disabled={!text.trim()} onClick={send}>
          <Icon name="send" size={16} /> Gửi
        </button>
      </div>
    </div>
  );
}
