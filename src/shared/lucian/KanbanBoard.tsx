/* Lucian UX/UI Prompt #255 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#255 */
// Drag-to-move kanban, ported to React state. Cards keep the board's own sort order, so the
// placeholder opens at the position the card will actually take; columns that reject the card stay inert.
import { type ReactNode, useEffect, useRef, useState } from 'react';
import './lucian-255.css';

export interface KanbanColumn<K extends string> {
  key: K;
  label: string;
  color: string;
  done?: boolean;
}

export interface KanbanCard<K extends string> {
  id: string;
  column: K;
}

interface Props<K extends string, C extends KanbanCard<K>> {
  columns: KanbanColumn<K>[];
  cards: C[];
  renderCard: (card: C) => ReactNode;
  canDrop: (card: C, to: K) => boolean;
  onMove: (card: C, to: K) => void;
  onOpen: (card: C) => void;
  ariaLabel: string;
}

interface Drag<K> {
  id: string;
  from: K;
  over: K;
  x: number;
  y: number;
  dx: number;
  dy: number;
  w: number;
  h: number;
  landing: boolean;
}

const DRAG_THRESHOLD = 4;

export function KanbanBoard<K extends string, C extends KanbanCard<K>>({ columns, cards, renderCard, canDrop, onMove, onOpen, ariaLabel }: Props<K, C>) {
  const bdRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef(new Map<K, HTMLDivElement>());
  const phRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag<K> | null>(null);
  const [pops, setPops] = useState<Partial<Record<K, number>>>({});
  const dragRef = useRef<Drag<K> | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<number>(0);
  dragRef.current = drag;

  useEffect(
    () => () => {
      cleanupRef.current?.();
      clearTimeout(timerRef.current);
    },
    [],
  );

  const byColumn = (key: K) => cards.filter((c) => c.column === key);
  const cardById = (id: string) => cards.find((c) => c.id === id);

  function pop(keys: K[]) {
    setPops((p) => {
      const next = { ...p };
      keys.forEach((k) => {
        next[k] = (next[k] ?? 0) + 1;
      });
      return next;
    });
  }

  function local(clientX: number, clientY: number) {
    const r = bdRef.current!.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function commit(card: C, to: K) {
    if (to === card.column) return;
    onMove(card, to);
    pop([card.column, to]);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>, card: C) {
    if (dragRef.current || e.button !== 0) return;
    const el = e.currentTarget;
    const sx = e.clientX;
    const sy = e.clientY;
    let lifted = false;

    const move = (ev: PointerEvent) => {
      if (!lifted) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < DRAG_THRESHOLD) return;
        lifted = true;
        const r = el.getBoundingClientRect();
        const at = local(r.left, r.top);
        const p = local(sx, sy);
        setDrag({ id: card.id, from: card.column, over: card.column, x: at.x, y: at.y, dx: p.x - at.x, dy: p.y - at.y, w: r.width, h: r.height, landing: false });
      }
      const p = local(ev.clientX, ev.clientY);
      let over: K | null = null;
      colRefs.current.forEach((col, key) => {
        const r = col.getBoundingClientRect();
        if (ev.clientX >= r.left && ev.clientX <= r.right) over = key;
      });
      setDrag((d) => {
        if (!d) return d;
        const target = over && (over === card.column || canDrop(card, over)) ? over : d.over;
        return { ...d, x: p.x - d.dx, y: p.y - d.dy, over: target };
      });
    };

    const up = () => {
      cleanupRef.current?.();
      if (!lifted) {
        onOpen(card);
        return;
      }
      const ph = phRef.current;
      if (ph) {
        const r = ph.getBoundingClientRect();
        const at = local(r.left, r.top);
        setDrag((d) => (d ? { ...d, x: at.x, y: at.y, landing: true } : d));
      }
      timerRef.current = window.setTimeout(() => {
        const d = dragRef.current;
        setDrag(null);
        if (d) commit(card, d.over);
      }, 290);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    cleanupRef.current = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      cleanupRef.current = null;
    };
  }

  function onKeyDown(e: React.KeyboardEvent, card: C) {
    if (e.key === 'Enter') {
      onOpen(card);
      return;
    }
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    const idx = columns.findIndex((c) => c.key === card.column);
    const to = columns[idx + dir];
    if (!to || !canDrop(card, to.key)) return;
    e.preventDefault();
    commit(card, to.key);
    const id = card.id;
    requestAnimationFrame(() => bdRef.current?.querySelector<HTMLElement>(`[data-card="${id}"]`)?.focus());
  }

  const dragged = drag ? cardById(drag.id) : undefined;

  return (
    <div className="ux u255" aria-label={ariaLabel}>
      <div className="u255-bd" ref={bdRef}>
        {columns.map((col) => {
          const list = byColumn(col.key).filter((c) => c.id !== drag?.id);
          // Placeholder sits where the board's sort order will put the card.
          let phIndex = -1;
          if (drag && dragged && drag.over === col.key) {
            const all = cards.filter((c) => c.column === col.key || c.id === drag.id);
            phIndex = all.findIndex((c) => c.id === drag.id);
            if (drag.over !== dragged.column) {
              const sorted = [...byColumn(col.key), dragged];
              const order = cards.map((c) => c.id);
              sorted.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
              phIndex = sorted.findIndex((c) => c.id === drag.id);
            }
          }
          const count = list.length + (phIndex >= 0 ? 1 : 0);
          const placeholder = <div key="ph" ref={phRef} className="u255-ph" style={{ height: drag?.h }} />;
          return (
            <div
              key={col.key}
              ref={(el) => {
                if (el) colRefs.current.set(col.key, el);
                else colRefs.current.delete(col.key);
              }}
              className={`u255-col${drag && drag.over === col.key && drag.from !== col.key ? ' is-over' : ''}`}
              data-done={col.done ? '' : undefined}
              role="list"
              aria-label={col.label}
            >
              <div className="u255-ch">
                <i style={{ background: col.color }} />
                <span>{col.label}</span>
                <b key={pops[col.key] ?? 0} className={pops[col.key] ? 'is-pop' : undefined}>
                  {count}
                </b>
              </div>
              {list.map((card, i) => [
                i === phIndex ? placeholder : null,
                <div
                  key={card.id}
                  data-card={card.id}
                  className="u255-cd"
                  role="listitem"
                  tabIndex={0}
                  onPointerDown={(e) => onPointerDown(e, card)}
                  onKeyDown={(e) => onKeyDown(e, card)}
                >
                  {renderCard(card)}
                  <em aria-hidden="true" />
                </div>,
              ])}
              {phIndex >= list.length && placeholder}
              {count === 0 && <p className="u255-empty">Không có yêu cầu</p>}
            </div>
          );
        })}
        {drag && dragged && (
          <div
            className={`u255-cd ${drag.landing ? 'is-land' : 'is-lift'}`}
            style={{ left: drag.x, top: drag.y, width: drag.w }}
            data-done={columns.find((c) => c.key === drag.over)?.done ? '' : undefined}
            aria-hidden="true"
          >
            {renderCard(dragged)}
          </div>
        )}
      </div>
    </div>
  );
}
