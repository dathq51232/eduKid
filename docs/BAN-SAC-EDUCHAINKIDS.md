# Bản sắc & bộ quy tắc EduChain Kids

> Tài liệu gốc cho mọi người làm nội dung, giao diện, đề thi và tính năng của EduChain Kids.
> Mục tiêu: có **chất riêng**, không đi theo lối mòn của các sân chơi thi trực tuyến hiện có (đặc biệt là mô hình “khoa cử” của Trạng Nguyên),
> và nhất quán từ tên gọi, giọng nói, hình ảnh đến cách chấm điểm.
> Khi có gì mâu thuẫn với tài liệu này, sửa tài liệu trước rồi mới sửa sản phẩm.

---

## 0. Một câu để nhớ

**EduChain Kids — Học theo cách của em, mỗi ngày một mắt xích.**

- **EduChain = chuỗi.** Kiến thức là những *mắt xích* nối nhau: hôm nay vững mắt xích này thì mai nối được mắt xích kế tiếp. Ngày học liên tiếp cũng là một chuỗi.
- **Kids = vừa sức em.** Mỗi em đi theo nhịp của mình (mức Cơ bản / Khá / Giỏi), không bị kéo theo bảng xếp hạng toàn quốc.
- **Cùng lớp.** Cô giáo là người dẫn dắt, phụ huynh là người đồng hành. Nền tảng phục vụ *lớp học thật*, không thay thế lớp học.

### Khác biệt cốt lõi so với Trạng Nguyên

| | Trạng Nguyên | EduChain Kids |
|---|---|---|
| Hình tượng | Khoa cử xưa: thi Hương – Hội – Đình, Trạng Nguyên, Bảng nhãn | **Cây tri thức** lớn dần + **chuỗi mắt xích** + bạn cú **Milo** |
| Động lực chính | Thi đấu, vượt vòng, xếp hạng toàn quốc | **Thành thạo từng kỹ năng**, tiến bộ của chính em, thi đua **theo lớp/nhóm** |
| Điểm | 300 điểm / 30 phút, bằng điểm xét thời gian | **Sao** (⭐ 1–3 mỗi câu) + thang 10 quen thuộc ở trường; lớp 1–3 không xét tốc độ |
| Ai tổ chức | Ban tổ chức → Sở → Trường | **Cô giáo** tạo phòng thi cho lớp mình trong vài giây; trường gom kết quả |
| Đánh giá | Giải Nhất/Nhì/Ba theo thang điểm | **Nhận xét theo kỹ năng** (đúng tinh thần Thông tư 27): “Em đã làm được… Em cần luyện thêm…” |
| Nội dung | Chuyên Tiếng Việt / Toàn Tài đa môn | Toán – Tiếng Việt – Tiếng Anh bám 3 bộ sách + công cụ dạy học cho giáo viên |

**Không dùng** trong sản phẩm (tránh nhầm thương hiệu và tránh áp lực thi cử):
tên khoa cử (*thi Hương, thi Hội, thi Đình, Trạng Nguyên, Bảng nhãn, Thám hoa, Sơ khảo*),
tên dạng bài theo con giáp (*Mèo con…, Chuột vàng…, Trâu vàng…, Khỉ con…, Ngựa con…, Hổ con…*),
tông đỏ son – vàng hoàng gia, và mốc “300 điểm”.

---

## 1. Ba giá trị

1. **Vừa sức** — câu hỏi đúng lớp, đúng giai đoạn của yêu cầu cần đạt; không đánh đố, không vượt trước chương trình.
2. **Hiểu sâu** — sai thì được gợi ý và xem lời giải từng bước, rồi làm lại câu tương tự; không chỉ báo “Sai”.
3. **Cùng lớp** — mọi thứ quy về lớp học: cô giao bài, cô xem lỗ hổng, cô khen; phụ huynh thấy con tiến bộ ở kỹ năng nào.

---

## 2. Hệ biểu tượng

