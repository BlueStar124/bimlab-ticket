/* Lucian UX/UI Prompt #219 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#219 */
// Sun/moon toggle whose new theme spreads out in a circle from the button.
import { useState } from 'react';
import { flushSync } from 'react-dom';
import './lucian-219.css';

type Theme = 'light' | 'dark';
const KEY = 'bimlab-ticket:theme';

function initialTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const SUN = (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="3" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 1.5v1.4M8 13.1v1.4M1.5 8h1.4M13.1 8h1.4M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
    </g>
  </svg>
);
const MOON = (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M13.5 9.8A5.6 5.6 0 0 1 6.2 2.5a5.6 5.6 0 1 0 7.3 7.3z" fill="currentColor" />
  </svg>
);

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const dark = theme === 'dark';

  function apply(next: Theme) {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Theme still applies for this visit.
    }
    setTheme(next);
  }

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const next: Theme = dark ? 'light' : 'dark';
    const b = e.currentTarget.getBoundingClientRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    const r = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
    const rs = document.documentElement.style;
    rs.setProperty('--u219-cx', `${cx}px`);
    rs.setProperty('--u219-cy', `${cy}px`);
    rs.setProperty('--u219-r', `${r}px`);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduce) {
      apply(next);
      return;
    }
    document.startViewTransition(() => flushSync(() => apply(next)));
  }

  return (
    <button
      type="button"
      className="ux u219-tg"
      aria-pressed={dark}
      aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      onClick={toggle}
    >
      {dark ? MOON : SUN}
    </button>
  );
}
