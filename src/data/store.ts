// Client-side store persisted to localStorage so the demo survives reloads.
// Action modules (ticketActions, chatActions, notifications) are the only writers;
// they are the seam to replace with REST calls once a backend exists.
import { useSyncExternalStore } from 'react';
import { buildSeed } from '@/data/seed';
import type { ChatMessage } from '@/domain/chat';
import type { Ticket, TicketEvent } from '@/domain/ticket';

// v2: IT-team tracker. Data from the v1 helpdesk prototype has another shape and is ignored.
const STORAGE_KEY = 'bimlab-ticket:data:v2';

export interface StoreState {
  tickets: Ticket[];
  events: TicketEvent[];
  /** Notification event ids each person has read. */
  readBy: Record<string, string[]>;
  /** Team channel, oldest first. */
  messages: ChatMessage[];
  /** Time of the newest channel message each person has seen. */
  chatReadAt: Record<string, string>;
}

function freshState(): StoreState {
  return { ...buildSeed(Date.now()), readBy: {} };
}

function load(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<StoreState>;
      if (saved.tickets && saved.events) {
        // Data saved before the team channel existed gets the demo conversation.
        const seed = saved.messages ? null : buildSeed(Date.now());
        return {
          tickets: saved.tickets,
          events: saved.events,
          readBy: saved.readBy ?? {},
          messages: seed ? seed.messages : saved.messages!,
          chatReadAt: saved.chatReadAt ?? seed?.chatReadAt ?? {},
        };
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
