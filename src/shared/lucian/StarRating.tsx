/* Lucian UX/UI Prompt #016 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#016 */
// Star rating for CSAT after a ticket is resolved. The element owns its DOM; React receives the score via onChange.
import { useEffect, useRef } from 'react';
import './lucian-016.css';

const WORDS = ['Chạm để đánh giá', 'Rất tệ', 'Chưa tốt', 'Tạm được', 'Tốt', 'Tuyệt vời'];
const COLORS = ['var(--ux-ink-3)', '#E5484D', '#F07A3E', '#E8A317', '#2FB37A', '#2E82B6'];
const STAR = 'M26 4.5l6.4 13.2 14.4 2-10.5 10.1 2.6 14.3L26 37.3l-12.9 6.8 2.6-14.3L5.2 19.7l14.4-2z';

export function StarRating({ question, onChange }: { question: string; onChange: (score: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const root = ref.current!;
    const wrap = root.querySelector<HTMLDivElement>('.u016-stars')!;
    const score = root.querySelector<HTMLSpanElement>('.u016-score')!;
    const word = root.querySelector<HTMLSpanElement>('.u016-word')!;
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timers: number[] = [];
    const gid = `u016-g-${Math.random().toString(36).slice(2, 7)}`;
    root.querySelector('linearGradient')!.id = gid;
    const stars: HTMLSpanElement[] = [];
    for (let i = 0; i < 5; i++) {
      const b = document.createElement('span');
      b.className = 'u016-s';
      let sparks = '';
      for (let k = 0; k < 5; k++) sparks += `<i style="--a:${k * 72}deg"></i>`;
      b.innerHTML = `<svg viewBox="0 0 52 52"><path class="bg" d="${STAR}" stroke-linejoin="round"/><path class="fg" d="${STAR}" style="fill:url(#${gid})"/></svg>${sparks}`;
      b.dataset.v = String(i + 1);
      wrap.appendChild(b);
      stars.push(b);
    }
    let val = 0;
    const preview = (n: number) => stars.forEach((s, i) => s.classList.toggle('is-pre', i < n && i >= val));
    function setWord(n: number) {
      const old = word.lastElementChild as HTMLElement;
      const s = document.createElement('span');
      s.textContent = WORDS[n];
      s.style.color = COLORS[n];
      s.style.transform = 'translateY(100%)';
      s.style.opacity = '0';
      word.appendChild(s);
      void s.offsetWidth;
      s.style.transform = 'none';
      s.style.opacity = '1';
      old.style.transform = 'translateY(-100%)';
      old.style.opacity = '0';
      timers.push(window.setTimeout(() => old.remove(), 500));
    }
    function set(n: number) {
      if (n === val) return;
      const prev = val;
      val = n;
      stars.forEach((s, i) => {
        const on = i < n;
        s.classList.remove('is-pre');
        if (on && i >= prev) {
          timers.push(
            window.setTimeout(
              () => {
                s.classList.add('is-on');
                if (!rm) {
                  s.classList.remove('is-pop');
                  void s.offsetWidth;
                  s.classList.add('is-pop');
                }
              },
              rm ? 0 : (i - prev) * 70,
            ),
          );
        } else if (!on) s.classList.remove('is-on', 'is-pop');
      });
      score.textContent = n.toFixed(1);
      score.style.color = n ? COLORS[n] : '';
      setWord(n);
      wrap.setAttribute('aria-valuenow', String(n));
      wrap.setAttribute('aria-valuetext', n ? `${n} sao, ${WORDS[n]}` : 'Chưa đánh giá');
      onChangeRef.current(n);
    }
    stars.forEach((s) => {
      s.addEventListener('pointerenter', () => preview(Number(s.dataset.v)));
      s.addEventListener('click', () => set(Number(s.dataset.v)));
    });
    wrap.addEventListener('pointerleave', () => preview(0));
    wrap.addEventListener('keydown', (e) => {
      const d = ({ ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 } as Record<string, number>)[e.key];
      if (e.key === 'Home') {
        e.preventDefault();
        set(0);
      }
      if (e.key === 'End') {
        e.preventDefault();
        set(5);
      }
      if (d) {
        e.preventDefault();
        set(Math.max(0, Math.min(5, val + d)));
      }
      if (/^[0-5]$/.test(e.key)) set(Number(e.key));
    });
    return () => {
      timers.forEach(clearTimeout);
      stars.forEach((s) => s.remove());
    };
  }, []);

  return (
    <div ref={ref} className="ux u016">
      <p className="u016-q">{question}</p>
      <div
        className="u016-stars"
        role="slider"
        tabIndex={0}
        aria-label="Mức độ hài lòng"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={0}
        aria-valuetext="Chưa đánh giá"
      >
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
          <defs>
            <linearGradient id="u016-g" x1="0" y1="0" x2=".6" y2="1">
              <stop offset="0" stopColor="#FFD66B" />
              <stop offset=".6" stopColor="#FFAA2C" />
              <stop offset="1" stopColor="#FF7A45" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="u016-out" aria-hidden="true">
        <span className="u016-score">0.0</span>
        <span className="u016-word">
          <span>{WORDS[0]}</span>
        </span>
      </div>
    </div>
  );
}
