import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@/shared/ui/Icon';
import { IncidentBoard } from '@/features/incidents/IncidentBoard';
import { FaqAccordion } from '@/shared/lucian/FaqAccordion';
import { TicketMiniList } from '@/features/tickets/components/TicketTable';
import { CATEGORIES } from '@/domain/categories';
import { KNOWLEDGE } from '@/domain/knowledge';
import { compareForRequester, formatDuration, isOpen } from '@/domain/ticket';
import { useCurrentUser } from '@/data/session';
import { useStore } from '@/data/store';
import './home.css';

const STEPS = [
  ['Gửi yêu cầu', 'Chọn nhóm lỗi, mô tả, đính kèm ảnh chụp màn hình'],
  ['CNTT tiếp nhận', 'Xếp ưu tiên theo mức ảnh hưởng, phản hồi từ 15 phút'],
  ['Xử lý & trao đổi', 'Theo dõi tiến độ, trả lời ngay trên yêu cầu'],
  ['Xác nhận & đánh giá', 'Bạn xác nhận đã xong và chấm điểm hài lòng'],
];

export function HomePage() {
  const me = useCurrentUser();
  const navigate = useNavigate();
  const tickets = useStore((s) => s.tickets);
  const [query, setQuery] = useState('');
  const now = Date.now();

  const stats = useMemo(() => {
    const resolved = tickets.filter((t) => t.resolvedAt);
    const avgMs = resolved.length ? resolved.reduce((s, t) => s + (Date.parse(t.resolvedAt!) - Date.parse(t.createdAt)), 0) / resolved.length : 0;
    const rated = tickets.filter((t) => t.rating);
    const csat = rated.length ? rated.reduce((s, t) => s + (t.rating ?? 0), 0) / rated.length : 0;
    return { open: tickets.filter((t) => isOpen(t.status)).length, avg: avgMs, csat };
  }, [tickets]);

  const mine = tickets.filter((t) => t.requesterId === me.id).sort(compareForRequester).slice(0, 4);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>Trung tâm hỗ trợ CNTT</h1>
          <p>Xin chào {me.name.split(' ').pop()}, gặp sự cố gì hãy gửi một yêu cầu — Phòng CNTT sẽ tiếp nhận và cập nhật cho bạn đến khi xong.</p>
        </div>
        <Link to="/gui-yeu-cau" className="btn btn-primary">
          <Icon name="plus" size={18} /> Gửi yêu cầu hỗ trợ
        </Link>
      </div>

      <div className="grid-2">
        <div className="stack">
          <section className="card">
            <form
              className="help-search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/huong-dan?q=${encodeURIComponent(query)}`);
              }}
            >
              <div className="search">
                <Icon name="search" size={18} />
                <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm cách tự xử lý: VPN, mật khẩu, Revit, máy in…" aria-label="Tìm trong kho hướng dẫn" />
              </div>
              <button type="submit" className="btn btn-secondary">
                Tìm hướng dẫn
              </button>
            </form>
            <div className="stat-line">
              <span>
                <b>{stats.open}</b> yêu cầu đang xử lý
              </span>
              <span>
                Xử lý trung bình <b>{stats.avg ? formatDuration(stats.avg) : '—'}</b>
              </span>
              <span>
                Mức hài lòng <b>{stats.csat ? `${stats.csat.toFixed(1)}/5` : '—'}</b>
              </span>
            </div>
          </section>

          <section className="card" aria-labelledby="cat-title">
            <div className="card-head">
              <h2 id="cat-title">Chọn nhóm vấn đề</h2>
              <span className="muted">Bấm để gửi yêu cầu nhanh</span>
            </div>
            <div className="cat-list">
              {CATEGORIES.map((c) => (
                <button key={c.id} type="button" className="cat" onClick={() => navigate(`/gui-yeu-cau?nhom=${c.id}`)}>
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
          </section>

          <section className="card" aria-labelledby="flow-title">
            <div className="card-head">
              <h2 id="flow-title">Quy trình xử lý</h2>
            </div>
            <ol className="steps">
              {STEPS.map(([title, text]) => (
                <li key={title}>
                  <b>{title}</b>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="faq-title">
            <div className="card-head">
              <h2 id="faq-title" className="section-title">
                Câu hỏi thường gặp
              </h2>
              <Link to="/huong-dan" className="btn btn-ghost btn-sm">
                Xem tất cả
              </Link>
            </div>
            <FaqAccordion
              initialOpen={null}
              items={KNOWLEDGE.slice(0, 4).map((k) => ({
                id: k.id,
                question: k.question,
                answer: k.answer,
                link: { label: 'Vẫn chưa được? Gửi yêu cầu', onClick: () => navigate(`/gui-yeu-cau?nhom=${k.categoryId}`) },
              }))}
            />
          </section>
        </div>

        <aside className="stack">
          <IncidentBoard />

          <section className="card card-flush" aria-labelledby="mine-title">
            <div className="card-head">
              <h2 id="mine-title">Yêu cầu gần đây của bạn</h2>
              <Link to="/yeu-cau" className="btn btn-ghost btn-sm">
                Tất cả
              </Link>
            </div>
            <TicketMiniList tickets={mine} now={now} emptyText="Bạn chưa gửi yêu cầu nào." />
          </section>
        </aside>
      </div>
    </main>
  );
}
