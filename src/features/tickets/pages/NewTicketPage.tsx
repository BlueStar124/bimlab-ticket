import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@/shared/ui/Icon';
import { FileDrop } from '@/shared/lucian/FileDrop';
import { StepWizard } from '@/shared/lucian/StepWizard';
import { toast } from '@/shared/lucian/Toaster';
import { PRIORITY_COLOR } from '@/features/tickets/components/TicketBits';
import { CATEGORIES, categoryById } from '@/domain/categories';
import { KNOWLEDGE } from '@/domain/knowledge';
import type { Attachment, Impact, Ticket, Urgency } from '@/domain/ticket';
import { IMPACT_LABEL, PRIORITY_LABEL, SLA_TARGETS, URGENCY_LABEL, formatDuration, priorityFor } from '@/domain/ticket';
import { useCurrentUser } from '@/data/session';
import { createTicket } from '@/data/ticketActions';
import '../new-ticket.css';

const MIN_TITLE = 5;
const MIN_DESCRIPTION = 10;

export function NewTicketPage() {
  const me = useCurrentUser();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preset = CATEGORIES.some((c) => c.id === params.get('nhom')) ? params.get('nhom')! : '';

  const [categoryId, setCategoryId] = useState(preset);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [asset, setAsset] = useState('');
  const [location, setLocation] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [impact, setImpact] = useState<Impact>('individual');
  const [urgency, setUrgency] = useState<Urgency>('medium');
  const [created, setCreated] = useState<Ticket | null>(null);

  const category = categoryId ? categoryById(categoryId) : null;
  const priority = priorityFor(impact, urgency);
  const sla = SLA_TARGETS[priority];
  const article = KNOWLEDGE.find((k) => k.categoryId === categoryId);

  function submit() {
    const ticket = createTicket({ title: title.trim(), description: description.trim(), categoryId, impact, urgency, asset: asset.trim(), location: location.trim(), attachments }, me.id);
    setCreated(ticket);
    toast({ kind: 'ok', title: `Đã gửi yêu cầu ${ticket.code}`, detail: 'Phòng CNTT đã nhận được yêu cầu của bạn', action: { label: 'Xem', onClick: () => navigate(`/yeu-cau/${ticket.id}`) } });
  }

  return (
    <main className="page page-narrow">
      <Link to="/" className="crumb">
        <Icon name="arrowLeft" size={16} /> Trang chủ
      </Link>
      <div className="page-head">
        <div>
          <h1>Gửi yêu cầu hỗ trợ CNTT</h1>
          <p>Mất khoảng 1 phút. Mô tả càng rõ, CNTT xử lý càng nhanh.</p>
        </div>
      </div>

      <StepWizard
        ariaLabel="Các bước gửi yêu cầu"
        submitLabel="Gửi yêu cầu"
        doneLabel="Hoàn tất"
        onSubmit={submit}
        steps={[
          {
            label: 'Nhóm lỗi',
            title: 'Vấn đề thuộc nhóm nào?',
            hint: 'Chọn đúng nhóm để yêu cầu đến thẳng người phụ trách',
            valid: Boolean(categoryId),
            content: (
              <div className="pick-grid" role="group" aria-label="Nhóm vấn đề">
                {CATEGORIES.map((c) => (
                  <button key={c.id} type="button" className="cat" aria-pressed={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
                    <span className="cat-ic">
                      <Icon name={c.icon} />
                    </span>
                    <span>
                      <b>{c.name}</b>
                      <small>{c.hint}</small>
                    </span>
                  </button>
                ))}
              </div>
            ),
          },
          {
            label: 'Chi tiết',
            title: 'Mô tả vấn đề',
            hint: category ? `Nhóm: ${category.name}` : 'Cho CNTT biết chuyện gì đang xảy ra',
            valid: title.trim().length >= MIN_TITLE && description.trim().length >= MIN_DESCRIPTION,
            content: (
              <>
                {article && (
                  <div className="kb-hint">
                    <Icon name="book" size={18} />
                    <span>
                      Có thể bạn tự xử lý được: {article.question}{' '}
                      <Link to={`/huong-dan?q=${encodeURIComponent(article.question.slice(0, 20))}`}>Xem hướng dẫn</Link>
                    </span>
                  </div>
                )}
                <div className="field">
                  <label htmlFor="t-title">Tiêu đề *</label>
                  <input id="t-title" className="input" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Revit báo lỗi khi mở model trung tâm" />
                  {category && (
                    <div className="suggest" aria-label="Gợi ý tiêu đề">
                      {category.examples.map((ex) => (
                        <button key={ex} type="button" onClick={() => setTitle(ex)}>
                          {ex}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="field">
                  <label htmlFor="t-desc">Mô tả chi tiết *</label>
                  <textarea
                    id="t-desc"
                    className="textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={'Lỗi xảy ra khi nào? Thông báo lỗi ghi gì?\nBạn đã thử cách nào chưa?'}
                  />
                  <small>Tối thiểu {MIN_DESCRIPTION} ký tự · đừng gửi mật khẩu qua yêu cầu</small>
                </div>
                <div className="row-2">
                  <div className="field">
                    <label htmlFor="t-asset">Mã thiết bị</label>
                    <input id="t-asset" className="input" value={asset} onChange={(e) => setAsset(e.target.value)} placeholder="Dán nhãn trên máy, ví dụ WS-BIM-014" />
                  </div>
                  <div className="field">
                    <label htmlFor="t-loc">Vị trí</label>
                    <input id="t-loc" className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Tầng 3 · phòng Thiết kế / công trường" />
                  </div>
                </div>
                <div className="field">
                  <span className="label">Ảnh chụp lỗi, file log</span>
                  <FileDrop onChange={setAttachments} />
                </div>
              </>
            ),
          },
          {
            label: 'Mức độ',
            title: 'Mức độ ảnh hưởng',
            hint: 'CNTT dùng thông tin này để xếp thứ tự ưu tiên',
            valid: true,
            content: (
              <>
                <div className="field">
                  <span className="label">Ai đang bị ảnh hưởng?</span>
                  <div className="choice-grid" role="group" aria-label="Phạm vi ảnh hưởng">
                    {(Object.keys(IMPACT_LABEL) as Impact[]).map((k) => (
                      <button key={k} type="button" className="choice" aria-pressed={impact === k} onClick={() => setImpact(k)}>
                        <b>{IMPACT_LABEL[k].title}</b>
                        <small>{IMPACT_LABEL[k].hint}</small>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <span className="label">Công việc bị ảnh hưởng thế nào?</span>
                  <div className="choice-grid" role="group" aria-label="Độ khẩn cấp">
                    {(Object.keys(URGENCY_LABEL) as Urgency[]).map((k) => (
                      <button key={k} type="button" className="choice" aria-pressed={urgency === k} onClick={() => setUrgency(k)}>
                        <b>{URGENCY_LABEL[k].title}</b>
                        <small>{URGENCY_LABEL[k].hint}</small>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="prio-preview" style={{ ['--c' as string]: PRIORITY_COLOR[priority] }} aria-live="polite">
                  <b>{priority}</b>
                  <span>
                    <strong style={{ color: 'var(--ux-ink)' }}>Ưu tiên {PRIORITY_LABEL[priority].toLowerCase()}</strong>
                    <br />
                    <span className="muted">
                      CNTT phản hồi trong {formatDuration(sla.responseMinutes * 60_000)} · xử lý xong trong {formatDuration(sla.resolveHours * 3_600_000)}
                    </span>
                  </span>
                </div>
              </>
            ),
          },
          {
            label: 'Xác nhận',
            title: 'Kiểm tra lại trước khi gửi',
            hint: 'Bạn vẫn có thể bổ sung thông tin sau khi gửi',
            valid: Boolean(categoryId) && title.trim().length >= MIN_TITLE && description.trim().length >= MIN_DESCRIPTION,
            content: (
              <dl className="review">
                <dt>Người gửi</dt>
                <dd>
                  {me.name} · {me.department}
                </dd>
                <dt>Nhóm</dt>
                <dd>{category?.name ?? '—'}</dd>
                <dt>Tiêu đề</dt>
                <dd>{title || '—'}</dd>
                <dt>Mô tả</dt>
                <dd style={{ whiteSpace: 'pre-wrap' }}>{description || '—'}</dd>
                <dt>Thiết bị · vị trí</dt>
                <dd>{[asset, location].filter(Boolean).join(' · ') || '—'}</dd>
                <dt>Đính kèm</dt>
                <dd>{attachments.length ? attachments.map((a) => a.name).join(', ') : 'Không có'}</dd>
                <dt>Ưu tiên</dt>
                <dd style={{ color: PRIORITY_COLOR[priority] }}>
                  {priority} · {PRIORITY_LABEL[priority]}
                </dd>
              </dl>
            ),
          },
        ]}
        done={
          created && (
            <>
              <h4>Đã gửi yêu cầu {created.code}</h4>
              <p>
                Phòng CNTT sẽ phản hồi trong {formatDuration(SLA_TARGETS[created.priority].responseMinutes * 60_000)}. Bạn sẽ nhận thông báo khi có cập nhật.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link to={`/yeu-cau/${created.id}`} className="btn btn-primary">
                  Theo dõi yêu cầu
                </Link>
                <Link to="/yeu-cau" className="btn btn-secondary">
                  Danh sách của tôi
                </Link>
              </div>
            </>
          )
        }
      />
    </main>
  );
}
