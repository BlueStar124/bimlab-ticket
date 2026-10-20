// Small helpers for writing Lottie (bodymovin) JSON by hand. Only the parts this app's animations use:
// shape layers with paths, ellipses, rectangles, fills, strokes and trim paths. Frames are at FPS.
export const FPS = 60;

export type RGB = [number, number, number];

interface Bezier {
  x: number[];
  y: number[];
}
export interface Ease {
  o: Bezier;
  i: Bezier;
}

const ease = (ox: number, oy: number, ix: number, iy: number): Ease => ({ o: { x: [ox], y: [oy] }, i: { x: [ix], y: [iy] } });
export const EASE_OUT = ease(0.2, 0.8, 0.2, 1);
export const EASE_IN = ease(0.5, 0, 0.8, 0.4);
export const EASE_IN_OUT = ease(0.6, 0, 0.3, 1);
/** Overshoots a little, like a spring settling. */
export const EASE_BACK = ease(0.3, 0.6, 0.3, 1.4);
export const LINEAR = ease(0, 0, 1, 1);

/** Repeats a one-dimension ease for every dimension of a value, as lottie-web reads them per dimension. */
function easeFor(e: Ease, dims: number) {
  const rep = (b: Bezier) => ({ x: Array(dims).fill(b.x[0]), y: Array(dims).fill(b.y[0]) });
  return { o: rep(e.o), i: rep(e.i) };
}

export type Key = [frame: number, value: number | number[], easeToNext?: Ease];

export function still(value: unknown) {
  return { a: 0, k: value };
}

/** An animated property. Each key eases into the next one with its own curve (default ease-out). */
export function keys(list: Key[]) {
  return {
    a: 1,
    k: list.map(([t, v, e], i) => {
      const s = Array.isArray(v) ? v : [v];
      return i === list.length - 1 ? { t, s } : { t, s, ...easeFor(e ?? EASE_OUT, s.length) };
    }),
  };
}

type Prop = ReturnType<typeof still> | ReturnType<typeof keys>;

export function color(c: RGB, alpha = 1) {
  return still([...c, alpha]);
}

export function fill(c: RGB, opacity: Prop = still(100)) {
  return { ty: 'fl', c: color(c), o: opacity, r: 1, nm: 'fill' };
}

export function stroke(c: RGB, width: number, opacity: Prop = still(100)) {
  return { ty: 'st', c: color(c), o: opacity, w: still(width), lc: 2, lj: 2, ml: 4, nm: 'stroke' };
}

/** Draws a stroke on: `end` goes from 0 to 100 percent. */
export function trim(end: Prop, start: Prop = still(0)) {
  return { ty: 'tm', s: start, e: end, o: still(0), m: 1, nm: 'trim' };
}

/** A polyline or polygon through the given points (straight segments). */
export function path(points: Array<[number, number]>, closed: boolean) {
  // Fresh arrays for each tangent list and vertex: lottie-web rewrites path data in place while it
  // prepares it, so shared arrays would bend the straight segments.
  const zeros = () => points.map(() => [0, 0]);
  const v = points.map(([x, y]) => [x, y]);
  return { ty: 'sh', ks: still({ i: zeros(), o: zeros(), v, c: closed }), nm: 'path' };
}

export function ellipse(size: number, at: [number, number] = [0, 0]) {
  return { ty: 'el', p: still(at), s: still([size, size]), nm: 'ellipse' };
}

export function rect(w: number, h: number, radius = 0) {
  return { ty: 'rc', p: still([0, 0]), s: still([w, h]), r: still(radius), nm: 'rect' };
}

function groupTransform() {
  return { ty: 'tr', p: still([0, 0]), a: still([0, 0]), s: still([100, 100]), r: still(0), o: still(100), sk: still(0), sa: still(0), nm: 'transform' };
}

export function group(items: object[], name = 'group') {
  return { ty: 'gr', it: [...items, groupTransform()], nm: name };
}

interface LayerTransform {
  position: Prop;
  scale?: Prop;
  rotation?: Prop;
  opacity?: Prop;
}

/** A shape layer; layers listed first are drawn on top. */
export function shapeLayer(index: number, name: string, shapes: object[], t: LayerTransform, outPoint: number) {
  return {
    ddd: 0,
    ind: index,
    ty: 4,
    nm: name,
    sr: 1,
    ks: {
      o: t.opacity ?? still(100),
      r: t.rotation ?? still(0),
      p: t.position,
      a: still([0, 0, 0]),
      s: t.scale ?? still([100, 100, 100]),
    },
    ao: 0,
    shapes,
    ip: 0,
    op: outPoint,
    st: 0,
    bm: 0,
  };
}

export function composition(name: string, size: number, outPoint: number, layers: object[]) {
  return { v: '5.7.4', fr: FPS, ip: 0, op: outPoint, w: size, h: size, nm: name, ddd: 0, assets: [], layers };
}

/** Deterministic pseudo-random numbers, so an animation looks the same every time it plays. */
export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
