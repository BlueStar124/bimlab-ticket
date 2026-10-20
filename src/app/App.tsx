// App shell: top bar, routed page, footer and the global toast host.
import { useEffect } from 'react';
import { AppBar } from '@/app/AppBar';
import { AppRoutes, preloadRolePages } from '@/app/routes';
import { useCurrentUser } from '@/data/session';
import { resetDemoData } from '@/data/store';
import { Toaster, toast } from '@/shared/lucian/Toaster';

export function App() {
  const me = useCurrentUser();
  useEffect(() => preloadRolePages(me.role), [me.role]);

  return (
    <div className="shell">
      <AppBar me={me} />
      <div className="main">
        <AppRoutes role={me.role} />
        <footer className="foot">
          <span>© 2026 BIMLab · Phòng CNTT · Sự cố P1 khẩn cấp: gửi yêu cầu rồi gọi trực tiếp Phòng CNTT</span>
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
    </div>
  );
}
