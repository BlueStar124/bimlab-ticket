// Reply box. IT can switch to an internal note that the requester never sees.
import { useState } from 'react';
import { addComment } from '@/data/ticketActions';
import type { Ticket } from '@/domain/ticket';
import { toast } from '@/shared/lucian/Toaster';
import { Icon } from '@/shared/ui/Icon';

export function Composer({ ticket, actorId, isAgent }: { ticket: Ticket; actorId: string; isAgent: boolean }) {
  const [text, setText] = useState('');
  const [internal, setInternal] = useState(false);

  function send() {
    const body = text.trim();
    if (!body) return;
    addComment(ticket.id, body, actorId, isAgent && internal);
    setText('');
    toast({
      kind: 'ok',
      title: internal && isAgent ? 'Đã lưu ghi chú nội bộ' : 'Đã gửi trả lời',
      detail: !isAgent && ticket.status === 'waiting' ? 'Yêu cầu đã chuyển lại cho Phòng CNTT' : undefined,
    });
  }

  return (
    <div className={`composer${isAgent && internal ? ' internal' : ''}`}>
      <label htmlFor="reply" className="sr-only">
        Nội dung trao đổi
      </label>
      <textarea
        id="reply"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send();
        }}
        placeholder={isAgent ? (internal ? 'Ghi chú chỉ Phòng CNTT nhìn thấy…' : 'Trả lời người dùng…') : ticket.status === 'waiting' ? 'CNTT đang chờ bạn bổ sung thông tin…' : 'Bổ sung thông tin cho Phòng CNTT…'}
      />
      <div className="composer-bar">
        {isAgent ? (
          <div className="seg" role="group" aria-label="Loại tin nhắn">
            <button type="button" aria-pressed={!internal} onClick={() => setInternal(false)}>
              Trả lời
            </button>
            <button type="button" aria-pressed={internal} onClick={() => setInternal(true)}>
              <Icon name="lock" size={12} /> Ghi chú nội bộ
            </button>
          </div>
        ) : (
          <small className="muted">Ctrl + Enter để gửi</small>
        )}
        <button type="button" className="btn btn-primary btn-sm" disabled={!text.trim()} onClick={send}>
          <Icon name="send" size={16} /> Gửi
        </button>
      </div>
    </div>
  );
}
