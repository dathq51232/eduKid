// Công tắc tính năng. Tắt = ẩn khỏi giao diện và chặn đường dẫn; mã nguồn, bảng dữ liệu (0013, 0014, 0016)
// và số liệu đã lưu vẫn giữ nguyên — bật lại không mất gì.
// Bật sổ theo dõi kết quả trên trường + nhận xét học sinh: đặt biến môi trường
//   NEXT_PUBLIC_FEATURE_SO_THEO_DOI=on   (Vercel → Settings → Environment Variables, rồi Redeploy)
export const FEATURES = {
  /** "Kết quả học tập trên trường" và "Nhận xét học sinh" của giáo viên */
  teacherRecords: process.env.NEXT_PUBLIC_FEATURE_SO_THEO_DOI === 'on',
} as const;
