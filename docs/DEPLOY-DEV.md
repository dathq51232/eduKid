# Dựng bản thử `educhain-dev` và đưa lên Vercel (Windows)

Mục tiêu: có một địa chỉ web thật (ví dụ `https://educhain-kids-dev.vercel.app`) chạy đầy đủ đăng nhập,
lớp học, phân quyền — **chỉ với dữ liệu demo**. Bản chạy thật (`educhain-prod`) làm sau, theo đúng các bước này
nhưng với project và bí mật riêng.

Thời gian: khoảng 45–60 phút. Cần: Node.js (đã có), trình duyệt, một email.

> Quy tắc: không nhập tên/thông tin học sinh thật vào `educhain-dev`. Dùng tên giả như "An", "Bình", "Chi".

---

## Bước 1 — Tạo project Supabase

1. Vào <https://supabase.com> → **Sign in** (đăng nhập bằng GitHub hoặc email).
2. **New project**:
   - Name: `educhain-dev`
   - Database Password: bấm **Generate**, lưu vào trình quản lý mật khẩu.
   - Region: **Southeast Asia (Singapore)** — không đổi được sau khi tạo.
   - Plan: Free.
3. Đợi 1–2 phút cho project khởi tạo xong.

## Bước 2 — Chạy migration (tạo bảng, phân quyền)

Vào **SQL Editor** → **New query**. Với **từng file** trong `supabase/migrations/` theo thứ tự:

| Thứ tự | File | Ghi chú |
|---|---|---|
| 1 | `0001_platform_foundation.sql` | |
| 2 | `0002_quiz_security_and_onboarding.sql` | |
| 3 | `0003_question_types_and_reports.sql` | |
| 4 | `0004_admin_authoring.sql` | |
| 5 | `0005_curriculum_catalog.sql` | |
| 6 | `0006_levels_timer_points.sql` | |
| 7 | `0007_student_role.sql` | **chạy riêng một lần**, xong mới sang 0008 |
| 8 | `0008_classroom_accounts.sql` | |
| 9 | `0009_teacher_view_pin.sql` | giáo viên xem lại PIN học sinh; chạy lại an toàn |
| 10 | `0010_class_code_required.sql` | mã lớp bắt buộc, không trùng, không sửa được; chạy lại an toàn |
| 11 | `0011_fix_student_role.sql` | sửa học sinh bị nhận nhầm là người lớn; chạy lại an toàn |
| 12 | `0012_class_leaderboard.sql` | Thành tích thật + bạn điểm cao nhất tuần/tháng trong lớp; chạy lại an toàn |
| 13 | `0013_student_comments.sql` | nhận xét học sinh tuần/học kỳ/cả năm; chạy lại an toàn |
| 14 | `0014_school_results.sql` | điểm kiểm tra định kỳ + khen thưởng trên trường; chạy lại an toàn |
| 15 | `0015_exam_papers.sql` | lưu ma trận và đề kiểm tra của giáo viên; chạy lại an toàn |
| 16 | `0016_class_rules_full_subjects.sql` | 1 giáo viên – 1 lớp, tối đa 40 em, đủ môn + phẩm chất – năng lực; chạy lại an toàn |

Cách làm mỗi file: mở file bằng Notepad/VS Code → chọn hết (Ctrl+A) → copy → dán vào SQL Editor → **Run**.
Thấy "Success. No rows returned" là được. Xóa ô soạn rồi làm file tiếp theo.

Kiểm tra nhanh sau khi chạy xong (dán và Run):

```sql
select count(*) as so_bang from information_schema.tables where table_schema = 'public';
select unnest(enum_range(null::public.app_role)) as vai_tro;
```

Phải thấy danh sách vai trò có `student`.

(Tùy chọn) Nạp mục lục chương trình: chạy `supabase/seed/curriculum_grade1.sql`.

## Bước 3 — Cài đặt Authentication

Trong Supabase:

1. **Authentication → Sign In / Providers → Email**: bật Email.
   - Với bản **dev**: có thể **tắt** *Confirm email* để thử nhanh (email mặc định của Supabase chỉ gửi được rất ít thư mỗi giờ).
   - Với bản **prod**: bật lại *Confirm email* và cấu hình SMTP riêng.
