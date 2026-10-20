# BIMLab Ticket

Cổng hỗ trợ CNTT nội bộ của BIMLab. Nhân viên gửi yêu cầu khi gặp lỗi; Phòng CNTT tiếp nhận, xử lý và trao đổi trong cùng một yêu cầu cho đến khi xong.

> Trạng thái: **bản frontend độc lập (prototype)**. Dữ liệu demo lưu ở `localStorage` của trình duyệt. App chưa có backend và chưa có đăng nhập (dùng nút chuyển vai trò *Nhân viên / Phòng CNTT*).

## Chạy

```bash
npm install
npm run dev        # http://localhost:5180
npm run typecheck  # tsc -b
npm test           # vitest — quy tắc nghiệp vụ
npm run build      # tsc + vite build
npm run preview    # chạy bản build
```

Cần Node 22.

## Quy trình (theo ITIL, tham khảo Jira Service Management / Freshservice / Zendesk)

1. **Gửi yêu cầu**: chọn nhóm lỗi, mô tả, đính kèm ảnh, chọn *mức ảnh hưởng × độ khẩn cấp*.
2. **Ưu tiên & SLA**: ma trận ra P1–P4.

   | Ưu tiên | Phản hồi | Xử lý xong |
   |---|---|---|
   | P1 Khẩn cấp | 15 phút | 4 giờ |
   | P2 Cao | 30 phút | 8 giờ |
   | P3 Trung bình | 2 giờ | 24 giờ |
   | P4 Thấp | 4 giờ | 72 giờ |

3. **Trạng thái**: Mới → Đang xử lý ⇄ Chờ phản hồi → Đã giải quyết → Đã đóng.
   - Khi ở *Chờ phản hồi*, SLA tạm dừng. Người dùng trả lời thì yêu cầu tự quay về *Đang xử lý*.
   - Ở *Đã giải quyết*, người gửi xác nhận và chấm điểm CSAT (1–5) để đóng, hoặc mở lại.
4. **Thông báo sự cố**: Phòng CNTT tự đăng ở trang Tổng quan (ví dụ "VPN đang gián đoạn, đang xử lý"), chọn mức độ và chuyển Đang xử lý → Đang theo dõi → Đã khắc phục. Nhân viên thấy ở trang chủ; không có thông báo thì hiện "Không có sự cố nào được báo". Không dựa trên hệ thống giám sát nào; thông báo đã khắc phục hiện thêm 24 giờ.
5. **Phòng CNTT**: trang tổng quan (KPI, cần chú ý), hàng đợi theo ưu tiên và hạn SLA, bảng Kanban kéo thả, ghi chú nội bộ, phân công.

SLA hiện tính theo giờ đồng hồ, chưa trừ ngoài giờ làm việc và ngày nghỉ.

## Cấu trúc

```
src/
  main.tsx              điểm vào: nạp CSS global và App
  app/                  khung ứng dụng
    App.tsx             AppBar + trang + footer + toast
    AppBar.tsx          thanh điều hướng, chuyển vai trò demo, chuông, giao diện sáng/tối
    routes.tsx          bảng route; mỗi trang là một chunk lazy-load, tải trước khi rê chuột / lúc rảnh
  domain/               quy tắc nghiệp vụ thuần (không React, không lưu trữ) + test
    ticket.ts           ưu tiên, SLA, chuyển trạng thái, sắp xếp
    incident.ts         thông báo sự cố
    notifications.ts    ai được báo về hoạt động nào
    categories.ts, people.ts, knowledge.ts   dữ liệu tham chiếu (knowledge là nội dung mẫu)
  data/                 trạng thái và ghi dữ liệu; chỗ thay bằng REST API khi có backend
    store.ts            lưu localStorage, useStore, khôi phục dữ liệu demo
    ticketActions.ts, incidentActions.ts, notifications.ts, session.ts, seed.ts
  features/             mỗi thư mục là một tính năng; CSS riêng đặt cạnh component
    home/               trang chủ
    tickets/            gửi yêu cầu, danh sách/hàng đợi, chi tiết (components/detail/*)
    it/                 tổng quan IT, Kanban, KpiCard
    incidents/          bảng thông báo cho nhân viên và khu đăng cho IT
    knowledge/          kho hướng dẫn
    notifications/      dữ liệu cho chuông thông báo
  shared/
    ui/Icon.tsx         Heroicons v2 (react-icons/hi2); mọi icon đi qua đây
    hooks/useNow.ts
    lucian/             element Lucian UX/UI đã port
  styles/               CSS global: tokens, base, layout, components
```

