// Light "realtime": every few seconds, while the tab is visible, ask the server for a short version string
// and reload data only when it changed. Hidden tabs do not poll; coming back to the tab checks at once.
import { loadSyncVersion } from '@/data/ticketApi';
import { hydrateFromBackend } from '@/data/store';

export const SYNC_INTERVAL_MS = 5000;

/** Starts polling for the signed-in member; returns a function that stops it. */
export function startLiveSync(meId: string, intervalMs = SYNC_INTERVAL_MS): () => void {
  let lastVersion: string | null = null;
  let running = false;
  let stopped = false;

  async function check() {
    if (running || stopped || document.visibilityState !== 'visible') return;
    running = true;
    try {
      const version = await loadSyncVersion();
      if (lastVersion !== null && version !== lastVersion && !stopped) await hydrateFromBackend(meId, { quiet: true });
      lastVersion = version;
    } catch {
      // Network blips are retried on the next tick; a lost session signs the member out via the API client.
    } finally {
      running = false;
    }
  }

  const timer = window.setInterval(() => void check(), intervalMs);
  const onVisible = () => void check();
  document.addEventListener('visibilitychange', onVisible);
  void check();
  return () => {
    stopped = true;
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
