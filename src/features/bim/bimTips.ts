// What Bim says when clicked: live hints from the team's tickets first, then general tips.
import type { Ticket } from '@/domain/ticket';
import { isOpen } from '@/domain/ticket';

const TIPS = [
  'Báo lỗi nhớ ghi các bước tái hiện nhé, có nút "Dùng mẫu báo lỗi" đó!',
  'Kéo thẻ trên Kanban sang cột khác để đổi trạng thái.',
  'Gõ @ trong kênh Tin nhắn để nhắc tên đồng đội.',
  'Dán mã BLT-… vào tin nhắn là thành link tới ticket luôn.',
  'Ghi cách đã sửa trước khi bấm Xong để người báo kiểm tra lại.',
  'Kéo mình đi đâu cũng được, thả ra mình tự đáp xuống!',
];

/** The `index`-th thing to say; cycles through live hints and tips. */
export function bimLine(tickets: Ticket[], meId: string, index: number): string {
  const open = tickets.filter((t) => isOpen(t.status));
  const live: string[] = [];
  const urgent = open.filter((t) => t.priority === 'urgent').length;
  const free = open.filter((t) => !t.assigneeId).length;
  const mine = open.filter((t) => t.assigneeId === meId).length;
  if (urgent) live.push(`Có ${urgent} ticket khẩn cấp đang mở, ưu tiên trước nha!`);
  if (free) live.push(`Còn ${free} ticket chưa ai nhận đó!`);
  live.push(mine ? `Bạn đang có ${mine} việc, cố lên!` : 'Bạn đang rảnh tay, nhận một ticket không?');
  const lines = [...live, ...TIPS];
  return lines[index % lines.length];
}
