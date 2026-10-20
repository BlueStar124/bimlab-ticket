// Plays one of the app's Lottie animations (shared/motion/lottie/animations.ts). The player is loaded
// on demand; colours are read from the theme tokens and rebuilt when the theme changes. Under
// prefers-reduced-motion the animation shows a single still frame instead of playing.
import type { AnimationItem } from 'lottie-web';
import { useEffect, useRef } from 'react';
import type { AnimationName } from '@/shared/motion/lottie/animations';
import { isMotionReady, loadMotion, prefersReducedMotion, whenIdle } from '@/shared/motion/motion';

interface Props {
  name: AnimationName;
  loop?: boolean;
  /** Frame shown when motion is reduced; defaults to the last frame. */
  stillFrame?: number;
  onComplete?: () => void;
  /** Decorative loops: if the player is not downloaded yet, wait for an idle moment instead of fetching now. */
  deferUntilIdle?: boolean;
  className?: string;
}

export function LottieAnimation({ name, loop = false, stillFrame, onComplete, deferUntilIdle = false, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const el = ref.current!;
    let item: AnimationItem | null = null;
    let cancelled = false;

    const start = () => {
      loadMotion()
        .then(({ playAnimation }) => {
          if (cancelled) return;
          item?.destroy();
          const still = prefersReducedMotion();
          item = playAnimation(el, name, { loop: loop && !still, autoplay: !still });
          if (still) {
            item.goToAndStop(stillFrame ?? item.totalFrames - 1, true);
            onCompleteRef.current?.();
          } else {
            item.addEventListener('complete', () => onCompleteRef.current?.());
          }
        })
        .catch(() => onCompleteRef.current?.()); // decorative: a failed download just skips it
    };
    let cancelIdle: (() => void) | undefined;
    if (deferUntilIdle && !isMotionReady()) cancelIdle = whenIdle(start);
    else start();

    // Colours are baked into the animation data, so redraw it when the theme switches.
    const themeObserver = new MutationObserver(start);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    scheme.addEventListener('change', start);

    return () => {
      cancelled = true;
      cancelIdle?.();
      themeObserver.disconnect();
      scheme.removeEventListener('change', start);
      item?.destroy();
    };
  }, [name, loop, stillFrame, deferUntilIdle]);

  return <div ref={ref} className={className} aria-hidden="true" />;
}
