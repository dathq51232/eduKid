# Quy tắc tạo lịch báo giảng (dành cho tổ trưởng chuyên môn)

Tổng hợp từ file mẫu `LAN từ tuần 12-LBG-KHOI 1-26-27.xlsx` (Trường TH Trần Hưng Đạo, khối 1, năm học 2026–2027),
đối chiếu với bộ đọc lịch báo giảng đang có trong app (`src/lib/plans/schedule.ts`, `schedule-rules.ts`).

---

## 1. Cấu trúc file mẫu

| Trang tính | Vai trò | Ai nhập |
|---|---|---|
| **HUONG DAN SU DUNG** | Hướng dẫn dùng (8 dòng chữ) | — |
| **Lich tuan** | Bảng tuần → ngày: tuần 1 = Thứ Hai 07/09/2026, mỗi tuần sau `= tuần trước + 7`; ngày kết thúc `= ngày đầu + 4` (Thứ Sáu). HK1: tuần 1–19, HK2: tuần 20–35; giữa tuần 22 và 23 có **2 dòng không đánh số** (nghỉ Tết) | Tổ trưởng nhập **1 ô** (D2 – ngày đầu tuần 1), sửa khi có tuần nghỉ |
| **Thoi khoa bieu** | TKB một lớp: Thứ 2→7 × tiết 1→8 (1–4 sáng, 5–8 chiều). Mỗi ô: **Môn** (chọn từ danh mục 28 môn ở cột M) + **Tiết thứ/tuần** (lần thứ mấy môn đó xuất hiện trong tuần). Cột G ghép **mã tra** `số tuần & môn & tiết thứ` (vd. `12TIẾNG VIỆT3`); cột H báo "CHƯA NHẬP ĐẦY ĐỦ" khi thiếu một trong hai | Giáo viên chủ nhiệm (mỗi lớp một TKB) |
| **PPCT LOP1** | Phân phối chương trình cả năm, mỗi môn một khối dòng: `Mã tra · Phân môn · Tuần · Tiết thứ/tuần · Tiết PPCT · Tên bài` (1 563 dòng) | Tổ trưởng (dùng chung cả khối) |
| **Lich bao giang** | Bản in: tiêu đề (UBND xã, trường, "LỊCH BÁO GIẢNG", Từ ngày… đến…), ô **Tuần** (F4) và **Khối** (H4), bảng `Thứ/ngày · Tiết · Phân môn · Tiết PPCT · Đầu bài`, dòng ngăn "BUỔI SÁNG / BUỔI CHIỀU", chân trang ký **TỔ TRƯỞNG** | Chỉ nhập số tuần rồi in |
| Sheet1, Sheet2 (ẩn) | Trống | — |

**Luồng tính:** số tuần (F4) → `Lich tuan` cho ngày → mỗi ô TKB ghép mã `tuần+môn+thứ tự` → `VLOOKUP` sang PPCT lấy *Tiết PPCT* (cột 5) và *Tên bài* (cột 6) → điền vào lịch báo giảng.

### Số tiết mỗi tuần — khối 1 (theo TKB và PPCT trong file)

| Môn | Tiết/tuần | Cả năm (35 tuần) |
|---|---|---|
| Tiếng Việt | 12 | 420 |
| Toán | 3 | 105 |
| Hoạt động trải nghiệm (gồm Sinh hoạt dưới cờ, Sinh hoạt lớp/sao) | 3 | 105 |
| Tự nhiên và Xã hội | 2 | 70 |
| Giáo dục thể chất | 2 | 70 |
| Tiếng Anh | 2 | 70 |
| Đạo đức · Âm nhạc · Mĩ thuật · Tin học | 1 mỗi môn | 35 mỗi môn |
| Tăng cường (Ôn Toán, Ôn Tiếng Việt, Thư viện, ATGT…) | 4 | ~140 |
| **Cộng** | **32 tiết**, học Thứ 2 → Thứ 6 | |

---

## 2. Quy tắc tạo lịch báo giảng

### 2.1. Lịch tuần (ngày của từng tuần)
1. Tổ trưởng nhập **ngày Thứ Hai của tuần 1** và danh sách **tuần nghỉ** (Tết, nghỉ lễ dài, tuần dự phòng).
2. Tuần dạy thứ *n* = tuần lịch thứ *n* sau khi bỏ các tuần nghỉ; ngày bắt đầu = Thứ Hai, ngày kết thúc = **ngày học cuối cùng trong TKB** (khối 1: Thứ Sáu, Thứ Hai + 4).
3. Ranh giới học kì do trường quy định (file: HK1 = tuần 1–19, HK2 = tuần 20–35) — chỉ dùng để in tiêu đề, không ảnh hưởng tra PPCT.
4. Ngày nghỉ lẻ trong tuần (lễ 2/9, 20/11…) → tiết của ngày đó **lùi sang tuần sau** hoặc đánh dấu "Nghỉ lễ – dạy bù"; không để PPCT nhảy cóc.

