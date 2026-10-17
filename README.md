# EduChain Kids — Foundation Starter

Bản nền tảng phát triển nội bộ cho website học tập tiểu học lớp 1–5. Đây chưa phải sản phẩm production và chưa kết nối blockchain.

## Công nghệ

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL + Row Level Security
- GitHub để quản lý mã nguồn

## Yêu cầu

- Windows 10/11
- Node.js LTS (khuyến nghị Node.js 22 LTS)
- Git (khuyến nghị)
- Tài khoản Supabase
- VS Code hoặc Cursor

## Chạy giao diện trước

1. Giải nén thư mục.
2. Mở PowerShell tại thư mục `educhain-kids-starter`.
3. Cài dependency:

   ```powershell
   npm install
   ```

4. Tạo file môi trường:

   ```powershell
   Copy-Item .env.example .env.local
   ```

5. Chưa có Supabase thì trang chủ vẫn có thể được xem, nhưng các hàm Supabase sẽ báo thiếu biến khi được gọi. Để build production, điền URL và publishable/anon key của project Supabase vào `.env.local`.
6. Chạy local:

   ```powershell
   npm run dev
   ```

7. Mở `http://localhost:3000`.

## Thiết lập Supabase

1. Tạo project Supabase riêng cho development.
2. Vào SQL Editor, chạy lần lượt (đúng thứ tự, mỗi file một lần):
   - `supabase/migrations/0001_platform_foundation.sql`
   - `supabase/migrations/0002_quiz_security_and_onboarding.sql`
   - `supabase/migrations/0003_question_types_and_reports.sql`
   - `supabase/migrations/0004_admin_authoring.sql`
   - `supabase/migrations/0005_curriculum_catalog.sql` (danh mục chương trình + dữ liệu lớp 1)
   - `supabase/migrations/0006_levels_timer_points.sql` (cấp độ L1–L5, thời gian từng câu, thời lượng bài làm, điểm tích luỹ)
   - `supabase/migrations/0007_student_role.sql` (chạy riêng), `0008_classroom_accounts.sql`, `0009_teacher_view_pin.sql` (giáo viên xem lại PIN học sinh), `0010_class_code_required.sql` (mã lớp bắt buộc, không trùng, không sửa được), `0011_fix_student_role.sql` (tài khoản học sinh luôn mang vai trò học sinh), `0012_class_leaderboard.sql` (Thành tích thật + bảng bạn điểm cao nhất tuần/tháng trong lớp)
3. Lấy Project URL và publishable/anon key từ phần API project settings, điền vào `.env.local`.
4. Tạo tài khoản test riêng cho từng vai trò. Không dùng tài khoản hoặc dữ liệu học sinh thật.
5. Gán role test qua SQL Editor bằng tài khoản quản trị tin cậy. Không tạo endpoint công khai để người dùng tự cấp role.
6. Kiểm tra kết quả trong `supabase/tests/0001_security_smoke_test.sql`.
7. Muốn chạy thử toàn bộ luồng (phụ huynh tạo con → vào lớp → làm bài → giáo viên xem báo cáo) trên PostgreSQL cục bộ: xem `supabase/tests/local/`. Năm migration đã được chạy thử thành công theo cách này trên PostgreSQL 16.

## Trang quản trị (/quan-tri)

Dành cho quản trị hệ thống và giáo viên soạn bài. Cần Supabase đã cấu hình và đã chạy migration 0001 → 0004.

**Tạo tài khoản admin đầu tiên** (làm một lần):

1. Supabase Dashboard → Authentication → Users → Add user → nhập email + mật khẩu, tích "Auto Confirm User".
2. SQL Editor, chạy (thay email):

   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'system_admin' from auth.users where email = 'email-cua-ban@example.com';
   ```

3. Mở `http://localhost:3000/dang-nhap`, đăng nhập → vào `/quan-tri`.

Các admin/giáo viên sau đó cấp quyền ngay trong trang **Người dùng** (không cần SQL nữa).

| Trang | Ai dùng | Làm gì |
|---|---|---|
| Chương trình | Admin (sửa), giáo viên (xem) | Lớp → Môn → Chủ đề → YCCĐ → Bài học → Dạng bài; độ phủ câu hỏi theo từng YCCĐ và mức độ |
| Tổng quan | Admin | Số bài theo trạng thái, lượt làm bài 7 ngày, tỉ lệ đúng, độ phủ nội dung Môn × Lớp, bài chờ duyệt |
| Bài học | Admin, giáo viên | Lọc theo môn/lớp/trạng thái, tạo bài mới |
| Soạn bài | Admin, giáo viên (bài của mình) | Gắn chủ đề + YCCĐ cho bài; thêm/sửa/xóa/đổi thứ tự câu hỏi 6 kiểu, mỗi câu có dạng bài, YCCĐ, mức độ, kỹ năng, lời giải; Xem thử; Nhập CSV |
| Người dùng | Admin | Tạo trường, cấp/gỡ vai trò giáo viên, quản trị trường, admin |
| Nhật ký | Admin | 200 thao tác gần nhất |

Quy trình bài: **Nháp → (giáo viên) Gửi duyệt → (admin) Xuất bản**. Bài đã xuất bản bị khóa sửa; admin bấm "Gỡ xuống để sửa" (học sinh tạm không thấy), sửa xong xuất bản lại. Mọi thao tác ghi đều đi qua hàm trong database có kiểm tra quyền, nên dù gọi API trực tiếp cũng không vượt quyền được.

**Lưu ý:** trang học sinh (`/chon-bai`, `/lam-bai`) vẫn đang chạy dữ liệu minh họa. Bài xuất bản từ trang quản trị đã sẵn sàng trong database nhưng chỉ hiện cho học sinh sau khi nối `src/lib/data.ts` với Supabase.

## Danh mục chương trình

Cây: **Lớp → Môn → Chủ đề → Yêu cầu cần đạt (YCCĐ) → Bài học → Dạng bài**. Mỗi câu hỏi lưu: nội dung, đáp án, nhận xét, **lời giải chi tiết**, **mức độ** (Nhận biết / Thông hiểu / Vận dụng), kỹ năng, dạng bài, YCCĐ.

