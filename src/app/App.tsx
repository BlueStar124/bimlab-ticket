// App shell: sign-in gate, then top bar, routed page, footer and the global toast host.
import { Suspense, lazy, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppBar } from '@/app/AppBar';
import { AppRoutes, preloadPages } from '@/app/routes';
import { ChangePasswordScreen, LoginScreen } from '@/app/AuthScreens';
import { startLiveSync } from '@/data/liveSync';
import { bootstrapSession, useCurrentUser, useSession } from '@/data/session';
import { hydrateFromBackend, useStore } from '@/data/store';
import { setBimHidden, useBimHidden } from '@/features/bim/bimPrefs';
import { Toaster, toast } from '@/shared/lucian/Toaster';
import { CelebrationHost } from '@/shared/motion/Celebration';
import { preloadMotionWhenIdle } from '@/shared/motion/motion';

// Bim arrives after the page: his code is its own chunk, off the critical path.
const RoamingBim = lazy(() => import('@/features/bim/RoamingBim').then((m) => ({ default: m.RoamingBim })));

export function App() {
  const session = useSession();
  useEffect(() => {
    void bootstrapSession();
  }, []);
  if (session.status === 'loading') return <div className="auth-screen" aria-busy="true" />;
  if (session.status === 'signed-out') return <LoginScreen key={session.message ?? ''} notice={session.message} />;
  if (session.status === 'must-change-password') return <ChangePasswordScreen user={session.user} />;
  return <SignedInApp />;
}

function SignedInApp() {
  const me = useCurrentUser();
  const loaded = useStore((s) => s.loaded);
  useEffect(() => preloadPages(), []);
  useEffect(() => {
    void hydrateFromBackend(me.id).catch((error: unknown) => {
      toast({ kind: 'err', title: 'Chưa tải được dữ liệu', detail: error instanceof Error ? error.message : 'Thử tải lại trang' });
    });
    return startLiveSync(me.id);
  }, [me.id]);
  useEffect(() => {
    const onApiError = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      toast({ kind: 'err', title: 'Không lưu được lên backend', detail });
    };
    window.addEventListener('ticket-api-error', onApiError);
    return () => window.removeEventListener('ticket-api-error', onApiError);
  }, []);
  useEffect(() => preloadMotionWhenIdle(), []);
  const bimHidden = useBimHidden();
  // The channel's composer sits at the bottom of the window, where Bim walks.
  const bimFits = useLocation().pathname !== '/tin-nhan';

  return (
    <div className="shell">
      <AppBar me={me} />
      <div className="main">
        {loaded ? <AppRoutes /> : <main className="page" aria-busy="true" />}
        <footer className="foot">
          <span>© 2026 BIMLab · Team IT · Sự cố khẩn cấp trên production: tạo ticket rồi báo trực tiếp trưởng nhóm</span>
          {bimHidden && (
            <button type="button" onClick={() => setBimHidden(false)}>
              Gọi Bim ra chơi
            </button>
          )}
        </footer>
      </div>
      <Toaster />
      <CelebrationHost />
      {!bimHidden && bimFits && (
        <Suspense fallback={null}>
          <RoamingBim />
        </Suspense>
      )}
    </div>
  );
}
