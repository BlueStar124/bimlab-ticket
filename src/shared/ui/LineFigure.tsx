// Isometric line figures from Hairline (MIT © Lucas Marques · https://github.com/lucasmarkes/hairline).
// Kept off the critical path: pages name a figure, and the figure code (src/shared/ui/figures.ts) is
// downloaded once, only when the first figure comes near the viewport. Until then the box keeps its
// 5:4 shape so nothing shifts. Colors come from the app tokens in line-figure.css.
import type { Figure } from '@lucasmarkes/hairline';
import { useEffect, useRef } from 'react';
import './line-figure.css';

type FigureModule = typeof import('@/shared/ui/figures');
export type FigureName = keyof FigureModule;

let figuresModule: Promise<FigureModule> | null = null;
function loadFigures(): Promise<FigureModule> {
  figuresModule ??= import('@/shared/ui/figures');
  return figuresModule;
}

interface Props {
  figure: FigureName;
  /** Accessible description in Vietnamese; the package default is English. */
  label: string;
  intensity?: number;
  play?: boolean;
  className?: string;
}

/** How far outside the viewport a figure starts loading. */
const LOAD_MARGIN = '200px';

export function LineFigure({ figure, label, intensity = 0.5, play = false, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useRef<Figure | null>(null);
  const options = useRef({ label, intensity, play });
  options.current = { label, intensity, play };

  useEffect(() => {
    const el = ref.current!;
    let cancelled = false;
    const mount = () => {
      loadFigures()
        .then((m) => {
          if (cancelled) return;
          mounted.current = m[figure](el, options.current);
        })
        .catch(() => {
          // Decorative only: if the chunk fails to load, the empty box stays and the page still works.
          figuresModule = null;
        });
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        mount();
      },
      { rootMargin: LOAD_MARGIN },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      mounted.current?.destroy();
      mounted.current = null;
    };
  }, [figure]);

  useEffect(() => {
    mounted.current?.update({ label, intensity, play });
  }, [label, intensity, play]);

  return <div ref={ref} className={`line-figure${className ? ` ${className}` : ''}`} role="img" aria-label={label} />;
}
