// Route table. Every page is a separate chunk loaded on first visit; nav links preload on hover/focus,
// and the remaining pages for the current role are preloaded when the browser is idle.
import { type ComponentType, type ReactElement, Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { Role } from '@/domain/ticket';

type Loader = () => Promise<{ default: ComponentType }>;

function page<T extends Record<string, unknown>>(load: () => Promise<T>, name: keyof T): Loader {
  return () => load().then((m) => ({ default: m[name] as ComponentType }));
}

const LOADERS = {
  home: page(() => import('@/features/home/HomePage'), 'HomePage'),
  newTicket: page(() => import('@/features/tickets/pages/NewTicketPage'), 'NewTicketPage'),
  myTickets: page(() => import('@/features/tickets/pages/TicketListPage'), 'MyTicketsPage'),
  queue: page(() => import('@/features/tickets/pages/TicketListPage'), 'QueuePage'),
  ticketDetail: page(() => import('@/features/tickets/pages/TicketDetailPage'), 'TicketDetailPage'),
  knowledge: page(() => import('@/features/knowledge/KnowledgePage'), 'KnowledgePage'),
  itDashboard: page(() => import('@/features/it/ItDashboardPage'), 'ItDashboardPage'),
  itBoard: page(() => import('@/features/it/ItBoardPage'), 'ItBoardPage'),
} satisfies Record<string, Loader>;

type PageKey = keyof typeof LOADERS;

const PAGES = {} as Record<PageKey, ComponentType>;
for (const key of Object.keys(LOADERS) as PageKey[]) PAGES[key] = lazy(LOADERS[key]);

const PATH_TO_PAGE: Record<string, PageKey> = {
  '/': 'home',
  '/gui-yeu-cau': 'newTicket',
  '/yeu-cau': 'myTickets',
  '/huong-dan': 'knowledge',
  '/it': 'itDashboard',
  '/it/hang-doi': 'queue',
  '/it/kanban': 'itBoard',
};

const ROLE_PAGES: Record<Role, Array<PageKey>> = {
  employee: ['home', 'newTicket', 'myTickets', 'ticketDetail', 'knowledge'],
  agent: ['itDashboard', 'queue', 'itBoard', 'ticketDetail', 'knowledge'],
};

/** Start downloading a page's chunk ahead of navigation. Safe to call repeatedly (imports are cached). */
export function preloadRoute(path: string) {
  const key = PATH_TO_PAGE[path];
  if (key) void LOADERS[key]();
}

/** Preload the other pages a role is likely to open, once the browser is idle. */
export function preloadRolePages(role: Role): () => void {
  const run = () => ROLE_PAGES[role].forEach((k) => void LOADERS[k]());
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(run, { timeout: 3000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(run, 1500);
  return () => clearTimeout(id);
}

function PageFallback() {
  return (
    <main className="page" aria-busy="true" aria-label="Đang tải trang">
      <div className="page-skeleton">
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}

export function AppRoutes({ role }: { role: Role }) {
  const isAgent = role === 'agent';
  const P = PAGES;
  const agentOnly = (el: ReactElement) => (isAgent ? el : <Navigate to="/" replace />);
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<P.home />} />
        <Route path="/gui-yeu-cau" element={<P.newTicket />} />
        <Route path="/yeu-cau" element={<P.myTickets />} />
        <Route path="/yeu-cau/:id" element={<P.ticketDetail />} />
        <Route path="/huong-dan" element={<P.knowledge />} />
        <Route path="/it" element={agentOnly(<P.itDashboard />)} />
        <Route path="/it/hang-doi" element={agentOnly(<P.queue />)} />
        <Route path="/it/kanban" element={agentOnly(<P.itBoard />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