- Dữ liệu lớp 1 (Toán, Tiếng Việt theo GDPT 2018; Tiếng Anh theo chương trình Làm quen tiếng Anh lớp 1–2) nằm ở `src/lib/curriculum/grade1.ts`. Đây là nguồn duy nhất: trang học sinh đọc trực tiếp, còn SQL nạp vào database được sinh bằng `npx tsx scripts/gen-curriculum-sql.ts > supabase/seed/curriculum_grade1.sql` (đã kèm sẵn trong 0005).
- YCCĐ có **giai đoạn 1–3** để tăng dần độ khó, và cờ **cốt lõi / mở rộng** (Tiếng Anh: tùy sách nhà trường).
- Database chặn gắn nhầm: chủ đề/YCCĐ/dạng bài phải cùng môn và lớp với bài; câu hỏi chỉ được gắn YCCĐ đã gắn cho bài.
- Nội dung YCCĐ được viết gọn cho phần mềm; giáo viên nên rà lại với văn bản chương trình gốc trước khi dùng chính thức.

## Bộ bài tập Lớp 1 – Học kì 1

47 bài, 402 câu, bám **trình tự** sách đang dùng ở trường thí điểm (câu hỏi do EduChain Kids tự soạn, không chép sách):

| Môn | Bộ sách | Bài |
|---|---|---|
| Toán 1 | Kết nối tri thức | Bài 1–20 (5 chủ đề) |
| Tiếng Việt 1 | Kết nối tri thức | Tuần 1–17 (mỗi tuần gom 4 bài mới + ôn tập) |
| Tiếng Anh 1 | Global Success | Unit 1–8, Review 1–2 |

Mỗi câu có: đáp án, nhận xét, cấp độ L1–L5, thời gian làm, YCCĐ, dạng bài, kỹ năng; câu từ L3 trở lên có lời giải chi tiết.

- Nội dung nằm ở `src/lib/content/` (toan1-hk1.ts, tv1-hk1.ts, ta1-hk1.ts). Trang học sinh đang dùng trực tiếp bộ này.
- **Kiểm tra tự động**: `npm run check:content` — đáp án tự chấm đúng, khớp danh mục, và **không vượt trước**: Toán không dùng số/phép tính chưa học; Tiếng Việt chỉ dùng âm, vần, dấu thanh đã học đến tuần đó; Tiếng Anh chỉ dùng từ của các unit đã học.
- **Nạp vào Supabase**: sau khi chạy migration 0001 → 0006 và tạo tài khoản admin, chạy `supabase/seed/content_grade1_hk1.sql` trong SQL Editor. Bài được tạo ở trạng thái **Chờ duyệt**; vào `/quan-tri/bai-hoc` xem lại rồi bấm Xuất bản. Chạy lại file nhiều lần không tạo trùng.
- Sửa nội dung: sửa file trong `src/lib/content/`, chạy `npm run check:content`, rồi `npm run gen:sql` để sinh lại file SQL.

## Ngân hàng câu hỏi theo cấp độ (L1–L5)

Thang nội bộ EduChain Kids (không phải cấp độ chính thức của Bộ):

| Cấp độ | Tên | Thời gian gốc | Điểm khi đúng |
|---|---|---|---|
| L1 | Làm quen (Nhận biết) | 30 giây | 10 |
| L2 | Cơ bản (Thông hiểu) | 40 giây | 15 |
| L3 | Vận dụng | 50 giây | 20 |
| L4 | Thử thách | 60 giây | 25 |
| L5 | Mở rộng | 75 giây | 30 |

- **Ngân hàng**: `src/lib/content/ngan-hang-lop1.ts` — 120 câu (mỗi môn 40 câu = 8 câu × 5 cấp độ): 45 câu bộ mẫu ban đầu (6 câu được chỉnh lại cấp độ, có ghi lý do) + 75 câu soạn thêm. Mỗi môn có 4 **Đề ôn** × 10 câu, mỗi đề đi từ L1 đến L5.
- **Thời gian mỗi câu** = thời gian gốc theo cấp độ + thêm theo dạng câu (điền, chọn nhiều +10 giây; sắp xếp, ghép cặp +15 giây) + 10 giây nếu đề dài; làm tròn 5 giây, trong khoảng 30–120 giây. Giáo viên sửa được thời gian từng câu trong trang quản trị (bỏ trống = tự tính). Quy tắc nằm ở `src/lib/levels.ts` và hàm SQL `default_time_limit` (0006).
- **File Excel**: `data/EduChain_Kids_Ngan_hang_cau_hoi_Lop_1.xlsx` — sheet Tong_hop, mỗi môn một sheet (L1→L5), sheet gộp, bài tập theo sách, khung cấp độ, checklist duyệt. Tạo lại bằng `npm run export:bank` (cần Python + `pip install openpyxl`). File mẫu gốc giữ ở `data/ngan-hang-mau-goc.xlsx`.

### Làm bài có đếm ngược

- Câu trong bài được sắp **từ dễ đến khó** (L1 → L5). Mỗi câu có vòng đếm ngược, đổi màu xanh → vàng → đỏ khi sắp hết giờ; 5 giây cuối có tiếng tích tắc nhẹ (tắt được bằng nút loa).
- Bấm **Kiểm tra**: hiện đúng/sai và nhận xét, rồi tự chuyển sang câu chưa làm tiếp theo (có nút đi tiếp ngay).
- **Để sau**: bỏ qua câu đang làm, giữ lại thời gian còn lại; các ô số phía trên cho biết câu nào đã làm, đang để sau, hết giờ; bấm vào ô để quay lại câu chưa làm.
- Hết giờ: câu tính là chưa đúng, hiện đáp án và lời giải.
- **Nộp bài** bất cứ lúc nào; câu chưa làm tính là chưa làm.
- **Đổi câu khác** (tối đa 3 lần mỗi lượt): thay câu đang làm bằng câu mới cùng cấp độ, không trùng câu đã có. Toán lấy câu mới từ bộ sinh ngẫu nhiên của chính bài đó; Tiếng Việt, Tiếng Anh lấy câu cùng cấp độ ở bài đó hoặc các bài học trước (không vượt trước); đề ôn lấy từ các đề ôn khác cùng môn. Đồng hồ của câu mới tính lại từ đầu, thời gian đã dùng cho câu bị đổi vẫn cộng vào tổng thời gian.
- Trang kết quả: số câu đúng, **tổng thời gian làm bài**, điểm bài này, **nhận xét** (điểm mạnh, cấp độ cần luyện thêm, tốc độ), bảng đúng/sai theo cấp độ, xem lại từng câu kèm lời giải.
- **Điểm**: câu đúng được điểm theo cấp độ; +5 nếu đúng và dùng không quá nửa thời gian; đúng hết bài +20, đúng từ 80% +10. **Điểm tích luỹ** = cộng điểm cao nhất của từng bài (làm lại chỉ được cộng phần vượt kỷ lục cũ), kèm danh hiệu Hạt mầm → Cây cổ thụ. Chế độ minh họa lưu trên trình duyệt; với Supabase dùng `finish_quiz_attempt` và `student_points` (0006).

