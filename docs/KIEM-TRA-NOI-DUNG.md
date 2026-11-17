# Kiểm tra câu hỏi & kiến thức — quy trình chống sai sót

## Một lệnh cho tất cả

```bash
npm run check:noi-dung           # đầy đủ (~5 phút) — trước khi deploy
npm run check:noi-dung -- nhanh  # nhanh (~1,5 phút) — git pre-commit tự chạy
```

Bước nào lỗi thì lệnh in trích đoạn lỗi và thoát mã 1. Git **chặn commit** có sửa `src/lib/content|practice|exams|curriculum`,
`src/lib/grading.ts` hoặc `scripts/check-*` cho tới khi đạt hết (hook ở `.githooks/pre-commit`, bật bằng `npm install` → `prepare`).

## Các lớp kiểm tra

| Lệnh | Kiểm gì |
|---|---|
| `check:content` | Bài soạn sẵn: đề/nhận xét không trống, lựa chọn không trùng, đáp án nằm trong lựa chọn, **đáp án đúng được chấm đúng** (mọi dạng: chọn, sắp xếp, nối, xếp hộp, mảnh ghép, điền nhiều ô, bảng Đ/S), YCCĐ & dạng bài có trong danh mục, không vượt phạm vi bài, đề ôn từ dễ đến khó |
| `check:knowledge` | **Đúng kiến thức**: tìm mọi phép tính / so sánh viết bằng số trong *Kiến thức cần nhớ*, nhận xét, lời giải, đáp án (thế đáp án vào chỗ trống), câu Đúng/Sai — của bài soạn sẵn, ngân hàng lớp 1 và bộ sinh câu — rồi **tính lại bằng phân số chính xác** (hiểu `1 000`, `2,5`, `2/3`, hỗn số, `%`, `dư`). Nhận xét ghi “đáp án là X” phải trùng đáp án đúng. Có tự kiểm: cố ý cài lỗi để chắc bộ kiểm tra còn bắt được |
| `check:practice` | Bộ sinh câu: đủ 10 câu/2 câu mỗi mức, không trùng, đáp án tự chấm đúng & đáp án sai bị chấm sai, phạm vi số, thời gian |
| `check:advanced` | Chuyên đề nâng cao: vét cạn để chắc đáp án đúng và duy nhất |
| `check:spelling`, `check:count-shapes`, `check:sets`, `check:exams`, `check:games` | Chính tả từ trên phiếu, câu đếm hình, đổi bộ câu không trùng, ma trận đề đủ câu & đáp án sau khi trộn, trò chơi |

## Khi soạn / sửa nội dung

1. Viết phép tính trong kiến thức, nhận xét, lời giải bằng số thật (`7 + 5 = 12`, `9 068 < 9 968`) — máy tính lại được.
   Muốn nêu phép tính **sai** để chỉ lỗi, ghi rõ chữ “sai / nhầm / không phải” trong câu đó (bộ kiểm tra bỏ qua câu ấy).
2. Câu “Phép tính nào **sai**?” — ghi chữ “sai” trong đề.
3. Chạy `npm run check:noi-dung`. Đạt hết mới commit.
4. Phát hiện kiểu lỗi mới mà máy chưa bắt → thêm luật vào script `check-*` tương ứng **và** thêm ví dụ vào phần tự kiểm, để lỗi đó không lặp lại.

## Máy KHÔNG thay được người

Nghĩa của từ, ngữ pháp Tiếng Anh, nội dung bài đọc, độ hợp lí của tình huống… vẫn cần giáo viên đọc lại. Khi rà tay, ưu tiên
câu mức L4–L5 và câu mới thêm; sửa xong vẫn chạy lại lệnh trên.

## Lỗi đã tìm & sửa (17/11/2026)

- Bộ sinh câu Toán 5 (Bài 23–24): `cl()` làm tròn mọi số thập phân về 4 chữ số → `19,85 × 0,001 = 0,0199` (đúng: `0,01985`),
  `117,78 : 1 000 = 0,1178` (đúng: `0,11778`). Đã nâng lên 8 chữ số.
- Ma trận đề Học kì 1 lớp 1 (cả 3 môn) chỉ ra 8/10 câu vì chưa có câu mức 3 in được; nay chuyển phần thiếu sang mức gần nhất.
- `check:exams` kiểm 0 câu (quên nạp kho bài) → nay nạp đủ và báo lỗi nếu không kiểm được gì.
- `check:content` báo nhầm 18 câu xếp hộp (`grouping`) và chưa kiểm cấu trúc các dạng xếp hộp, mảnh ghép, điền nhiều ô, bảng Đ/S.
