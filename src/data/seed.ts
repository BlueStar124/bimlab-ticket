import type { Ticket, TicketEvent, TicketStatus } from '@/domain/ticket';
import { priorityFor } from '@/domain/ticket';

interface SeedTicket {
  title: string;
  description: string;
  categoryId: string;
  impact: Ticket['impact'];
  urgency: Ticket['urgency'];
  status: TicketStatus;
  requesterId: string;
  assigneeId: string | null;
  hoursAgo: number;
  asset?: string;
  rating?: number;
  replies?: Array<[actorId: string, text: string, internal?: boolean]>;
}

const SEED: SeedTicket[] = [
  { title: 'Revit 2025 crash khi mở model trung tâm dự án Vinhomes', description: 'Mở file central của dự án là Revit tự tắt, không có thông báo lỗi. Các bạn cùng nhóm vẫn mở bình thường.', categoryId: 'bim', impact: 'team', urgency: 'high', status: 'in_progress', requesterId: 'u-binh', assigneeId: 'it-duc', hoursAgo: 2.5, asset: 'WS-BIM-014', replies: [['it-duc', 'Mình đã nhận, đang remote vào máy để xem log journal của Revit.'], ['it-duc', 'Nghi do add-in cũ của pyRevit, thử gỡ trước.', true]] },
  { title: 'Không kết nối được VPN từ công trường Thủ Đức', description: 'FortiClient báo "Credential or SSL VPN configuration is wrong (-7200)". Hôm qua vẫn vào được.', categoryId: 'network', impact: 'individual', urgency: 'high', status: 'new', requesterId: 'u-dung', assigneeId: null, hoursAgo: 0.4 },
  { title: 'Máy in khổ A0 tầng 2 báo kẹt giấy liên tục', description: 'In bản vẽ A0 cứ được nửa tờ là báo kẹt. Đã thử tháo cuộn giấy ra lắp lại.', categoryId: 'printer', impact: 'team', urgency: 'medium', status: 'waiting', requesterId: 'u-an', assigneeId: 'it-hanh', hoursAgo: 6, asset: 'PLT-A0-02', replies: [['it-hanh', 'Bạn chụp giúp mình màn hình báo lỗi trên máy in và loại giấy đang dùng nhé?']] },
  { title: 'Xin cấp thêm 1 màn hình 27 inch', description: 'Làm việc với Navisworks cần 2 màn hình để xem model và bảng clash song song.', categoryId: 'hardware', impact: 'individual', urgency: 'low', status: 'new', requesterId: 'u-an', assigneeId: null, hoursAgo: 20 },
  { title: 'Outlook không đồng bộ email từ sáng nay', description: 'Outlook hiện "Disconnected", webmail vẫn nhận bình thường.', categoryId: 'email', impact: 'individual', urgency: 'medium', status: 'resolved', requesterId: 'u-an', assigneeId: 'it-duc', hoursAgo: 28, replies: [['it-duc', 'Đã tạo lại profile Outlook và đồng bộ xong. Bạn kiểm tra giúp mình nhé.']] },
  { title: 'Tài khoản bị khóa sau khi đổi mật khẩu', description: 'Đổi mật khẩu trên điện thoại xong thì máy tính báo tài khoản bị khóa.', categoryId: 'account', impact: 'individual', urgency: 'high', status: 'closed', requesterId: 'u-chau', assigneeId: 'it-hanh', hoursAgo: 50, rating: 5, replies: [['it-hanh', 'Đã mở khóa. Điện thoại còn lưu mật khẩu cũ nên đăng nhập sai nhiều lần, bạn cập nhật lại trên điện thoại nhé.']] },
  { title: 'Ổ dự án P:\\ không truy cập được', description: 'Báo "Access denied" khi vào thư mục P:\\2026-Ecopark. Cần gấp để nộp hồ sơ chiều nay.', categoryId: 'data', impact: 'team', urgency: 'medium', status: 'in_progress', requesterId: 'u-dung', assigneeId: 'it-hanh', hoursAgo: 9 },
  { title: 'Cài Dynamo Player cho nhóm BIM', description: 'Nhóm BIM cần Dynamo Player 2.x trên 6 máy để chạy script đánh số phòng.', categoryId: 'bim', impact: 'team', urgency: 'low', status: 'in_progress', requesterId: 'u-binh', assigneeId: 'it-duc', hoursAgo: 30 },
  { title: 'Wi-Fi phòng họp lớn rất chậm', description: 'Họp Teams với khách hàng bị giật hình, mất tiếng.', categoryId: 'network', impact: 'company', urgency: 'medium', status: 'new', requesterId: 'u-chau', assigneeId: null, hoursAgo: 1.2 },
  { title: 'Excel treo khi mở file dự toán lớn', description: 'File dự toán 40MB mở mất 5 phút rồi treo.', categoryId: 'software', impact: 'individual', urgency: 'medium', status: 'closed', requesterId: 'u-chau', assigneeId: 'it-duc', hoursAgo: 120, rating: 4 },
];

