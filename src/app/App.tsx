// App shell: top bar, routed page, footer and the global toast host.
import { useEffect } from 'react';
import { AppBar } from '@/app/AppBar';
import { AppRoutes, preloadPages } from '@/app/routes';
import { useCurrentUser } from '@/data/session';
import { resetDemoData } from '@/data/store';
import { Toaster, toast } from '@/shared/lucian/Toaster';
import { CelebrationHost } from '@/shared/motion/Celebration';
import { preloadMotionWhenIdle } from '@/shared/motion/motion';

export function App() {
  const me = useCurrentUser();
  useEffect(() => preloadPages(), []);
  useEffect(() => preloadMotionWhenIdle(), []);

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
        </footer>
      </div>
      <Toaster />
      <CelebrationHost />
    </div>
  );
}