## Đổi bộ câu hỏi và chọn mức độ (mọi bài, mọi môn)

- **Trang chọn bài**: khối **Mức độ cho tất cả các bài** (Cơ bản / Khá / Giỏi) và ở mỗi bài có ô **Mức độ** riêng (mặc định theo mức chung) cùng nút **Đổi bộ câu hỏi**. Lựa chọn được nhớ trên trình duyệt.
- **Màn mở đầu bài**: chọn lại mức độ, **Đổi bộ câu hỏi** (bộ 10 câu mới) hoặc **Về bộ câu gốc**.
- Mức độ: **Cơ bản** = đủ L1 → L5 (3-3-2-1-1 câu); **Khá** = từ L2 (3-3-2-2); **Giỏi** = L3 → L5 (3-3-4). Mức cao có nhiều câu khó nên điểm mỗi bài cũng cao hơn.
- Nguồn câu khi đổi bộ: Toán sinh mới bằng bộ sinh ngẫu nhiên của bài. Tiếng Việt, Tiếng Anh **trộn** khoảng một nửa câu soạn sẵn (của bài, các bài học trước, câu ngân hàng nằm trong phạm vi kiến thức của bài) với câu **sinh mới** theo đúng cấp độ — nhờ vậy mức Khá/Giỏi luôn đủ câu L3–L5 kể cả ở tuần/unit đầu. Đề ôn lấy từ cả học kì. Mã nguồn: `src/lib/sets.ts`.
- **Bộ sinh câu Tiếng Việt** (`src/lib/practice/tv1.ts`, vốn từ và câu ở `viet-words.ts`): bám 83 bài của Vở bài tập Tiếng Việt 1 – Tập một (Kết nối tri thức). Dạng bài: chọn tiếng theo âm đầu / dấu thanh, tranh → từ, âm đầu – vần – dấu của một tiếng, ghép âm + vần + thanh, chọn tất cả tiếng có âm đầu, nối tiếng với vần, nối tranh với từ, điền c/k – g/gh – ng/ngh, bảng Đúng/Sai, tìm tiếng khác vần, đọc câu trả lời Ai/Con gì, đếm tiếng có vần/dấu/âm đầu trong câu, sắp xếp từ thành câu. Mỗi từ, câu tự được xếp vào tuần sớm nhất mà mọi tiếng đều đã học (âm đầu, vần, dấu thanh) — thêm từ/câu mới chỉ cần ghi vào `viet-words.ts`.
- **Bộ sinh câu Tiếng Anh** (`src/lib/practice/ta1.ts`): Unit 1–16, Review 1–4 Global Success, chỉ dùng từ của các unit đã học. Dạng bài: tranh → từ, từ ↔ nghĩa, chữ cái đầu, điền chữ còn thiếu, nối từ – nghĩa – tranh, xếp chữ thành từ, hoàn thành mẫu câu (I have a… / This is my… / I can see a…), xếp từ thành câu, a/an, câu → nghĩa, chọn tranh đúng với câu, chào hỏi – giới thiệu tên.
- `npm run check:practice` kiểm tra cả ba bộ sinh câu: đáp án tự chấm đúng, không trùng câu, và **không vượt trước** theo đúng quy tắc của `npm run check:content` (`src/lib/content/scope.ts`).
- Bộ câu được giữ theo `seed` và `muc` trên địa chỉ trang: tải lại trang hay bấm **Làm lại bộ này** ở trang kết quả vẫn đúng bộ đó; trang kết quả có thêm nút **Đổi bộ câu hỏi**.
- **Đổi bộ không trùng câu**: bấm **Đổi bộ câu hỏi** (ở màn mở đầu hoặc trang kết quả) thì bộ mới **không lặp lại câu nào** của bộ đang làm và bộ trước đó nữa — so theo mã câu, đề câu và "lõi" câu (đề + hình + đáp án; hai câu chỉ khác lựa chọn sai vẫn tính là trùng). Bộ trước được ghi trên địa chỉ trang (`tru=`) và các bộ đã tạo được nhớ trên trình duyệt (`src/lib/set-history.ts`), nên tải lại trang vẫn ra đúng bộ đang làm. Nếu một bài quá ít dạng câu không thể tránh trùng, màn mở đầu ghi rõ "có vài câu giống bộ trước". Kiểm tra tự động: `npm run check:sets`.
- Những tuần đầu Tiếng Việt / Tiếng Anh còn ít câu khó; khi chọn Khá/Giỏi mà chưa đủ câu, bộ câu sẽ bù câu mức thấp hơn và ghi rõ điều đó trên màn mở đầu.

## Luyện tập ngẫu nhiên — Toán 1, Bài 1–20

Bộ sinh câu ngẫu nhiên cho Toán 1 (Học kì 1) — dùng cho nút **Đổi bộ câu hỏi** của các bài Toán: mỗi bộ 10 câu sinh ngẫu nhiên theo mức độ đã chọn. Mỗi lần bấm là một đề mới; đề được giữ theo `seed` trên địa chỉ trang nên tải lại trang không đổi đề. Trang kết quả có nút **Làm đề mới**.