| Biểu tượng | Ý nghĩa | Dùng ở đâu |
|---|---|---|
| **Milo – bạn cú** | Người bạn dẫn đường, thông thái nhưng gần gũi. Đổi trang phục theo môn: Toán – *Milo giáo sư*, Tiếng Việt – *Milo họa sĩ*, Tiếng Anh – *Milo phi hành gia*; game: robot, bác sĩ… (`src/lib/mascots.ts`) | Đầu bài, lời khen, gợi ý, màn kết quả |
| **Cây tri thức** | Điểm tích lũy làm cây lớn: 🌱 Hạt mầm → 🌿 Chồi non → 🍀 Lá xanh → 🌳 Cây nhỏ → 🌲 Cây lớn → 🏆 Cây cổ thụ (`src/lib/levels.ts`) | Trang của em, hồ sơ, thư khen |
| **Mắt xích** | Một kỹ năng đã vững = một mắt xích sáng; chuỗi ngày học liên tiếp | Bản đồ bài học, chuỗi ngày, báo cáo kỹ năng |
| **Vở ô li** | Gần với lớp học Việt Nam: nền kẻ ô, lề đỏ, chữ viết tay | Thẻ câu hỏi mẫu, phiếu in, luyện chữ |
| **Sticker sưu tầm** | Khủng long Xanh, Tên lửa, Cá voi Xanh… (`src/lib/stickers.ts`) | Phần thưởng sau mỗi bộ bài |

---

## 3. Giọng nói của Milo

- **Xưng hô:** Milo gọi học sinh là **“em”**, tự xưng **“Milo”** (không “tôi”, không “ta”). Với phụ huynh/giáo viên: “thầy cô”, “ba mẹ”.
- **Câu ngắn:** lớp 1–2 mỗi câu ≤ 12 từ; lớp 3–5 ≤ 20 từ. Một câu một ý.
- **Khen cụ thể, không khen chung chung:** ✅ “Em nhớ đổi 1 chục thành 10 đơn vị rồi đó!” ❌ “Giỏi quá!”
- **Sai thì gợi, không chê:** ✅ “Gần đúng rồi! Em thử đếm lại số chục nhé.” ❌ “Sai rồi.”, “Trượt”, “Thua”.
- **Không so sánh với bạn khác** trong lời nhắn cho học sinh và phụ huynh.
- **Không dọa thời gian:** đồng hồ chỉ là gợi ý nhịp, hết giờ thì “Mình chuyển câu sau nhé”, không hiện chữ đỏ “HẾT GIỜ”.
- Tiếng Việt chuẩn chính tả, thống nhất cách bỏ dấu theo bộ sách hiện hành; tiếng Anh theo sách Global Success (bộ app đang bám).

---

## 4. Hình ảnh

- **Màu thương hiệu** (định nghĩa trong `globals.css`, có bản tối):
  Xanh dương `--brand-blue` (chủ đạo, tin cậy) · Vàng `--brand-yellow` (năng lượng, nút hành động) · Xanh lá `--brand-green` (đúng, phát triển) · Tím `--brand-purple` (sáng tạo) · San hô `--brand-coral` (vui, cảnh báo nhẹ — không dùng đỏ gắt cho lỗi) · Xanh trời `--brand-sky`.
- **Màu theo môn:** Toán – xanh dương, Tiếng Việt – đỏ cam, Tiếng Anh – xanh lá (bìa “vở” ở trang chủ).
- **Chữ:** Quicksand (tròn, dễ đọc cho trẻ). Cỡ chữ câu hỏi ≥ 20px lớp 1–2, ≥ 18px lớp 3–5.
- **Hình:** emoji 3D (Fluent 3D, `public/emoji/f3d`) và ảnh Milo; nền giấy kẻ ô; bo góc lớn, bóng mềm. Không dùng ảnh chụp người thật của trẻ em.
- **Chuyển động:** nhẹ, ngắn (≤ 400ms), chỉ `transform`/`opacity`; tôn trọng “giảm chuyển động” của máy.

---

