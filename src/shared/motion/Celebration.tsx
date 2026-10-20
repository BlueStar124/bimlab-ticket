// A short, non-blocking celebration over the page (success check, confetti) after a meaningful action.
// Call celebrate() from anywhere, like toast(); <CelebrationHost /> is mounted once in the app shell.
// Purely decorative: it never takes focus or clicks, the toast carries the message for screen readers,
// and nothing plays when the user prefers reduced motion.
import { useEffect, useState } from 'react';
import { LottieAnimation } from '@/shared/motion/LottieAnimation';
import { loadMotion, prefersReducedMotion } from '@/shared/motion/motion';
import './celebration.css';

export type CelebrationKind = 'check' | 'confetti';

interface Celebration {
  id: number;
  kind: CelebrationKind;
  label?: string;
}

let nextId = 1;
const listeners = new Set<(c: Celebration) => void>();

export function celebrate(kind: CelebrationKind, label?: string) {
  if (prefersReducedMotion()) return;
  const c = { id: nextId++, kind, label };
  // Start the download now if it has not happened yet; the overlay shows once the player is ready.
  loadMotion()
    .then(() => listeners.forEach((fn) => fn(c)))
    .catch(() => undefined);
}

export function CelebrationHost() {
  const [current, setCurrent] = useState<Celebration | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const show = (c: Celebration) => {
      setLeaving(false);
      setCurrent(c);
    };
    listeners.add(show);
    return () => {
      listeners.delete(show);
    };
  }, []);

  // Fade out shortly after the animation ends, then unmount it.
  useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(() => setCurrent(null), 260);
    return () => clearTimeout(id);
  }, [leaving]);

  if (!current) return null;
  return (
    <div className={`celebration celebration-${current.kind}${leaving ? ' is-leaving' : ''}`} aria-hidden="true">
      <LottieAnimation key={current.id} name={current.kind === 'check' ? 'successCheck' : 'confetti'} className="celebration-art" onComplete={() => setLeaving(true)} />
      {current.label && <span className="celebration-label">{current.label}</span>}
    </div>
  );
}
