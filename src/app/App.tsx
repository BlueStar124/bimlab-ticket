// App shell: top bar, routed page, footer and the global toast host.
import { Suspense, lazy, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppBar } from '@/app/AppBar';
import { AppRoutes, preloadPages } from '@/app/routes';
import { useCurrentUser } from '@/data/session';
import { resetDemoData } from '@/data/store';
import { setBimHidden, useBimHidden } from '@/features/bim/bimPrefs';
import { Toaster, toast } from '@/shared/lucian/Toaster';
import { CelebrationHost } from '@/shared/motion/Celebration';
import { preloadMotionWhenIdle } from '@/shared/motion/motion';

// Bim arrives after the page: his code is its own chunk, off the critical path.
const RoamingBim = lazy(() => import('@/features/bim/RoamingBim').then((m) => ({ default: m.RoamingBim })));

export function App() {
  const me = useCurrentUser();
  useEffect(() => preloadPages(), []);
  useEffect(() => preloadMotionWhenIdle(), []);
  const bimHidden = useBimHidden();
  // The channel's composer sits at the bottom of the window, where Bim walks.
  const bimFits = useLocation().pathname !== '/tin-nhan';

  return (
    <div className="shell">
      <AppBar me={me} />
      <div className="main">
        <AppRoutes />
        <footer className="foot">
          <span>© 2026 BIMLab · Team IT · Sự cố khẩn cấp trên production: tạo ticket rồi báo trực tiếp trưởng nhóm</span>
          <button
            type="button"
            onClick={() => {
              resetDemoData();
              toast({ kind: 'ok', title: 'Đã khôi phục dữ liệu mẫu' });
            }}
          >
            Khôi phục dữ liệu demo
          </button>
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
