// Demo tickets and team-channel messages for the prototype. Content is illustrative, not real incidents.
import type { ChatMessage } from '@/domain/chat';
import { TEAM } from '@/domain/people';
import type { Environment, Priority, Ticket, TicketEvent, TicketStatus } from '@/domain/ticket';

interface SeedTicket {
  title: string;
  description: string;
  areaId: string;
  environment: Environment | null;
  priority: Priority;
  status: TicketStatus;
  reporterId: string;
  assigneeId: string | null;
  hoursAgo: number;
  comments?: Array<[actorId: string, text: string]>;
}

const SEED: SeedTicket[] = [
  {
    title: 'HRM: lọc nhân viên theo phòng ban trả về danh sách rỗng',
    description: 'Các bước tái hiện:\n1. Vào Nhân sự → Danh sách nhân viên\n2. Chọn phòng ban "Phòng BIM"\n\nKết quả mong đợi: hiện nhân viên của phòng\nKết quả thực tế: bảng rỗng, API trả 200 với content = []',
    areaId: 'hrm', environment: 'test', priority: 'high', status: 'in_progress', reporterId: 'it-trang', assigneeId: 'it-duc', hoursAgo: 5,
    comments: [['it-duc', 'Query đang so sánh department_id với mã phòng ban thay vì id. Đang sửa.']],
  },
  {
    title: 'Jenkins: pipeline CDS fail ở bước dependency audit',
    description: 'Build nhánh test fail từ sáng nay ở stage "Dependency audit", báo 1 lỗ hổng mức high trong thư viện frontend.',
    areaId: 'ci', environment: null, priority: 'high', status: 'todo', reporterId: 'it-huy', assigneeId: null, hoursAgo: 1.5,
  },
  {
    title: 'Server test sắp đầy ổ đĩa (92%)',
    description: 'Phần lớn dung lượng là image Docker cũ và log container. Cần dọn và đặt lịch prune.',
    areaId: 'server', environment: 'test', priority: 'urgent', status: 'in_progress', reporterId: 'it-hanh', assigneeId: 'it-bao', hoursAgo: 3,
    comments: [['it-bao', 'Đã prune image không dùng, còn 71%. Đang cấu hình giới hạn kích thước log.']],
  },
  {
    title: 'QLVT: xuất Excel biên bản kiểm kê lỗi font tiếng Việt',
    description: 'File Excel mở ra bị lỗi dấu ở cột "Tên tài sản". Bản PDF thì bình thường.',
    areaId: 'qlvt', environment: 'production', priority: 'medium', status: 'todo', reporterId: 'it-nam', assigneeId: 'it-huy', hoursAgo: 20,
  },
  {
    title: 'Platform: token đăng nhập hết hạn sau 5 phút',
    description: 'Người dùng bị đẩy ra trang đăng nhập liên tục. Nghi refresh token không được gọi.',
    areaId: 'platform', environment: 'test', priority: 'high', status: 'done', reporterId: 'it-trang', assigneeId: 'it-duc', hoursAgo: 30,
    comments: [['it-duc', 'Interceptor gọi refresh sai endpoint sau khi đổi gateway. Đã sửa và deploy lên test.'], ['it-trang', 'Đã kiểm tra lại, ổn.']],
  },
  {
    title: 'Jobs: trang thống kê truy cập không tải được dữ liệu',
    description: 'Trang admin báo "Không lấy được số liệu". Console có lỗi 401 khi gọi API thống kê.',
    areaId: 'jobs', environment: 'local', priority: 'low', status: 'todo', reporterId: 'it-huy', assigneeId: null, hoursAgo: 26,
  },
  {
    title: 'Cấp quyền Git repo BIMLab_Ticket cho thành viên mới',
    description: 'Thêm quyền push nhánh feature cho bạn thực tập mới vào team.',
    areaId: 'access', environment: null, priority: 'low', status: 'done', reporterId: 'it-nam', assigneeId: 'it-hanh', hoursAgo: 50,
  },
  {
    title: 'CDS: kéo thả công việc trên Kanban bị nhảy về cột cũ',
    description: 'Kéo thẻ sang "Đang làm" thì thẻ quay về cột cũ sau khoảng 1 giây, F5 thì lại thấy đã chuyển.',
    areaId: 'cds', environment: 'production', priority: 'medium', status: 'in_progress', reporterId: 'it-nam', assigneeId: 'it-huy', hoursAgo: 9,
  },
  {
    title: 'Backup database đêm qua không chạy',
    description: 'Không thấy file backup ngày hôm qua trong thư mục lưu trữ. Cron vẫn đang bật.',
    areaId: 'database', environment: 'production', priority: 'urgent', status: 'todo', reporterId: 'it-bao', assigneeId: null, hoursAgo: 0.6,
  },
  {
    title: 'DigitalTwin: model 3D tải chậm trên trình duyệt',
    description: 'Model dự án mẫu mất khoảng 40 giây mới hiện. Cần xem lại cách nén và tải dần.',
    areaId: 'digitaltwin', environment: 'test', priority: 'low', status: 'done', reporterId: 'it-trang', assigneeId: 'it-huy', hoursAgo: 120,
  },
];