Import dùng alias `@/` (trỏ tới `src/`). Phụ thuộc một chiều: `domain` ← `data` ← `features` ← `app`; `shared` dùng được ở mọi nơi nhưng không import `features`.

### Thêm một tính năng mới

1. Quy tắc nghiệp vụ: hàm thuần trong `src/domain/`, kèm `*.test.ts`.
2. Ghi dữ liệu: hàm trong `src/data/*Actions.ts`; kiểm tra quyền ở đây, không chỉ ẩn nút.
3. Giao diện: thư mục mới trong `src/features/<tên>/`; CSS riêng import từ component của nó.
4. Trang mới: thêm loader vào `LOADERS` và route trong `src/app/routes.tsx`, mục menu trong `AppBar.tsx`.

### Hiệu năng

- Mỗi trang là một chunk riêng (2–6KB gzip). Thư viện nền tách thành `vendor-react`, `vendor-router`, `vendor-icons` để trình duyệt cache lâu dài; cập nhật app chỉ phải tải lại code app (~12KB gzip).
- Trang chủ lần đầu (gzip): ~110KB JS, trong đó ~88KB là React, React Router và icon; ~11KB CSS; logo 11KB. Các trang còn lại được tải trước khi trình duyệt rảnh.
- Icon được tree-shake (chỉ icon đang dùng vào bundle); font chỉ tải 4 độ đậm.

## Giao diện

- Theo DESIGN.md của BIMLab HRM: sidebar trắng + logo BIMLab, nền `#F9FAFB`, thẻ phẳng viền 1px bo 12px, navy `#154D7C` chỉ cho hành động chính/mục đang chọn, màu xanh/vàng/đỏ chỉ mang ý nghĩa trạng thái, font Be Vietnam Pro.
- Icon: Heroicons v2 outline qua `react-icons/hi2` — cùng bộ với HRM; tất cả đi qua `src/components/Icon.tsx`.
- Logo `public/bimlab-logo.png`, `public/lgBL.ico` lấy từ BIMLab_HRM.

## Element Lucian UX/UI (MIT, © 2026 Seokwoooo)

#070 Toast · #016 Đánh giá sao · #032 Upload · #044 FAQ · #255 Kanban · #074 Chuông thông báo · #042 Wizard · #219 Đổi giao diện sáng/tối. Mỗi file giữ dòng license gốc; các điều chỉnh được ghi chú ở đầu file CSS tương ứng.

## Việc tiếp theo để đưa vào sử dụng

- **Kho hướng dẫn hiện là nội dung mẫu** (`KNOWLEDGE` trong `src/domain/catalog.ts`): tên hồ sơ VPN, địa chỉ máy in, chính sách sao lưu NAS, số lần khóa tài khoản… chưa được xác nhận — Phòng CNTT cần thay bằng thông tin thật trước khi dùng.

- Backend + DB (lưu ticket, event, file đính kèm thật), API theo chuẩn các dự án BIMLab.
- Đăng nhập SSO Keycloak qua BIMLab_Platform; lấy danh sách nhân viên từ HRM.
- Thông báo email/Teams; SLA theo lịch làm việc; liên kết mã thiết bị với QLVT.
- Thiết lập Jenkinsfile (lint, test, build) như các dự án khác.
