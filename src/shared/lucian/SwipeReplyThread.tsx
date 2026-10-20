/* Lucian UX/UI Prompt #078 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#078 */
// Message log of #078: swipe a message right (or press its reply arrow) to reply; new messages rise in.
// Adapted: rendered from props instead of DOM writes, scrollable full history that sticks to the bottom,
// an optional header (author, day) before a message, no simulated typing or auto-reply.
import { type ReactNode, useEffect, useLayoutEffect, useRef } from 'react';
import './lucian-078.css';

export interface ThreadItem {
  id: string;
  mine: boolean;
  /** Rendered above the bubble, outside the swipe area: author line, day divider… */
  before?: ReactNode;
  quote?: ReactNode;
  body: ReactNode;
  /** Plain-text summary for the reply button's label. */
  label: string;
}

const ARROW = (
  <svg viewBox="0 0 14 14" aria-hidden="true">
    <path d="M5.5 3.5L2 7l3.5 3.5M2 7h6.5a3.5 3.5 0 0 1 3.5 3.5" />
  </svg>
);
const SWIPE_PX = 60;
const NEAR_BOTTOM_PX = 80;

function Message({ item, fresh, onReply, onEntered }: { item: ThreadItem; fresh: boolean; onReply: (id: string) => void; onEntered: (id: string) => void }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const repRef = useRef<HTMLSpanElement>(null);
  const drag = useRef({ down: false, sx: 0, dx: 0 });
  const canSwipe = !item.mine;

  function move(dx: number) {
    const row = rowRef.current!;
    const d = dx > SWIPE_PX ? SWIPE_PX + (dx - SWIPE_PX) * 0.3 : dx;
    row.querySelector<HTMLElement>('.u078-bub')!.style.setProperty('--dx', `${d}px`);
    row.style.setProperty('--ro', Math.min(1, dx / SWIPE_PX).toFixed(2));
    repRef.current!.classList.toggle('full', dx >= SWIPE_PX);
  }

  function end() {
    const g = drag.current;
    if (!g.down) return;
    g.down = false;
    rowRef.current!.classList.remove('drag');
    move(0);
    if (g.dx >= SWIPE_PX) onReply(item.id);
  }

  return (
    <>
      {item.before}
      <div
        ref={rowRef}
        className={`u078-m${item.mine ? ' me' : ''}${fresh ? ' in' : ''}`}
        onAnimationEnd={(e) => {
          if (e.target !== rowRef.current) return;
          rowRef.current.classList.remove('in');
          onEntered(item.id);
        }}
      >
        <span ref={repRef} className="u078-rep" aria-hidden="true">
          {ARROW}
        </span>
        <span
          className="u078-bub"
          onPointerDown={(e) => {
            if (!canSwipe || e.button !== 0 || (e.target as HTMLElement).closest('a')) return;
            drag.current = { down: true, sx: e.clientX, dx: 0 };
            e.currentTarget.setPointerCapture(e.pointerId);
            rowRef.current!.classList.add('drag');
          }}
          onPointerMove={(e) => {
            const g = drag.current;
            if (!g.down) return;
            g.dx = Math.max(0, e.clientX - g.sx);
            move(g.dx);
          }}
          onPointerUp={end}
          onPointerCancel={end}
        >
          {item.quote && <span className="u078-q">{item.quote}</span>}
          {item.body}
        </span>
        {canSwipe && (
          <button className="u078-rb" type="button" aria-label={`Trả lời: ${item.label}`} onClick={() => onReply(item.id)}>
            {ARROW}
          </button>
        )}
      </div>
    </>
  );
}

export function SwipeReplyThread({ items, onReply, ariaLabel }: { items: ThreadItem[]; onReply: (id: string) => void; ariaLabel: string }) {
  const logRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  // Messages present at first render appear without the rise-in motion; later ones animate once.
  const known = useRef<Set<string> | null>(null);
  const fresh = useRef(new Set<string>());
  if (known.current === null) known.current = new Set(items.map((i) => i.id));
  for (const i of items) {
    if (!known.current.has(i.id)) {
      known.current.add(i.id);
      fresh.current.add(i.id);
    }
  }

  // Stay pinned to the newest message when the frame resizes (viewport, keyboard) or web fonts reflow the text.
  useEffect(() => {
    const log = logRef.current!;
    const pin = () => {
      if (stick.current) log.scrollTop = log.scrollHeight;
    };
    const ro = new ResizeObserver(pin);
    ro.observe(log);
    let alive = true;
    void document.fonts?.ready.then(() => alive && pin());
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, []);

  const last = items[items.length - 1];
  useLayoutEffect(() => {
    const log = logRef.current!;
    // Follow new messages when the reader is at the bottom or just sent one.
    if (stick.current || last?.mine) log.scrollTop = log.scrollHeight;
  }, [items.length, last?.mine]);

  return (
    <div
      ref={logRef}
      className="u078-log"
      role="log"
      aria-label={ariaLabel}
      aria-live="polite"
      tabIndex={0}
      onScroll={(e) => {
        const el = e.currentTarget;
        stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
      }}
    >
      {items.map((item) => (
        <Message key={item.id} item={item} fresh={fresh.current.has(item.id)} onReply={onReply} onEntered={(id) => fresh.current.delete(id)} />
      ))}
    </div>
  );
}
