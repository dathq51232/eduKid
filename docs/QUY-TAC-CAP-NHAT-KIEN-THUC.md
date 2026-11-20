# Quy tắc cập nhật kiến thức vào ngân hàng câu hỏi (cơ bản & nâng cao)

> Áp dụng cho mọi kiến thức / câu hỏi mới thêm qua **trang Quản trị** (`/quan-tri/bai-hoc`: soạn tay hoặc nhập CSV)
> và cho kho soạn sẵn trong mã nguồn (`src/lib/content`). Mục tiêu: nội dung thêm trên web được kiểm **cùng mức** với nội dung
> do lập trình viên soạn.
> Mã: quy tắc `src/lib/content/rules.ts` · bộ máy tính lại phép tính `src/lib/content/verify-math.ts` ·
> dữ liệu `lessons.level`, `lessons.prerequisite_lesson_id`, bảng `lesson_knowledge` (migration `0070_lesson_knowledge.sql`).

## 1. Hai cấp kiến thức

| | **Cơ bản** (`co_ban`) | **Nâng cao** (`nang_cao`) |
|---|---|---|
| Nguồn | Theo sách giáo khoa, đúng YCCĐ của bài và giai đoạn | Chuyên đề mở rộng (như mục “Chuyên đề nâng cao”, mã `nc<lớp>-<chuyên đề>`) |
| Mức câu hỏi | L1–L3, **đủ cả ba mức** | L3–L5, **ít nhất 2 câu L4–L5** |
| Số câu tối thiểu / bài | 6 | 4 |
| Lời giải | Nên có | **Bắt buộc**, giải từng bước |
| Bài cần học trước | — | **Bắt buộc** ghi bài cơ bản tương ứng |
| Ví dụ trong kiến thức | Nên có | **Bắt buộc** (ví dụ giải mẫu) |

Mức L1–L5 theo `src/lib/levels.ts` (Làm quen · Cơ bản · Vận dụng · Thử thách · Mở rộng).

## 2. Một đơn vị kiến thức gồm

1. **Gắn với:** môn, lớp, bài, YCCĐ (`outcome_code`), cấp (`co_ban` / `nang_cao`); bài nâng cao thêm bài cần học trước.
2. **Kiến thức cần nhớ** (`lesson_knowledge`): 2–4 ý (tối đa 6), mỗi ý một câu ≤ 200 ký tự; một ví dụ viết bằng số thật; ghi chú nếu cần.
   Cùng dạng với `src/lib/content/knowledge.ts` để trang học hiện giống hệt bài soạn sẵn.
3. **Câu hỏi:** mỗi câu có dạng bài (`form_code`), mức (`difficulty`), mã kỹ năng (`skill_code`), nhận xét, lời giải.
   Cách ghi CSV: `docs/soan-cau-hoi.md`.

## 3. Viết sao cho máy kiểm được

- Phép tính, so sánh viết bằng **số và dấu thật**: `7 + 5 = 12`, `9 068 < 9 968`, `2,5 × 4 = 10`, `30 : 9 = 3 dư 3`.
- Muốn nêu phép tính **sai** để chỉ lỗi, ghi rõ chữ *sai / nhầm / không phải* trong câu đó (máy bỏ qua câu ấy).
- Câu “Phép tính nào **sai**?” — ghi chữ “sai” trong đề.
- Nhận xét ghi “đáp án là X” thì X phải đúng là đáp án đúng.
- **Không vượt trước:** bài giai đoạn 1 không dùng số, kiến thức của giai đoạn sau (xem trang Chương trình).
- **Bản sắc** (`docs/BAN-SAC-EDUCHAINKIDS.md`): không tên khoa cử (*thi Hương / Hội / Đình, Trạng Nguyên, Bảng nhãn, Thám hoa, Sơ khảo*),
  không đặt tên dạng bài theo con giáp; dạng câu dùng tên trong “Đồ nghề của Milo”.

## 4. Máy kiểm gì — và khi nào

| Khi | Kiểm | Kết quả |
|---|---|---|
| Lưu một câu / xem trước bảng nhập CSV (`validateDraft`) | Cấu trúc câu · tính lại mọi phép tính trong **đáp án (thế vào chỗ trống), nhận xét, lời giải** · câu Đúng/Sai chấm ngược · “đáp án là X” khớp đáp án · bản sắc | Dòng lỗi **không được nhập / lưu**, ghi rõ chỗ sai |
| Lưu “Kiến thức cần nhớ” (`validateKnowledge`) | Số ý, độ dài · phép tính trong ý, ví dụ, ghi chú · bản sắc · bài nâng cao phải có ví dụ | Lỗi chặn; nhắc nhở (ví dụ “nên 2–4 ý”) chỉ cảnh báo |
| Chuyển bài sang **Chờ duyệt** (`validateLessonBank`) | Có kiến thức đạt · đủ số câu theo cấp · câu đúng mức · đủ L1–L3 (cơ bản) / ≥ 2 câu L4–L5 + đủ lời giải + bài cần học trước (nâng cao) | Chưa đạt thì không chuyển được |
| `npm run check:noi-dung` (git pre-commit) | Như trên cho toàn bộ kho soạn sẵn; tự kiểm cả bộ quy tắc của trang Quản trị | Lỗi chặn commit |

## 5. Quy trình 4 bước

**Nháp → Máy đã kiểm → Người duyệt → Xuất bản**

1. **Nháp:** soạn tay hoặc nhập CSV; dòng lỗi máy báo phải sửa mới vào được.
2. **Máy đã kiểm:** `lesson_knowledge.checked_at` ghi thời điểm kiến thức đạt; bài đạt `validateLessonBank` mới được gửi duyệt.
3. **Người duyệt:** giáo viên khác người soạn (bắt buộc với bài nâng cao) đọc nghĩa, ngữ pháp, độ hợp lí của tình huống —
   những điều máy không thay được. Ưu tiên câu L4–L5 và câu mới.
4. **Xuất bản:** system_admin bấm Xuất bản. Mọi lần sửa ghi vào Nhật ký (`/quan-tri/nhat-ky`).

## 6. Thêm luật kiểm mới

Phát hiện kiểu lỗi mới mà máy chưa bắt → thêm luật vào `rules.ts` (hoặc `verify-math.ts`) **và** thêm ví dụ vào phần tự kiểm
(`rulesSelfTestErrors` / `MATH_SELF_TEST`), chạy `npm run check:knowledge` để chắc luật mới bắt được lỗi và không báo nhầm.

## 7. Lộ trình

- **Bước 1 (đã làm):** migration 0070, bộ quy tắc + bộ máy kiểm dùng chung, kiểm khi soạn câu / nhập CSV, tài liệu này.
- **Bước 2 (đã làm):** trang soạn bài có ô **Kiến thức cần nhớ & cấp bài** (chọn cấp, bài cần học trước, máy kiểm khi gõ, chỉ lưu khi đạt, ghi `checked_at`); nút **Gửi duyệt / Xuất bản** khoá khi chưa đạt `validateLessonBank` (chưa chạy migration 0070/0071 thì không khoá); trang chủ Quản trị có thẻ **Cập nhật kiến thức** (độ phủ CB / NC theo môn × lớp, bài thiếu kiến thức). Migration `0071_lesson_level_grant.sql` mở quyền sửa hai cột mới.
- **Bước 3:** trang làm bài đọc kiến thức từ `lesson_knowledge` khi bài không có trong kho soạn sẵn; bài nâng cao hiện ở “Chuyên đề nâng cao”.
