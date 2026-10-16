# Soạn câu hỏi bằng AI cho EduChain Kids (Toán, Tiếng Việt, Tiếng Anh, lớp 1–5)

## 0. Bộ bài có sẵn

Lớp 1 – Học kì 1 đã có 402 câu soạn sẵn trong `src/lib/content/` (xem README, mục "Bộ bài tập Lớp 1"). Soạn thêm bằng tay thì thêm vào các file đó (dùng hàm `sc`, `fb`, `mc`, `ord`, `mt`, `tf`) rồi chạy `npm run check:content`; hoặc soạn qua trang quản trị / CSV như hướng dẫn dưới.

## 1. Quy trình

1. Chọn **một bài** (ví dụ: Toán lớp 1, "Phép cộng trong phạm vi 10").
2. Dùng prompt ở mục 3 để AI soạn 10–15 câu, xuất ra CSV.
3. **Người thật duyệt từng câu** theo mục 4, sửa trực tiếp trong Excel.
4. Nhập vào bài trên trang quản trị: mở bài ở `/quan-tri/bai-hoc` → **Nhập CSV** (hoặc soạn từng câu bằng nút **Thêm câu hỏi**). Câu được lưu ở trạng thái `draft` (bảng `lessons`, `questions`, `question_keys`).
5. Duyệt xong, admin bấm **Xuất bản** trên trang soạn bài. Website chỉ hiển thị bài và câu `published`.

Làm theo thứ tự: Toán lớp 1 → Tiếng Việt lớp 1 → Tiếng Anh lớp 1 → rồi mới sang lớp 2.

## 2. Dữ liệu được lưu ở đâu trong Supabase

Schema nằm ở `supabase/migrations/` (0001 → 0002 → 0003). **Không tự tạo bảng theo SQL khác**, vì sẽ lệch schema và có thể làm lộ đáp án.

| Bảng | Nội dung | Ai đọc được |
|---|---|---|
| `subjects` | Môn theo lớp: `toan-1` … `toan-5`, `tieng-viet-1` …, `tieng-anh-1` … (0002 đã tạo sẵn) | Người đã đăng nhập |
| `lessons` | Bài học: `title`, `book_series`, `semester`, `sort_order`, `status` | Bài `published` + người soạn |
| `questions` | Đề, các lựa chọn, `question_type`, `skill_code`, `difficulty` (**không có đáp án**) | Câu `published` + người soạn |
| `question_keys` | `answer_key` và `explanation` | Chỉ người soạn và system_admin |

Học sinh không bao giờ đọc được `question_keys`. Bài làm được chấm bằng hàm `submit_quiz_answer` trên server.
Bài chỉ hiện cho học sinh sau khi system_admin chạy `publish_lesson` (bước "người thật duyệt").

### Loại câu hỏi (`type` trong CSV = `question_type` trong DB)

| type | Dạng | Cột `answer` trong CSV | `answer_key` lưu trong DB |
|---|---|---|---|
| `single_choice` | Chọn 1 đáp án | Nội dung đáp án đúng, ví dụ `7` | `{"correct": "7"}` |
| `true_false` | Đúng / Sai | `Đúng` hoặc `Sai` | `{"correct": "Sai"}` |
| `fill_blank` | Điền đáp án | Các đáp án chấp nhận, cách nhau bằng `\|`, ví dụ `9\|chín` | `{"accepted": ["9", "chín"]}` |
| `multiple_choice` | Chọn nhiều | Các đáp án đúng, cách nhau bằng `\|` | `{"correct": ["a", "c"]}` |
| `ordering` | Sắp xếp | Thứ tự đúng, cách nhau bằng `\|` | `{"order": ["1", "3", "5"]}` |
| `matching` | Ghép cặp | Các cặp `trái=phải`, cách nhau bằng `\|`, ví dụ `mèo=cat\|chó=dog` | `{"pairs": {"mèo": "cat"}}` |

Chấm điểm không phân biệt hoa/thường và bỏ khoảng trắng thừa. Giao diện hiện đã làm được `single_choice`, `true_false`, `fill_blank`; ba dạng còn lại đã chấm được ở server nhưng chưa có giao diện.

`skill_code` là mã kỹ năng ngắn, không dấu, ví dụ `cong_10`, `so_sanh_10`, `am_dau`, `tu_vung_mau_sac`. Báo cáo kỹ năng cho giáo viên và phụ huynh gom theo mã này, nên **dùng thống nhất một mã cho cùng một kỹ năng**.

### Danh mục: chủ đề, yêu cầu cần đạt, dạng bài, mức độ

Mỗi câu hỏi nên gắn đủ: **YCCĐ** (cột `outcome_code`, ví dụ `T1.PT.02`), **dạng bài** (`form_code`, ví dụ `TOAN.TINH`), **mức độ** (`difficulty`: 1 Nhận biết, 2 Thông hiểu, 3 Vận dụng — ghi số hoặc chữ đều được) và **lời giải chi tiết** (`solution`, học sinh bấm "Xem lời giải" sau khi trả lời).
Mã YCCĐ và mã dạng bài xem ở trang quản trị **Chương trình** (`/quan-tri/chuong-trinh`). Danh mục lớp 1 có sẵn trong `src/lib/curriculum/grade1.ts`.

Nguyên tắc **không vượt trước**: YCCĐ có giai đoạn 1–3. Bài đầu học kỳ chỉ dùng YCCĐ giai đoạn 1; câu hỏi không được dùng kiến thức của giai đoạn sau (ví dụ giai đoạn 1 chỉ có số trong phạm vi 10, chưa có số 20).

