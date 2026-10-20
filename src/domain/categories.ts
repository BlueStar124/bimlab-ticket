// IT request categories shown when filing a ticket.
export type CategoryIcon = 'monitor' | 'cube' | 'app' | 'wifi' | 'key' | 'mail' | 'printer' | 'database' | 'help';

export interface Category {
  id: string;
  name: string;
  hint: string;
  icon: CategoryIcon;
  examples: string[];
}

export const CATEGORIES: Category[] = [
  { id: 'hardware', name: 'Máy tính & thiết bị', hint: 'PC, laptop, màn hình, chuột, bàn phím', icon: 'monitor', examples: ['Máy không lên nguồn', 'Màn hình nhấp nháy', 'Xin cấp thêm màn hình'] },
  { id: 'bim', name: 'Phần mềm BIM / CAD', hint: 'Revit, AutoCAD, Navisworks, Civil 3D', icon: 'cube', examples: ['Revit báo lỗi khi mở model', 'Hết license Autodesk', 'Cài plugin Dynamo'] },
  { id: 'software', name: 'Phần mềm văn phòng', hint: 'Office, PDF, cài đặt và cập nhật', icon: 'app', examples: ['Excel bị treo', 'Cài phần mềm mới', 'Kích hoạt Office'] },
  { id: 'network', name: 'Mạng & VPN', hint: 'Wi-Fi, Internet, VPN làm việc từ xa', icon: 'wifi', examples: ['Mất kết nối Wi-Fi', 'Không vào được VPN', 'Mạng chậm'] },
  { id: 'account', name: 'Tài khoản & mật khẩu', hint: 'Đăng nhập, quên mật khẩu, phân quyền', icon: 'key', examples: ['Quên mật khẩu', 'Tài khoản bị khóa', 'Xin quyền thư mục'] },
  { id: 'email', name: 'Email & họp trực tuyến', hint: 'Outlook, Teams, Zoom, lịch họp', icon: 'mail', examples: ['Không nhận được email', 'Teams mất tiếng', 'Tạo nhóm email'] },
  { id: 'printer', name: 'Máy in & scan', hint: 'In ấn, khổ A0–A3, máy scan', icon: 'printer', examples: ['Máy in khổ lớn kẹt giấy', 'Không thấy máy in', 'Scan không gửi được'] },
  { id: 'data', name: 'Dữ liệu & NAS dự án', hint: 'Ổ chung, sao lưu, khôi phục file', icon: 'database', examples: ['Không vào được ổ dự án', 'Khôi phục file bị xóa', 'Ổ đầy dung lượng'] },
  { id: 'other', name: 'Yêu cầu khác', hint: 'Những vấn đề chưa có trong danh mục', icon: 'help', examples: ['Tư vấn mua thiết bị', 'Hỗ trợ sự kiện'] },
];

export function categoryById(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