function iso(hoursAgo: number, now: number): string {
  return new Date(now - hoursAgo * 3_600_000).toISOString();
}

export function buildSeed(now: number): { tickets: Ticket[]; events: TicketEvent[] } {
  const tickets: Ticket[] = [];
  const events: TicketEvent[] = [];
  const createdAt = (s: SeedTicket) => iso(s.hoursAgo, now);

  // Oldest first so codes increase with time.
  [...SEED]
    .sort((a, b) => b.hoursAgo - a.hoursAgo)
    .forEach((s, index) => {
      const id = `t-seed-${index + 1}`;
      const created = createdAt(s);
      const step = (fraction: number) => iso(s.hoursAgo * (1 - fraction), now);
      const handled = s.status !== 'new';
      const resolved = s.status === 'resolved' || s.status === 'closed';
      tickets.push({
        id,
        code: `BLT-${new Date(now).toISOString().slice(2, 4)}${new Date(now).toISOString().slice(5, 7)}-${String(index + 1).padStart(4, '0')}`,
        title: s.title,
        description: s.description,
        categoryId: s.categoryId,
        impact: s.impact,
        urgency: s.urgency,
        priority: priorityFor(s.impact, s.urgency),
        status: s.status,
        requesterId: s.requesterId,
        assigneeId: s.assigneeId,
        asset: s.asset ?? '',
        location: '',
        attachments: [],
        createdAt: created,
        updatedAt: step(0.8),
        firstResponseAt: handled ? step(0.1) : null,
        resolvedAt: resolved ? step(0.7) : null,
        closedAt: s.status === 'closed' ? step(0.9) : null,
        waitingSince: s.status === 'waiting' ? step(0.6) : null,
        pausedMs: 0,
        rating: s.rating ?? null,
        ratingComment: '',
      });
      events.push({ id: `${id}-e0`, ticketId: id, at: created, actorId: s.requesterId, kind: 'created', text: 'Đã gửi yêu cầu', internal: false });
      if (s.assigneeId) {
        events.push({ id: `${id}-e1`, ticketId: id, at: step(0.1), actorId: s.assigneeId, kind: 'assign', text: 'Đã nhận xử lý', internal: false });
      }
      (s.replies ?? []).forEach(([actorId, text, internal], i) => {
        events.push({ id: `${id}-r${i}`, ticketId: id, at: step(0.2 + i * 0.15), actorId, kind: internal ? 'note' : 'reply', text, internal: Boolean(internal) });
      });
      if (handled && s.assigneeId) {
        events.push({ id: `${id}-s`, ticketId: id, at: step(0.6), actorId: s.assigneeId, kind: 'status', text: '', internal: false, toStatus: s.status === 'closed' ? 'resolved' : s.status });
      }
      if (s.status === 'closed') {
        events.push({ id: `${id}-c`, ticketId: id, at: step(0.9), actorId: s.requesterId, kind: 'status', text: '', internal: false, toStatus: 'closed' });
      }
      if (s.rating) {
        events.push({ id: `${id}-rt`, ticketId: id, at: step(0.9), actorId: s.requesterId, kind: 'rating', text: `${s.rating}/5`, internal: false });
      }
    });

  return { tickets, events };
}
