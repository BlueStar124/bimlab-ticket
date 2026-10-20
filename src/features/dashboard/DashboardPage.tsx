import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '@/data/session';
import { useStore } from '@/data/store';
import { AREAS } from '@/domain/areas';
import { TEAM } from '@/domain/people';
import { compareForQueue, isOpen } from '@/domain/ticket';
import { KpiCard } from '@/features/dashboard/KpiCard';
import { Avatar } from '@/features/tickets/components/TicketBits';
import { TicketTable } from '@/features/tickets/components/TicketTable';
import { useNow } from '@/shared/hooks/useNow';
import { EmptyState } from '@/shared/ui/EmptyState';
import { LineFigure } from '@/shared/ui/LineFigure';
import { LottieAnimation } from '@/shared/motion/LottieAnimation';
import { Icon } from '@/shared/ui/Icon';
import './dashboard.css';

const WEEK = 7 * 24 * 3_600_000;

export function DashboardPage() {
  const me = useCurrentUser();
  const tickets = useStore((s) => s.tickets);
  const now = useNow(60_000);

  const m = useMemo(() => {
    const open = tickets.filter((t) => isOpen(t.status)).sort(compareForQueue);
    const doneThisWeek = tickets.filter((t) => t.doneAt && now - Date.parse(t.doneAt) < WEEK);
    return {
      open,
      unassigned: open.filter((t) => !t.assigneeId),
      urgent: open.filter((t) => t.priority === 'urgent'),
      mine: open.filter((t) => t.assigneeId === me.id),
      inProgress: open.filter((t) => t.status === 'in_progress').length,
      doneThisWeek: doneThisWeek.length,
      byArea: AREAS.map((a) => ({ a, n: open.filter((t) => t.areaId === a.id).length }))
        .filter((x) => x.n > 0)
        .sort((x, y) => y.n - x.n),
      byPerson: TEAM.map((p) => ({ p, n: open.filter((t) => t.assigneeId === p.id).length })).sort((x, y) => y.n - x.n),
    };
  }, [tickets, now, me.id]);

  const maxArea = Math.max(1, ...m.byArea.map((x) => x.n));

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1 className="greeting">
            Tổng quan
            <LottieAnimation name="sparkles" loop deferUntilIdle stillFrame={20} className="greeting-sparkles" />
          </h1>
          <p>Xin chào {me.name.split(' ').pop()}. Ưu tiên việc khẩn cấp và việc chưa ai nhận.</p>
        </div>
        <div className="page-actions">
          <LineFigure figure="hub" label="Các ô nối về một trung tâm" className="page-figure" />
          <Link to="/kanban" className="btn btn-secondary">
            <Icon name="board" size={18} /> Kanban
          </Link>
          <Link to="/bao-loi" className="btn btn-primary">
            <Icon name="plus" size={18} /> Báo lỗi
          </Link>
        </div>
      </div>

      <div className="kpis">
        <KpiCard label="Đang mở" icon="inbox" value={String(m.open.length)} sub={`${m.inProgress} đang làm · ${m.open.length - m.inProgress} mới`} />
        <KpiCard label="Chưa ai nhận" icon="userPlus" tone={m.unassigned.length ? 'warn' : undefined} value={String(m.unassigned.length)} sub="cần người nhận" />
        <KpiCard label="Khẩn cấp đang mở" icon="alert" tone={m.urgent.length ? 'danger' : undefined} value={String(m.urgent.length)} sub="làm trước tiên" />
        <KpiCard label="Xong trong 7 ngày" icon="checkCircle" tone="ok" value={String(m.doneThisWeek)} sub="ticket đã đóng" />
      </div>

      <div className="stack">
        <section className="card card-flush" aria-labelledby="mine-title">
          <div className="card-head">
            <h2 id="mine-title">Việc của tôi</h2>
            <Link to="/ticket" className="btn btn-ghost btn-sm">
              Xem tất cả
            </Link>
          </div>
          <TicketTable
            tickets={m.mine}
            now={now}
            empty={<EmptyState figure="basket" figureLabel="Giỏ trống" title="Bạn không có việc nào đang mở" text="Nhận một ticket chưa ai làm ở bên dưới." />}
          />
        </section>

        <section className="card card-flush" aria-labelledby="free-title">
          <div className="card-head">
            <h2 id="free-title">Chưa ai nhận</h2>
            <span className="muted">Mở ticket rồi bấm “Nhận việc”</span>
          </div>
          <TicketTable
            tickets={m.unassigned}
            now={now}
            empty={<EmptyState figure="settle" figureLabel="Các ô xếp vào đúng chỗ" title="Mọi ticket đang mở đều đã có người làm" />}
          />
        </section>

        <div className="split-2">
          <section className="card" aria-labelledby="area-title">
            <div className="card-head">
              <h2 id="area-title">Đang mở theo hệ thống / hạ tầng</h2>
            </div>
            <div className="bars">
              {m.byArea.map(({ a, n }) => (
                <div key={a.id} className="bars-row">
                  <span>{a.name}</span>
                  <i style={{ width: `${(n / maxArea) * 100}%` }} aria-hidden="true" />
                  <b>{n}</b>
                </div>
              ))}
              {m.byArea.length === 0 && <p className="muted">Không có ticket đang mở.</p>}
            </div>
          </section>
          <section className="card" aria-labelledby="load-title">
            <div className="card-head">
              <h2 id="load-title">Khối lượng theo người</h2>
            </div>
            <div className="bars">
              {m.byPerson.map(({ p, n }) => (
                <div key={p.id} className="person" style={{ justifyContent: 'space-between' }}>
                  <span className="person">
                    <Avatar person={p} size={30} />
                    <span>
                      {p.name}
                      {p.id === me.id ? ' (tôi)' : ''}
                      <small>{p.title}</small>
                    </span>
                  </span>
                  <b style={{ color: 'var(--ux-ink)' }}>{n} đang mở</b>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
