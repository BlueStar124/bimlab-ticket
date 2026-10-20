// Client-side store persisted to localStorage so the demo survives reloads.
// Action modules (ticketActions, incidentActions, notifications) are the only writers;
// they are the seam to replace with REST calls once a backend exists.
import { useSyncExternalStore } from 'react';
import { buildSeed } from '@/data/seed';
import type { Incident } from '@/domain/incident';
import type { Ticket, TicketEvent } from '@/domain/ticket';

const STORAGE_KEY = 'bimlab-ticket:data:v1';

export interface StoreState {
  tickets: Ticket[];
  events: TicketEvent[];
  /** Notification event ids each person has read. */
  readBy: Record<string, string[]>;
  /** Incident notices posted by the IT team. Starts empty: nothing is shown until IT posts. */
  incidents: Incident[];
}

function freshState(): StoreState {
  return { ...buildSeed(Date.now()), readBy: {}, incidents: [] };
}

function load(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<StoreState>;
      // Data saved before incident notices existed has no "incidents" field.
      if (saved.tickets && saved.events) {
        return { tickets: saved.tickets, events: saved.events, readBy: saved.readBy ?? {}, incidents: saved.incidents ?? [] };
      }
    }
  } catch {
    // Storage blocked or corrupted: fall back to fresh demo data.
  }
  return freshState();
}

let state: StoreState = load();
const listeners = new Set<() => void>();

export function getState(): StoreState {
  return state;
}

export function setState(next: StoreState) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Demo keeps working in memory when storage is unavailable.
  }
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

export function resetDemoData() {
  setState(freshState());
}
