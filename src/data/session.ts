// Demo session: which role the viewer is acting as. Replace with Keycloak/OIDC when a backend exists.
import { useSyncExternalStore } from 'react';
import { DEMO_ACCOUNT, personById } from '@/domain/people';
import type { Person, Role } from '@/domain/ticket';

const KEY = 'bimlab-ticket:role';
const listeners = new Set<() => void>();

function readRole(): Role {
  try {
    return localStorage.getItem(KEY) === 'agent' ? 'agent' : 'employee';
  } catch {
    return 'employee';
  }
}

let role: Role = readRole();

export function setRole(next: Role) {
  role = next;
  try {
    localStorage.setItem(KEY, next);
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
    () => role,
  );
  const person = personById(DEMO_ACCOUNT[current]);
  if (!person) throw new Error('Thiếu tài khoản demo');
  return person;
}
