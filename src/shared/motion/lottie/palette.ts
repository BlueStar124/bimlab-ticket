// Reads the app's --ux-* colour tokens as Lottie RGB triples (0..1), for the current theme.
import type { Palette } from '@/shared/motion/lottie/animations';
import type { RGB } from '@/shared/motion/lottie/builders';

function parse(css: string): [number, number, number, number] {
  const n = css.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
  return [n[0] / 255, n[1] / 255, n[2] / 255, n[3] ?? 1];
}

function mix(a: RGB, b: RGB, amount: number): RGB {
  return [0, 1, 2].map((i) => a[i] * amount + b[i] * (1 - amount)) as RGB;
}

/** Resolves each token through a probe element, so any CSS colour syntax ends up as rgb()/rgba(). */
export function readPalette(root: HTMLElement = document.body): Palette {
  const probe = document.createElement('span');
  probe.style.display = 'none';
  root.appendChild(probe);
  const get = (token: string): RGB => {
    probe.style.color = `var(${token})`;
    const [r, g, b] = parse(getComputedStyle(probe).color);
    return [r, g, b];
  };
  const surface = get('--ux-surface');
  const accent = get('--ux-accent');
  const palette: Palette = {
    accent,
    accent2: get('--ux-accent-2'),
    // Same idea as --ux-accent-soft, but opaque so it reads the same on any background.
    accentSoft: mix(accent, surface, 0.14),
    mint: get('--ux-mint'),
    warn: get('--ux-warn'),
    danger: get('--ux-danger'),
    line: get('--ux-ink-3'),
    surface,
  };
  probe.remove();
  return palette;
}
