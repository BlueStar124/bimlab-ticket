// The app's Lottie animations, drawn in code so they use the live theme colours and stay a few KB.
// Each one is a pure function of the palette and returns bodymovin JSON for lottie-web.
import type { RGB } from '@/shared/motion/lottie/builders';
import { EASE_BACK, EASE_IN, EASE_IN_OUT, EASE_OUT, LINEAR, composition, ellipse, fill, group, keys, path, rect, seeded, shapeLayer, still, stroke, trim } from '@/shared/motion/lottie/builders';

export interface Palette {
  accent: RGB;
  accent2: RGB;
  accentSoft: RGB;
  mint: RGB;
  warn: RGB;
  danger: RGB;
  line: RGB;
  surface: RGB;
}

/** A ring draws itself, fills softly and pops, then a check mark is drawn inside. ~1.2s, plays once. */
function successCheck(p: Palette) {
  const OUT = 72;
  const c = 60;
  const pop = keys([
    [24, [100, 100, 100], EASE_IN_OUT],
    [32, [109, 109, 100], EASE_IN_OUT],
    [42, [100, 100, 100]],
  ]);
  const check = shapeLayer(
    1,
    'check',
    [group([path([[-17, 1], [-5, 13], [19, -12]], false), trim(keys([[22, 0, EASE_OUT], [44, 100]])), stroke(p.accent, 6)])],
    { position: still([c, c, 0]), scale: pop },
    OUT,
  );
  const ring = shapeLayer(
    2,
    'ring',
    [group([ellipse(86), trim(keys([[0, 0, EASE_IN_OUT], [26, 100]])), stroke(p.accent, 5)])],
    { position: still([c, c, 0]), scale: pop, rotation: still(-90) },
    OUT,
  );
  const disc = shapeLayer(3, 'disc', [group([ellipse(86), fill(p.accentSoft)])], { position: still([c, c, 0]), scale: pop, opacity: keys([[8, 0], [26, 100]]) }, OUT);
  return composition('success-check', 120, OUT, [check, ring, disc]);
}

/** Paper confetti bursts up from the middle, tumbles and falls away. ~1.7s, plays once. */
function confetti(p: Palette) {
  const OUT = 104;
  const size = 320;
  const rnd = seeded(7);
  const colors = [p.accent, p.accent2, p.mint, p.warn, p.danger];
  const layers = Array.from({ length: 22 }, (_, i) => {
    const angle = -Math.PI / 2 + (rnd() - 0.5) * Math.PI * 1.25;
    const dist = 70 + rnd() * 80;
    const x0 = size / 2;
    const y0 = size / 2 + 20;
    const x1 = x0 + Math.cos(angle) * dist;
    const y1 = y0 + Math.sin(angle) * dist;
    const x2 = x1 + (rnd() - 0.5) * 40;
    const y2 = y1 + 70 + rnd() * 50;
    const peak = 30 + Math.round(rnd() * 10);
    const piece = i % 3 === 0 ? ellipse(7) : rect(9, 5, 1);
    return shapeLayer(
      i + 1,
      `piece-${i}`,
      [group([piece, fill(colors[i % colors.length])])],
      {
        position: keys([
          [0, [x0, y0, 0], EASE_OUT],
          [peak, [x1, y1, 0], EASE_IN],
          [OUT - 8, [x2, y2, 0]],
        ]),
        scale: keys([[0, [0, 0, 100], EASE_BACK], [10, [100, 100, 100]]]),
        rotation: keys([[0, 0, LINEAR], [OUT - 8, (rnd() > 0.5 ? 1 : -1) * (300 + rnd() * 420)]]),
        opacity: keys([[peak + 30, 100, EASE_IN], [OUT - 8, 0]]),
      },
      OUT,
    );
  });
  return composition('confetti', size, OUT, layers);
}

/** BIMLab floors: three isometric slabs drop in one by one, hold, then lift away. Loops (2s). */
function floorsLoader(p: Palette) {
  const OUT = 120;
  const T = 6; // slab thickness
  // A fill or stroke paints every path above it in its group, so the top face and the sides are
  // separate groups; the face group comes first and covers the sides' closing edge.
  const slab = (top: boolean) => [
    group([path([[0, -16.5], [33, 0], [0, 16.5], [-33, 0]], true), fill(p.surface), stroke(top ? p.accent : p.line, 2.4)], 'face'),
    group([path([[-33, 0], [-33, T], [0, 16.5 + T], [33, T], [33, 0]], false), path([[0, 16.5], [0, 16.5 + T]], false), fill(p.surface), stroke(top ? p.accent : p.line, 2.4)], 'sides'),
  ];
  const floor = (index: number, y: number, start: number, top: boolean) =>
    shapeLayer(
      index,
      `floor-${index}`,
      slab(top),
      {
        position: keys([
          [start, [60, y - 26, 0], EASE_BACK],
          [start + 18, [60, y, 0], EASE_IN_OUT],
          [84, [60, y, 0], EASE_IN],
          [100, [60, y - 14, 0]],
        ]),
        opacity: keys([
          [start, 0, EASE_OUT],
          [start + 10, 100, LINEAR],
          [86, 100, EASE_IN],
          [100, 0],
        ]),
      },
      OUT,
    );
  // Top floor first so it is drawn over the ones below.
  return composition('floors-loader', 120, OUT, [floor(1, 42, 28, true), floor(2, 62, 14, false), floor(3, 82, 0, false)]);
}

/** Three sparkles twinkle in turn, then rest. Loops (2s). */
function sparkles(p: Palette) {
  const OUT = 120;
  const star = (r: number) => {
    const k = r * 0.36;
    return path([[0, -r], [k, -k], [r, 0], [k, k], [0, r], [-k, k], [-r, 0], [-k, -k]], true);
  };
  const twinkle = (index: number, at: [number, number], r: number, c: RGB, start: number) =>
    shapeLayer(
      index,
      `sparkle-${index}`,
      [group([star(r), fill(c)])],
      {
        position: still([...at, 0]),
        scale: keys([
          [start, [0, 0, 100], EASE_BACK],
          [start + 16, [100, 100, 100], EASE_IN],
          [start + 40, [0, 0, 100]],
        ]),
        rotation: keys([[start, -15, LINEAR], [start + 40, 25]]),
      },
      OUT,
    );
  return composition('sparkles', 60, OUT, [twinkle(1, [22, 24], 11, p.accent, 0), twinkle(2, [43, 14], 6.5, p.warn, 14), twinkle(3, [42, 40], 7.5, p.accent2, 28)]);
}

export const ANIMATIONS = {
  successCheck,
  confetti,
  floorsLoader,
  sparkles,
} satisfies Record<string, (p: Palette) => object>;

export type AnimationName = keyof typeof ANIMATIONS;