## 5. Đồ nghề của Milo — tên riêng các dạng câu hỏi

Mỗi dạng câu hỏi là **một món đồ trong cặp sách của Milo**: tên gợi đúng thao tác, dễ nhớ với trẻ, không trùng ai.

| Tên hiển thị | Thao tác của em | Mã kỹ thuật | Trạng thái |
|---|---|---|---|
| 🔍 **Kính lúp** | Soi kỹ, chọn **1** đáp án đúng | `single_choice` | Có |
| 🎈 **Chùm bóng** | Chọn **tất cả** đáp án đúng | `multiple_choice` | Có |
| 🔦 **Đèn pin** | Soi từng nhận định: **Đúng / Sai** | `true_false`, `true_false_table` | Có |
| ✏️ **Bút chì** | **Điền** số, chữ, từ vào ô trống | `fill_blank`, `fill_blanks` | Có |
| 🧵 **Sợi chỉ** | **Nối** mỗi ô bên trái với ô bên phải | `matching` | Có |
| 🪜 **Bậc thang** | **Xếp thứ tự** đúng (số, tiếng, câu, đoạn) | `ordering` | Có |
| 🎨 **Hộp màu** | **Kéo** từng thẻ vào đúng nhóm (2–3 hộp) | `grouping` | Cần làm |
| 🧩 **Mảnh ghép** | Lật/chọn **2 ô cùng cặp** trên lưới, đúng thì ô biến mất | `pair_grid` | Cần làm |
| 📿 **Chuỗi hạt** | Xâu các hạt chữ/tiếng **thành từ, thành câu** theo chuỗi | `bead_chain` | Cần làm |
| 🎧 **Tai nghe** | **Nghe** đoạn âm thanh rồi trả lời (chính tả nghe – viết, nghe tiếng Anh) | thuộc tính `audio` trên mọi dạng | Cần làm |
| 🖼️ **Khung tranh** | Nhìn **tranh/ghép hình đoán từ** (đố chữ, thành ngữ) | `single_choice`/`fill_blank` + `images` | Cần làm |

Quy tắc dùng:
- Trên giao diện học sinh **luôn hiện tên đồ nghề + biểu tượng** ở đầu câu (ví dụ “🧵 Sợi chỉ — Nối từ với nghĩa”), để các em quen thao tác.
- Một bộ 10 câu có **ít nhất 3 món đồ nghề khác nhau**, **không quá 4 câu cùng món liền nhau**.
- Lớp 1: ưu tiên Kính lúp, Sợi chỉ, Hộp màu, Mảnh ghép, Tai nghe (ít gõ phím). Bút chì chỉ điền 1–2 ký tự.

---

## 6. Mức độ và cấu trúc bộ câu

- **5 mức câu hỏi** (gần thang Bloom, `src/lib/levels.ts`):
  L1 *Làm quen* (nhận biết) · L2 *Cơ bản* (thông hiểu) · L3 *Vận dụng* · L4 *Thử thách* (kết hợp kỹ năng) · L5 *Mở rộng* (tình huống mới).
  Thời gian gợi ý 30 / 40 / 50 / 60 / 75 giây; sao ⭐ mỗi câu đúng theo mức đề kiểm tra (Thông tư 27): Mức 1 (L1–L2) = 1 sao, Mức 2 (L3) = 2 sao, Mức 3 (L4–L5) = 3 sao.
- **3 mức bộ bài** cho em tự chọn (`src/lib/basics.ts`): *Cơ bản* (L1→L5), *Khá* (L2→L5), *Giỏi* (L3→L5).
- **Một bộ = 10 câu.** Không lặp câu của bộ vừa làm.
- **Thành thạo một mắt xích:** đạt **≥ 8/10 câu** ở mức Cơ bản (hoặc ≥ 7/10 ở mức Khá/Giỏi) trong **2 lần khác ngày** → mắt xích kỹ năng sáng lên.
- **Đề kiểm tra** (giáo viên tạo): theo ma trận của trường; mặc định 40% L1–L2, 30% L3, 20% L4, 10% L5; thang **10 điểm**.

