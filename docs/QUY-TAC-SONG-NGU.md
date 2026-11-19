# Quy tắc dịch song ngữ đề Toán (Việt → Anh)

> Áp dụng cho khung **Song ngữ English** dưới đề Toán (`src/components/questions/MathBilingual.tsx`).
> Bộ dịch: `src/lib/math-translate.ts` · Kiểm tra: `npm run check:song-ngu` (nằm trong `npm run check:noi-dung`).

## 1. Nguyên tắc chung

1. **Dịch theo mẫu câu, không dịch máy.** Mỗi mẫu câu tiếng Việt có một câu tiếng Anh viết tay, đã soát nghĩa và ngữ pháp.
2. **Hoặc dịch trọn, hoặc không dịch.** Chỉ hiện bản dịch khi *mọi câu* trong đề khớp một quy tắc. Còn một câu chưa có quy tắc thì không hiện bản dịch
   mà chỉ hiện phép tính đọc bằng tiếng Anh và từ vựng. Không bao giờ hiện nửa Việt nửa Anh.
3. **Dịch sát nghĩa, đúng cách nói tiếng Anh của sách Toán**, không dịch từng chữ:
   - “Số nào gồm 1 và 7?” → *Which number is made up of 1 and 7?* (không phải “What number includes 1 and 7?”)
   - “Tính nhẩm.” → *Calculate mentally.* · “Đặt tính rồi tính” → *Set out the calculation, then calculate.*
   - “Hỏi cả hai bạn có bao nhiêu …?” → *How many … do both children have altogether?*
4. **Tiếng Anh – Anh (British English)**, thống nhất với sách tiếng Anh tiểu học: *metre, litre, centimetre, colour, Maths, rubber, sweets, Mum, Dad*.

## 2. Số, đơn vị, thời gian

| Tiếng Việt | Tiếng Anh | Ghi chú |
|---|---|---|
| 12 500 · 12.500 | 12,500 | Dấu phẩy ngăn hàng nghìn khi số có từ 5 chữ số; số 4 chữ số viết liền (1000) |
| 2,5 | 2.5 | Dấu thập phân là dấu chấm |
| 3/4 · 2 1/3 | 3/4 · 2 1/3 | Phân số, hỗn số giữ nguyên |
| cm, kg, l, m², km/giờ | cm, kg, l, m², km/h | Viết tắt giữ nguyên; km/giờ → km/h, m/phút → m/min |
| ki-lô-gam, xăng-ti-mét, lít | kilograms, centimetres, litres | Viết đủ thì dịch đủ, có số ít / số nhiều |
| 7 giờ 5 phút (giờ đồng hồ) | 7:05 | Phút luôn 2 chữ số |
| 2 giờ 15 phút (khoảng thời gian) | 2 hours 15 minutes | |
| ngày 14 tháng 1 | 14 January | Không viết 14/1 |
| thứ Hai … Chủ nhật | Monday … Sunday | |
| … ? □ (ô trống) | giữ nguyên | |

## 3. Ngữ pháp bắt buộc

- **Số ít / số nhiều theo số:** *1 pen, 3 pens; 1 ten, 4 tens; 1 hour; 1 year old*. Bộ dịch tự sửa “1 + danh từ số nhiều” về số ít.
- **Có / is–are:** *There is 1 bird / There are 3 birds*; *1 more bird flies in / 2 more birds fly in*.
- **Do / does:** *How many … does Lan have?* · *How many … do both children have?*
- **a / an** đúng trước nguyên âm.
- **Tên người, địa danh Việt Nam giữ nguyên** (có dấu): *Bình, Hà Nội, Đà Lạt*. “Bạn Lan” → *Lan*.
- **Đ / S** (Đúng / Sai) là ký hiệu đáp án trên màn hình nên giữ nguyên.
- Lượng từ trơn (“viên”, “chiếc”, “cuốn”…) **không dịch trong câu** (dễ sai nghĩa: “6 viên” là 6 viên bi), chỉ dịch ở dòng đáp số “? viên”.

## 4. Từ vựng thống nhất

| Việt | Anh | Việt | Anh |
|---|---|---|---|
| bạn (học sinh) | pupil(s) / child, children | học sinh | student(s) |
| quyển vở | notebook | cây bút / bút chì | pen / pencil |
| viên bi | marble | cái nhãn vở | label |
| cái kẹo | sweet | quả bóng bay | balloon |
| hộp bút | pencil case | hộp như nhau | identical boxes |
| tổng · hiệu · tích · thương | sum · difference · product · quotient | số bị chia · số chia | dividend · divisor |
| chu vi · diện tích · thể tích | perimeter · area · volume | hình hộp chữ nhật | cuboid |
| hình thang · hình thoi | trapezium · rhombus | đường gấp khúc | broken line |
| làm tròn đến hàng nghìn | round to the nearest thousand | trung bình cộng | average |
| mẹ · bố · anh · chị | Mum · Dad · older brother · older sister | cô bán hàng | the shopkeeper |

Danh sách đầy đủ: `NOUNS`, `UNITS`, `SUBJ`, `PLACE`, `COLOR`, `ACT`, `TREE` trong `src/lib/math-translate.ts`.

## 5. Thêm quy tắc mới (khi thêm dạng câu / bộ sinh câu Toán)

1. Chạy `npm run check:song-ngu -- --chua 60` (thêm `--lop 1` để xem riêng một lớp) — in các mẫu câu chưa có quy tắc, xếp theo số lần gặp.
2. Thêm quy tắc vào `RULES`: `rule('Mẫu tiếng Việt có {n} {t}.', 'English pattern with {1q2}.')`
   - Chỗ trống: `{n}` số · `{t}` đồ vật · `{u}` đơn vị · `{name}` tên · `{who}` chủ ngữ · `{cls}` lớp 4A · `{e}` biểu thức · `{s}` môn / thể thao ·
     `{p}` hàng chữ số · `{w}` thứ · `{c}` màu · `{a}` hoạt động · `{k}` loại cây · `{L}` chữ cái tên điểm · `{x}` phần nhắc lại (không dịch).
   - Bên tiếng Anh: `{1}` · `{1s}` số ít · `{1q2}` số kèm danh từ chia đúng số · `{1d2}` “14 January” · `{1m}` tên tháng · `{2z}` phút 2 chữ số.
   - Quy tắc cụ thể đặt **trước** quy tắc chung.
3. Danh từ mới → thêm vào `NOUNS` cả số ít và số nhiều (`'con bướm': ['butterfly', 'butterflies']`).
4. Chạy lại `npm run check:song-ngu`: phải **không có lỗi** (chữ Việt sót, chỗ trống sót, a/an, số ít / số nhiều, viết hoa đầu câu).
   Soát nghĩa bằng mắt vài câu mẫu của quy tắc vừa thêm.

## 6. Độ phủ hiện tại (11/2026)

Đề Toán lớp 1–5 (câu soạn sẵn + bộ sinh câu mọi mức, 24 316 đề khác nhau): **dịch trọn khoảng 90%** — lớp 2–5: 90–95%, lớp 1: ~64%
(lớp 1 có nhiều câu chuyện tranh mỗi mẫu chỉ vài câu). Đề chưa dịch trọn vẫn có phép tính tiếng Anh + từ vựng.
