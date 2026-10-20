// Entry to the motion layer that stays in the main bundle (a few hundred bytes). The player and the
// animations live in runtime.ts, downloaded once: on idle after the first paint, or on first use.
type Runtime = typeof import('@/shared/motion/runtime');

let runtime: Promise<Runtime> | null = null;
let ready = false;

export function loadMotion(): Promise<Runtime> {
  runtime ??= import('@/shared/motion/runtime').then(
    (m) => {
      ready = true;
      return m;
    },
    (err: unknown) => {
      runtime = null; // let a later call retry
      throw err;
    },
  );
  return runtime;
}

/** True once the player is downloaded, so a loading screen can animate without waiting for it. */
export function isMotionReady(): boolean {
  return ready;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Runs `fn` when the browser is idle (or after a short delay where idle callbacks are missing). */
export function whenIdle(fn: () => void, timeout = 4000): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, Math.min(timeout, 2500));
  return () => clearTimeout(id);
}

/** Fetches the player when the browser is idle, so the first celebration plays without a delay. */
export function preloadMotionWhenIdle(): () => void {
  return whenIdle(() => void loadMotion().catch(() => undefined));
}