---

## 7. 12 quy tắc soạn câu hỏi

1. **Bám yêu cầu cần đạt (YCCĐ) CT GDPT 2018** và **không vượt trước**: dùng đúng giai đoạn của học kỳ (xem `docs/soan-cau-hoi.md`).
2. **Một câu – một ý – một đáp án đúng** (trừ Chùm bóng). Không câu mẹo, không bẫy chữ.
3. **Phương án nhiễu lấy từ lỗi sai thật của học sinh** (quên nhớ, nhầm l/n, nhầm số chục – đơn vị…), không bịa đáp án vô lý.
4. **Lời giải ≤ 3 bước**, viết cho trẻ đọc được; có câu “Mẹo nhớ” khi phù hợp.
5. **Ngữ liệu Việt Nam:** tên người đủ 3 miền, cân bằng bạn nam – bạn nữ; tiền Việt Nam, đơn vị đo, cảnh vật, món ăn quen thuộc.
6. **Văn hóa dân gian có chọn lọc:** ca dao, tục ngữ, thành ngữ, câu đố phải hợp lứa tuổi và có giải nghĩa ngắn trong lời giải.
7. **Tiếng Việt chuẩn:** chính tả, dấu câu, khoảng trắng; đọc lại thành tiếng trước khi duyệt.
8. **Hình minh họa** có chú thích thay thế (alt); hình là một phần của câu hỏi thì phải rõ khi in đen trắng.
9. **Không** bạo lực, sợ hãi, thương hiệu sản phẩm, quảng cáo, chính trị, tôn giáo, nội dung gây phân biệt.
10. **Gắn đủ nhãn:** `skill_code` (mã kỹ năng thống nhất), `outcome_code` (YCCĐ), mức L1–L5, món đồ nghề.
11. **Người thật duyệt** từng câu do AI soạn trước khi xuất bản (đọc đề, kiểm đáp án, thử làm).
12. **Câu đủ “chất EduChain”:** có ngữ cảnh gần gũi (lớp học, gia đình, khu vườn của Milo), không chỉ là phép tính trơn.

---

## 8. Mùa Mắt Xích — thể thức thi đua riêng

Thay cho mô hình vòng loại toàn quốc, EduChain Kids tổ chức **theo mùa (mỗi học kỳ một mùa)**, đi theo **vòng đời của cây** — học sinh nào cũng có chỗ đứng, cô giáo là người tổ chức.

| Chặng | Tên | Ai tổ chức | Cách tham gia | Hoàn thành khi |
|---|---|---|---|---|
| 1 | 🌱 **Gieo hạt** | Tự học | Luyện tự do các bộ 10 câu, làm bao nhiêu lần cũng được | Không bắt buộc |
| 2 | 🌿 **Ươm mầm** | Tự học | Làm các bộ **mắt xích** của mùa (mỗi tuần một chủ đề). **Khuyến khích, không phải điều kiện** để vào Ra hoa | Mỗi bộ đạt ≥ 8/10 câu (làm lại không giới hạn, mỗi lần đề mới) → huy hiệu 🦉 **Cú Chăm** |
| 3 | 🌼 **Ra hoa** | **Cô giáo** tạo phòng thi cho lớp (mã phòng, giờ mở – đóng) | Lớp 1–2: **10 câu / 15 phút**; lớp 3–5: **20 câu / 25 phút** (cô sửa được). Làm tại lớp hoặc ở nhà theo cô chọn. Thể thức chi tiết: mục 8.1 | Có kết quả |
| 4 | 🍎 **Kết trái** | **Nhà trường** (gom các lớp cùng khối) | Bài 30 câu, 35 phút, làm tại trường | Có kết quả |
| 5 | 🌳 **Mùa vàng** *(tùy chọn)* | EduChain Kids | Giao lưu liên trường, trực tuyến; có phần “Nói – kể” và “Viết đoạn ngắn” cho lớp 4–5 | Có kết quả |

