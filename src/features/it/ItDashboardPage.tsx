import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/shared/ui/Icon';
import { KpiCard } from '@/features/it/KpiCard';
import { Avatar } from '@/features/tickets/components/TicketBits';
import { useNow } from '@/shared/hooks/useNow';
import { IncidentManager } from '@/features/incidents/IncidentManager';
import { TicketTable } from '@/features/tickets/components/TicketTable';
import { AGENTS } from '@/domain/people';
import { CATEGORIES } from '@/domain/categories';
import { compareForQueue, isOpen, slaState } from '@/domain/ticket';
import { useCurrentUser } from '@/data/session';
import { useStore } from '@/data/store';
import './it.css';

export function ItDashboardPage() {
  const me = useCurrentUser();
  const tickets = useStore((s) => s.tickets);
  const now = useNow();

  const m = useMemo(() => {
    const open = tickets.filter((t) => isOpen(t.status));
    const resolved = tickets.filter((t) => t.resolvedAt);
    const onTime = resolved.filter((t) => !slaState(t, now).breached).length;
    const rated = tickets.filter((t) => t.rating);
    return {
      open,
      unassigned: open.filter((t) => !t.assigneeId).length,
      breached: open.filter((t) => slaState(t, now).breached).length,
      atRisk: open.filter((t) => !slaState(t, now).breached && slaState(t, now).used > 0.75).length,
      compliance: resolved.length ? Math.round((onTime / resolved.length) * 100) : 100,
      csat: rated.length ? rated.reduce((s, t) => s + (t.rating ?? 0), 0) / rated.length : 0,
      byCategory: CATEGORIES.map((c) => ({ c, n: open.filter((t) => t.categoryId === c.id).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n),
      attention: open.filter((t) => t.priority === 'P1' || slaState(t, now).used > 0.75 || !t.assigneeId).sort((a, b) => compareForQueue(a, b, now)).slice(0, 6),
    };
  }, [tickets, now]);

  const maxCat = Math.max(1, ...m.byCategory.map((x) => x.n));

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>Tổng quan Phòng CNTT</h1>
          <p>Ưu tiên xử lý yêu cầu quá hạn và chưa có người nhận trước.</p>
        </div>
        <div className="page-actions">
          <Link to="/it/kanban" className="btn btn-secondary">
            <Icon name="board" size={18} /> Bảng Kanban
          </Link>
          <Link to="/it/hang-doi" className="btn btn-primary">
            <Icon name="list" size={18} /> Mở hàng đợi
          </Link>
        </div>
      </div>

      <div className="kpis">
        <KpiCard label="Đang mở" icon="inbox" value={String(m.open.length)} sub={`${m.open.length - m.unassigned} đã nhận · ${m.unassigned} chưa phân công`} meter={m.open.length ? (m.open.length - m.unassigned) / m.open.length : 0} />
        <KpiCard label="Quá hạn SLA" icon="alert" tone={m.breached ? 'danger' : undefined} value={String(m.breached)} sub={`${m.atRisk} sắp đến hạn · trên ${m.open.length} đang mở`} meter={m.open.length ? m.breached / m.open.length : 0} />
        <KpiCard label="Đúng hạn SLA" icon="clock" tone={m.compliance >= 90 ? 'ok' : 'warn'} value={`${m.compliance}%`} sub="trên các yêu cầu đã xử lý" meter={m.compliance / 100} />
        <KpiCard label="Hài lòng (CSAT)" icon="star" value={m.csat ? m.csat.toFixed(1) : '—'} unit={m.csat ? '/ 5' : undefined} sub="điểm trung bình" meter={m.csat / 5} />
      </div>

      <div className="stack">
        <section className="card card-flush" aria-labelledby="att-title">
          <div className="card-head">
            <h2 id="att-title">Cần chú ý</h2>
            <span className="muted">P1, sắp/quá hạn, chưa phân công</span>
          </div>
          <TicketTable tickets={m.attention} now={now} showRequester emptyText="Không có yêu cầu nào cần chú ý." />
        </section>

        <div className="split-2">
          <IncidentManager actorId={me.id} />
          <div className="stack">
          <section className="card" aria-labelledby="cat-title">
            <div className="card-head">
              <h2 id="cat-title">Đang mở theo nhóm</h2>
            </div>
            <div className="bars">
              {m.byCategory.map(({ c, n }) => (
                <div key={c.id} className="bars-row">
                  <span>{c.name}</span>
                  <i style={{ width: `${(n / maxCat) * 100}%` }} aria-hidden="true" />
                  <b>{n}</b>
                </div>
              ))}
              {m.byCategory.length === 0 && <p className="muted">Không có yêu cầu đang mở.</p>}
            </div>
          </section>
          <section className="card" aria-labelledby="load-title">
            <div className="card-head">
              <h2 id="load-title">Khối lượng theo người</h2>
            </div>
            <div className="bars">
              {AGENTS.map((a) => {
                const n = m.open.filter((t) => t.assigneeId === a.id).length;
                return (
                  <div key={a.id} className="person" style={{ justifyContent: 'space-between' }}>
                    <span className="person">
                      <Avatar person={a} size={30} />
                      <span>
                        {a.name}
                        <small>{a.title}</small>
                      </span>
                    </span>
                    <b style={{ color: 'var(--ux-ink)' }}>{n} đang mở</b>
                  </div>
                );
              })}
            </div>
          </section>
          </div>
        </div>
      </div>
    </main>
  );
}
