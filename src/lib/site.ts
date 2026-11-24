// Tên miền chính và thông tin chung cho SEO (robots, sitemap, ảnh xem trước, dữ liệu có cấu trúc).
// Đổi tên miền: đặt NEXT_PUBLIC_SITE_URL (không có dấu / ở cuối) rồi Redeploy.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://educhainkids.com').replace(/\/+$/, '');
export const SITE_NAME = 'EduChain Kids';
export const SITE_TITLE = 'EduChain Kids — Học vui · Khám phá · Phát triển';
export const SITE_DESCRIPTION =
  'Nền tảng học tập cho học sinh tiểu học lớp 1–5: học đúng chương trình GDPT 2018, luyện tập vui, trò chơi trí tuệ; công cụ soạn bài, lịch báo giảng, nhận xét cho thầy cô.';

/** Chỉ bản chính thức mới cho Google lập chỉ mục; bản xem trước (Vercel Preview) và máy dev thì chặn. */
export const IS_INDEXABLE = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === 'production'
  : process.env.NODE_ENV === 'production';

/** Trang riêng tư / cần đăng nhập — không cho máy tìm kiếm vào */
export const PRIVATE_PATHS = [
  '/api/', '/auth/', '/giao-vien', '/quan-tri', '/phu-huynh', '/hoc-sinh', '/sau-dang-nhap', '/dang-xuat',
  '/dat-lai-mat-khau', '/quen-mat-khau', '/lam-bai', '/ket-qua', '/trien-lam', '/chieu-offline', '/dev-slide-preview',
];