- Dạng bài tham khảo cách ra bài của vở bài tập Toán 1 (học liệu NXB Giáo dục): đếm đồ vật trong tranh, chọn nhóm có đúng số lượng, điền số còn thiếu trong dãy, bảng **Đúng/Sai** nhiều nhận định, so sánh hai hàng đồ vật, tách – gộp số theo sơ đồ, nhận dạng hình qua đồ vật thật, đếm hình trong tranh ghép, đếm hình xếp bằng que tính, tìm hình theo quy luật (hàng, lưới 3×3), phép tính theo tranh, bài toán có lời văn, khối lập phương – khối hộp chữ nhật, vị trí trái – phải – trên – dưới – trước – sau. **Không chép** câu hỏi, tranh hay số liệu của sách: mọi số, tranh và câu chữ đều sinh ngẫu nhiên.
- Tranh minh hoạ vẽ bằng SVG/emoji (`src/components/Figure.tsx`), không cần ảnh ngoài.
- Hai dạng câu mới chỉ dùng cho luyện tập: **điền nhiều ô** (`fill_blanks`) và **bảng Đúng/Sai** (`true_false_table`).
- Mã nguồn: `src/lib/practice/` (`toan1.ts` — các mẫu câu và danh sách bài; `kit.ts` — từ vựng, tranh; `rng.ts` — số ngẫu nhiên theo seed).
- **Kiểm tra tự động**: `npm run check:practice` sinh 500 đề cho mỗi bài và kiểm tra: đủ 10 câu đúng thứ tự cấp độ, không trùng câu trong đề, đáp án tự chấm đúng (và đáp án sai bị chấm sai), lựa chọn không trùng, **không vượt trước** (Bài 1 chỉ số 0–5; trước Bài 10 không có dấu + / −; Bài 10 chưa có dấu −; mọi số ≤ 10), thời gian mỗi câu 30–120 giây, câu L3 trở lên có lời giải.
- Lưu ý: đề luyện tập sinh và chấm ngay trên trình duyệt nên chỉ dùng để tự luyện. Khi cần chấm thật (kiểm tra, chứng nhận) thì chạy bộ sinh ở server và không gửi đáp án xuống trình duyệt.

## Game trí tuệ (/tro-choi)

Thanh điều hướng chính có 3 tab: **Học tập** (`/chon-bai`), **Game trí tuệ** (`/tro-choi`), **Thành tích** (`/thanh-tich`). Mục Phụ huynh đã bỏ; đường dẫn cũ `/phu-huynh` chuyển về trang chủ.

- **Thế giới khám phá**: lọc theo kỹ năng (Tất cả, Logic, Trí nhớ, Không gian, Toán, Ngôn ngữ) và chọn lớp 1–5. Chọn lớp chỉ để gợi ý cấp độ bắt đầu; lớp và cấp độ game là hai thứ khác nhau. Nhóm Ngôn ngữ chưa có game nên hiện trạng thái trống.
- **Cấp độ L1–L5** (Làm quen, Cơ bản, Vận dụng, Thử thách, Mở rộng) là thang thử thách nội bộ của EduChain Kids, **không phải** cấp độ chính thức của Bộ GD&ĐT. Game khó dần nhờ thêm lựa chọn, quy luật phức tạp hơn, nhiều cặp thẻ hơn hoặc mê cung rộng hơn, không đưa thêm kiến thức chưa học.
- **Thám tử quy luật**: 25 câu soạn sẵn, mỗi cấp độ 5 câu, 3–4 lựa chọn. Đáp án và lời giải được tính từ quy luật nên không thể sai.
- **Nhà vô địch trí nhớ**: số cặp thẻ là 3/4/6/8/10. Thẻ được xáo lại mỗi lần chơi. Không lật được thẻ đang mở hoặc đã ghép. Game chỉ đếm số lượt, không có đồng hồ.
- **Mê cung phiêu lưu**: mê cung 5×5 → 12×12, luôn có đường đến đích. Điều khiển bằng nút chạm, phím mũi tên hoặc W A S D. Không đếm ngược.
- **Thành tích**: chỉ dùng dữ liệu minh họa, có ghi nhãn rõ. Không có bảng xếp hạng, không so sánh với bạn khác, huy hiệu không có giá trị đổi thưởng.
- Milo và mọi hình ảnh đều vẽ bằng SVG trong mã nguồn (`src/components/mascot/`), không tải ảnh từ ngoài.
- Mã nguồn:
  - Dữ liệu và logic: `src/lib/games/`
  - Giao diện: `src/components/games/`, `src/components/navigation/MainNavigation.tsx`
- Kiểm tra: `npm run check:games`.

## Toán 1 — Học kì 2 (Bài 21–41) và "Kiến thức cần nhớ"

Nội dung bám trình tự sách Toán 1 tập hai (Kết nối tri thức). Mục tiêu của từng bài lấy theo sách giáo viên. Câu hỏi và hình minh họa đều tự soạn, không chép bài tập của sách.

- **Chủ đề 6. Các số đến 100** (Bài 21–24): chục và đơn vị, đọc và viết số, số tròn chục, so sánh và xếp thứ tự, bảng các số từ 1 đến 100.
- **Chủ đề 7. Độ dài và đo độ dài** (Bài 25–28): dài hơn/ngắn hơn, đo bằng gang tay, sải tay, bước chân và xăng-ti-mét, ước lượng.
- **Chủ đề 8. Phép cộng, phép trừ (không nhớ) trong phạm vi 100** (Bài 29–33): đặt tính, tính nhẩm số tròn chục, bài toán có lời văn.
- **Chủ đề 9. Thời gian, giờ và lịch** (Bài 34–37): giờ đúng, các ngày trong tuần, xem tờ lịch.
- **Chủ đề 10. Ôn tập cuối năm** (Bài 38–41).
- **Mã nguồn:**
  - `src/lib/content/toan1-hk2.ts`: câu soạn sẵn.
  - `src/lib/practice/toan1b.ts`: bộ sinh đề ngẫu nhiên L1–L5, dùng cho "Đổi bộ câu hỏi", mức Khá/Giỏi và "Đổi câu khác".
- **Hình minh họa mới** (`src/components/Figure.tsx`): bó que tính chục – đơn vị, đồng hồ, thước xăng-ti-mét, tờ lịch, phép tính đặt cột.
- **Không vượt trước** (kiểm tra tự động trong `check:content` và `check:practice`):
  - Bài 21–22 dùng số đến 99; từ Bài 23 dùng số đến 100.
  - Trước Bài 29 chỉ có phép tính trong phạm vi 10.
  - Bài 29: cộng số có hai chữ số với số có một chữ số. Bài 30: cộng hai số có hai chữ số. Bài 31: trừ cho số có một chữ số. Từ Bài 32: cộng, trừ trong phạm vi 100.
  - Mọi phép tính đều không nhớ.
