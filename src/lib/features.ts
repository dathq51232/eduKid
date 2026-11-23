// Công tắc tính năng. Tắt = ẩn khỏi giao diện và chặn đường dẫn; mã nguồn, bảng dữ liệu (0013, 0014, 0016)
// và số liệu đã lưu vẫn giữ nguyên — bật lại không mất gì.
// Sổ theo dõi kết quả trên trường + nhận xét học sinh: MẶC ĐỊNH BẬT (cần đã chạy migration 0013, 0014, 0016).
// Muốn tắt lại: đặt NEXT_PUBLIC_FEATURE_SO_THEO_DOI=off   (Vercel → Settings → Environment Variables, rồi Redeploy)
export const FEATURES = {
  /** "Kết quả học tập trên trường" và "Nhận xét học sinh" của giáo viên */
  teacherRecords: process.env.NEXT_PUBLIC_FEATURE_SO_THEO_DOI !== 'off',
  /** Trang Thu phí của quản trị (0018, giá theo học kỳ + đặc cách 0074) — mặc định HIỆN; ẩn: NEXT_PUBLIC_FEATURE_THU_PHI=off rồi Redeploy.
   *  Chỉ là phần của quản trị: học sinh chỉ bị thu phí khi quản trị bấm “Bật thu phí” trong trang. */
  billing: process.env.NEXT_PUBLIC_FEATURE_THU_PHI !== 'off',
  /** Trợ lý AI dùng API key của giáo viên (migration 0030) — đang TẮT; bật lại: NEXT_PUBLIC_FEATURE_TRO_LY_AI=on rồi Redeploy */
  ai: process.env.NEXT_PUBLIC_FEATURE_TRO_LY_AI === 'on',
  /** Cộng đồng giáo viên (EduChainKids Community: kho chia sẻ, tin nhắn, đăng tài liệu — migration 0079–0081) — đang TẮT để tập trung
   *  thu hút người dùng giai đoạn đầu. Ẩn mục Cộng đồng, thẻ trên trang Hôm nay, nút Chia sẻ, dòng "đồng nghiệp đã soạn" và chặn
   *  đường dẫn /giao-vien/cong-dong. Bật lại: NEXT_PUBLIC_FEATURE_CONG_DONG=on rồi Redeploy. */
  community: process.env.NEXT_PUBLIC_FEATURE_CONG_DONG === 'on',
} as const;
