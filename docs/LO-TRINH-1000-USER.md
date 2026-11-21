# Lộ trình 1.000 người dùng + nâng cấp hệ thống

> Ghi lại 22/11/2026. Đây là kế hoạch, chưa kiểm chứng bằng số liệu thật. Giá dịch vụ (Supabase, Vercel) cần xem lại khi làm.

**Ý chính:** đường nhanh nhất là **đi qua giáo viên** — mỗi cô kéo theo khoảng 30 học sinh và phụ huynh.
1.000 người dùng ≈ **30 lớp dùng thật** ≈ 30 cô dùng đều đặn.

---

## A. Marketing 8 tuần

**Phễu cần đạt:** 100 cô đăng ký → 40 cô tạo lớp → 30 lớp hoạt động → ~900 học sinh + giáo viên + phụ huynh.

**Chỉ số chính theo dõi hằng tuần — “cô kích hoạt”:** trong 7 ngày đầu, cô tạo lớp, thêm ≥ 10 em và giao ≥ 1 bài.

### Giai đoạn 0 (tuần 1) — chuẩn bị
- [ ] **Vào việc dưới 10 phút:** lớp mẫu có sẵn dữ liệu; cô đăng ký xong thấy ngay thẻ học sinh, giao bài, phòng thi.
- [ ] **3 video 30–60 giây**, mỗi video một việc giúp cô tiết kiệm thời gian:
  “Lịch báo giảng xuất Word trong 1 phút” · “Phòng thi lớp + Đấu cặp” · “Sổ lớp nhắn phụ huynh”.
- [ ] **Trang giới thiệu cho giáo viên** + mã / link giới thiệu cho từng cô.
- [x] **Nút “Chia sẻ app”** ở trang giáo viên và Góc Phụ huynh (chép link + mở Zalo) — đã làm 22/11/2026.
- [ ] **Chưa bật thu phí cho lớp mới**: dùng 2 tuần rồi mới bật (phụ huynh thấy giá trị trước khi thấy giá).

### Giai đoạn 1 (tuần 1–3) — 10 “cô hạt giống”, ~300 học sinh
- [ ] Người quen: trường của mình, đồng nghiệp, tổ khối.
- [ ] Hỗ trợ tận tay qua một nhóm Zalo riêng, sửa lỗi trong ngày.
- [ ] Mỗi cô cho 1 lời chứng thực + 1 ảnh / video lớp đang dùng app.

### Giai đoạn 2 (tuần 3–6) — cộng đồng giáo viên, thêm ~20 lớp
- [ ] **Bám mùa ôn tập cuối học kỳ 1** (tháng 12 → 15/1): “Ôn cuối kỳ bằng Phòng thi lớp — chấm tự động, cô đỡ chấm bài.”
- [ ] Video / bài hướng dẫn trong nhóm Facebook, Zalo giáo viên tiểu học, TikTok, Reels — mỗi bài một việc cụ thể + link dùng thử.
- [ ] **Công cụ miễn phí làm mồi:** sinh đề, lịch báo giảng, giáo án xuất Word.
- [ ] **Livestream 30 phút tối thứ Năm**: soạn và chạy một phòng thi ngay trên sóng.
- [ ] **Cô giới thiệu cô**: giới thiệu thành công một cô được thêm suất đặc cách / quyền lợi.
- [ ] Quảng cáo Facebook nhắm giáo viên tiểu học ~3–5 triệu đồng, chỉ chạy video có tỉ lệ xem tốt nhất.

### Giai đoạn 3 (tuần 6–8) — cấp trường + lan qua phụ huynh
- [ ] Trường có ≥ 2 cô dùng: xin **15 phút ở họp tổ chuyên môn / ban giám hiệu**, mang số liệu thật của lớp.
- [ ] Thư khen, thành tích, tóm tắt 14 ngày có nút **“Chia sẻ Zalo”** (phụ huynh lớp khác hỏi “app gì đấy”).
- [ ] Tổng kết học kỳ 1 gửi phụ huynh, chạy mùa đóng phí học kỳ 2.

**Chi phí:** ~5–10 triệu đồng quảng cáo trong 8 tuần; còn lại là công sức hỗ trợ cô.

---

## B. Nâng cấp hệ thống

1.000 người dùng là nhỏ về kỹ thuật. Rủi ro nằm ở **cao điểm**: cả lớp 40 em đăng nhập cùng lúc, nhiều phòng thi cùng giờ,
đầu học kỳ phụ huynh đóng phí dồn dập.

### Ưu tiên 1 — trước khi chạy marketing (vài ngày công)
- [ ] **Hạ tầng trả phí** (~1,2 triệu đồng/tháng):
  - **Supabase Pro** (~25 USD/tháng): Free tự tạm dừng sau 1 tuần không truy cập, giới hạn 500MB, không sao lưu hằng ngày.
  - **Vercel Pro** (~20 USD/tháng): gói Hobby không cho dùng thương mại, app đã thu phí.
  - Kiểm tra database Supabase ở **Singapore**, cùng vùng Vercel (`vercel.json`: `sin1`).
- [ ] **Giới hạn số lần gọi** (`src/lib/rate-limit.ts`) đang nằm trong bộ nhớ từng máy chủ → trên Vercel gần như không chặn được.
      Chuyển sang Upstash Redis hoặc bảng trong Supabase.
- [ ] **Theo dõi lỗi:** Sentry / Vercel Observability + dịch vụ báo khi web sập.
- [ ] **Supabase Performance Advisor**: tìm bảng thiếu index (`lesson_results`, `class_memberships`, `exam_room_results`).

### Ưu tiên 2 — khi ~20–30 lớp hoạt động
- [ ] **Truy vấn nặng:** trang lớp của cô tải tới 5.000 dòng `lesson_results` rồi mới tính; có 5 chỗ lấy 2.000–5.000 dòng.
      Chuyển sang hàm SQL tổng hợp hoặc bảng tóm tắt cập nhật khi em nộp bài.
- [ ] **Middleware** gọi `my_learning_gate` mỗi lần em mở trang học → lưu kết quả vài phút (có ký số).
- [ ] **18 chỗ `setInterval`** (đấu cặp 20 giây, phòng thi 15 giây…): chỉ chạy khi tab đang mở; nhiều lớp cùng thi thì chuyển sang Supabase Realtime.
- [ ] **Kiểm tra tải** trước mùa thi: k6 mô phỏng 5 lớp × 40 em vào phòng thi cùng lúc rồi nộp bài.

### Ưu tiên 3 — từ vài nghìn người dùng
- [ ] Tách nội dung câu hỏi theo khối (`src/lib/content` ~845KB mã nguồn); ảnh webp qua CDN.
- [ ] Môi trường staging (`docs/DEPLOY-DEV.md`): chạy migration ở staging trước, giữ sao lưu.
- [ ] Tự xác nhận thanh toán bằng SePay (`docs/SEPAY-TICH-HOP.md`).

**Thứ tự nên làm:** hạ tầng trả phí → giới hạn số lần gọi + theo dõi lỗi → marketing giai đoạn 0–1 → tối ưu truy vấn nặng trong lúc chạy giai đoạn 2.
