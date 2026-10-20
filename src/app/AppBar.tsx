// Top navigation: brand, role-based menu, demo role switch, notifications, theme, account.
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { preloadRoute } from '@/app/routes';
import { markRead } from '@/data/notifications';
import { setRole } from '@/data/session';
import type { Person, Role } from '@/domain/ticket';
import { useBellItems } from '@/features/notifications/useBellItems';
import { Avatar } from '@/features/tickets/components/TicketBits';
import { NotificationBell } from '@/shared/lucian/NotificationBell';
import { ThemeToggle } from '@/shared/lucian/ThemeToggle';
import { toast } from '@/shared/lucian/Toaster';
import { Icon, type IconName } from '@/shared/ui/Icon';

const NAV: Record<Role, Array<{ to: string; label: string; icon: IconName; end?: boolean }>> = {
  employee: [
    { to: '/', label: 'Trang chủ', icon: 'home', end: true },
    { to: '/gui-yeu-cau', label: 'Gửi yêu cầu', icon: 'plus' },
    { to: '/yeu-cau', label: 'Yêu cầu của tôi', icon: 'list' },
    { to: '/huong-dan', label: 'Tự xử lý', icon: 'book' },
  ],
  agent: [
    { to: '/it', label: 'Tổng quan', icon: 'chart', end: true },
    { to: '/it/hang-doi', label: 'Hàng đợi', icon: 'list' },
    { to: '/it/kanban', label: 'Bảng Kanban', icon: 'board' },
    { to: '/huong-dan', label: 'Kho hướng dẫn', icon: 'book' },
  ],
};

function RoleSwitch({ role, onSwitch }: { role: Role; onSwitch: (role: Role) => void }) {
  return (
    <div className="role-switch" role="group" aria-label="Vai trò demo">
      <button type="button" aria-pressed={role === 'employee'} onClick={() => onSwitch('employee')}>
        Nhân viên
      </button>
      <button type="button" aria-pressed={role === 'agent'} onClick={() => onSwitch('agent')}>
        Phòng CNTT
      </button>
    </div>
  );
}

export function AppBar({ me }: { me: Person }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, ticketOf } = useBellItems(me.id);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [location.pathname]);

  function switchRole(role: Role) {
    if (role === me.role) return;
    setRole(role);
    navigate(role === 'agent' ? '/it' : '/');
    toast({ kind: 'info', title: role === 'agent' ? 'Đang xem với vai trò Phòng CNTT' : 'Đang xem với vai trò Nhân viên', detail: 'Chế độ demo · chưa kết nối đăng nhập' });
  }

  return (
    <header className="appbar">
      <div className="appbar-in">
        <Link to={me.role === 'agent' ? '/it' : '/'} className="brand" aria-label="BIMLab Ticket — trang chủ">
          <img src="/bimlab-logo.png" alt="BIMLab" width={75} height={24} decoding="async" />
          <span className="brand-sub">Hỗ trợ CNTT</span>
        </Link>

        <nav className={`topnav${menuOpen ? ' is-open' : ''}`} id="main-nav" aria-label="Điều hướng chính">
          {NAV[me.role].map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onPointerEnter={() => preloadRoute(n.to)} onFocus={() => preloadRoute(n.to)}>
              <Icon name={n.icon} size={18} />
              {n.label}
            </NavLink>
          ))}
          <div className="topnav-role">
            <span>Vai trò demo</span>
            <RoleSwitch role={me.role} onSwitch={switchRole} />
          </div>
        </nav>

        <div className="appbar-tools">
          <div className="appbar-role">
            <RoleSwitch role={me.role} onSwitch={switchRole} />
          </div>
          <NotificationBell
            items={items}
            onOpenItem={(id) => {
              markRead(me.id, [id]);
              const ticketId = ticketOf.get(id);
              if (ticketId) navigate(`/yeu-cau/${ticketId}`);
            }}
            onMarkAllRead={() =>
              markRead(
                me.id,
                items.map((i) => i.id),
              )
            }
          />
          <ThemeToggle />
          <span className="me" title={`${me.name} · ${me.title} · ${me.department}`}>
            <Avatar person={me} size={36} />
            <span>
              <b>{me.name}</b>
              <small>{me.department}</small>
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