### 2.2. Thời khoá biểu (mỗi lớp)
5. Lưới cố định: Thứ 2 → Thứ 7 × tiết 1 → 8; **tiết 1–4 buổi sáng, 5–8 buổi chiều** (trong lịch in, tiết chiều đánh số lại 1, 2, 3…).
6. Mỗi ô chỉ ghi **tên môn theo danh mục chuẩn** (Tiếng Việt, Toán, HĐTN, TNXH, GDTC, Đạo đức, Âm nhạc, Mĩ thuật, Tiếng Anh, Tin học, Tăng cường…). Tên viết tắt/biến thể (`HĐ T.NGHIỆM`, `GD T.CHẤT`, `TNXH`, `Toán (BS)`) quy về tên chuẩn (bảng `SUBJECT_ALIASES` trong app đã có).
7. **"Tiết thứ/tuần" không cần nhập tay**: đánh số tự động theo thứ tự xuất hiện của môn từ Thứ 2 tiết 1 đến Thứ 7 tiết 8. Đây là chỗ file mẫu dễ sai nhất (nhập tay, trùng hoặc bỏ số).
8. Tiết 1 Thứ Hai = **Sinh hoạt dưới cờ** (thuộc HĐTN), tiết cuối Thứ Sáu = **Sinh hoạt lớp/sao** (HĐTN).
9. Kiểm tra TKB trước khi sinh lịch: số tiết mỗi môn trong TKB **phải bằng** số tiết/tuần trong PPCT của khối (bảng mục 1). Lệch → báo cho tổ trưởng, không sinh lịch sai.

### 2.3. Phân phối chương trình (dùng chung cả khối)
10. Mỗi môn là một dãy tiết **liên tục 1 → N cả năm**; mỗi tiết có: tuần, thứ tự trong tuần (1…k), số tiết PPCT, tên bài.
11. Khoá tra cứu = **(khối, tuần, môn chuẩn, thứ tự tiết trong tuần)** — mỗi khoá chỉ có **một** dòng. Không dùng chuỗi ghép `12TIẾNG VIỆT3` (dễ lệch dấu cách, chữ hoa, số dạng chữ).
12. Số tiết của môn trong một tuần phải đúng số tiết/tuần (TV 12, Toán 3…). Tuần ít/nhiều tiết hơn (tuần ôn tập, dồn bài) phải ghi rõ trong PPCT, không để trống.
13. Nội dung tích hợp ghi **tách riêng** khỏi tên bài: QCN, Tích hợp AI (mã năng lực, vd. `1.A2.2`), GDĐP, STEM, ATGT, "Lý tưởng cách mạng, đạo đức, lối sống"… (file mẫu đang nối vào cuối tên bài; bộ đọc của app đã tự tách được).
14. Tiết **Tăng cường / bổ sung** đánh số riêng, ghi rõ nội dung (Ôn Toán, Ôn Tiếng Việt, Thư viện, ATGT bài n) và gắn nhãn "(BS)" khi in.

### 2.4. Ghép thành lịch báo giảng
15. Với mỗi ô TKB có môn: lấy dòng PPCT theo khoá ở mục 11 → điền **Tiết PPCT** và **Tên bài**. Ô trống → bỏ dòng, không in `#N/A`.
16. Không tìm thấy dòng PPCT → in "**(chưa có trong PPCT)**" và đưa vào danh sách cảnh báo của tổ trưởng.
17. Một tiết PPCT chỉ được xuất hiện **một lần** trong tuần (file mẫu đang lặp tiết TV 142 ở Thứ 5).
18. Tiết PPCT của mỗi môn phải **nối tiếp tuần trước** (tuần 12 bắt đầu bằng tiết cuối tuần 11 + 1). Đứt quãng → cảnh báo.

### 2.5. Trình bày bản in
19. Tiêu đề: cơ quan chủ quản (UBND xã/phường), tên trường, **LỊCH BÁO GIẢNG – Tuần n**, khối/lớp, giáo viên, **Từ ngày … đến ngày …** (đến Thứ Sáu nếu lớp học 5 ngày).
20. Bảng: `Thứ/ngày · Buổi · Tiết · Môn · Tiết PPCT · Tên bài dạy · ND tích hợp / ĐDDH · Điều chỉnh` (mẫu chuẩn của app; file mẫu thiếu 3 cột Buổi, Tích hợp/ĐDDH, Điều chỉnh).
21. Chân trang: ký **Giáo viên** (người lập) và **Tổ trưởng** (duyệt) – có thể thêm **Ban giám hiệu**.
22. Khổ A4 dọc, cả tuần vừa 1 trang (file mẫu chưa đặt vùng in / vừa trang).

### 2.6. Việc của tổ trưởng
23. Quản lý **một bộ PPCT cho cả khối** và **lịch tuần** cho cả năm; giáo viên chỉ nhập TKB lớp mình.
24. Mỗi tuần: chọn số tuần → **sinh lịch cho tất cả lớp trong khối** → xem danh sách cảnh báo (môn lệch số tiết, thiếu PPCT, trùng tiết, đứt quãng) → duyệt / ký.
25. Khi trường điều chỉnh (nghỉ đột xuất, dạy bù, đổi TKB giữa kì): sửa ở **lịch tuần** hoặc **TKB**, không sửa tay trên bản in.

