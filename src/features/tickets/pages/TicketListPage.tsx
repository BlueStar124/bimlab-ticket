import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/shared/ui/Icon';
import { useNow } from '@/shared/hooks/useNow';
import { TicketTable } from '@/features/tickets/components/TicketTable';
import { CATEGORIES } from '@/domain/categories';
import { personById } from '@/domain/people';
import type { Ticket } from '@/domain/ticket';
import { compareForQueue, compareForRequester, isOpen, slaState } from '@/domain/ticket';
import { useCurrentUser } from '@/data/session';
import { useStore } from '@/data/store';

type Filter = 'open' | 'waiting' | 'done' | 'all' | 'unassigned' | 'mine' | 'breached';

function TicketListPage({ scope }: { scope: 'mine' | 'all' }) {
  const me = useCurrentUser();
  const all = useStore((s) => s.tickets);
  const now = useNow();
  const isQueue = scope === 'all';
  const [filter, setFilter] = useState<Filter>('open');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('');

  const base = useMemo(() => (isQueue ? all : all.filter((t) => t.requesterId === me.id)), [all, isQueue, me.id]);

  const tests: Record<Filter, (t: Ticket) => boolean> = {
    open: (t) => isOpen(t.status),
    waiting: (t) => t.status === 'waiting' || (!isQueue && t.status === 'resolved'),
    done: (t) => !isOpen(t.status),
    all: () => true,
    unassigned: (t) => isOpen(t.status) && !t.assigneeId,
    mine: (t) => isOpen(t.status) && t.assigneeId === me.id,
    breached: (t) => isOpen(t.status) && slaState(t, now).breached,
  };
  const chips: Array<[Filter, string]> = isQueue
    ? [
        ['open', 'Đang mở'],
        ['unassigned', 'Chưa phân công'],
        ['mine', 'Tôi xử lý'],
        ['breached', 'Quá hạn SLA'],
        ['waiting', 'Chờ người dùng'],
        ['done', 'Đã xong'],
        ['all', 'Tất cả'],
      ]
    : [
        ['open', 'Đang xử lý'],
        ['waiting', 'Cần bạn phản hồi'],
        ['done', 'Đã xong'],
        ['all', 'Tất cả'],
      ];

  const q = query.trim().toLowerCase();
  const shown = base
    .filter(tests[filter])
    .filter((t) => !cat || t.categoryId === cat)
    .filter((t) => !q || `${t.code} ${t.title} ${t.description} ${personById(t.requesterId)?.name ?? ''}`.toLowerCase().includes(q))
    .sort((a, b) => (isQueue ? compareForQueue(a, b, now) : compareForRequester(a, b)));

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>{isQueue ? 'Hàng đợi yêu cầu' : 'Yêu cầu của tôi'}</h1>
          <p>{isQueue ? 'Sắp xếp theo mức ưu tiên rồi đến hạn SLA gần nhất.' : 'Theo dõi tiến độ và trao đổi với Phòng CNTT.'}</p>
        </div>
        {!isQueue && (
          <Link to="/gui-yeu-cau" className="btn btn-primary">
            <Icon name="plus" size={18} /> Gửi yêu cầu mới
          </Link>
        )}
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={18} />
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo mã, tiêu đề, người gửi…" aria-label="Tìm yêu cầu" />
        </div>
        <select className="select" style={{ width: 220 }} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Lọc theo nhóm">
          <option value="">Tất cả nhóm</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="chips" role="group" aria-label="Lọc theo trạng thái" style={{ marginBottom: 16 }}>
        {chips.map(([key, label]) => (
          <button key={key} type="button" className="chip" aria-pressed={filter === key} onClick={() => setFilter(key)}>
            {label} <b>{base.filter(tests[key]).length}</b>
          </button>
        ))}
      </div>

      <section className="card card-flush" aria-label="Danh sách yêu cầu">
        <TicketTable tickets={shown} now={now} showRequester={isQueue} emptyText="Không có yêu cầu nào phù hợp bộ lọc." />
      </section>
    </main>
  );
}

export function MyTicketsPage() {
  return <TicketListPage scope="mine" />;
}

export function QueuePage() {
  return <TicketListPage scope="all" />;
}
