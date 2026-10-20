import { describe, expect, it } from 'vitest';
import type { BimState, BimWorld } from '@/features/bim/engine';
import { EDGE_PX, WALK_SPEED, cheer, dragTo, dropFrom, initialBim, lookOffset, moodFor, release, stepBim } from '@/features/bim/engine';

const world = (over: Partial<BimWorld> = {}): BimWorld => ({
  now: 0,
  dt: 0.1,
  width: 1000,
  height: 800,
  size: 72,
  pointer: null,
  reduced: false,
  random: () => 0.5,
  ...over,
});

const bim = (over: Partial<BimState> = {}): BimState => ({ ...initialBim(0, false), ...over });

describe('stepBim', () => {
  it('walks at a steady speed and turns around at the edges', () => {
    expect(stepBim(bim({ x: 100, dir: 1 }), world()).x).toBeCloseTo(100 + WALK_SPEED * 0.1);
    const atRight = stepBim(bim({ x: 1000 - 72 - EDGE_PX, dir: 1 }), world());
    expect(atRight.dir).toBe(-1);
    expect(stepBim(bim({ x: EDGE_PX, dir: -1 }), world()).dir).toBe(1);
  });

  it('rests after a walk and sets off again later', () => {
    const resting = stepBim(bim({ x: 100, until: 0 }), world({ now: 10 }));
    expect(resting.mode).toBe('idle');
    expect(stepBim(resting, world({ now: resting.until + 1 })).mode).toBe('walk');
  });

  it('stops and faces a nearby pointer, then resumes once it leaves', () => {
    const near = stepBim(bim({ x: 500, dir: 1 }), world({ pointer: { x: 450, y: 760 } }));
    expect(near.mode).toBe('greet');
    expect(near.dir).toBe(-1);
    expect(near.x).toBe(500);
    expect(stepBim(near, world({ pointer: { x: 50, y: 50 } })).mode).toBe('idle');
  });

  it('falls with gravity after being dropped and lands on the floor', () => {
    let s = release(dragTo(bim(), { x: 300, y: 200 }, { x: 36, y: 36 }, world()));
    expect(s.mode).toBe('fall');
    for (let i = 0; i < 40 && s.mode === 'fall'; i++) s = stepBim(s, world({ dt: 0.05, now: i * 50 }));
    expect(s).toMatchObject({ mode: 'idle', y: 0, vy: 0 });
  });

  it('keeps a dragged Bim inside the viewport', () => {
    const s = dragTo(bim(), { x: -50, y: -50 }, { x: 0, y: 0 }, world());
    expect(s.x).toBe(0);
    expect(s.y).toBe(800 - 72);
  });

  it('does not walk when motion is reduced', () => {
    expect(stepBim(bim({ x: 100, mode: 'walk' }), world({ reduced: true })).mode).toBe('idle');
    expect(stepBim(bim({ x: 100, mode: 'idle', until: 0 }), world({ reduced: true, now: 99_999 })).mode).toBe('idle');
  });

  it('cheers for a while after a click', () => {
    const c = cheer(bim(), 0);
    expect(moodFor(stepBim(c, world({ now: 100 })).mode)).toBe('happy');
    expect(stepBim(c, world({ now: 5000 })).mode).toBe('idle');
  });
});

describe('dropFrom', () => {
  it('puts Bim under the point and lets him fall to the floor', () => {
    const s = dropFrom(bim({ x: 600 }), { x: 60, y: 50 }, world());
    expect(s).toMatchObject({ mode: 'fall', x: 60 - 36, y: 800 - 50 - 72 });
    let t = s;
    for (let i = 0; i < 60 && t.mode === 'fall'; i++) t = stepBim(t, world({ dt: 0.05 }));
    expect(t).toMatchObject({ mode: 'idle', y: 0 });
  });

  it('keeps him on screen and skips the fall when motion is reduced', () => {
    expect(dropFrom(bim(), { x: 0, y: 50 }, world()).x).toBe(EDGE_PX);
    expect(dropFrom(bim(), { x: 300, y: 50 }, world({ reduced: true }))).toMatchObject({ mode: 'idle', y: 0, x: 300 - 36 });
  });
});

describe('lookOffset', () => {
  it('points the eyes at the pointer, mirrored when Bim faces left', () => {
    const w = world({ pointer: { x: 900, y: 750 } });
    expect(lookOffset(bim({ x: 100, dir: 1 }), w).x).toBeGreaterThan(0);
    expect(lookOffset(bim({ x: 100, dir: -1 }), w).x).toBeLessThan(0);
    expect(Math.hypot(lookOffset(bim(), w).x, lookOffset(bim(), w).y)).toBeLessThanOrEqual(2.2 + 1e-9);
  });
});
