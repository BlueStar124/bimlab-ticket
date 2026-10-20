// Whether the roaming Bim is shown (per-browser preference, survives reloads), and requests to drop him
// from a point on screen, e.g. a click on the BIMLab logo.
import { useSyncExternalStore } from 'react';

const KEY = 'bimlab-ticket:bim-hidden';
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

let hidden = read();

export function setBimHidden(next: boolean) {
  hidden = next;
  try {
    if (next) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    // In-memory only.
  }
  listeners.forEach((fn) => fn());
}

type DropPoint = { x: number; y: number };
let pendingDrop: DropPoint | null = null;
const dropListeners = new Set<(p: DropPoint) => void>();

/** Shows Bim if he was put away and drops him from `point` (viewport coordinates). */
export function dropBim(point: DropPoint) {
  if (dropListeners.size) dropListeners.forEach((fn) => fn(point));
  else pendingDrop = point; // Bim is not mounted yet (hidden, or his chunk is still loading)
  if (hidden) setBimHidden(false);
}

/** Receives drop requests; one made before Bim mounted is delivered right away. */
export function onBimDrop(fn: (p: DropPoint) => void): () => void {
  dropListeners.add(fn);
  if (pendingDrop) {
    const p = pendingDrop;
    fn(p);
    // Keep it until this commit is over: React StrictMode mounts, unmounts and mounts again at once,
    // and the second mount must get the drop too.
    window.setTimeout(() => {
      if (pendingDrop === p) pendingDrop = null;
    }, 0);
  }
  return () => {
    dropListeners.delete(fn);
  };
}

export function useBimHidden(): boolean {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => hidden,
  );
}
