// Demo session: which team member the viewer is acting as. Replace with Keycloak/OIDC when a backend exists.
import { useSyncExternalStore } from 'react';
import { TEAM, personById } from '@/domain/people';
import type { Person } from '@/domain/ticket';

const KEY = 'bimlab-ticket:user';
const listeners = new Set<() => void>();

function readUserId(): string {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && personById(saved)) return saved;
  } catch {
    // Storage blocked: use the default account.
  }
  return TEAM[0].id;
}

let userId = readUserId();

export function setCurrentUser(id: string) {
  if (!personById(id)) throw new Error(`Không có thành viên ${id}`);
  userId = id;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // In-memory only.
  }
  listeners.forEach((fn) => fn());
}

export function useCurrentUser(): Person {
  const current = useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => userId,
  );
  return personById(current) ?? TEAM[0];
}
