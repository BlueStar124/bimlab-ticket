import { describe, expect, it } from 'vitest';
import { ANIMATIONS, type Palette } from '@/shared/motion/lottie/animations';
import { path } from '@/shared/motion/lottie/builders';

const palette: Palette = {
  accent: [0.08, 0.3, 0.49],
  accent2: [0.18, 0.51, 0.71],
  accentSoft: [0.9, 0.93, 0.96],
  mint: [0.02, 0.47, 0.34],
  warn: [0.71, 0.33, 0.04],
  danger: [0.75, 0.07, 0.24],
  line: [0.42, 0.45, 0.5],
  surface: [1, 1, 1],
};

describe('path', () => {
  it('gives each tangent list and vertex its own array, since lottie-web mutates them', () => {
    const k = path([[0, 0], [10, 0]], false).ks.k as { i: number[][]; o: number[][]; v: number[][] };
    expect(k.i).not.toBe(k.o);
    expect(k.i[0]).not.toBe(k.o[0]);
    k.o[0][0] += 5;
    expect(k.i[0]).toEqual([0, 0]);
  });
});

describe('animations', () => {
  it.each(Object.keys(ANIMATIONS) as Array<keyof typeof ANIMATIONS>)('%s builds a valid composition from the palette', (name) => {
    const data = ANIMATIONS[name](palette) as { fr: number; op: number; w: number; h: number; layers: Array<{ ty: number; op: number }> };
    expect(data.fr).toBe(60);
    expect(data.op).toBeGreaterThan(0);
    expect(data.w).toBe(data.h);
    expect(data.layers.length).toBeGreaterThan(0);
    for (const layer of data.layers) {
      expect(layer.ty).toBe(4);
      expect(layer.op).toBe(data.op);
    }
    // Colours come only from the palette.
    const colors = JSON.stringify(data).match(/"c":\{"a":0,"k":\[[^\]]+\]/g) ?? [];
    const allowed = Object.values(palette).map((c) => JSON.stringify([...c, 1]));
    for (const c of colors) expect(allowed).toContain(c.slice(c.indexOf('[')));
  });

  it('builds the same confetti every time', () => {
    expect(JSON.stringify(ANIMATIONS.confetti(palette))).toBe(JSON.stringify(ANIMATIONS.confetti(palette)));
  });
});
