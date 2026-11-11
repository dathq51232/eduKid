// Rút gọn đường dẫn trước khi đếm lượt truy cập: bỏ query, thay mã (uuid, số, chuỗi dài) bằng ":id", giữ tối đa 4 đoạn.
// Không bao giờ gửi tên, mã học sinh hay tham số cá nhân lên máy chủ thống kê.
export function normalizePath(raw: string): string {
  const path = (raw || '/').split(/[?#]/)[0].toLowerCase();
  const segs = path.split('/').filter(Boolean).slice(0, 4).map((s) =>
    /^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(s) || /^\d+$/.test(s) || s.length > 32 || !/^[a-z0-9_-]+$/.test(s) ? ':id' : s,
  );
  return `/${segs.join('/')}`.slice(0, 80);
}

/** Tên dễ đọc cho trang Truy cập */
const NAMES: [RegExp, string][] = [
  [/^\/$/, 'Trang chủ'], [/^\/chon-bai/, 'Chọn bài'], [/^\/lam-bai/, 'Làm bài'], [/^\/ket-qua/, 'Kết quả'],
  [/^\/tieng-anh/, 'Tiếng Anh (phản xạ)'], [/^\/tro-choi/, 'Trò chơi'], [/^\/co/, 'Cờ'], [/^\/hoc-sinh/, 'Trang học sinh'],
  [/^\/giao-vien/, 'Giáo viên'], [/^\/phu-huynh/, 'Phụ huynh'], [/^\/quan-tri/, 'Quản trị'], [/^\/dang-nhap/, 'Đăng nhập'],
  [/^\/dang-ky/, 'Đăng ký'], [/^\/thanh-tich/, 'Thành tích'], [/^\/luyen-chu/, 'Luyện chữ'],
];
export const pathLabel = (p: string) => NAMES.find(([re]) => re.test(p))?.[1] ?? p;
