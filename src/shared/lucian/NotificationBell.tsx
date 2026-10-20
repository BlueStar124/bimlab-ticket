/* Lucian UX/UI Prompt #074 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#074 */
// Notification bell for ticket activity. Items come from props; read state lives in the store.
import { type ReactNode, useEffect, useRef, useState } from 'react';
import './lucian-074.css';

export interface BellItem {
  id: string;
  actor: string;
  text: string;
  time: string;
  icon: ReactNode;
  color: string;
  unread: boolean;
}

interface Props {
  items: BellItem[];
  onOpenItem: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationBell({ items, onOpenItem, onMarkAllRead }: Props) {
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [ring, setRing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const unread = items.filter((i) => i.unread).length;
  const prevUnread = useRef(unread);
  const seen = useRef(new Set(items.map((i) => i.id)));
  const rm = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Ring the bell and pop the badge when a new unread item arrives.
  useEffect(() => {
    if (unread > prevUnread.current) {
      setRing(true);
      if (!rm) badgeRef.current?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'cubic-bezier(.34,1.5,.64,1)' });
    }
    prevUnread.current = unread;
  }, [unread, rm]);

  const fresh = items.filter((i) => !seen.current.has(i.id)).map((i) => i.id);
  useEffect(() => {
    if (!fresh.length) return;
    const raf = requestAnimationFrame(() => {
      fresh.forEach((id) => seen.current.add(id));
      rootRef.current?.querySelectorAll('.u074-it.new').forEach((n) => n.classList.remove('new'));
    });
    return () => cancelAnimationFrame(raf);
  });

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);

  const shown = unreadOnly ? items.filter((i) => i.unread) : items;

  return (
    <div
      ref={rootRef}
      className={`ux u074${open ? '' : ' is-closed'}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          setOpen(false);
          bellRef.current?.focus();
        }
      }}
    >
      <button
        ref={bellRef}
        className={`u074-bell${ring ? ' ring' : ''}`}
        type="button"
        aria-expanded={open}
        aria-label={`Thông báo, ${unread} chưa đọc`}
        onClick={() => setOpen((o) => !o)}
        onAnimationEnd={() => setRing(false)}
      >
        <svg viewBox="0 0 22 22" aria-hidden="true">
          <path d="M5.5 15V10a5.5 5.5 0 0 1 11 0v5l1.5 1.5h-14zM9 18.5a2 2 0 0 0 4 0" />
        </svg>
        <span ref={badgeRef} className={`u074-badge${unread ? '' : ' zero'}`} aria-hidden="true">
          {unread}
        </span>
      </button>
      <div className="u074-pan" role="region" aria-label="Danh sách thông báo" inert={!open}>
        <div className="u074-ph" role="tablist" aria-label="Lọc thông báo">
          <button className="u074-tab" type="button" role="tab" aria-selected={!unreadOnly} onClick={() => setUnreadOnly(false)}>
            Tất cả
          </button>
          <button className="u074-tab" type="button" role="tab" aria-selected={unreadOnly} onClick={() => setUnreadOnly(true)}>
            Chưa đọc
          </button>
          <button className="u074-all" type="button" disabled={!unread} onClick={onMarkAllRead}>
            Đánh dấu đã đọc
          </button>
        </div>
        <ul className="u074-list" aria-live="polite">
          {shown.length === 0 && <li className="u074-empty">Không có thông báo</li>}
          {shown.map((it) => (
            <li key={it.id} className={`u074-it${fresh.includes(it.id) ? ' new' : ''}`}>
              <div>
                <button
                  className={`u074-row${it.unread ? '' : ' read'}`}
                  type="button"
                  aria-label={`${it.actor} ${it.text}, ${it.time}${it.unread ? ', chưa đọc' : ''}`}
                  onClick={() => {
                    setOpen(false);
                    onOpenItem(it.id);
                  }}
                >
                  <span className="u074-av" style={{ ['--g' as string]: it.color }} aria-hidden="true">
                    {it.icon}
                  </span>
                  <span className="u074-tx">
                    <b>{it.actor}</b> <span>{it.text}</span>
                    <small>{it.time}</small>
                  </span>
                  <span className="u074-dot" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