---

## 3. Lỗi phát hiện trong file mẫu

| # | Vị trí | Lỗi | Hậu quả |
|---|---|---|---|
| 1 | `Lich bao giang` cột E, F (48 công thức) | `VLOOKUP(…,'PPCT LOP1'!$B$3:$G$1172,…)` chỉ tra đến **dòng 1172**, dữ liệu PPCT tới **dòng 1589** | 35 dòng Tăng cường cuối (dòng 1173–1207) không bao giờ được tra |
| 2 | Cùng các công thức trên | Nhánh khối 2–5 trỏ `#REF!` (sheet PPCT lớp 2–5 đã bị xoá) | Đổi ô Khối sang 2–5 → toàn bộ lịch lỗi |
| 3 | `Lich bao giang` dòng 42 và 44 | Cả hai cùng lấy TKB ô E35 (Thứ 5 tiết 5) | Tiết TV 142 "Bài 55 – Tiết 2" in **2 lần** (buổi sáng có 5 tiết) |
| 4 | `Lich bao giang` dòng 58–67 (Thứ 7) | Dòng 62 có ngày nhưng không có tiết; dòng 63–64 lấy nhầm E51/E46; ô **"Tuần:" (D65)** nằm giữa khối Thứ 7 và chứa công thức tra | Hiện `#N/A`; mọi công thức phụ thuộc ô D65 nằm lẫn trong bảng |
| 5 | `Lich bao giang` J2 | `= H2 + 5` (đến Thứ Bảy) trong khi `Lich tuan` dùng `+ 4` | Khoảng ngày in ra 23/11–28/11, lớp chỉ học đến 27/11 |
| 6 | `PPCT LOP1` Tăng cường | Số tiết PPCT chạy 1→105 rồi **đánh lại từ 1** (dòng 1138, tuần 27); tuần 18 có 2 dòng "tiết thứ 2"; tuần 19–21 có dòng thiếu thứ tự; dòng 1173–1207 là dòng thừa trùng mã | Tra trùng / tra sai bài ở tuần 18–21 |
| 7 | `PPCT LOP1` Tiếng Việt | 32 dòng ghi "Ôn luyện **tuần N−1**" ở tuần N, 34 dòng ghi đúng "tuần N" | Không thống nhất cách ghi tuần ôn luyện |
| 8 | `PPCT LOP1` cột Tuần | Âm nhạc, Mĩ thuật… lưu số tuần dạng **chữ** ("2", "3") lẫn dạng số | Tra vẫn chạy nhờ ghép chuỗi, nhưng dễ lỗi khi sắp xếp / lọc |
| 9 | `Thoi khoa bieu` | "Tiết thứ/tuần" nhập tay; ô gộp "Thứ 4" chỉ phủ dòng 23–27 (thiếu 28–30); kiểm tra dữ liệu ô J7 trỏ `#REF!`; danh mục 28 môn còn tên môn chương trình cũ (Tập đọc, LTVC, Kỹ thuật, HĐNGLL, Khoa học, Lịch sử, Địa lý…) | Dễ nhập sai thứ tự tiết; danh mục gây nhầm |

---

## 4. Đối chiếu với app

- **Đã có:** app **đọc** được lịch báo giảng theo mẫu này (thử với file mẫu: nhận đủ **32 tiết** tuần 12, nhận buổi theo dòng "Buổi sáng/Buổi chiều", đổi tiết chiều 5–8 về 1–4, bỏ ô `#N/A`, tự gộp tiết Thứ 5 bị lặp và báo cảnh báo, tách nội dung tích hợp ra cột riêng, nhận "Tăng cường" là tiết bổ sung) rồi sinh giáo án từng tiết.
- **Đã làm (Kế hoạch bài dạy → mục 🧩 Tạo lịch báo giảng):**
  1. Nạp **file Excel của tổ** (mẫu "LBG tự động" như file trên): app đọc trang PPCT, Thời khoá biểu, Lịch tuần, tên trường — `src/lib/plans/lbg.ts` (`parseKhoiBook`).
  2. Dữ liệu khối (PPCT, lịch tuần, TKB các lớp) **dùng chung cả trường** qua `lbg_get` / `lbg_save` (migration `0068_lbg_khoi.sql`); chưa chạy migration thì lưu tạm trên máy.
  3. Nhập / sửa **TKB từng lớp** trên lưới Thứ × Tiết (gợi ý tên môn theo PPCT, ô môn lạ tô cam), chép TKB giữa các lớp; app tự đánh "tiết thứ/tuần".
  4. Chọn tuần → **lịch báo giảng** của lớp + **cảnh báo** (mục 2.4) + tình trạng cả khối; **tải Excel** một lớp hoặc cả khối (mỗi lớp một trang, mẫu chuẩn mục 2.5); lớp đang mở bấm **Soạn giáo án** → chuyển thẳng sang bộ soạn giáo án đã có.
- **Chưa làm:** vai trò "tổ trưởng" riêng (hiện mọi giáo viên của trường đều sửa được dữ liệu khối), ngày nghỉ lẻ trong tuần / dạy bù, nhập PPCT từ chương trình có sẵn trong app.