## 3. Prompt gửi AI

Thay phần trong `[ ]` rồi dán vào ChatGPT hoặc Claude:

```
Bạn là giáo viên tiểu học giàu kinh nghiệm, soạn câu hỏi ôn tập cho học sinh.

Môn: [Toán / Tiếng Việt / Tiếng Anh]
Lớp: [1-5]
Bộ sách: [Kết nối tri thức / Chân trời sáng tạo / Cánh Diều]
Bài: [tên bài]
Yêu cầu cần đạt (theo chương trình GDPT 2018): [mã và nội dung YCCĐ, ví dụ T1.PT.02 — Tính nhẩm cộng, trừ trong phạm vi 10]
Giai đoạn: [1/2/3] — KHÔNG dùng kiến thức vượt giai đoạn này
Dạng bài được dùng: [mã dạng bài, ví dụ TOAN.TINH, TOAN.LOIVAN]
Số câu: 12 (4 dễ, 5 vừa, 3 khó)

Quy tắc:
- Tự viết câu hỏi mới, không chép nguyên văn từ sách giáo khoa hay trang web khác.
- Mỗi câu có đúng 1 đáp án đúng. 3 đáp án sai phải là lỗi học sinh hay mắc phải.
- Ngôn ngữ phù hợp lứa tuổi, câu ngắn, bối cảnh quen thuộc (gia đình, trường lớp, con vật).
- explanation: nhận xét tối đa 2 câu, giọng nhẹ nhàng, nói rõ vì sao đáp án đúng.
- solution: lời giải chi tiết từng bước, câu ngắn, bé lớp 1 đọc hoặc nghe hiểu được.
- difficulty: 1 = Nhận biết, 2 = Thông hiểu, 3 = Vận dụng; chia đều theo số câu yêu cầu.
- Toán: kiểm tra lại phép tính trước khi trả lời. Tiếng Việt: chỉ dùng chính tả và từ ngữ phổ thông, tránh từ vùng miền gây tranh cãi. Tiếng Anh: chỉ dùng từ vựng cơ bản đúng cấp độ.
- Chỉ trả về CSV, không giải thích thêm, bao mọi ô bằng dấu ngoặc kép.

Loại câu (cột type): single_choice, true_false, fill_blank. Cột answer theo quy tắc:
- single_choice: ghi nội dung đáp án đúng (không ghi A/B/C/D)
- true_false: ghi Đúng hoặc Sai, bỏ trống option_a..d
- fill_blank: ghi mọi cách viết được chấp nhận, cách nhau bằng dấu |, bỏ trống option_a..d
Cột skill_code: mã kỹ năng không dấu, nối bằng gạch dưới (ví dụ cong_10).

Cột CSV (đúng thứ tự):
subject,grade,book_series,semester,lesson_title,type,prompt,option_a,option_b,option_c,option_d,answer,explanation,difficulty,skill_code,form_code,outcome_code,solution
```

Cột `answer` ghi **nội dung đáp án đúng** (ví dụ `7`), không ghi chữ A, B, C, D, để sau này đảo thứ tự đáp án không bị sai.

## 4. Danh sách kiểm tra khi duyệt

- Tính lại đáp án của mọi câu Toán bằng tay hoặc máy tính.
- Tiếng Việt: soát chính tả, dấu thanh, từ loại, đáp án có bị trùng nghĩa với đáp án sai không.
- Tiếng Anh: soát đánh vần và nghĩa tiếng Việt.
- Đề bài có đúng lớp không (lớp 1 chưa học nhân, chia).
- Có câu nào quá giống nhau hoặc giống sách giáo khoa không.
- Giải thích có bé đọc hiểu được không.

Người duyệt được ghi tự động vào `lessons.reviewed_by` khi chạy `publish_lesson`.

## 5. Mẫu một dòng CSV

```csv
"toan","1","Kết nối tri thức","1","Phép cộng trong phạm vi 10","single_choice","Bé có 4 quả táo, mẹ cho thêm 3 quả. Bé có tất cả mấy quả?","6","7","8","9","7","4 quả thêm 3 quả là 4 + 3 = 7 quả.","3","cong_10","TOAN.LOIVAN","T1.PT.07","Cho thêm nghĩa là làm phép cộng: 4 + 3 = 7. Trả lời: Bé có 7 quả táo."
"toan","1","Kết nối tri thức","1","Phép cộng trong phạm vi 10","fill_blank","Điền số: 3 + 6 = ...","","","","","9|chín","Đếm thêm 6 từ 3 được 9.","2","cong_10","TOAN.TINH","T1.PT.02","Bắt đầu từ 6, đếm thêm 3: 7, 8, 9. Vậy 3 + 6 = 9."
"toan","1","Kết nối tri thức","1","Phép cộng trong phạm vi 10","true_false","2 + 2 = 5. Đúng hay sai?","","","","","Sai","2 + 2 = 4, không phải 5.","1","cong_10","TOAN.DUNGSAI","T1.PT.02",""
```

## 6. Về bản quyền và dữ liệu

- Chương trình GDPT 2018 và yêu cầu cần đạt là văn bản công khai, được phép bám theo. Nội dung sách giáo khoa và đề của các trang khác thì không được chép lại.
- Câu hỏi AI soạn vẫn nên được người thật duyệt trước khi đăng, vì AI có thể sai đáp án.
