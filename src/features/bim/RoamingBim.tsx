// Bim walking along the bottom of the window. He rests now and then, stops to wave and follows the pointer
// with his eyes when it comes near, says something useful when clicked, and can be picked up and dropped.
// Behaviour lives in engine.ts; this component runs it on one requestAnimationFrame loop and writes the
// position straight to the DOM, so React only re-renders when the mood or the speech bubble changes.
import { useEffect, useRef, useState } from 'react';
import { useCurrentUser } from '@/data/session';
import { getState } from '@/data/store';
import { onBimDrop, setBimHidden } from '@/features/bim/bimPrefs';
import { bimLine } from '@/features/bim/bimTips';
import { type BimState, cheer, dragTo, dropFrom, initialBim, lookOffset, moodFor, release, stepBim } from '@/features/bim/engine';
import { Mascot, type MascotMood } from '@/shared/mascot/Mascot';
import { prefersReducedMotion } from '@/shared/motion/motion';
import './bim.css';

const DRAG_START_PX = 5;
const BUBBLE_MS = 4200;

function sizeForViewport() {
  return window.matchMedia('(max-width: 560px)').matches ? 56 : 72;
}

export function RoamingBim() {
  const me = useCurrentUser();
  const meRef = useRef(me.id);
  meRef.current = me.id;
  const rootRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLDivElement>(null);
  const [mood, setMood] = useState<MascotMood>('walk');
  const [bubble, setBubble] = useState<string | null>(null);
  const [size, setSize] = useState(sizeForViewport);
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const lineIndex = useRef(0);

  useEffect(() => {
    const root = rootRef.current!;
    const flip = flipRef.current!;
    const reduced = prefersReducedMotion();
    let s: BimState = initialBim(performance.now(), reduced);
    let pointer: { x: number; y: number } | null = null;
    let last = performance.now();
    let frame = 0;
    let shownMood: MascotMood | null = null;
    let bubbleTimer = 0;
    let press: { id: number; x: number; y: number; grab: { x: number; y: number }; dragging: boolean } | null = null;

    const world = (now: number, dt: number) => ({
      now,
      dt,
      width: window.innerWidth,
      height: window.innerHeight,
      size: sizeRef.current,
      pointer,
      reduced,
      random: Math.random,
    });

    const render = (now: number) => {
      root.style.transform = `translate3d(${s.x}px, ${-s.y}px, 0)`;
      flip.style.transform = `scaleX(${s.dir})`;
      const look = lookOffset(s, world(now, 0));
      root.style.setProperty('--look-x', look.x.toFixed(2));
      root.style.setProperty('--look-y', look.y.toFixed(2));
      const m = moodFor(s.mode);
      if (m !== shownMood) {
        shownMood = m;
        setMood(m);
      }
      root.dataset.mode = s.mode;
      // Speech bubble opens towards the middle of the window so it never leaves the screen.
      root.dataset.side = s.x + sizeRef.current / 2 > window.innerWidth / 2 ? 'right' : 'left';
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s = stepBim(s, world(now, dt));
      render(now);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    const say = () => {
      setBubble(bimLine(getState().tickets, meRef.current, lineIndex.current++));
      clearTimeout(bubbleTimer);
      bubbleTimer = window.setTimeout(() => setBubble(null), BUBBLE_MS);
    };

    const onPointerMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      if (!press || e.pointerId !== press.id) return;
      if (!press.dragging && Math.hypot(e.clientX - press.x, e.clientY - press.y) > DRAG_START_PX) {
        press.dragging = true;
        setBubble(null);
      }
      if (press.dragging) s = dragTo(s, pointer, press.grab, world(performance.now(), 0));
    };
    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget) pointer = null; // left the window
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('.bim-close')) return;
      const rect = root.getBoundingClientRect();
      press = { id: e.pointerId, x: e.clientX, y: e.clientY, grab: { x: e.clientX - rect.left, y: rect.bottom - e.clientY }, dragging: false };
      root.setPointerCapture(e.pointerId);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!press || e.pointerId !== press.id) return;
      if (press.dragging) s = release(s);
      else {
        s = cheer(s, performance.now());
        say();
      }
      press = null;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      s = cheer(s, performance.now());
      say();
    };
    const onResize = () => setSize(sizeForViewport());

    // Dropped from the BIMLab logo (or anywhere else that asks).
    const stopDrops = onBimDrop((point) => {
      press = null;
      setBubble(null);
      s = dropFrom(s, point, world(performance.now(), 0));
      render(performance.now());
    });

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mouseout', onMouseOut);
    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('pointercancel', onPointerUp);
    root.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(bubbleTimer);
      stopDrops();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('mouseout', onMouseOut);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div ref={rootRef} className="bim" style={{ width: size, height: size * (124 / 120) }} role="button" tabIndex={0} aria-label="Bim, linh vật BIMLab. Bấm để nghe mẹo, kéo để di chuyển.">
      {bubble && (
        <div className="bim-bubble" role="status">
          {bubble}
        </div>
      )}
      <div ref={flipRef} className="bim-flip">
        <Mascot mood={mood} size={size} label="" />
      </div>
      <button type="button" className="bim-close" aria-label="Cất Bim đi" title="Cất Bim đi" onClick={() => setBimHidden(true)}>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 3l6 6M9 3L3 9" />
        </svg>
      </button>
    </div>
  );
}
