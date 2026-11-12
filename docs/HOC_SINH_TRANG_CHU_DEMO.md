# Trang chủ học sinh — hướng kết hợp (bản phác thảo + demo)

Demo chạy được: `/demo-hoc-sinh` (dữ liệu mẫu, không cần đăng nhập). Nút trên cùng chuyển 2 giao diện.

## Nguyên tắc chung
- **Một hành động chính mỗi màn**: nút "Học tiếp" vàng, to nhất (lấy từ phong cách "thế giới khám phá").
- **Tiến độ luôn thấy được** nhưng nói bằng hình cho trẻ nhỏ (sao, lửa chuỗi ngày), bằng số + thanh cho trẻ lớn (lấy từ phong cách "thẻ mềm 3D").
- **Milo là người dẫn đường**, nói một câu duy nhất: hôm nay học gì. Có nút loa đọc to.
- Màu thương hiệu EduChain (xanh dương chủ đạo, vàng cho nút chính, san hô / xanh lá điểm nhấn) — không dùng tím đại trà.
- Chữ trên màn học sinh ≥ 16 px (lớp 1–2: ≥ 20 px), chữ phụ xám đậm đạt tương phản 4,5:1; vùng bấm ≥ 56 px.

## A. Lớp 1–2: "Lớp học của Milo" (cảnh khám phá, ít chữ)
```
┌──────────────────────────────────────────────────────────────┐
│ (ảnh em)  ⭐ 128   🔥 5 ngày            ▲ cờ dây ▲   ⚙        │
│                                                              │
│   ┌────────┐      ┌───────────┐     [Bảng đen]  [Giá sách]   │
│   │  MILO  │ 💬   │  ▶ HỌC    │       Toán     Tiếng Việt    │
│   │  (to)  │ câu  │   TIẾP    │                              │
│   └────────┘ nói  └───────────┘     [Quả cầu]   [Hộp quà]    │
│              🔊   Bài 12 · ⭐⭐⭐☆☆   Tiếng Anh  Trò chơi     │
│▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ sàn gỗ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│
│ MÔN CỦA EM  [ 🧮 Toán ] [ 📚 Tiếng Việt ] [ 🔤 Tiếng Anh ] [ ✏️ Luyện chữ ] │
└──────────────────────────────────────────────────────────────┘
```
- Đồ vật trong lớp = lối vào (bấm bảng đen → Toán…). Mỗi vật có nhãn 1–2 chữ.
- Mục tiêu hôm nay = 5 ngôi sao (đã đủ mấy sao), không dùng phần trăm.

## B. Lớp 3–5: thẻ học có tiến độ
```
┌──────────────────────────────┐
│ Chào Minh Anh 👋   ⭐ 860 🔥 12│
│ ┌──────────────────────────┐ │
│ │ Mục tiêu hôm nay  3/5 bài│ │  ← thẻ xanh + Milo
│ │ ███████░░░░   MILO       │ │
│ └──────────────────────────┘ │
│ HỌC TIẾP                     │
│ ┌──────────────────────────┐ │
│ │ 🧮 Toán 4 · Phân số      │ │
│ │ ████░░ 6/10   [▶ Học tiếp]│ │  ← nút chính duy nhất
│ └──────────────────────────┘ │
│ BÀI CÔ GIAO (2)       Xem hết │
│ ▸ Tiếng Việt · Luyện từ  ⏰ mai│
│ MÔN HỌC   [Toán][TV][TA]      │  ← thẻ + thanh tiến độ
│ HUY HIỆU  🏅 🧮 📚 🔥   THỬ THÁCH TUẦN 6/10 │
│ ─────────────────────────────│
│ 🏠 Trang chủ 📘 Học 🎮 Trò chơi 🏆 Thưởng 🙂 Em │
└──────────────────────────────┘
```

## Chuyển sang trang thật (sau khi duyệt demo)
- Lấy dữ liệu từ `src/app/hoc-sinh/page.tsx` (điểm, chuỗi ngày `learningStreak`, bài cô giao `student_my_assignments`, khối lớp).
- Lớp 1–2 → giao diện A, lớp 3–5 → giao diện B (cho phép học sinh đổi).
