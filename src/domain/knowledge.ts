export interface KnowledgeArticle {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
}

// SAMPLE CONTENT — not confirmed by the IT team (VPN profile name, printer path, NAS backup policy,
// lockout count are placeholders). Replace with real procedures before the portal is used.
export const KNOWLEDGE: KnowledgeArticle[] = [
  { id: 'kb-1', categoryId: 'account', question: 'Tôi quên mật khẩu đăng nhập máy tính, phải làm sao?', answer: 'Bấm "Quên mật khẩu" trên màn hình đăng nhập và xác thực bằng số điện thoại đã đăng ký. Nếu tài khoản bị khóa sau 5 lần nhập sai, hãy gửi yêu cầu mục "Tài khoản & mật khẩu" — CNTT sẽ mở khóa trong vòng 30 phút.' },
  { id: 'kb-2', categoryId: 'bim', question: 'Revit báo "License not available" khi mở?', answer: 'Đóng hết các phiên Revit, đợi 2 phút rồi mở lại để trả license về máy chủ. Nếu vẫn lỗi, xem mục Thông báo sự cố ở trang chủ — nếu Phòng CNTT đã báo sự cố license thì không cần gửi thêm yêu cầu.' },
  { id: 'kb-3', categoryId: 'network', question: 'Làm sao kết nối VPN khi làm việc ở công trường?', answer: 'Mở FortiClient, chọn hồ sơ "BIMLab-Remote" và đăng nhập bằng tài khoản công ty kèm mã OTP. Nếu mạng 4G yếu, hãy chuyển sang chế độ SSL-VPN port 443.' },
  { id: 'kb-4', categoryId: 'data', question: 'Tôi lỡ xóa file trên ổ dự án, có khôi phục được không?', answer: 'Có. Ổ NAS dự án lưu bản sao mỗi giờ trong 30 ngày. Chuột phải vào thư mục → "Restore previous versions", hoặc gửi yêu cầu kèm đường dẫn thư mục và thời điểm xóa.' },
  { id: 'kb-5', categoryId: 'printer', question: 'Máy in khổ lớn không hiện trong danh sách?', answer: 'Vào Settings → Printers → Add printer và nhập \\\\print01\\Plotter-A0. Máy chỉ hiện khi bạn đang dùng mạng nội bộ hoặc VPN.' },
];