**Chấm và công nhận**
- Điểm theo **thang 10** (làm tròn 0,5) và **số sao ⭐**.
- Công nhận bằng **Huy hiệu Cú** theo mốc, không xếp thứ hạng cá nhân toàn quốc:
  🦉 **Cú Vàng** ≥ 9 · 🦉 **Cú Bạc** ≥ 8 · 🦉 **Cú Đồng** ≥ 7 · 🦉 **Cú Chăm** (hoàn thành chặng, khen sự cố gắng).
- **Thi đua theo lớp/nhóm** (trang Thi đua `td-`): cộng sao của cả nhóm, khen nhóm tiến bộ nhiều nhất — không chỉ nhóm điểm cao nhất.
- **Lớp 1–3 không xét thời gian** khi bằng điểm (cùng huy hiệu). Lớp 4–5 chỉ xét thời gian ở chặng Kết trái / Mùa vàng.
- **Không có bảng xếp hạng cá nhân cho học sinh** ở mọi lớp: em chỉ thấy kết quả của mình, phụ huynh thấy của con, **giáo viên xem được cả lớp**.
- Giấy khen / thư khen tự động in được (trang Thư khen), có **lời nhận xét theo kỹ năng**.

**Công bằng (thay cho “Hội đồng giám sát”)**
- Đề **sinh riêng cho từng em**, trộn câu và trộn phương án.
- Phòng thi có **mã do cô giáo phát**, giờ mở – đóng rõ ràng; cô có nút **cho làm lại** khi em gặp sự cố.
- Bài làm quá nhanh mà điểm tuyệt đối, hay đổi tab nhiều lần → **gắn cờ để cô xem lại**, hệ thống **không tự hủy** kết quả của trẻ.

### 8.1 Phòng thi lớp (chặng Ra hoa) — thể thức đã chốt (11/2026)

Đây là tầng làm **đầu tiên**. Kỳ thi chung toàn hệ thống (Mùa vàng) chỉ mở khi đã có nhiều trường dùng; dữ liệu vẫn thiết kế theo khung **Mùa → Chặng → Phòng thi** với phạm vi lớp / trường / toàn hệ thống để mở rộng sau không phải làm lại.

| Mục | Quy định |
|---|---|
| **Ai tạo** | Giáo viên chủ nhiệm (hoặc giáo viên bộ môn được gán lớp) |
| **Đề** | Cô chọn bài / chủ đề (hoặc ma trận). Hệ thống **sinh đề riêng cho từng em** cùng ma trận, trộn câu và trộn phương án |
| **Cấu trúc mặc định** | Lớp 1–2: 10 câu, 15 phút · Lớp 3–5: 20 câu, 25 phút · Ma trận 40% L1–L2, 30% L3, 20% L4, 10% L5 · Cô sửa được số câu, thời gian, tỉ lệ mức |
| **Vào phòng** | Em đăng nhập → nhập **mã phòng** (6 ký tự) hoặc bấm vào bài cô giao; chỉ vào được trong **giờ mở – đóng** cô đặt |
| **Số lần làm** | **1 lần.** Em gặp sự cố (mất mạng, tắt máy, hết pin) → cô bấm **“Cho làm lại”**, em nhận đề mới cùng ma trận; lần cũ ghi lại để cô xem |
| **Trong lúc làm** | Có nhãn đồ nghề, nghe đọc đề; **không hiện đúng/sai từng câu**; đồng hồ đếm lùi nhẹ nhàng; hết giờ máy tự nộp phần đã làm |
| **Điều kiện vào** | **Không bắt buộc** hoàn thành Ươm mầm (em nào cũng được kiểm tra cùng lớp); em đã có 🦉 Cú Chăm thì hiện kèm trong kết quả |
| **Chấm** | Thang **10** (làm tròn 0,5) + số **sao ⭐** (mỗi câu đúng: Mức 1 = 1, Mức 2 = 2, Mức 3 = 3 sao) + **huy hiệu Cú** theo mốc (mục 8) |
| **Sau khi nộp** | Em thấy: điểm, số sao, huy hiệu, lời Milo theo kỹ năng (“Em đã vững… / Em cần luyện thêm…”), xem lại từng câu kèm lời giải **sau khi phòng đóng** |
| **Ai thấy kết quả** | Em thấy của mình · phụ huynh thấy của con · **chỉ cô xem bảng cả lớp**. Không bảng xếp hạng cho học sinh |
| **Cô nhận được** | Bảng điểm lớp, phổ điểm, **kỹ năng cả lớp còn yếu** (gom theo `skill_code`), danh sách bài bị gắn cờ, nút in **thư khen / giấy khen** theo huy hiệu, đưa điểm vào **sổ lớp** |
| **Tự động gắn cờ** | Điểm 10 mà thời gian < 30% thời lượng; rời trang / đổi tab ≥ 3 lần. Cờ chỉ để cô xem lại, không tự trừ điểm hay hủy bài |

