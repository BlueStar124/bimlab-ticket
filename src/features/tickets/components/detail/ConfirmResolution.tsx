// Requester confirms the fix with a CSAT rating, or reopens the ticket.
import { useState } from 'react';
import { changeStatus, rateAndClose } from '@/data/ticketActions';
import type { Ticket } from '@/domain/ticket';
import { StarRating } from '@/shared/lucian/StarRating';
import { toast } from '@/shared/lucian/Toaster';
import { Icon } from '@/shared/ui/Icon';

export function ConfirmResolution({ ticket, actorId }: { ticket: Ticket; actorId: string }) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  return (
    <section className="callout" aria-labelledby="confirm-title">
      <h3 id="confirm-title">Phòng CNTT đã xử lý xong. Vấn đề của bạn đã được giải quyết chưa?</h3>
      <p className="muted">Xác nhận để đóng yêu cầu, hoặc mở lại nếu lỗi vẫn còn.</p>
      <StarRating question="Bạn hài lòng với hỗ trợ lần này thế nào?" onChange={setScore} />
      <div className="field">
        <label htmlFor="rate-note">Góp ý thêm (không bắt buộc)</label>
        <input id="rate-note" className="input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Điều gì làm bạn hài lòng hoặc cần cải thiện?" />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-success"
          disabled={!score}
          onClick={() => {
            rateAndClose(ticket.id, score, comment.trim(), actorId);
            toast({ kind: 'ok', title: 'Cảm ơn bạn đã đánh giá!', detail: `${ticket.code} đã được đóng` });
          }}
        >
          <Icon name="check" size={18} /> Đã ổn, đóng yêu cầu
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            changeStatus(ticket.id, 'in_progress', actorId, 'Lỗi vẫn còn');
            toast({ kind: 'info', title: 'Đã mở lại yêu cầu', detail: 'Phòng CNTT sẽ tiếp tục xử lý' });
          }}
        >
          <Icon name="refresh" size={18} /> Chưa được, mở lại
        </button>
      </div>
    </section>
  );
}