- **"Kiến thức cần nhớ"** (`src/lib/content/knowledge.ts`): mỗi bài Toán 1–41 có các ý chính và một ví dụ mẫu, hiện ở màn hình bắt đầu làm bài. Phần này tự viết lại, không chép nguyên văn sách.

## Tiếng Việt 1 và Tiếng Anh 1 — Học kì 2

Bám trình tự Tiếng Việt 1 tập hai (Kết nối tri thức) và Tiếng Anh 1 Global Success (Unit 9–16). Bài đọc, câu hỏi đều tự soạn; chỉ lấy tên chủ đề, tên bài đọc, từ vựng và mẫu câu của từng unit để bám đúng phạm vi.

- **Tiếng Việt HK2** (`src/lib/content/tv1-hk2.ts`, bộ sinh `src/lib/practice/tv2.ts`, dữ liệu `viet-hk2.ts`): 8 chủ đề (Tôi và các bạn → Đất nước và con người) và Ôn tập cuối năm. Có 24 bài đọc ngắn tự viết (3 bài mỗi chủ đề) kèm câu hỏi đọc hiểu, điền từ, từ chỉ sự vật / hoạt động / đặc điểm, dấu câu, viết hoa tên riêng, sắp xếp từ thành câu, chính tả s/x, ch/tr, l/n. Bộ sinh còn trộn các dạng bài Học kì 1 để ôn lại.
- **Tiếng Anh HK2** (`src/lib/content/ta1-hk2.ts`, bộ sinh `TA2_POOL` trong `src/lib/practice/ta1.ts`): Unit 9–16, Review 3–4 (chữ o, m, u, l, n, t, f, w). Dạng bài mới: đếm và trả lời How many …? (one–five từ Unit 9, six–ten từ Unit 16), That's a …, He's/She's running, Look at the …, She's having …, Point to your …, giới thiệu bố mẹ. Kiểm tra "không vượt trước" chấp nhận số nhiều (clocks, mice, leaves…) và từ của mẫu câu theo đúng unit (`GS1_PHRASES`).

## Lớp 2 — Toán, Tiếng Việt, Tiếng Anh (cả năm)

Bám trình tự sách (chỉ lấy tên bài, thứ tự, phạm vi kiến thức; Tiếng Anh lấy từ vựng + mẫu câu ở Book map). Câu hỏi, bài đọc do EduChain Kids tự soạn — không chép SGK/SGV/VBT. Mỗi bài có câu mức Giỏi (L4–L5) kiểu bài nâng cao: dãy số theo quy luật, bài toán hai bước, tuổi, tổng – hiệu, đếm hình, chân gà – chân chó…

| Môn | Bài | Nguồn câu |
|---|---|---|
| Toán 2 (Kết nối tri thức) | Bài 1–75 (HK1: 1–36) · `toan2-kntt-bNN` | bộ sinh `src/lib/practice/toan2.ts`, khung bài `src/lib/content/toan2-plan.ts`, kiến thức cần nhớ `knowledge2.ts` |
| Tiếng Việt 2 (Kết nối tri thức) | Tuần 1–35 (HK1: 1–18) · `tv2-kntt-tNN` | bài đọc tự viết theo chủ điểm tuần + câu đọc hiểu (`src/lib/content/tv2.ts`), luyện từ – câu – chính tả `src/lib/practice/tv2g.ts` |
| Tiếng Anh 2 (Global Success) | Unit 1–16, Fun time 1–4, Review 1–4 · `ta2-gs-…` | từ vựng `src/lib/content/ta2-vocab.ts`, bộ sinh `src/lib/practice/ta2g.ts` |

Kiểm tra phạm vi tự động (`scope.ts`): Toán 2 không dùng cộng/trừ có nhớ trước bài học nó, chỉ nhân/chia trong bảng 2 và 5; Tiếng Anh 2 chỉ dùng từ đã học (Tiếng Anh 1 + các unit Tiếng Anh 2 đến bài hiện tại).
Xuất câu Lớp 2 ra JSON: `npm run export:bank2` → `data/bank-lop2.json`. File seed Supabase: xem mục **Nạp Lớp 2–5 vào Supabase**.

## Lớp 3 — Toán, Tiếng Việt, Tiếng Anh (cả năm)

Cùng cách làm như Lớp 2: bám tên bài, thứ tự, phạm vi kiến thức của sách; câu hỏi và bài đọc tự soạn; mức Giỏi (L4–L5) có dạng nâng cao (rút về đơn vị, tổng – hiệu, gấp – giảm liên tiếp, chu vi – diện tích ngược, chia có dư – làm tròn lên, gà – chó…).

| Môn | Bài | Nguồn câu |
|---|---|---|
| Toán 3 (Kết nối tri thức) | Bài 1–81 (HK1: 1–44) · `toan3-kntt-bNN` | khung bài `src/lib/content/toan3-plan.ts`, bộ sinh `src/lib/practice/toan3.ts`, kiến thức cần nhớ `knowledge3.ts` |
| Tiếng Việt 3 (Kết nối tri thức) | Tuần 1–35 (HK1: 1–18) · `tv3-kntt-tNN` | bài đọc tự viết + 4 câu đọc hiểu (`src/lib/content/tv3.ts`), luyện từ – câu (câu kể/hỏi/cảm/khiến, so sánh, dấu hai chấm – gạch ngang – ngoặc kép, Khi nào? Ở đâu? Bằng gì? Để làm gì?) `src/lib/practice/tv3g.ts` |
| Tiếng Anh 3 (Global Success) | Unit 1–20, Review 1–4 · `ta3-gs-…` | từ vựng + mẫu câu `src/lib/content/ta3-vocab.ts`, bộ sinh `src/lib/practice/ta3g.ts` |

Phạm vi Toán 3 được kiểm tự động: số đến 1000 (Bài 1–44) → 10 000 (Bài 45–58) → 100 000; bảng nhân chia mở dần từ 2–5 đến 9; nhân/chia số nhiều chữ số với số có một chữ số từ Bài 23, chia có dư từ Bài 25. Số từ 1000 trở lên viết tách lớp bằng khoảng trắng hẹp (12 345); ô điền số nhận tối đa 6 chữ số.
Xuất câu Lớp 3 ra JSON: `npm run export:bank3` → `data/bank-lop3.json`.

