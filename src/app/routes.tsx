// Route table. Every page is a separate chunk loaded on first visit; nav links preload on hover/focus,
// and the remaining pages are preloaded when the browser is idle.
import { type ComponentType, Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

type Loader = () => Promise<{ default: ComponentType }>;

function page<T extends Record<string, unknown>>(load: () => Promise<T>, name: keyof T): Loader {
  return () => load().then((m) => ({ default: m[name] as ComponentType }));
}

const LOADERS = {
  dashboard: page(() => import('@/features/dashboard/DashboardPage'), 'DashboardPage'),
  newTicket: page(() => import('@/features/tickets/pages/NewTicketPage'), 'NewTicketPage'),
  ticketList: page(() => import('@/features/tickets/pages/TicketListPage'), 'TicketListPage'),
  ticketDetail: page(() => import('@/features/tickets/pages/TicketDetailPage'), 'TicketDetailPage'),
  board: page(() => import('@/features/board/BoardPage'), 'BoardPage'),
  chat: page(() => import('@/features/chat/ChatPage'), 'ChatPage'),
  links: page(() => import('@/features/links/LinksPage'), 'LinksPage'),
} satisfies Record<string, Loader>;

type PageKey = keyof typeof LOADERS;

const PAGES = {} as Record<PageKey, ComponentType>;
for (const key of Object.keys(LOADERS) as PageKey[]) PAGES[key] = lazy(LOADERS[key]);

const PATH_TO_PAGE: Record<string, PageKey> = {
  '/': 'dashboard',
  '/bao-loi': 'newTicket',
  '/ticket': 'ticketList',
  '/kanban': 'board',
  '/tin-nhan': 'chat',
  '/bang-link': 'links',
};

/** Start downloading a page's chunk ahead of navigation. Safe to call repeatedly (imports are cached). */
export function preloadRoute(path: string) {
  const key = PATH_TO_PAGE[path];
  if (key) void LOADERS[key]();
}

/** Preload every page once the browser is idle; the app is small and the team uses all of it. */
export function preloadPages(): () => void {
  const run = () => (Object.keys(LOADERS) as PageKey[]).forEach((k) => void LOADERS[k]());
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

export function AppRoutes() {
  const P = PAGES;
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<P.dashboard />} />
        <Route path="/bao-loi" element={<P.newTicket />} />
        <Route path="/ticket" element={<P.ticketList />} />
        <Route path="/ticket/:id" element={<P.ticketDetail />} />
        <Route path="/kanban" element={<P.board />} />
        <Route path="/tin-nhan" element={<P.chat />} />
        <Route path="/bang-link" element={<P.links />} />
        <Route path="/ghi-chu" element={<Navigate to="/bang-link" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