2. **Authentication → Rate Limits**: tăng mục **sign-ups and sign-ins** (ví dụ 300 / 5 phút).
   Lý do: học sinh đăng nhập qua máy chủ của app, nên với Supabase **cả lớp trông như cùng một địa chỉ**;
   để mặc định thì lớp 30–40 em đăng nhập cùng lúc có thể bị chặn.
3. **URL Configuration**: làm ở Bước 7 (khi đã có địa chỉ Vercel).

## Bước 4 — Lấy key và tạo chuỗi bí mật

1. **Project Settings → API** (hoặc **API Keys**), ghi lại:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon / publishable key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role / secret key → `SUPABASE_SERVICE_ROLE_KEY` (**bí mật**, không gửi ai, không dán lên chat)
2. Tạo `STUDENT_PIN_PEPPER` — mở PowerShell trong thư mục dự án:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

   Copy chuỗi in ra. Lưu vào trình quản lý mật khẩu, ghi chú "PEPPER educhain-dev".
   **Đổi chuỗi này = mọi PIN học sinh hết hiệu lực.** Bản prod dùng một chuỗi khác.

## Bước 5 — Chạy thử trên máy (khuyên làm)

1. Trong thư mục dự án, copy `.env.example` thành `.env.local` và điền 4 giá trị ở Bước 4.
   (`.env.local` đã nằm trong `.gitignore` và `.vercelignore`, không bị tải lên đâu cả.)
2. PowerShell:

   ```powershell
   npm install
   npm run dev
   ```

3. Mở <http://localhost:3000/dang-ky> → đăng ký một tài khoản bằng email của bạn (chọn Giáo viên).
4. Biến tài khoản đó thành quản trị viên — Supabase **SQL Editor**:

   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'system_admin' from auth.users where email = 'email-cua-ban@vi-du.vn';
   ```

5. Đăng nhập lại → vào `/quan-tri/duyet-giao-vien` duyệt chính mình làm giáo viên (gán trường demo).

Nếu bước này chạy được thì Bước 6 gần như chắc chắn chạy được.

## Bước 6 — Đưa lên Vercel

### 6.1 Tạo tài khoản và đăng nhập CLI

1. Vào <https://vercel.com> → **Sign Up** (gói Hobby, miễn phí, dùng cho thử nghiệm phi thương mại).
2. PowerShell trong thư mục dự án:

   ```powershell
   npx vercel login
   ```

### 6.2 Tạo project và deploy lần đầu

```powershell
npx vercel
```

Trả lời các câu hỏi:

- Set up and deploy? → **Y**
- Which scope? → chọn tài khoản của bạn
- Link to existing project? → **N**
- Project name → `educhain-kids-dev`
- In which directory is your code located? → `./` (Enter)
- Want to modify these settings? → **N** (Vercel tự nhận Next.js)

Lần này app sẽ chạy ở **chế độ minh họa** (chưa có biến môi trường) — bình thường.

### 6.3 Khai báo biến môi trường

Cách dễ nhất: vào <https://vercel.com> → project `educhain-kids-dev` → **Settings → Environment Variables**.
Thêm 4 biến, tick cả **Production** và **Preview**:

| Key | Value | Sensitive |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | không |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key | không |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **bật** |
| `STUDENT_PIN_PEPPER` | chuỗi ở Bước 4 | **bật** |

> Không bao giờ đặt tên `NEXT_PUBLIC_` cho service_role key hay pepper — tên `NEXT_PUBLIC_` sẽ lộ ra trình duyệt.

### 6.4 Chọn vùng máy chủ gần Supabase

**Settings → Functions → Function Region** → chọn **Singapore (sin1)**.
Mặc định Vercel chạy ở Mỹ, mỗi lần đọc database sẽ chậm hơn đáng kể.

### 6.5 Deploy lại để nhận biến môi trường

Biến `NEXT_PUBLIC_*` được gắn vào lúc build, nên **mỗi lần thêm/sửa biến phải deploy lại**:

```powershell
npx vercel --prod
```

Cuối lệnh có dòng `Production: https://educhain-kids-dev....vercel.app` — đó là địa chỉ của bạn
(địa chỉ ngắn `https://educhain-kids-dev.vercel.app` xem ở trang project → Domains).

Các lần cập nhật code sau: chỉ cần chạy lại `npx vercel --prod`.

## Bước 7 — Báo cho Supabase biết địa chỉ web

Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://educhain-kids-dev.vercel.app`
- **Redirect URLs** (Add URL):
  - `https://educhain-kids-dev.vercel.app/**`
  - `http://localhost:3000/**`