## Lớp 4 — Toán, Tiếng Việt, Tiếng Anh (cả năm)

Cùng cách làm như Lớp 2–3: chỉ bám tên bài, thứ tự, phạm vi kiến thức (Toán, Tiếng Việt) và từ vựng – mẫu câu (Tiếng Anh) của sách; bài đọc, câu hỏi tự soạn. Mức Giỏi (L4–L5) có dạng nâng cao: tổng – hiệu, trung bình cộng tìm số thiếu, rút về đơn vị, nhân chia nhẩm, tính thuận tiện, phân số của một số – phần còn lại, chia góc vuông/góc bẹt…

| Môn | Bài | Nguồn câu |
|---|---|---|
| Toán 4 (Kết nối tri thức) | Bài 1–73 (HK1: 1–37) · `toan4-kntt-bNN` | khung bài `src/lib/content/toan4-plan.ts`, bộ sinh `src/lib/practice/toan4.ts`, kiến thức cần nhớ `knowledge4.ts` |
| Tiếng Việt 4 (Kết nối tri thức) | Tuần 1–35 (HK1: 1–18) · `tv4-kntt-tNN` | bài đọc tự viết theo chủ điểm + 4 câu đọc hiểu (`src/lib/content/tv4.ts`); luyện từ và câu (danh từ – động từ – tính từ, nhân hoá, từ điển, viết hoa tên cơ quan, chủ ngữ – vị ngữ, các loại trạng ngữ, dấu gạch ngang – ngoặc kép – ngoặc đơn, lựa chọn từ ngữ) `src/lib/practice/tv4g.ts` |
| Tiếng Anh 4 (Global Success) | Unit 1–20, Review 1–4 · `ta4-gs-…` | từ vựng + mẫu câu `src/lib/content/ta4-vocab.ts`, bộ sinh `src/lib/practice/ta4g.ts` |

Phạm vi Toán 4 được kiểm tự động: số đến 100 000 (Bài 1–9) → 1 000 000 (Bài 10–11) → lớp triệu; nhân với số có hai chữ số từ Bài 43, nhân chia nhẩm với 10, 100, 1000 từ Bài 41; phân số được bỏ qua khi kiểm phép chia. Ô điền số nhận tối đa 9 chữ số.
Xuất câu Lớp 4 ra JSON: `npm run export:bank4` → `data/bank-lop4.json`.

## Lớp 5 — Toán, Tiếng Việt, Tiếng Anh (cả năm)

Cùng cách làm như Lớp 2–4: chỉ bám tên bài, thứ tự, phạm vi kiến thức (Toán, Tiếng Việt) và từ vựng – mẫu câu (Tiếng Anh) của sách; bài đọc, câu hỏi tự soạn. Mức Giỏi (L4–L5) có dạng nâng cao: tổng – tỉ, hiệu – tỉ, phần trăm lãi – giảm giá – tiết kiệm, chuyển động ngược chiều – cùng chiều, giờ đến, hình ghép (vành khăn, phần tô màu), nước dâng trong bể, sơn mặt hình lập phương…

| Môn | Bài | Nguồn câu |
|---|---|---|
| Toán 5 (Kết nối tri thức) | Bài 1–75 (HK1: 1–35) · `toan5-kntt-bNN` | khung bài `src/lib/content/toan5-plan.ts`, bộ sinh `src/lib/practice/toan5.ts`, kiến thức cần nhớ `knowledge5.ts` |
| Tiếng Việt 5 (Kết nối tri thức) | Tuần 1–35 (HK1: 1–18) · `tv5-kntt-tNN` | bài đọc tự viết theo chủ điểm + 4 câu đọc hiểu (`src/lib/content/tv5.ts`); luyện từ và câu (đại từ, kết từ, từ đồng nghĩa, từ đa nghĩa, điệp từ – điệp ngữ, câu đơn – câu ghép, nối vế câu ghép, liên kết câu, viết hoa thể hiện sự tôn trọng, tên nước ngoài) `src/lib/practice/tv5g.ts` |
| Tiếng Anh 5 (Global Success) | Unit 1–20, Review 1–4 · `ta5-gs-…` | từ vựng + mẫu câu `src/lib/content/ta5-vocab.ts`, bộ sinh `src/lib/practice/ta5g.ts` |

Phạm vi Toán 5 (`kind: 'math5'`) được kiểm tự động: không dùng số thập phân trước Bài 10. Số thập phân viết dấu phẩy (12,5); ô điền số nhận dấu phẩy (gõ dấu chấm cũng được tự đổi), tối đa 9 chữ số phần nguyên và 4 chữ số phần thập phân.
Kiểm riêng một khối khi sửa: `npx tsx scripts/check-practice.ts 300 toan5` (tham số thứ hai lọc theo mã bài).
Xuất câu Lớp 5 ra JSON: `npm run export:bank5` → `data/bank-lop5.json`.

## Nạp Lớp 2–5 vào Supabase

Trang học sinh và bộ chấm điểm trên máy chủ đọc câu hỏi trực tiếp từ `src/lib/content` + bộ sinh câu, nên Lớp 2–5 **đã dùng được mà không cần nạp**. Nạp vào Supabase để quản trị viên xem, sửa câu, theo dõi độ phủ YCCĐ trong `/quan-tri`.

1. Điều kiện: đã chạy migration `0001` → `0008` và có ít nhất 1 tài khoản `system_admin` (môn `toan-2`…`tieng-anh-5` đã có sẵn từ migration 0002).
2. Với mỗi lớp N (2, 3, 4, 5), chạy lần lượt trong SQL Editor (hoặc `psql "$DATABASE_URL" -f …`):
   1. `supabase/seed/curriculum_gradeN.sql` — chủ đề, YCCĐ, dạng bài (chạy trước, vì câu hỏi tra mã YCCĐ ở đây);
   2. `supabase/seed/content_gradeN_hk1.sql` rồi `content_gradeN_hk2.sql` — bài và câu soạn sẵn (mỗi file ~0,5 MB).
