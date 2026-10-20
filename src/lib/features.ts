// Công tắc tính năng. Tắt = ẩn khỏi giao diện và chặn đường dẫn; mã nguồn, bảng dữ liệu (0013, 0014, 0016)
// và số liệu đã lưu vẫn giữ nguyên — bật lại không mất gì.
// Sổ theo dõi kết quả trên trường + nhận xét học sinh: MẶC ĐỊNH BẬT (cần đã chạy migration 0013, 0014, 0016).
// Muốn tắt lại: đặt NEXT_PUBLIC_FEATURE_SO_THEO_DOI=off   (Vercel → Settings → Environment Variables, rồi Redeploy)
export const FEATURES = {
  /** "Kết quả học tập trên trường" và "Nhận xét học sinh" của giáo viên */
  teacherRecords: process.env.NEXT_PUBLIC_FEATURE_SO_THEO_DOI !== 'off',
  /** Thu phí học sinh (migration 0018) — đang ẩn; bật: NEXT_PUBLIC_FEATURE_THU_PHI=on rồi Redeploy */
  billing: process.env.NEXT_PUBLIC_FEATURE_THU_PHI === 'on',
} as const;
