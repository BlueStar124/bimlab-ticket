import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/data/session';
import { createTicketApi, uploadTicketAttachment } from '@/data/ticketApi';
import { refreshTicketFromBackend } from '@/data/store';
import type { TicketKind } from '@/domain/areas';
import { KIND_LABEL, areasOf } from '@/domain/areas';
import { teamMembers } from '@/data/people';
import type { Environment, Priority } from '@/domain/ticket';
import { ENVIRONMENT_LABEL, PRIORITY_LABEL, PRIORITY_ORDER } from '@/domain/ticket';
import { PRIORITY_COLOR } from '@/features/tickets/components/TicketBits';
import { FileDrop } from '@/shared/lucian/FileDrop';
import { toast } from '@/shared/lucian/Toaster';
import { celebrate } from '@/shared/motion/Celebration';
import { Icon } from '@/shared/ui/Icon';
import { LineFigure } from '@/shared/ui/LineFigure';
import '../new-ticket.css';

const MIN_TITLE = 5;
const MIN_DESCRIPTION = 10;

const BUG_TEMPLATE = 'Các bước tái hiện:\n1. \n2. \n\nKết quả mong đợi:\n\nKết quả thực tế:\n';

const ENVIRONMENTS = Object.keys(ENVIRONMENT_LABEL) as Environment[];

export function NewTicketPage() {
  const me = useCurrentUser();
  const navigate = useNavigate();

  const [kind, setKind] = useState<TicketKind>('bug');
  const [areaId, setAreaId] = useState('');
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [tried, setTried] = useState(false);

  const errors = {
    area: !areaId,
    title: title.trim().length < MIN_TITLE,
    description: description.trim().length < MIN_DESCRIPTION,
  };
  const valid = !errors.area && !errors.title && !errors.description;

  function chooseKind(next: TicketKind) {
    setKind(next);
    setAreaId('');
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!valid) return;
    try {
      const ticket = await createTicketApi(
        { title: title.trim(), description: description.trim(), areaId, environment, priority, assigneeId: assigneeId || null },
      );
      const uploadResults = await Promise.allSettled(files.map((file) => uploadTicketAttachment(ticket.id, file)));
      await refreshTicketFromBackend(ticket.id);
      const failedUploads = uploadResults.filter((result) => result.status === 'rejected').length;
      toast({ kind: failedUploads ? 'err' : 'ok', title: failedUploads ? `Đã tạo ${ticket.code}, nhưng tải lên ${failedUploads} tệp thất bại` : `Đã tạo ${ticket.code}`, detail: failedUploads ? 'Bạn vẫn có thể mở ticket và thử lại sau' : (assigneeId ? undefined : 'Cả team đã nhận được thông báo') });
      celebrate('check', `Đã tạo ${ticket.code}`);
      navigate(`/ticket/${ticket.id}`);
    } catch {
      // The shared API error toast explains why creation failed.
    }
  }

  return (
    <main className="page page-narrow">
      <Link to="/ticket" className="crumb">
        <Icon name="arrowLeft" size={16} /> Danh sách ticket
      </Link>
      <div className="page-head">
        <div>
          <h1>Báo lỗi</h1>
          <p>Ghi đủ để người nhận làm được ngay mà không phải hỏi lại.</p>
        </div>
        <LineFigure
          figure={kind === 'bug' ? 'stack' : 'cabinet'}
          label={kind === 'bug' ? 'Các khung call stack xếp chồng' : 'Tủ rack máy chủ'}
          intensity={0.6}
          className="page-figure"
        />
      </div>

      <form className="card card-lg new-ticket" onSubmit={submit} noValidate>
        <div className="field">
          <span className="label">Loại</span>
          <div className="choice-grid cols-2" role="group" aria-label="Loại ticket">
            {(Object.keys(KIND_LABEL) as TicketKind[]).map((k) => (
              <button key={k} type="button" className="choice" aria-pressed={kind === k} onClick={() => chooseKind(k)}>
                <b>
                  <Icon name={k === 'bug' ? 'bug' : 'server'} size={16} /> {KIND_LABEL[k].title}
                </b>
                <small>{KIND_LABEL[k].hint}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="row-2">
          <div className="field">
            <label htmlFor="t-area">{kind === 'bug' ? 'Hệ thống *' : 'Hạng mục *'}</label>
            <select id="t-area" className="select" value={areaId} onChange={(e) => setAreaId(e.target.value)} aria-invalid={tried && errors.area}>
              <option value="">Chọn…</option>
              {areasOf(kind).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            {tried && errors.area && <small className="error">Chọn {kind === 'bug' ? 'hệ thống' : 'hạng mục'} gặp lỗi</small>}
          </div>
          <div className="field">
            <label htmlFor="t-env">Môi trường</label>
            <select id="t-env" className="select" value={environment ?? ''} onChange={(e) => setEnvironment((e.target.value || null) as Environment | null)}>
              <option value="">Không rõ / không áp dụng</option>
              {ENVIRONMENTS.map((env) => (
                <option key={env} value={env}>
                  {ENVIRONMENT_LABEL[env]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="t-title">Tiêu đề *</label>
          <input
            id="t-title"
            className="input"
            value={title}
            maxLength={140}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={tried && errors.title}
            placeholder={kind === 'bug' ? 'Ví dụ: HRM: lọc theo phòng ban trả về danh sách rỗng' : 'Ví dụ: Server test sắp đầy ổ đĩa'}
          />
          {tried && errors.title && <small className="error">Tối thiểu {MIN_TITLE} ký tự</small>}
        </div>

        <div className="field">
          <div className="label-row">
            <label htmlFor="t-desc">Mô tả *</label>
            {kind === 'bug' && !description.trim() && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDescription(BUG_TEMPLATE)}>
                Dùng mẫu báo lỗi
              </button>
            )}
          </div>
          <textarea
            id="t-desc"
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={tried && errors.description}
            placeholder={kind === 'bug' ? 'Các bước tái hiện, kết quả mong đợi, kết quả thực tế, log lỗi…' : 'Hiện tượng, từ khi nào, đã thử gì…'}
          />
          <small className={tried && errors.description ? 'error' : undefined}>Tối thiểu {MIN_DESCRIPTION} ký tự · không dán mật khẩu, token hay secret</small>
        </div>

        <div className="field">
          <span className="label">Mức ưu tiên</span>
          <div className="choice-grid" role="group" aria-label="Mức ưu tiên">
            {PRIORITY_ORDER.map((p) => (
              <button key={p} type="button" className="choice" aria-pressed={priority === p} style={{ ['--c' as string]: PRIORITY_COLOR[p] }} onClick={() => setPriority(p)}>
                <b className="choice-prio">{PRIORITY_LABEL[p].title}</b>
                <small>{PRIORITY_LABEL[p].hint}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="t-assignee">Giao cho</label>
          <select id="t-assignee" className="select" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Chưa giao, để ai đó tự nhận</option>
            {teamMembers().map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.id === me.id ? ' (tôi)' : ''} · {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <span className="label">Ảnh chụp màn hình, file log</span>
          <FileDrop onChange={setFiles} />
        </div>

        <div className="form-actions">
          <Link to="/ticket" className="btn btn-secondary">
            Hủy
          </Link>
          <button type="submit" className="btn btn-primary">
            <Icon name="send" size={18} /> Tạo ticket
          </button>
        </div>
      </form>
    </main>
  );
}
