// Top navigation: brand, menu, demo account switch, notifications, theme, account.
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BrandMark } from '@/app/BrandMark';
import { preloadRoute } from '@/app/routes';
import { markRead } from '@/data/notifications';
import { setCurrentUser } from '@/data/session';
import { useStore } from '@/data/store';
import { dropBim } from '@/features/bim/bimPrefs';
import { unreadCount } from '@/domain/chat';
import { TEAM } from '@/domain/people';
import type { Person } from '@/domain/ticket';
import { useBellItems } from '@/features/notifications/useBellItems';
import { Avatar } from '@/features/tickets/components/TicketBits';
import { NotificationBell } from '@/shared/lucian/NotificationBell';
import { ThemeToggle } from '@/shared/lucian/ThemeToggle';
import { toast } from '@/shared/lucian/Toaster';
import { Icon, type IconName } from '@/shared/ui/Icon';

const NAV: Array<{ to: string; label: string; icon: IconName; end?: boolean }> = [
  { to: '/', label: 'Tổng quan', icon: 'chart', end: true },
  { to: '/ticket', label: 'Danh sách', icon: 'list' },
  { to: '/kanban', label: 'Kanban', icon: 'board' },
  { to: '/tin-nhan', label: 'Tin nhắn', icon: 'chat' },
  { to: '/bao-loi', label: 'Báo lỗi', icon: 'plus' },
];

function UserSwitch({ me, onSwitch }: { me: Person; onSwitch: (id: string) => void }) {
  return (
    <select className="select user-switch" value={me.id} onChange={(e) => onSwitch(e.target.value)} aria-label="Đăng nhập demo với tư cách">
      {TEAM.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

export function AppBar({ me }: { me: Person }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, hrefOf } = useBellItems(me.id);
  const unreadChat = useStore((s) => unreadCount(s.messages, me.id, s.chatReadAt[me.id]));
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [location.pathname]);

  function switchUser(id: string) {
    if (id === me.id) return;
    setCurrentUser(id);
    toast({ kind: 'info', title: 'Đã đổi người dùng demo', detail: 'Chưa kết nối đăng nhập thật' });
  }

  return (
    <header className="appbar">
      <div className="appbar-in">
        <Link
          to="/"
          className="brand"
          aria-label="BIMLab Ticket — tổng quan"
          onClick={(e) => {
            // The logo also drops Bim from just under it (and brings him back if he was put away).
            const r = e.currentTarget.getBoundingClientRect();
            dropBim({ x: r.left + 30, y: r.bottom + 6 });
          }}
        >
          <BrandMark />
          <img src="/bimlab-logo.png" alt="BIMLab" width={75} height={24} decoding="async" />
          <span className="brand-sub">Ticket team IT</span>
        </Link>

        <nav className={`topnav${menuOpen ? ' is-open' : ''}`} id="main-nav" aria-label="Điều hướng chính">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onPointerEnter={() => preloadRoute(n.to)} onFocus={() => preloadRoute(n.to)}>
              <Icon name={n.icon} size={18} />
              {n.label}
              {n.to === '/tin-nhan' && unreadChat > 0 && (
                <span className="nav-badge" aria-label={`${unreadChat} tin chưa đọc`}>
                  {unreadChat > 99 ? '99+' : unreadChat}
                </span>
              )}
            </NavLink>
          ))}
          <div className="topnav-role">
            <span>Người dùng demo</span>
            <UserSwitch me={me} onSwitch={switchUser} />
          </div>
        </nav>

        <div className="appbar-tools">
          <div className="appbar-role">
            <UserSwitch me={me} onSwitch={switchUser} />
          </div>
          <NotificationBell
            items={items}
            onOpenItem={(id) => {
              markRead(me.id, [id]);
              const href = hrefOf.get(id);
              if (href) navigate(href);
            }}
            onMarkAllRead={() =>
              markRead(
                me.id,
                items.map((i) => i.id),
              )
            }
          />
          <ThemeToggle />
          <span className="appbar-me" title={`${me.name} · ${me.title}`}>
            <Avatar person={me} size={36} />
            <span>
              <b>{me.name}</b>
              <small>{me.title}</small>
            </span>
          </span>
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  );
}