## Bước 8 — Kiểm tra trên địa chỉ thật

Làm lần lượt, đánh dấu từng dòng. Dùng điện thoại/máy tính bảng thật cho phần học sinh.

- [ ] Trang chủ mở được, đổi sáng/tối được, không còn dòng "Chưa kết nối Supabase" ở `/dang-nhap`.
- [ ] Đăng nhập bằng tài khoản quản trị → vào được `/quan-tri`.
- [ ] Mở cửa sổ ẩn danh, đăng ký **giáo viên thứ hai** → thấy màn hình "chờ duyệt", không tạo được lớp.
- [ ] Quản trị viên duyệt → giáo viên tạo lớp **1A**, thêm 3 học sinh demo (An, Bình, Chi) → **In thẻ**.
- [ ] Giáo viên tạo thêm lớp **1B** bằng tài khoản khác → giáo viên 1A dán link lớp 1B vào thanh địa chỉ → bị chặn (404).
- [ ] Trên điện thoại: `/dang-nhap` → nhập mã lớp → chọn tên → nhập PIN → vào `/hoc-sinh`.
- [ ] Nhập sai PIN → báo số lần còn lại; sai 5 lần → bị khóa → giáo viên bấm **Mở khóa** → đăng nhập lại được.
- [ ] Học sinh làm một bài → giáo viên thấy bài đó trong **Tiến độ theo bài**; bấm tên em → thấy điểm, số lần làm; tải được CSV.
- [ ] Đăng xuất học sinh → mở lại `/dang-nhap` trên cùng máy → chỉ cần nhập PIN rồi Enter.
- [ ] `/quen-mat-khau` → nhận thư → bấm liên kết → đặt mật khẩu mới → đăng nhập bằng mật khẩu mới.
  (Bản dev dùng email mặc định của Supabase: chỉ vài thư mỗi giờ.)
- [ ] Giáo viên tạo **mã mời phụ huynh** cho An → đăng ký tài khoản phụ huynh → nhập mã → chỉ thấy An.
- [ ] Học sinh gõ thẳng `/giao-vien` hoặc `/quan-tri` → bị chuyển đi.
- [ ] Đăng xuất → mở lại `/hoc-sinh` → về trang đăng nhập.

Ghi lại lỗi gặp phải (ảnh chụp màn hình + bước làm) để sửa trước khi mở `educhain-prod`.

## Lỗi thường gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Vẫn thấy "Chưa kết nối Supabase" trên Vercel | Thêm biến nhưng chưa deploy lại | `npx vercel --prod` |
| "Máy chủ chưa bật đăng nhập học sinh" | Thiếu `SUPABASE_SERVICE_ROLE_KEY` hoặc `STUDENT_PIN_PEPPER` | Kiểm tra 6.3, deploy lại |
| SQL báo `unsafe use of new enum value "student"` | Chạy 0007 và 0008 chung một lần | Chạy 0007 riêng, rồi chạy 0008 |
| SQL báo `already exists` ở 0001–0006 | Chạy lại file cũ | Bỏ qua file đó; 0007/0008 chạy lại an toàn |
| Đăng ký không nhận được email | Email mặc định của Supabase bị giới hạn | Bản dev: tắt *Confirm email*; bản prod: cấu hình SMTP |
| Bấm link trong email ra `localhost` | Chưa đặt Site URL | Làm Bước 7 |
| Cả lớp đăng nhập cùng lúc, một số em bị báo "thử nhiều quá" | Giới hạn đăng nhập của Supabase | Tăng ở **Authentication → Rate Limits** (Bước 3.2) |
| Trang chậm | Vercel đang chạy ở Mỹ | Bước 6.4, rồi deploy lại |
| Đăng nhập học sinh báo sai PIN dù nhập đúng | Đã đổi `STUDENT_PIN_PEPPER` sau khi in thẻ | Giáo viên bấm **Đặt PIN mới** |

## Khi chuyển sang `educhain-prod`

Làm lại Bước 1–8 với: project tên `educhain-prod`, **gói Pro** (có sao lưu hằng ngày), bật *Confirm email*
+ SMTP riêng, **pepper mới** (lưu cẩn thận, không bao giờ đổi), project Vercel riêng (`educhain-kids`)
và tên miền chính thức. Không copy dữ liệu từ dev sang prod.