3. Bài được tạo ở trạng thái **Chờ duyệt**. Xuất bản từng bài ở `/quan-tri/bai-hoc`, hoặc xuất bản cả lớp một lần bằng `supabase/seed/publish_seeded.sql` (đổi `v_grade` rồi chạy; bỏ qua bài thiếu câu hoặc sai định dạng đáp án).
4. Chạy lại file nhiều lần không tạo trùng (bài đã có cùng `seed_id` được bỏ qua). Muốn cập nhật câu đã nạp: sửa trong `/quan-tri`, hoặc xoá bài đó rồi nạp lại.

Sinh lại file sau khi sửa nội dung: `npm run gen:sql2` (… `gen:sql5`). Đã thử trên PostgreSQL cục bộ: Lớp 2–5 nạp đủ 540 bài, 4299 câu; không câu nào thiếu YCCĐ/dạng bài, không đáp án sai định dạng.

## Bộ nhận diện thương hiệu và chế độ sáng / tối

- **Màu thương hiệu:** xanh dương chủ đạo `#2457C5`, vàng năng lượng `#FFC83D`, xanh lá phát triển `#22C55E`, tím sáng tạo `#8B5CF6`, cam san hô vui vẻ `#FF6B6B`, xanh trời thân thiện `#7DD3FC`.
- **Phông chữ:** Quicksand (tiêu đề Bold, nội dung Medium, phụ đề Regular, chú thích Light), có đủ dấu tiếng Việt.
- **Logo** (`src/components/brand/BrandLogo.tsx`): quyển sách mở xanh dương – xanh lá với ngôi sao vàng, chữ Edu (xanh dương) Chain (vàng) Kids (xanh lá). **Linh vật** Milo: cú nâu đeo kính tròn xanh dương (`src/components/mascot/MiloMascot.tsx`).
- **Chế độ sáng / tối:** nút mặt trăng / mặt trời trên thanh trên cùng (`src/components/brand/ThemeToggle.tsx`). Lựa chọn lưu ở trình duyệt (`educhain-theme`); chưa chọn thì theo hệ điều hành. Script nhỏ trong `layout.tsx` đặt chế độ trước khi vẽ trang nên không bị nháy màu.
- **Màu trong CSS** (`src/app/globals.css`): mọi màu đều là biến (`--ink`, `--surface`, `--paper`, `--line`, `--link`…; màu riêng của từng thành phần là `--bg-xxxxxx` / `--fg-xxxxxx`) và có giá trị riêng cho chế độ tối. Hình minh họa nét mực (que tính, đồng hồ, thước…) được đặt trên nền giấy sáng ở chế độ tối để vẫn rõ nét.

## Đăng nhập, lớp học và phân quyền

Chi tiết cấu hình: `docs/AUTH-SETUP.md`. Khi chưa kết nối Supabase, app vẫn chạy chế độ minh họa như trước.
Hướng dẫn từng bước dựng bản thử `educhain-dev` và đưa lên Vercel: `docs/DEPLOY-DEV.md`.

- **Vai trò:** học sinh (`student`), giáo viên (`teacher`), quản trị (`school_admin`, `system_admin`). Vai trò chỉ do quản trị hệ thống cấp; không ai tự nâng quyền. Mục phụ huynh đã bỏ khỏi giao diện (bảng/hàm cũ trong database vẫn giữ, không dùng).
- **Giáo viên:** đăng ký ở `/dang-ky` → chờ duyệt (Quản trị → Duyệt giáo viên) → `/giao-vien` tạo lớp → **Quản lý lớp** (`/giao-vien/lop/[id]`): thêm học sinh theo danh sách tên, tạo PIN và in thẻ, **xem lại PIN** (nút Hiện PIN, In thẻ cả lớp), đặt PIN mới, khóa/mở, mở khóa nhập sai, cho rời lớp, xem tiến độ lớp.
- **Học sinh:** `/dang-nhap` → mã lớp → chọn tên → PIN 6 số (sai 5 lần → khóa 15 phút) → `/hoc-sinh`. Bài làm được gửi lên máy chủ, **máy chủ chấm lại** rồi mới lưu (`/api/tien-do`).
- **PIN học sinh** (migration `0009_teacher_view_pin.sql`): PIN lưu ở bảng `student_pins` — trình duyệt không đọc/ghi trực tiếp được; giáo viên đọc qua hàm `teacher_class_pins` (chỉ lớp mình dạy, quản trị trường/hệ thống), mỗi lần xem ghi nhật ký. Học sinh tạo PIN trước khi chạy 0009 hiện "Chưa lưu" — bấm **Đặt PIN mới** một lần. Kiểm thử: `supabase/tests/local/60_teacher_pins.sql`.
- **Mã lớp** (migration `0010_class_code_required.sql`): mỗi lớp có một mã dạng `ABC-123` do hệ thống tự sinh, duy nhất trên toàn hệ thống (không trùng giữa các giáo viên, các trường), bắt buộc có và không sửa được sau khi cấp. Lớp cũ chưa có mã được cấp khi chạy migration. Kiểm thử: `supabase/tests/local/70_class_codes.sql`.
- **Vai trò học sinh** (migration `0011_fix_student_role.sql`): Supabase Auth ghi `app_metadata` sau khi tạo tài khoản nên trigger 0008 từng gán nhầm vai trò người lớn cho học sinh (bài làm không được lưu). 0011 gán vai trò học sinh khi tài khoản được gắn vào hồ sơ học sinh và sửa các tài khoản đã tạo. Kiểm thử: `supabase/tests/local/80_student_role.sql`.
- **Thành tích & bạn điểm cao nhất** (migration `0012_class_leaderboard.sql`, API `/api/thanh-tich`): học sinh đăng nhập thấy điểm thật (tổng, tuần, tháng, số bài) và Top 5 tuần/tháng của **lớp mình**; thầy cô thấy bảng này trong Quản lý lớp. Chỉ bạn cùng lớp và thầy cô dạy lớp xem được, chỉ hiện tên gọi và điểm. Điểm mỗi bài = lần làm tốt nhất trong kỳ (làm lại không cộng dồn); tuần bắt đầu thứ Hai, giờ Việt Nam. Trang tự làm mới mỗi 30 giây. Kiểm thử: `supabase/tests/local/90_leaderboard.sql`.
- **Bắt đăng nhập để học:** khi đã nối Supabase, các trang `/chon-bai`, `/lam-bai`, `/ket-qua`, `/tro-choi`, `/thanh-tich` chuyển người chưa đăng nhập sang `/dang-nhap`. Chỉ bài làm của tài khoản học sinh (mã lớp + PIN) được lưu cho thầy cô xem.
- **Database:** `supabase/migrations/0007_student_role.sql`, `0008_classroom_accounts.sql`, `0009_teacher_view_pin.sql` (chỉ thêm, chạy lại an toàn). Kiểm thử phân quyền: `supabase/tests/local/50_classroom_rbac.sql`.
- **Mã nguồn chính:** `src/lib/auth/` (người xem, PIN, chuyển hướng an toàn), `src/lib/supabase/admin.ts` (service_role, chỉ máy chủ), `src/lib/progress-server/grade.ts` (chấm lại phía máy chủ), `src/app/api/` (đăng nhập học sinh, tạo tài khoản, lưu tiến độ).