---

## 9. Phần thưởng & động lực

- **Thưởng nỗ lực, không phạt sai.** Làm lại không bị trừ điểm; điểm của bộ là lần làm tốt nhất.
- **Chuỗi ngày học (mắt xích ngày):** mỗi tuần có **1 “ngày nghỉ”** không làm đứt chuỗi.
- **Cây tri thức** lớn theo tổng điểm; **sticker** sau mỗi bộ hoàn thành; **thư khen** do cô gửi phụ huynh.
- Không dùng phần thưởng mua bằng tiền, không vòng quay may mắn, không quảng cáo trong khu vực học sinh.

---

## 10. Vai trò giáo viên & phụ huynh

- **Giáo viên làm chủ:** giao bài, tạo phòng thi, xem **lỗ hổng kỹ năng** của cả lớp, nhận xét theo Thông tư 27, in phiếu — mọi tính năng mới phải trả lời câu hỏi *“giúp cô bớt việc gì?”*.
- **Phụ huynh đồng hành:** thấy con **đã vững / cần luyện** kỹ năng nào và gợi ý 5 phút luyện cùng con; **không** hiện so sánh với bạn khác.
- **Học sinh:** chỉ thấy tiến bộ của chính mình, nhóm mình và lời khen của cô.

---

## 11. Lộ trình áp dụng vào sản phẩm

| Ưu tiên | Việc | Ghi chú |
|---|---|---|
| 1 | Hiện **tên đồ nghề + biểu tượng** trên mọi câu hỏi (`src/components/questions/*`) | Chỉ đổi nhãn, không đổi cách chấm |
| 1 | Áp **giọng Milo** cho lời khen / gợi ý sai (`lam-bai`) | Theo mục 3 |
| 2 | Dạng mới **🎨 Hộp màu** (`grouping`) và **🧩 Mảnh ghép** (`pair_grid`) | Thêm vào `QuestionType`, bộ sinh câu `src/lib/practice/*`, máy chấm |
| 2 | **Mắt xích kỹ năng**: tính thành thạo theo mục 6, hiện trên bản đồ bài | Dựa trên `skill_code` |
| 3 | **Mùa Mắt Xích**: ✅ Phòng thi lớp (chặng Ra hoa) — mã phòng, đề riêng, huy hiệu Cú, gắn cờ (11/2026, migration 0062, trang `giao-vien/lop/[id]/phong-thi`) | Còn: chặng Ươm mầm, Kết trái, Mùa vàng; đưa điểm phòng thi vào sổ lớp / thư khen |
| 3 | **🎧 Tai nghe** (câu có âm thanh) và **📿 Chuỗi hạt**, **🖼️ Khung tranh** | Tiếng Việt lớp 1–2 và Tiếng Anh dùng nhiều |
| 4 | Ngân hàng **ca dao – tục ngữ – câu đố** theo lớp, có giải nghĩa | Dùng chung cho Tiếng Việt và thư khen |
