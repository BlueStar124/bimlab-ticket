/* Lucian UX/UI Prompt #070 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#070 */
// Stacking toasts, ported as an app-wide host. Call `toast(...)` from anywhere once <Toaster/> is mounted.
import { useEffect, useRef } from 'react';
import './lucian-070.css';

export type ToastKind = 'ok' | 'err' | 'info';

interface ToastInput {
  kind: ToastKind;
  title: string;
  detail?: string;
  action?: { label: string; onClick: () => void };
}

let pushToast: ((t: ToastInput) => void) | null = null;

export function toast(t: ToastInput) {
  pushToast?.(t);
}

const ICON: Record<ToastKind, string> = {
  ok: '<svg viewBox="0 0 18 18"><path d="M4 9.4l3.2 3.2L14 5.6"/></svg>',
  err: '<svg viewBox="0 0 18 18"><path d="M9 5v5M9 13h.01"/></svg>',
  info: '<svg viewBox="0 0 18 18"><path d="M3.5 4.5h11v7h-6l-3 2.5v-2.5h-2z"/></svg>',
};
const COLOR: Record<ToastKind, string> = { ok: 'var(--ux-mint)', err: 'var(--ux-danger)', info: 'var(--ux-accent)' };
const DUR = 4500;

interface Item {
  el: HTMLDivElement;
  left: number;
}

export function Toaster() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const zone = root.querySelector<HTMLDivElement>('.u070-zone')!;
    const live = root.querySelector<HTMLDivElement>('.u070-live')!;
    const timers: number[] = [];
    let list: Item[] = [];
    let open = false;
    let raf = 0;

    function layout() {
      let acc = 0;
      list.forEach((t, i) => {
        const el = t.el;
        el.classList.toggle('back', !open && i > 0);
        if (open) {
          el.style.setProperty('--y', `${-acc}px`);
          el.style.setProperty('--s', '1');
          el.style.setProperty('--o', '1');
          acc += el.offsetHeight + 8;
        } else {
          el.style.setProperty('--y', `${-(i * 14)}px`);
          el.style.setProperty('--s', (1 - i * 0.06).toFixed(2));
          el.style.setProperty('--o', i > 2 ? '0' : '1');
        }
        el.style.zIndex = String(50 - i);
        el.inert = !open && i > 0;
      });
    }

    function remove(t: Item, dir?: number) {
      if (!list.includes(t)) return;
      list = list.filter((x) => x !== t);
      t.el.classList.add('leave');
      if (dir) {
        t.el.style.setProperty('--dir', String(dir));
        t.el.classList.add('side');
      }
      timers.push(window.setTimeout(() => t.el.remove(), 450));
      layout();
    }

    function push({ kind, title, detail, action }: ToastInput) {
      const el = document.createElement('div');
      el.className = 'u070-t enter';
      el.style.setProperty('--c', COLOR[kind]);
      el.setAttribute('role', kind === 'err' ? 'alert' : 'status');
      el.innerHTML = `<span class="u070-ic" aria-hidden="true">${ICON[kind]}</span><span class="u070-tx"><b></b><small></small></span>${action ? '<button class="u070-act" type="button"></button>' : ''}<button class="u070-x" type="button" aria-label="Đóng thông báo"><svg viewBox="0 0 14 14"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7"/></svg></button><span class="u070-bar" aria-hidden="true"></span>`;
      el.querySelector('b')!.textContent = title;
      el.querySelector('small')!.textContent = detail ?? '';
      const t: Item = { el, left: DUR };
      zone.appendChild(el);
      list.unshift(t);
      void el.offsetWidth;
      el.classList.remove('enter');
      layout();
      live.textContent = title;
      el.querySelector('.u070-x')!.addEventListener('click', () => remove(t));
      if (action) {
        const btn = el.querySelector<HTMLButtonElement>('.u070-act')!;
        btn.textContent = action.label;
        btn.addEventListener('click', () => {
          remove(t);
          action.onClick();
        });
      }
      let sx = 0;
      let dx = 0;
      let down = false;
      el.addEventListener('pointerdown', (e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        down = true;
        sx = e.clientX;
        dx = 0;
        el.setPointerCapture(e.pointerId);
        el.classList.add('drag');
      });
      el.addEventListener('pointermove', (e) => {
        if (!down) return;
        dx = e.clientX - sx;
        el.style.setProperty('--dx', `${dx}px`);
        el.style.setProperty('--o', String(Math.max(0.2, 1 - Math.abs(dx) / 260)));
      });
      const end = () => {
        if (!down) return;
        down = false;
        el.classList.remove('drag');
        if (Math.abs(dx) > 90) remove(t, dx > 0 ? 1 : -1);
        else {
          el.style.setProperty('--dx', '0px');
          layout();
        }
      };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
    }

    let last = performance.now();
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      if (!open)
        list.slice().forEach((t, i) => {
          if (i > 0) return;
          t.left -= dt;
          t.el.style.setProperty('--left', Math.max(0, t.left / DUR).toFixed(3));
          if (t.left <= 0) remove(t);
        });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const setOpen = (v: boolean) => {
      if (open === v) return;
      open = v;
      layout();
    };
    zone.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && setOpen(true));
    zone.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse' && !zone.contains(document.activeElement)) setOpen(false);
    });
    zone.addEventListener('focusin', () => setOpen(true));
    zone.addEventListener('focusout', (e) => {
      if (!zone.contains(e.relatedTarget as Node | null)) setOpen(false);
    });
    zone.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('button') && list.length > 1) setOpen(!open);
    });

    pushToast = push;
    return () => {
      pushToast = null;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      zone.querySelectorAll('.u070-t').forEach((n) => n.remove());
    };
  }, []);

  return (
    <div ref={ref} className="ux u070">
      <div className="u070-zone" role="region" aria-label="Thông báo" tabIndex={-1}>
        <div className="u070-live" aria-live="polite" />
      </div>
    </div>
  );
}