## Đọc đề bằng giọng nói

Dùng giọng có sẵn trên máy (Web Speech API, miễn phí). Toán và Tiếng Việt đọc bằng giọng tiếng Việt, ký hiệu `+ − = > <` được đọc thành chữ; Tiếng Anh đọc phần tiếng Anh bằng giọng Anh, phần hướng dẫn bằng giọng Việt. Nếu máy không có giọng tiếng Việt, trang hiện hướng dẫn cài (Edge có sẵn giọng Hoài My; Windows + Chrome cần thêm gói giọng nói Tiếng Việt).

## Biến môi trường

`NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` chỉ là URL và public client key. Không đưa `service_role` key, database password hoặc secret khác vào biến `NEXT_PUBLIC_*`.

## Lưu ý bảo mật cần giải quyết trước khi làm bài tập

- Đáp án đã tách sang bảng `question_keys` (0002) và chấm qua `submit_quiz_answer` (0003 chấm theo từng loại câu). Giao diện hiện vẫn chạy bằng **dữ liệu minh họa** trong `src/lib/demo-data.ts`, chấm ngay trên trình duyệt; khi nối Supabase chỉ cần thay thân các hàm trong `src/lib/data.ts`.
- Học sinh chưa có tài khoản riêng: lượt làm bài chạy bằng phiên đăng nhập của phụ huynh. Nếu thí điểm trên máy của trường, cần thêm cách vào học bằng mã lớp + PIN.
- Quy trình xác minh phụ huynh–học sinh chưa được tự động hóa. Liên kết ở trạng thái pending không cho phép xem hồ sơ trẻ.
- Trang xác minh chứng nhận công khai chưa được xây; không bật public read cho bảng `certificates`.
- Cần thêm kiểm thử tự động có JWT context, quy trình phục hồi backup, kiểm soát rate-limit, luồng yêu cầu xóa dữ liệu và đánh giá pháp lý trước pilot với trẻ thật.
- Không dùng dữ liệu cá nhân thật trong development; chưa tích hợp blockchain, ví hoặc token.

## Lệnh kiểm tra

```powershell
npm run typecheck
npm run lint
npm run build
npm run check:content   # kiểm tra nội dung bài tập
npm run gen:sql         # sinh lại file SQL nạp dữ liệu
npm run export:bank     # xuất lại file Excel ngân hàng câu hỏi
npm run check:practice  # kiểm tra bộ sinh bài luyện tập ngẫu nhiên
npm run check:games     # kiểm tra dữ liệu và logic Game trí tuệ
npm run check:sets      # kiểm tra Đổi bộ câu hỏi không trùng câu với bộ trước
```

## Cấu trúc chính

## Các trang

| Đường dẫn | Nội dung |
|---|---|
| `/` | Trang chủ (landing) |
| `/chon-bai?subject=toan&grade=1` | Chọn lớp, môn, bài |
| `/lam-bai?lessonId=...` | Làm bài: 6 dạng câu, đếm ngược từng câu, để sau / quay lại, đi từ dễ đến khó |
| `/ket-qua` | Kết quả: câu đúng, tổng thời gian, nhận xét, điểm tích luỹ, xem lại từng câu |
| `/tro-choi` | Game trí tuệ: danh mục, lọc kỹ năng, chọn lớp |
| `/tro-choi/tham-tu-quy-luat`, `/tro-choi/nha-vo-dich-tri-nho`, `/tro-choi/me-cung` | Ba game, chọn cấp độ L1–L5 (`?cap=1..5`) |
| `/thanh-tich` | Thành tích cá nhân (dữ liệu minh họa) |
| `/phu-huynh` | (đã bỏ) chuyển về trang chủ |
| `/dang-nhap` | Đăng nhập (admin, giáo viên) |
| `/quan-tri` | Khu quản trị: tổng quan, bài học, soạn câu hỏi, người dùng, nhật ký |

```text
src/app/                 App Router: landing, chon-bai, lam-bai, ket-qua, global CSS
src/components/          LearnHeader, questions/ (6 dạng câu hỏi), admin/ (trang quản trị)
src/lib/                 types, data, demo-data, grading, progress, sound, shuffle
src/lib/admin/           Chuyển đổi form câu hỏi <-> DB, kiểm tra, đọc CSV
src/lib/auth/            Xác định quyền vào khu quản trị
src/middleware.ts        Làm mới phiên Supabase (bỏ qua nếu chưa cấu hình)
src/lib/supabase/        Supabase browser/server clients
supabase/migrations/     SQL schema, helper functions, RLS
supabase/tests/          Checklist bảo mật + kịch bản chạy thử cục bộ (tests/local)
docs/                    Tài liệu kiến trúc và bước triển khai
.env.example             Mẫu biến môi trường không chứa bí mật
```

## Trạng thái kiểm thử

- `npm run typecheck`, `npm run lint`, `npm run build`: chạy được, không lỗi.
- Trang quản trị: đã bấm thử đầu-cuối (đăng nhập, tạo bài, soạn 6 dạng câu, xem thử, nhập CSV, xuất bản, gỡ xuống, cấp quyền, giáo viên gửi duyệt) trên Supabase giả lập (PostgREST + Auth giả).
- Migration 0001–0004: đã chạy thử trên PostgreSQL 16 với môi trường giả lập Supabase (vai trò `anon`, `authenticated`, `auth.uid()`), kèm kịch bản đầu-cuối và các thao tác phải bị từ chối. Đây vẫn chưa thay được việc kiểm thử trên một project Supabase thật với JWT của từng vai trò trước khi dùng dữ liệu trẻ thật.
