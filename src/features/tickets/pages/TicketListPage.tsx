import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '@/data/session';
import { useStore } from '@/data/store';
import type { TicketKind } from '@/domain/areas';
import { KIND_LABEL, areaById, areasOf } from '@/domain/areas';
import { personById } from '@/data/people';
import type { Priority, Ticket } from '@/domain/ticket';
import { PRIORITY_LABEL, PRIORITY_ORDER, compareForQueue, isOpen } from '@/domain/ticket';
import { TicketTable } from '@/features/tickets/components/TicketTable';
import { useNow } from '@/shared/hooks/useNow';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Icon } from '@/shared/ui/Icon';

type Filter = 'open' | 'unassigned' | 'mine' | 'reported' | 'done' | 'all';

const CHIPS: Array<[Filter, string]> = [
  ['open', 'Đang mở'],
  ['unassigned', 'Chưa ai nhận'],
  ['mine', 'Tôi đang làm'],
  ['reported', 'Tôi đã báo'],
  ['done', 'Đã xong'],
  ['all', 'Tất cả'],
];

function searchText(t: Ticket): string {
  return [t.code, t.title, t.description, areaById(t.areaId).name, personById(t.reporterId)?.name, personById(t.assigneeId)?.name].join(' ').toLowerCase();
}

export function TicketListPage() {
  const me = useCurrentUser();
  const all = useStore((s) => s.tickets);
  const now = useNow(60_000);
  const [filter, setFilter] = useState<Filter>('open');
  const [query, setQuery] = useState('');
  // Either "" (all), a kind ("kind:bug") or a single area id.
  const [area, setArea] = useState('');
  const [priority, setPriority] = useState<Priority | ''>('');

  const tests: Record<Filter, (t: Ticket) => boolean> = useMemo(
    () => ({
      open: (t) => isOpen(t.status),
      unassigned: (t) => isOpen(t.status) && !t.assigneeId,
      mine: (t) => isOpen(t.status) && t.assigneeId === me.id,
      reported: (t) => t.reporterId === me.id,
      done: (t) => !isOpen(t.status),
      all: () => true,
    }),
    [me.id],
  );

  function clearFilters() {
    setQuery('');
    setArea('');
    setPriority('');
    setFilter('all');
  }

  const q = query.trim().toLowerCase();
  const matchesArea = (t: Ticket) => !area || (area.startsWith('kind:') ? areaById(t.areaId).kind === area.slice(5) : t.areaId === area);
  const narrowed = all.filter(matchesArea).filter((t) => !priority || t.priority === priority).filter((t) => !q || searchText(t).includes(q));
  const shown = narrowed.filter(tests[filter]).sort(compareForQueue);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>Danh sách ticket</h1>
          <p>Việc đang mở xếp theo ưu tiên, cùng mức thì việc chờ lâu nhất lên trước.</p>
        </div>
        <Link to="/bao-loi" className="btn btn-primary">
          <Icon name="plus" size={18} /> Báo lỗi
        </Link>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={18} />
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo mã, tiêu đề, hệ thống, người…" aria-label="Tìm ticket" />
        </div>
        <select className="select toolbar-select" value={area} onChange={(e) => setArea(e.target.value)} aria-label="Lọc theo hệ thống / hạng mục">
          <option value="">Tất cả hệ thống, hạ tầng</option>
          {(Object.keys(KIND_LABEL) as TicketKind[]).map((k) => (
            <optgroup key={k} label={KIND_LABEL[k].title}>
              <option value={`kind:${k}`}>Tất cả {KIND_LABEL[k].title.toLowerCase()}</option>
              {areasOf(k).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select className="select toolbar-select" value={priority} onChange={(e) => setPriority(e.target.value as Priority | '')} aria-label="Lọc theo ưu tiên">
          <option value="">Mọi mức ưu tiên</option>
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p].title}
            </option>
          ))}
        </select>
      </div>
      <div className="chips" role="group" aria-label="Lọc theo trạng thái" style={{ marginBottom: 16 }}>
        {CHIPS.map(([key, label]) => (
          <button key={key} type="button" className="chip" aria-pressed={filter === key} onClick={() => setFilter(key)}>
            {label} <b>{narrowed.filter(tests[key]).length}</b>
          </button>
        ))}
      </div>

      <section className="card card-flush" aria-label="Danh sách ticket">
        <TicketTable
          tickets={shown}
          now={now}
          empty={
            all.length === 0 ? (
              <EmptyState figure="basket" figureLabel="Giỏ trống" title="Chưa có ticket nào" text="Gặp lỗi phần mềm hay sự cố hạ tầng thì báo để cả team cùng thấy.">
                <Link to="/bao-loi" className="btn btn-primary btn-sm">
                  <Icon name="plus" size={16} /> Báo lỗi
                </Link>
              </EmptyState>
            ) : (
              <EmptyState figure="loupe" figureLabel="Kính lúp trên tờ giấy trống" title="Không có ticket nào phù hợp" text="Thử đổi từ khóa, bỏ bớt bộ lọc hoặc chọn trạng thái khác.">
                <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
                  Xóa bộ lọc
                </button>
              </EmptyState>
            )
          }
        />
      </section>
    </main>
  );
}
