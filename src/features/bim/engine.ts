// Behaviour of the roaming Bim, as pure functions over a small state so it can be tested without a DOM.
// Coordinates: x from the viewport's left edge to Bim's left side; y is the height above the floor
// (the bottom of the viewport). The pointer is in viewport coordinates (y from the top).
import type { MascotMood } from '@/shared/mascot/Mascot';

export type BimMode = 'walk' | 'idle' | 'greet' | 'cheer' | 'drag' | 'fall';

export interface BimState {
  x: number;
  y: number;
  /** Vertical speed while falling, px/s (negative is downwards). */
  vy: number;
  dir: 1 | -1;
  mode: BimMode;
  /** When the current walk, rest or cheer ends (ms, same clock as `now`). */
  until: number;
}

export interface BimWorld {
  now: number;
  /** Seconds since the last step, capped so a background tab does not teleport Bim. */
  dt: number;
  width: number;
  height: number;
  size: number;
  pointer: { x: number; y: number } | null;
  reduced: boolean;
  random: () => number;
}

export const WALK_SPEED = 46; // px/s
export const GRAVITY = 2600; // px/s²
export const NEAR_PX = 160;
export const EDGE_PX = 8;
export const CHEER_MS = 1900;

const between = (random: () => number, min: number, max: number) => min + random() * (max - min);

export function initialBim(now: number, reduced: boolean): BimState {
  return { x: 24, y: 0, vy: 0, dir: 1, mode: reduced ? 'idle' : 'walk', until: now + 4000 };
}

/** Bim's head, where the eyes look from and where "near the pointer" is measured. */
export function headOf(s: BimState, w: Pick<BimWorld, 'height' | 'size'>) {
  return { x: s.x + w.size / 2, y: w.height - s.y - w.size * 0.62 };
}

function pointerNear(s: BimState, w: BimWorld): boolean {
  if (!w.pointer) return false;
  const h = headOf(s, w);
  return Math.hypot(w.pointer.x - h.x, w.pointer.y - h.y) < NEAR_PX;
}

function clampX(x: number, w: BimWorld): number {
  return Math.min(Math.max(x, EDGE_PX), Math.max(EDGE_PX, w.width - w.size - EDGE_PX));
}

/** Advances Bim by one frame. Dragging is driven from outside (see dragTo / release). */
export function stepBim(s: BimState, w: BimWorld): BimState {
  const next = { ...s, x: clampX(s.x, w) };
  if (next.mode === 'drag') return next;

  if (next.mode === 'fall') {
    next.vy -= GRAVITY * w.dt;
    next.y += next.vy * w.dt;
    if (next.y <= 0) return { ...next, y: 0, vy: 0, mode: 'idle', until: w.now + 1500 };
    return next;
  }

  if (next.mode === 'cheer') {
    return w.now >= next.until ? { ...next, mode: 'idle', until: w.now + between(w.random, 2500, 5000) } : next;
  }

  // The pointer close by: stop, face it and wave until it leaves.
  if (pointerNear(next, w)) {
    const facing = w.pointer!.x < headOf(next, w).x ? -1 : 1;
    return { ...next, mode: 'greet', dir: facing };
  }
  if (next.mode === 'greet') return { ...next, mode: 'idle', until: w.now + 1200 };

  if (next.mode === 'walk') {
    if (w.reduced) return { ...next, mode: 'idle', until: Infinity };
    let x = next.x + next.dir * WALK_SPEED * w.dt;
    let dir = next.dir;
    if (x <= EDGE_PX) {
      x = EDGE_PX;
      dir = 1;
    } else if (x >= w.width - w.size - EDGE_PX) {
      x = w.width - w.size - EDGE_PX;
      dir = -1;
    }
    if (w.now >= next.until) return { ...next, x, dir, mode: 'idle', until: w.now + between(w.random, 2500, 5000) };
    return { ...next, x, dir };
  }

  // Resting: set off again later, sometimes the other way.
  if (!w.reduced && w.now >= next.until) {
    const dir = w.random() < 0.5 ? next.dir : ((-next.dir) as 1 | -1);
    return { ...next, mode: 'walk', dir, until: w.now + between(w.random, 3000, 7000) };
  }
  return next;
}

/** Click on Bim: a happy hop. */
export function cheer(s: BimState, now: number): BimState {
  return { ...s, mode: 'cheer', until: now + CHEER_MS };
}

/** Bim held by the pointer: `grab` is where on Bim it was picked up (px from Bim's bottom-left). */
export function dragTo(s: BimState, pointer: { x: number; y: number }, grab: { x: number; y: number }, w: Pick<BimWorld, 'height' | 'width' | 'size'>): BimState {
  const x = Math.min(Math.max(pointer.x - grab.x, 0), w.width - w.size);
  const y = Math.min(Math.max(w.height - pointer.y - grab.y, 0), w.height - w.size);
  return { ...s, mode: 'drag', x, y, vy: 0 };
}

/**
 * Drops Bim from a point in the viewport (his top centre goes there) so he falls to the floor,
 * e.g. from the BIMLab logo. With reduced motion he is placed on the floor straight away.
 */
export function dropFrom(s: BimState, point: { x: number; y: number }, w: Pick<BimWorld, 'height' | 'width' | 'size' | 'reduced'>): BimState {
  const x = Math.min(Math.max(point.x - w.size / 2, EDGE_PX), Math.max(EDGE_PX, w.width - w.size - EDGE_PX));
  if (w.reduced) return { ...s, x, y: 0, vy: 0, mode: 'idle', until: Infinity };
  const y = Math.min(Math.max(w.height - point.y - w.size, 0), w.height - w.size);
  return { ...s, x, y, vy: 0, mode: y > 0 ? 'fall' : 'idle', until: 0 };
}

export function release(s: BimState): BimState {
  return { ...s, mode: s.y > 0 ? 'fall' : 'idle', vy: 0, until: 0 };
}

export function moodFor(mode: BimMode): MascotMood {
  switch (mode) {
    case 'walk':
      return 'walk';
    case 'greet':
      return 'wave';
    case 'cheer':
      return 'happy';
    case 'drag':
    case 'fall':
      return 'think';
    default:
      return 'idle';
  }
}

/** Where the pupils point (SVG units, at most `reach`), in Bim's own frame (mirrored when facing left). */
export function lookOffset(s: BimState, w: Pick<BimWorld, 'pointer' | 'height' | 'size'>, reach = 2.2): { x: number; y: number } {
  if (!w.pointer) return { x: 0, y: 0 };
  const h = headOf(s, w);
  const dx = w.pointer.x - h.x;
  const dy = w.pointer.y - h.y;
  const len = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, len / 120) * reach;
  return { x: (dx / len) * k * s.dir, y: (dy / len) * k };
}
