// Sign-in state. The session itself is an HttpOnly cookie set by the server; this module only knows who
// is signed in and whether they still have to replace the initial password.
import { useSyncExternalStore } from 'react';
import { AUTH_LOST_EVENT, ApiError, apiRequest } from '@/data/apiClient';
import { loadTeam } from '@/data/people';
import { resetStore } from '@/data/store';
import type { Person } from '@/domain/ticket';

export type SessionState =
  | { status: 'loading' }
  | { status: 'signed-out'; message?: string }
  | { status: 'must-change-password'; user: Person }
  | { status: 'signed-in'; user: Person };

interface Me {
  user: Person;
  mustChangePassword: boolean;
}

let session: SessionState = { status: 'loading' };
const listeners = new Set<() => void>();

function set(next: SessionState) {
  session = next;
  listeners.forEach((fn) => fn());
}

async function adopt(me: Me) {
  if (me.mustChangePassword) {
    set({ status: 'must-change-password', user: me.user });
    return;
  }
  await loadTeam();
  set({ status: 'signed-in', user: me.user });
}

function signOutLocally(message?: string) {
  resetStore();
  set({ status: 'signed-out', message });
}

/** Restores the session from the cookie on page load. */
export async function bootstrapSession() {
  try {
    await adopt(await apiRequest<Me>('/api/auth/me', undefined, { quiet: true }));
  } catch (error) {
    // 401 just means "not signed in"; anything else (network error, proxy 5xx) means the service is unreachable.
    const signedOut = error instanceof ApiError && error.status === 401;
    signOutLocally(signedOut ? undefined : 'Chưa kết nối được backend. Kiểm tra dịch vụ rồi tải lại trang.');
  }
}

export async function login(username: string, password: string) {
  await adopt(await apiRequest<Me>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }, { quiet: true }));
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await adopt(await apiRequest<Me>('/api/auth/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }, { quiet: true }));
}

export async function logout() {
  try {
    await apiRequest<void>('/api/auth/logout', { method: 'POST' }, { quiet: true });
  } finally {
    signOutLocally();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_LOST_EVENT, (event) => {
    if (session.status === 'signed-in' || session.status === 'must-change-password') {
      signOutLocally((event as CustomEvent<string>).detail);
    }
  });
}

export function useSession(): SessionState {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => session,
  );
}

/** The signed-in member. Only for components rendered inside the signed-in app. */
export function useCurrentUser(): Person {
  const current = useSession();
  if (current.status !== 'signed-in') throw new Error('useCurrentUser dùng ngoài phần đã đăng nhập');
  return current.user;
}
