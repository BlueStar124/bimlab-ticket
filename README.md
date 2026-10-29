# BIMLab Ticket

Công cụ báo lỗi nội bộ của team IT BIMLab. Thành viên team báo lỗi phần mềm (CDS, HRM, QLVT, Jobs, Platform, DigitalTwin, Ticket) hoặc sự cố hạ tầng (máy chủ, Jenkins/CI-CD, Docker, cơ sở dữ liệu, mạng, tài khoản). Một người khác trong team nhận và xử lý.

> Trạng thái: frontend đọc/ghi ticket, lịch sử, bình luận, chat và thông báo qua REST API; backend dùng PostgreSQL/MinIO. Đăng nhập bằng tài khoản riêng của app (xem [Đăng nhập](#đăng-nhập)); dữ liệu tự cập nhật vài giây một lần, không cần tải lại trang.

## Chạy

```bash
npm install
npm run dev        # http://localhost:5180
npm run typecheck  # tsc -b
npm test           # vitest — quy tắc nghiệp vụ
npm run build      # tsc + vite build
npm run preview    # chạy bản build
```

Cần Node 22. Giao diện cần backend đang chạy (xem [Backend](#backend)); không có dữ liệu mẫu khi backend tắt.

## Quy trình

1. **Báo lỗi** (`/bao-loi`): chọn loại (lỗi phần mềm / hạ tầng), hệ thống hoặc hạng mục, môi trường (Production / Test / Local, không bắt buộc), tiêu đề, mô tả (có mẫu "các bước tái hiện / mong đợi / thực tế"), mức ưu tiên và đính kèm. Có thể giao ngay cho một người hoặc để trống cho ai đó tự nhận.
2. **Mức ưu tiên** do người báo chọn, ai cũng sửa được sau đó: Khẩn cấp (production dừng, mất/sai dữ liệu) · Cao (chặn công việc) · Trung bình (có cách làm tạm) · Thấp.
3. **Trạng thái**: Mới → Đang làm → Xong. Ai trong team cũng chuyển được giữa bất kỳ hai trạng thái (kể cả mở lại ticket đã xong). Người bấm "Bắt đầu làm" trên ticket chưa có người nhận sẽ tự được gán.
4. **Giao việc**: không phân quyền. Ai cũng tự nhận, giao hoặc chuyển ticket cho người khác.
5. **Kênh chung** (`/tin-nhan`): một cuộc trò chuyện cho cả team. Vuốt tin nhắn sang phải hoặc bấm mũi tên để trả lời kèm trích dẫn; gõ `@` để nhắc tên (không cần gõ dấu: `@duc` → Đỗ Minh Đức); mã `BLT-…` trong tin nhắn thành link tới ticket. Menu hiện số tin chưa đọc.
6. **Thông báo** (chuông; backend tính và lưu trạng thái đã đọc nên đồng bộ giữa các máy): ticket mới chưa giao báo cho cả team cho đến khi có người nhận; ticket giao sẵn chỉ báo người được giao; bình luận, đổi trạng thái/ưu tiên báo cho người báo và người đang làm; tin nhắn trong kênh có `@tên` báo cho người được nhắc.
7. **Bảng link** (`/bang-link`): link hay cả team đã thử, dạng giấy nhớ tô màu theo loại (Tài liệu, Repo, AI & Prompt, Công cụ, Thiết kế, Video, Khác) và chia theo bảng (Frontend, Backend, DevOps, AI, Nội bộ). Dán link vào ô trên cùng hoặc nhấn Ctrl+V ở bất kỳ đâu trên trang: backend lấy tiêu đề và mô tả của trang, giao diện đoán loại và bảng theo domain, người ghim viết một câu "dùng để làm gì". Link đã có trên bảng (kể cả khác `www`, `/` cuối, `utm_*`) thì báo người đã ghim và gợi ý thả tim thay vì tạo tờ trùng. Thả tim cho link hữu ích; "Hot tuần này" xếp theo số tim trong 7 ngày. Ghim đưa tờ lên đầu bảng. Prompt (có hoặc không có link) có nút chép. `/ghi-chu` cũ chuyển sang `/bang-link`.
8. **Cập nhật tự động**: khi tab đang mở, giao diện hỏi `/api/sync/version` mỗi 5 giây và chỉ tải lại dữ liệu khi có thay đổi (ticket, lịch sử, tệp, chat, trạng thái đã đọc). Tab ẩn không hỏi; quay lại tab thì kiểm tra ngay.
9. **Màn hình**: Tổng quan (việc của tôi, việc chưa ai nhận, khối lượng theo người/hệ thống), Danh sách (lọc theo trạng thái, hệ thống, ưu tiên, tìm kiếm), Kanban kéo thả (cột Xong giữ 7 ngày gần nhất), Chi tiết ticket (bình luận, lịch sử), Tin nhắn, Bảng link.

Danh sách việc đang mở xếp theo ưu tiên, cùng mức thì việc chờ lâu nhất lên trước.

## Cấu trúc

```
src/
  main.tsx              điểm vào: nạp CSS global và App
  app/                  khung ứng dụng
    App.tsx             cổng đăng nhập; sau đó AppBar + trang + footer + toast, bật cập nhật tự động
    AuthScreens.tsx     đăng nhập, đặt mật khẩu riêng lần đầu (auth.css)
    AppBar.tsx          thanh điều hướng, chuông, giao diện sáng/tối, đăng xuất
    routes.tsx          bảng route; mỗi trang là một chunk lazy-load, tải trước khi rê chuột / lúc rảnh
  domain/               quy tắc nghiệp vụ thuần (không React, không lưu trữ) + test
    ticket.ts           trạng thái, ưu tiên, sắp xếp, định dạng thời gian
    areas.ts            hệ thống / hạng mục hạ tầng và loại ticket
    people.ts           tên rút gọn
    notifications.ts    kiểu thông báo từ server, đánh dấu đã đọc
    chat.ts             kênh chung: tách @nhắc tên và mã ticket, tin chưa đọc
  data/                 trạng thái và gọi REST API
    apiClient.ts        fetch kèm cookie phiên; 401 đưa về màn hình đăng nhập
    session.ts          đăng nhập: khôi phục phiên, đăng nhập, đổi mật khẩu, đăng xuất
    people.ts           team IT tải từ /api/people sau khi đăng nhập
    store.ts            dữ liệu từ REST API (không lưu trên trình duyệt); làm mới từng ticket sau khi ghi
    liveSync.ts         hỏi phiên bản dữ liệu mỗi 5 giây, tải lại khi đổi
    ticketApi.ts, noteApi.ts  các lời gọi REST
    ticketActions.ts    tạo, đổi trạng thái, giao việc, ưu tiên, bình luận (+ test)
    chatActions.ts      gửi tin nhắn, đánh dấu đã đọc (+ test)
    notifications.ts    đánh dấu thông báo đã đọc trên server
  features/             mỗi thư mục là một tính năng; CSS riêng đặt cạnh component
    dashboard/          trang tổng quan, KpiCard
    tickets/            báo lỗi, danh sách, chi tiết (components/detail/*)
    board/              Kanban
    chat/               kênh chung team (trang, hiển thị @nhắc tên và link ticket)
    links/              bảng link: thẻ giấy nhớ (LinkCard), soạn link (LinkComposer), trang (LinksPage)
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
2. Ghi dữ liệu: hàm trong `src/data/*Actions.ts`; kiểm tra dữ liệu và người thao tác ở đây, không chỉ ẩn nút.
3. Giao diện: thư mục mới trong `src/features/<tên>/`; CSS riêng import từ component của nó.
4. Trang mới: thêm loader vào `LOADERS` và route trong `src/app/routes.tsx`, mục menu trong `AppBar.tsx`.

### Hiệu năng

- Mỗi trang là một chunk riêng (1–4KB gzip). Thư viện nền tách thành `vendor-react`, `vendor-router`, `vendor-icons` để trình duyệt cache lâu dài; cập nhật app chỉ phải tải lại code app (~10KB gzip).
- Trang Tổng quan lần đầu (gzip): ~100KB JS, trong đó ~86KB là React, React Router và icon; ~7KB CSS; logo 11KB. Hình Hairline (~28KB) tải sau, khi hình hiện ra. Các trang còn lại được tải trước khi trình duyệt rảnh.
- Icon được tree-shake (chỉ icon đang dùng vào bundle); font chỉ tải 4 độ đậm.

## Giao diện

- Theo DESIGN.md của BIMLab HRM: sidebar trắng + logo BIMLab, nền `#F9FAFB`, thẻ phẳng viền 1px bo 12px, navy `#154D7C` chỉ cho hành động chính/mục đang chọn, màu xanh/vàng/đỏ chỉ mang ý nghĩa trạng thái, font Be Vietnam Pro.
- Icon: Heroicons v2 outline qua `react-icons/hi2` — cùng bộ với HRM; tất cả đi qua `src/shared/ui/Icon.tsx`.
- Logo `public/bimlab-logo.png`, `public/lgBL.ico` lấy từ BIMLab_HRM.

## Element Lucian UX/UI (MIT, © 2026 Seokwoooo)

#070 Toast · #032 Upload (có nút xóa file) · #255 Kanban · #074 Chuông thông báo · #219 Đổi giao diện sáng/tối · #078 Chat vuốt để trả lời · #268 Danh sách @nhắc tên. Mỗi file giữ dòng license gốc; các điều chỉnh được ghi chú ở đầu file CSS tương ứng.

## Hình minh họa Hairline (MIT, © Lucas Marques)

[`@lucasmarkes/hairline`](https://github.com/lucasmarkes/hairline): hình isometric nét mảnh phản hồi theo con trỏ. Màu lấy từ token `--ux-*` (`src/shared/ui/line-figure.css`), nên theo giao diện sáng/tối.

| Chỗ | Hình |
|---|---|
| Tổng quan, trống | *Basket* (không có việc của tôi), *Settle* (mọi ticket đã có người làm) |
| Danh sách, trống | *Loupe* (lọc không ra, kèm Xóa bộ lọc), *Basket* (chưa có ticket) |
| Kanban, cạnh tiêu đề | *Slow* |
| Báo lỗi, cạnh tiêu đề | *Stack* (lỗi phần mềm) / *Cabinet* (hạ tầng), đổi theo loại |
| Chi tiết ticket, góc thẻ | theo hạng mục: *Terminal* (lỗi phần mềm), *Cabinet* máy chủ, *Branches* CI/CD, *Rebuild* Docker, *Drawer* CSDL, *Router* mạng, *Padlock* tài khoản, *Patch* hạ tầng khác (`detail/areaFigure.ts`) |
| Tin nhắn, kênh trống | *Relay* |

**Hiệu năng.** Trang chỉ đặt tên hình (`<LineFigure figure="hub" … />`); code hình nằm trong một chunk `vendor-hairline` (~28KB gzip, chỉ gồm các hình liệt kê trong `src/shared/ui/figures.ts`) được tải bằng dynamic import khi hình đầu tiên đến gần màn hình, một lần cho cả phiên và cache lâu dài. Trang không có hình trong tầm nhìn không tải chunk này; khung giữ sẵn tỉ lệ 5:4 nên không giật bố cục; hình ẩn ở màn hẹp. Không dùng `@lucasmarkes/hairline/react` vì entry này nạp cả 33 hình. Thêm hình mới: export nó trong `figures.ts` rồi dùng tên.

## Linh vật Bim

Bim là chú hải ly ("kỹ sư xây dựng" của tự nhiên, hợp với BIM) mặc đồng phục BIMLab: tạp dề navy in ba vạch của logo BIMLab, túi có bút chì kiến trúc sư, mũ bảo hộ vàng có vạch navy và cùng biểu tượng. Vẽ bằng SVG trong `src/shared/mascot/Mascot.tsx`, chuyển động bằng CSS (`mascot.css`): thở nhẹ, chớp mắt, vẫy đuôi; dừng khi người dùng bật giảm chuyển động. Khoảng 2KB gzip, không có JavaScript chạy nền.

| Trạng thái (`mood`) | Ở đâu |
|---|---|
| `wave`: vẫy tay | Bim đi dạo, khi chuột lại gần |
| `happy`: nhảy cẫng, hai tay giơ cao | Lớp phủ confetti khi ticket Xong |
| `think`: tay chống cằm, bong bóng "?" | Chi tiết ticket không tìm thấy |
| `idle` + `crop="head"` | Avatar kênh Tin nhắn |
| `walk`: chân bước, tay vung | Bim đi dạo (bên dưới) |

### Bim đi dạo trên web

Bim đi qua lại dọc đáy cửa sổ, thỉnh thoảng nghỉ; mắt nhìn theo con trỏ, chuột lại gần thì dừng lại, quay mặt và vẫy tay. Bấm (hoặc Tab rồi Enter) để Bim nhảy cẫng và nói một câu: số ticket khẩn cấp/chưa ai nhận, việc của bạn, hoặc mẹo dùng app (`features/bim/bimTips.ts`). Kéo để nhấc Bim đi, thả ra Bim rơi xuống đất. Bấm logo BIMLab (thanh trên cùng) thì Bim rơi từ dưới logo xuống, kể cả khi đang bị cất đi. Nút × cất Bim đi (nhớ trong trình duyệt); bật lại bằng logo hoặc nút "Gọi Bim ra chơi" ở footer. Ẩn ở trang Tin nhắn để không che ô soạn.

- Hành vi là hàm thuần trong `features/bim/engine.ts` (có test); `RoamingBim.tsx` chạy một vòng `requestAnimationFrame`, ghi vị trí thẳng vào DOM, React chỉ render lại khi đổi dáng hoặc bong bóng.
- Tải sau (chunk riêng ~3.6KB gzip), không nằm trên đường tải đầu tiên.
- Giảm chuyển động: Bim ngồi yên, vẫn bấm được.

Dùng: `<Mascot mood="wave" size={64} label="" />` (`label=""` khi chỉ để trang trí cạnh chữ), hoặc `<EmptyState mascot="think" … />`.

## Animation Lottie (tự vẽ, lottie-web MIT)

Các animation được viết bằng code trong `src/shared/motion/lottie/animations.ts` (dùng helper `builders.ts`), không tải file JSON từ ngoài. Màu đọc từ token `--ux-*` lúc phát (`palette.ts`) và vẽ lại khi đổi giao diện sáng/tối.

| Animation | Ở đâu |
|---|---|
| `successCheck`: vòng tròn tự vẽ rồi hiện dấu tích | Tạo ticket xong; bấm Nhận việc |
| `confetti`: giấy màu tung lên rồi rơi | Ticket chuyển sang Xong (trang chi tiết và Kanban) |
| `floorsLoader`: ba tầng sàn BIMLab xếp chồng | Chỉ báo "… đang làm" trên ticket đang xử lý |
| `sparkles`: ba ngôi sao lấp lánh | Cạnh tiêu đề Tổng quan |

- Gọi `celebrate('check' | 'confetti', nhãn)` từ bất kỳ đâu (giống `toast()`); lớp phủ không chặn click, không lấy focus, tự tắt sau khi phát xong.
- **Hiệu năng:** trình phát `lottie-web` bản light (chỉ SVG, không expressions, không `eval`) nằm trong chunk `vendor-lottie` ~47KB gzip, kèm animation ~2KB, tải khi trình duyệt rảnh sau lần hiển thị đầu (hoặc khi cần lần đầu), cache lâu dài. Phần trong bundle chính chỉ khoảng 1KB.
- **Giảm chuyển động:** không phát lớp phủ; animation lặp hiển thị một khung đứng yên.
- Thêm animation: viết hàm mới trong `animations.ts`, thêm vào `ANIMATIONS`, rồi dùng `<LottieAnimation name="…" />`. Test trong `animations.test.ts` kiểm tra cấu trúc và màu.

## Việc tiếp theo để đưa vào sử dụng

- Môi trường deploy (Dockerfile frontend, compose, route nginx/gateway) và các stage push/deploy trong Jenkinsfile.
- Màn hình quản trị tài khoản (đặt lại mật khẩu); hiện đặt lại bằng cách xóa dòng trong `ticket.team_accounts`.
- Thông báo mention qua email/Teams; sửa tiêu đề/mô tả sau khi tạo; liên kết commit/PR với ticket.
- Script lint cho frontend (dự án chưa có ESLint/Biome).

## Backend

`backend/ticket-service` là REST service Spring Boot 4 / Java 17. Service sở hữu schema PostgreSQL `ticket` qua Flyway; không dùng chung bảng với sản phẩm khác. Mọi API `/api/**` (trừ `POST /api/auth/login`) cần phiên đăng nhập; người thao tác lấy từ phiên, không từ dữ liệu client gửi.

| Method | Endpoint | Chức năng |
|---|---|---|
| `POST` | `/api/auth/login` | Đăng nhập, đặt cookie phiên |
| `GET` | `/api/auth/me` | Người đang đăng nhập, có cần đổi mật khẩu không |
| `POST` | `/api/auth/password` | Đổi mật khẩu; đăng xuất các phiên khác |
| `POST` | `/api/auth/logout` | Đăng xuất, thu hồi phiên |
| `GET` | `/api/sync/version` | Chuỗi phiên bản dữ liệu cho cập nhật tự động |

Các API nghiệp vụ:

| Method | Endpoint | Chức năng |
|---|---|---|
| `GET` | `/api/tickets` | Danh sách ticket |
| `POST` | `/api/tickets` | Tạo ticket; người báo là người đang đăng nhập |
| `GET` | `/api/tickets/{id}` | Chi tiết ticket |
| `GET` | `/api/tickets/events` | Lịch sử và bình luận của mọi ticket (frontend tải một lần khi mở app) |
| `GET` | `/api/tickets/{id}/events` | Lịch sử ticket và bình luận |
| `PATCH` | `/api/tickets/{id}/status` | Đổi trạng thái; tự nhận việc khi chuyển sang `in_progress` nếu chưa có người làm |
| `PATCH` | `/api/tickets/{id}/assignee` | Giao hoặc bỏ giao ticket |
| `PATCH` | `/api/tickets/{id}/priority` | Đổi mức ưu tiên |
| `POST` | `/api/tickets/{id}/comments` | Thêm bình luận |
| `GET` | `/api/tickets/attachments` | Tệp đính kèm của mọi ticket |
| `GET` | `/api/tickets/{id}/attachments` | Liệt kê tệp đính kèm |
| `POST` | `/api/tickets/{id}/attachments` | Tải tệp lên MinIO, multipart, tối đa 10 MB |
| `GET` | `/api/tickets/{id}/attachments/{fileId}` | Tải tệp xuống |
| `DELETE` | `/api/tickets/{id}/attachments/{fileId}` | Xóa tệp |
| `GET` | `/api/people` | Danh sách team IT (từ `APP_TEAM_MEMBERS`) |
| `GET` | `/api/chat/messages` | 200 tin nhắn gần nhất |
| `POST` | `/api/chat/messages` | Gửi tin nhắn, có thể trả lời tin khác |
| `GET` | `/api/chat/messages/unread-count` | Đếm tin chưa đọc |
| `GET` | `/api/chat/messages/read-marker` | Mốc đã đọc của người đang đăng nhập |
| `POST` | `/api/chat/messages/read-marker` | Cập nhật mốc đã đọc |
| `GET` | `/api/notifications` | 20 hoạt động gần nhất liên quan đến người dùng |
| `POST` | `/api/notifications/read` | Đánh dấu hoạt động đã đọc |
| `GET` | `/api/dashboard` | Tổng ticket, việc của tôi, ticket chưa giao và phân bố việc mở |
| `GET` | `/api/notes?q=&category=&tag=` | Link trên bảng (kèm bảng, ghim, mô tả, người thả tim, số tim trong 7 ngày); lọc tùy chọn |
| `POST` | `/api/notes/preview` | Lấy tiêu đề/mô tả của trang và link trùng nếu có (chỉ http/https cổng 80/443, chặn địa chỉ nội bộ kể cả sau redirect) |
| `POST` | `/api/notes` | Ghim link hoặc prompt; link đã có trên bảng trả 409 |
| `GET` | `/api/notes/{id}` | Xem một ghi chú |
| `PUT` | `/api/notes/{id}` | Cập nhật ghi chú |
| `DELETE` | `/api/notes/{id}` | Xóa ghi chú |
| `PATCH` | `/api/notes/{id}/pin` | Ghim / bỏ ghim lên đầu bảng |
| `PUT` / `DELETE` | `/api/notes/{id}/like` | Thả / bỏ tim |
| `GET` | `/actuator/health` | Liveness/health |

Chạy package backend trong JDK 17:

```bash
cd backend/ticket-service
mvn -B verify
```

Service cần PostgreSQL và MinIO. Cấu hình trong `.env.example`; đặt `SPRING_DATASOURCE_PASSWORD`, `MINIO_ACCESS_KEY` và `MINIO_SECRET_KEY` theo môi trường. `.env.example` dùng bucket `project-files` trên MinIO dùng chung BIMLab (mặc định trong `application.yml` là `bimlab-ticket-files`). Port mặc định là `8086`.

Khi backend chạy ở `localhost:8086`, chạy giao diện bằng `npm run dev` tại `localhost:5180`; Vite proxy `/api` sang backend, nên cookie phiên cùng origin với giao diện. Chỉ tùy chọn giao diện (sáng/tối, Bim) lưu trên trình duyệt.

### Đăng nhập

- **Thành viên** khai báo trong `APP_TEAM_MEMBERS`: các mục `username|Họ tên|Chức danh` cách nhau bằng `;`. Chỉ username có trong danh sách mới đăng nhập và được giao việc; bỏ một người khỏi danh sách thì phiên của họ hết hiệu lực ngay. Khi không đặt biến, mặc định là sáu tài khoản demo `it-nam`, `it-duc`, … để chạy local.
- **Lần đầu**: thành viên đăng nhập bằng mật khẩu tạm `APP_AUTH_INITIAL_PASSWORD` (bí mật, đặt theo môi trường; để trống thì không ai đăng nhập lần đầu được), rồi bắt buộc đặt mật khẩu riêng từ 10 ký tự trước khi dùng app. Mật khẩu lưu dạng BCrypt trong `ticket.team_accounts`.
- **Phiên**: token ngẫu nhiên trong cookie `TICKET_SESSION` (HttpOnly, SameSite=Lax; đặt `APP_AUTH_COOKIE_SECURE=true` khi chạy HTTPS), hết hạn sau `APP_AUTH_SESSION_TTL` (mặc định 12h). DB chỉ lưu SHA-256 của token (`ticket.auth_sessions`). Sai mật khẩu 5 lần thì khóa username 5 phút.
- **Quên mật khẩu**: xóa dòng của người đó trong `ticket.team_accounts`; họ đăng nhập lại bằng mật khẩu tạm và đặt mật khẩu mới.

## CI

`Jenkinsfile` chạy các bước trong container như các dự án BIMLab khác: frontend (`npm ci`, typecheck, vitest kèm báo cáo JUnit, build, tùy chọn `npm audit --audit-level=high`), backend (`mvn verify` trên JDK 17) và build image `bimlab-ticket-service`. Chưa có stage push image hay deploy.
