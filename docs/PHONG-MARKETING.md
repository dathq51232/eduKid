# Phòng Marketing EduChain Kids — vị trí, quy trình, quy tắc

Trưởng phòng (chủ sản phẩm) **duyệt toàn quyền và tự đăng / tự gửi**. Các vị trí là trợ lý AI chuyên trách (Claude Code subagent),
định nghĩa ở `.claude/agents/mkt-*.md`. Mọi sản phẩm của phòng là **bản nháp** trong thư mục `docs/marketing/` —
không vị trí nào được đăng bài, gửi tin nhắn hay chạy quảng cáo.

> Đây là trợ lý AI, không phải người có 10 năm kinh nghiệm thật: làm nhanh, có khuôn khổ, nhưng vẫn có thể sai số liệu
> hoặc viết quá tay — nên luôn qua bước Trưởng phòng duyệt.

## 1. Các vị trí

| Vị trí | Tên gọi (agent) | Việc chính | Nộp vào |
|---|---|---|---|
| Trưởng phòng | — (thầy/cô) | Duyệt kế hoạch, duyệt bài / video, tự đăng (Quản trị › Marketing), tự gửi tin, xuất số liệu | — |
| Chiến lược | `mkt-chien-luoc` | Mục tiêu, mồi, thông điệp, kênh, lịch, ngân sách, chia việc | `docs/marketing/<ngày>-<chiến dịch>.md` |
| Nội dung | `mkt-noi-dung` | Bài Facebook / Zalo / mô tả TikTok, 3 phiên bản, link UTM | `docs/marketing/bai-viet/` |
| Video | `mkt-video` | Kịch bản video thao tác (quay màn hình) và video bài học (Xưởng video, 9:16) | `docs/marketing/video/` |
| Cộng đồng & Chăm sóc GV | `mkt-cong-dong` | Chuỗi tin đón giáo viên mới, giữ chân, đại sứ, trả lời câu hỏi, gom phản hồi | `docs/marketing/` (cong-dong, phan-hoi) |
| Phân tích tăng trưởng | `mkt-phan-tich` | Báo cáo tuần từ số liệu Trưởng phòng xuất ra | `docs/marketing/bao-cao/` |

Phòng Marketing **phối hợp** với Phòng CNTT (`docs/PHONG-CNTT.md`):
- Bài học / phép tính trong video → nhờ `noi-dung-giao-duc` rà.
- Phản hồi của giáo viên cần sửa app → `mkt-cong-dong` gom thành danh sách → `kien-truc-su` lập kế hoạch.
- Cần thêm mẫu bài trong Quản trị › Marketing hay công cụ đo mới → giao Phòng CNTT.

## 2. Quy trình một chiến dịch

```
① Trưởng phòng nêu mục tiêu (vd. “Ôn thi cuối HK1 — 100 giáo viên đăng ký trong 4 tuần”)
② mkt-chien-luoc → kế hoạch chiến dịch                         ── DUYỆT 1: Trưởng phòng duyệt kế hoạch
③ Song song: mkt-noi-dung (bài viết) · mkt-video (kịch bản) · mkt-cong-dong (tin nhắn đón giáo viên)
④ Trưởng phòng duyệt từng bài / kịch bản                       ── DUYỆT 2
⑤ Trưởng phòng: dán bài vào Quản trị › Marketing (tạo link UTM) → đăng tay / hẹn giờ; dựng video ở Xưởng video hoặc quay màn hình
⑥ Mỗi thứ Hai: Trưởng phòng xuất số liệu vào docs/marketing/so-lieu/ → mkt-phan-tich báo cáo → mkt-chien-luoc điều chỉnh
```

## 3. Cách giao việc (gõ trong Claude Code)

- “**mkt-chien-luoc** lập kế hoạch chiến dịch Ôn thi cuối HK1, mục tiêu 100 giáo viên đăng ký trong 4 tuần.”
- “Kế hoạch đã duyệt. **mkt-noi-dung** viết 3 bài tuần 1; **mkt-video** viết 2 kịch bản video thao tác.”
- “**mkt-phan-tich** đọc `docs/marketing/so-lieu/2026-12-07.csv` và báo cáo tuần.”
- Hoặc gọn: “**Chạy quy trình phòng Marketing cho chiến dịch X**” — trợ lý chính điều phối và dừng ở 2 điểm duyệt.

## 4. Quy tắc chung của phòng

- Chỉ quảng bá tính năng có thật và đang bật trong app.
- Không ảnh, giọng, tên học sinh thật; không thu thập thêm dữ liệu cá nhân.
- Không cam kết điểm số, không hạ thấp app khác, không nói app hay học phí là bắt buộc.
- Phí cộng tác: chỉ nói đúng (phụ huynh tự chuyển cho app, tự nguyện, em chưa đóng vẫn làm bài cô giao) — không quảng bá kiểu “kiếm tiền từ phụ huynh”.
- Giọng và tên gọi theo `docs/BAN-SAC-EDUCHAINKIDS.md`; mọi link có UTM để đo được.

## 5. Nhịp gợi ý cho người làm một mình

- Thứ Hai (30 phút): xuất số liệu → báo cáo tuần → chốt 1 việc dồn sức.
- Thứ Ba – Thứ Năm: 3 bài + 3 video / tuần (soạn sẵn cả tuần trong 1 buổi, hẹn giờ đăng).
- Hằng ngày (10 phút): trả lời giáo viên mới theo chuỗi tin của `mkt-cong-dong`.
