// Thông tin liên hệ quản trị EduChain Kids (hiện cho giáo viên khi cần thêm học sinh vượt gói miễn phí).
// Sửa ở đây là đổi ở mọi trang.
export const ADMIN_CONTACT = {
  name: 'Quản trị EduChain Kids',
  phone: '0937557150',
  phoneDisplay: '0937 557 150',
  zalo: '0937557150',
  email: 'dathq51232@gmail.com',
  address: 'Đức Linh, Lâm Đồng, Việt Nam',
} as const;

/** Gói miễn phí cho giáo viên: số học sinh tối đa (khớp mặc định trong migration 0019) */
export const FREE_STUDENT_LIMIT = 3;
/** Giáo viên mới: dùng thử đủ lớp (40 học sinh) trong số ngày này (khớp migration 0045) */
export const TEACHER_TRIAL_DAYS = 15;

/** Liên hệ chung của EduChain Kids (trang chủ: chân trang + nút Zalo nổi) */
export const SITE_CONTACT = {
  email: 'educhainkids@gmail.com',
  phone: '0967514511',
  phoneDisplay: '0967 514 511',
  zalo: '0967514511',
  zaloName: 'EduChain Kids',
} as const;
