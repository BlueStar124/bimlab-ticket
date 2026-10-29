// UI state loaded from the REST API after sign-in. Nothing is cached in the browser: signing out clears it,
// and the live-sync loop reloads it when the server reports a change.
import { useSyncExternalStore } from 'react';
import type { ChatMessage } from '@/domain/chat';
import type { SharedNote } from '@/domain/note';
import type { AppNotification } from '@/domain/notifications';
import type { Ticket, TicketEvent } from '@/domain/ticket';
import { loadTicket, loadTicketState } from '@/data/ticketApi';

export interface StoreState {
  /** False until the first load from the server has finished. */
  loaded: boolean;
  tickets: Ticket[];
  events: TicketEvent[];
  /** Notification-bell rows for the signed-in member, newest first, with server-side read state. */
  notifications: AppNotification[];
  /** Team channel, oldest first. */
  messages: ChatMessage[];
  /** Link board. */
  notes: SharedNote[];
  /** Time of the newest channel message each person has seen (only the signed-in member is loaded). */
  chatReadAt: Record<string, string>;
}

export function emptyState(): StoreState {
  return { loaded: false, tickets: [], events: [], notifications: [], messages: [], notes: [], chatReadAt: {} };
}

let state: StoreState = emptyState();
const listeners = new Set<() => void>();

export function getState(): StoreState {
  return state;
}

export function setState(next: StoreState) {
  state = next;
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Subscribe to a slice of state. Selectors must return existing references (derive with useMemo). */
export function useStore<T>(select: (s: StoreState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function resetStore() {
  setState(emptyState());
}

/** Reloads everything for the signed-in member. Quiet loads (background polling) do not toast on failure. */
export async function hydrateFromBackend(meId: string, options?: { quiet?: boolean }) {
  const remote = await loadTicketState(options);
  const localReadAt = state.chatReadAt[meId];
  // A read marker moved locally may not have reached the server yet; never move it backwards.
  const readAt = [localReadAt, remote.chatReadAt].filter((v): v is string => Boolean(v)).sort().at(-1);
  setState({
    loaded: true,
    tickets: remote.tickets,
    events: remote.events,
    notifications: remote.notifications,
    messages: remote.messages,
    notes: remote.notes,
    chatReadAt: readAt ? { [meId]: readAt } : {},
  });
}

/** Replaces one ticket and its history with the server's copy; a ticket not in the list yet goes first. */
export function withTicketSnapshot(s: StoreState, ticket: Ticket, events: TicketEvent[]): StoreState {
  const known = s.tickets.some((t) => t.id === ticket.id);
  return {
    ...s,
    tickets: known ? s.tickets.map((t) => (t.id === ticket.id ? ticket : t)) : [ticket, ...s.tickets],
    events: [...s.events.filter((e) => e.ticketId !== ticket.id), ...events],
  };
}

/** Reconciles one ticket after a write, without reloading every ticket. */
export async function refreshTicketFromBackend(id: string) {
  const { ticket, events } = await loadTicket(id);
  setState(withTicketSnapshot(state, ticket, events));
}