function iso(hoursAgo: number, now: number): string {
  return new Date(now - hoursAgo * 3_600_000).toISOString();
}

interface SeedMessage {
  authorId: string;
  /** "{t:<title start>}" is replaced with that seed ticket's code. */
  text: string;
  hoursAgo: number;
  /** Index into SEED_MESSAGES of the message this one replies to. */
  replyTo?: number;
}

const SEED_MESSAGES: SeedMessage[] = [
  { authorId: 'it-nam', text: 'Chào cả team, từ tuần này lỗi và sự cố đều tạo ticket nhé, trao đổi nhanh thì nhắn ở đây.', hoursAgo: 27 },
  { authorId: 'it-trang', text: 'Đã test lại {t:Platform: token}, ổn rồi. Cảm ơn @Đỗ Minh Đức', hoursAgo: 24 },
  { authorId: 'it-duc', text: '👍', hoursAgo: 23.8, replyTo: 1 },
  { authorId: 'it-bao', text: 'Server test lên 92% ổ đĩa, mình đang dọn image Docker cũ: {t:Server test}', hoursAgo: 3 },
  { authorId: 'it-hanh', text: 'Nhớ đặt lịch prune tự động luôn nhé, tháng trước cũng đầy một lần rồi.', hoursAgo: 2.8, replyTo: 3 },
  { authorId: 'it-huy', text: '{t:Jenkins: pipeline} đang chặn merge nhánh test của CDS. @Phạm Gia Bảo rảnh xem giúp mình được không?', hoursAgo: 1.4 },
  { authorId: 'it-bao', text: 'Backup DB đêm qua không chạy, mình tạo {t:Backup database} rồi, ưu tiên khẩn cấp. @Nguyễn Hải Nam anh xem ai nhận giúp em.', hoursAgo: 0.5 },
];

export function buildSeed(now: number): { tickets: Ticket[]; events: TicketEvent[]; messages: ChatMessage[]; chatReadAt: Record<string, string> } {
  const tickets: Ticket[] = [];
  const events: TicketEvent[] = [];
  const month = new Date(now).toISOString();

  // Oldest first so codes increase with time.
  [...SEED]
    .sort((a, b) => b.hoursAgo - a.hoursAgo)
    .forEach((s, index) => {
      const id = `t-seed-${index + 1}`;
      const created = iso(s.hoursAgo, now);
      const step = (fraction: number) => iso(s.hoursAgo * (1 - fraction), now);
      const started = s.status !== 'todo';
      tickets.push({
        id,
        code: `BLT-${month.slice(2, 4)}${month.slice(5, 7)}-${String(index + 1).padStart(4, '0')}`,
        title: s.title,
        description: s.description,
        areaId: s.areaId,
        environment: s.environment,
        priority: s.priority,
        status: s.status,
        reporterId: s.reporterId,
        assigneeId: s.assigneeId,
        attachments: [],
        createdAt: created,
        updatedAt: step(0.8),
        startedAt: started ? step(0.2) : null,
        doneAt: s.status === 'done' ? step(0.8) : null,
      });
      events.push({ id: `${id}-e0`, ticketId: id, at: created, actorId: s.reporterId, kind: 'created', text: 'Đã báo lỗi' });
      if (s.assigneeId) {
        events.push({ id: `${id}-e1`, ticketId: id, at: step(0.1), actorId: s.assigneeId, kind: 'assign', text: 'Đã nhận việc', toAssigneeId: s.assigneeId });
      }
      if (started && s.assigneeId) {
        events.push({ id: `${id}-s1`, ticketId: id, at: step(0.2), actorId: s.assigneeId, kind: 'status', text: '', toStatus: 'in_progress' });
      }
      (s.comments ?? []).forEach(([actorId, text], i) => {
        events.push({ id: `${id}-c${i}`, ticketId: id, at: step(0.3 + i * 0.2), actorId, kind: 'comment', text });
      });
      if (s.status === 'done' && s.assigneeId) {
        events.push({ id: `${id}-s2`, ticketId: id, at: step(0.8), actorId: s.assigneeId, kind: 'status', text: '', toStatus: 'done' });
      }
    });

  const codeOf = (titleStart: string) => tickets.find((t) => t.title.startsWith(titleStart))?.code ?? titleStart;
  const messages: ChatMessage[] = SEED_MESSAGES.map((m, i) => ({
    id: `m-seed-${i + 1}`,
    authorId: m.authorId,
    text: m.text.replace(/\{t:([^}]+)\}/g, (_, start: string) => codeOf(start)),
    at: iso(m.hoursAgo, now),
    replyToId: m.replyTo === undefined ? null : `m-seed-${m.replyTo + 1}`,
  }));
  // Everyone has read up to the morning, so the latest few messages show as unread.
  const readUntil = iso(2, now);
  const chatReadAt = Object.fromEntries(TEAM.map((p) => [p.id, readUntil]));

  return { tickets, events, messages, chatReadAt };
}
