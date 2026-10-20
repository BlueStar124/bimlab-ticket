// Lazily loaded half of the motion layer: the lottie-web SVG player (light build: no expressions, no eval)
// plus the app's animations. Imported only through loadMotion() in motion.ts.
import lottie from 'lottie-web/build/player/esm/lottie_light.min.js';
import type { AnimationItem } from 'lottie-web';
import { ANIMATIONS, type AnimationName } from '@/shared/motion/lottie/animations';
import { readPalette } from '@/shared/motion/lottie/palette';

export function playAnimation(container: HTMLElement, name: AnimationName, options: { loop: boolean; autoplay: boolean }): AnimationItem {
  return lottie.loadAnimation({
    container,
    renderer: 'svg',
    loop: options.loop,
    autoplay: options.autoplay,
    animationData: ANIMATIONS[name](readPalette()),
    rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
  });
}
