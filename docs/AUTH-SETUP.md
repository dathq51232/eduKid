# Cấu hình đăng nhập và phân quyền (Supabase)

Ứng dụng chạy được khi **chưa** có Supabase: bài học, game, Thành tích dùng dữ liệu minh họa; các trang
`/giao-vien`, `/hoc-sinh`, `/phu-huynh` hiện thông báo "chưa kết nối". Làm các bước dưới đây để bật tài khoản.

## 1. Tạo project và chạy migration

1. Tạo project trên Supabase (khu vực gần Việt Nam, ví dụ Singapore).
2. Vào **SQL Editor**, chạy lần lượt từng file trong `supabase/migrations/`:
   `0001` → `0002` → `0003` → `0004` → `0005` → `0006` → `0007_student_role.sql` → `0008_classroom_accounts.sql` → `0009_teacher_view_pin.sql` → `0010_class_code_required.sql`.
   - `0007` phải chạy **riêng** và trước `0008` (thêm giá trị vai trò `student`).
   - `0007`, `0008` chỉ thêm bảng/cột/hàm và thay policy, chạy lại nhiều lần vẫn an toàn.
3. (Tùy chọn) Nạp dữ liệu chương trình: `supabase/seed/curriculum_grade1.sql`, sau khi có tài khoản quản trị (bước 3)
   thì nạp `supabase/seed/content_grade1_hk1.sql`.

## 2. Cài đặt Authentication

- **Authentication → Providers → Email**: bật Email; nên bật *Confirm email* cho tài khoản người lớn.
- **Password**: tối thiểu 8 ký tự (trang đăng ký cũng kiểm tra 8 ký tự).
- **URL Configuration**: thêm địa chỉ trang web (ví dụ `http://localhost:3000`) vào *Site URL*; trong
  *Redirect URLs* thêm `http://localhost:3000/**` và `https://<ten-mien>/**`. Liên kết trong email (xác nhận đăng ký,
  đặt lại mật khẩu) đều quay về `/auth/xac-nhan`, trang này đổi mã trong liên kết lấy phiên đăng nhập.
- **Quên mật khẩu** (thầy cô, phụ huynh): `/quen-mat-khau` → thư có liên kết → `/dat-lai-mat-khau`. Bản chạy thật
  nên cấu hình SMTP riêng (*Authentication → Emails → SMTP Settings*) vì email mặc định của Supabase gửi được rất ít thư.
- Tài khoản học sinh do máy chủ tạo với email nội bộ `s-<mã>@students.educhain.invalid` (đã xác nhận sẵn,
  không gửi thư). Học sinh không đăng nhập trực tiếp bằng email; mật khẩu thật được tạo từ PIN + `STUDENT_PIN_PEPPER`.

## 3. Biến môi trường

Sao chép `.env.example` thành `.env.local` và điền:

| Biến | Lấy ở đâu | Ghi chú |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API | công khai |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API (anon / publishable) | công khai |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API (service_role / secret) | **chỉ máy chủ**, không đặt NEXT_PUBLIC |
| `STUDENT_PIN_PEPPER` | tự tạo, ví dụ `openssl rand -base64 48` | ≥ 32 ký tự; đổi thì mọi PIN cũ hết hiệu lực |

## 4. Tạo quản trị viên đầu tiên

1. Đăng ký một tài khoản ở `/dang-ky` (chọn Phụ huynh hoặc Giáo viên đều được).
2. Trong SQL Editor (quyền chủ project):

```sql
insert into public.user_roles (user_id, role)
select id, 'system_admin' from auth.users where email = 'email-cua-ban@vi-du.vn';
```

Từ đó quản trị viên duyệt giáo viên ở **Quản trị → Duyệt giáo viên** và cấp/gỡ vai trò ở **Người dùng**.

## 5. Luồng sử dụng

1. **Giáo viên** đăng ký → chờ duyệt → quản trị viên duyệt (gán trường) → vào `/giao-vien` tạo lớp.
2. Trong **Quản lý lớp**: dán danh sách tên → xác nhận nhà trường đã có sự đồng ý của phụ huynh → hệ thống tạo
   tài khoản + PIN 6 số → **In thẻ** (PIN chỉ hiện một lần; quên thì bấm *Đặt PIN mới*).
3. **Học sinh** vào `/dang-nhap` → nhập mã lớp (hoặc mở link `…/dang-nhap?lop=ABC-123`) → bấm tên mình → nhập PIN.
   Lần sau trên cùng máy: trang nhớ lớp + tên (chỉ trong trình duyệt, không lưu PIN) nên em chỉ cần nhập PIN rồi Enter;
   máy dùng chung thì bấm *Không phải …? Chọn tên khác*. Sai 5 lần trong 15 phút → tạm khóa 15 phút; giáo viên bấm *Mở khóa*.
4. **Giáo viên xem tiến độ**: trang lớp có bảng *Tiến độ theo bài* (bao nhiêu bạn đã làm, % đúng, bạn cần hỗ trợ);
   bấm tên học sinh → trang chi tiết (từng bài, số lần, lần tốt nhất/gần nhất, lịch sử, game). Có nút *Tải Excel (CSV)*.
5. **Phụ huynh** đăng ký → `/phu-huynh` → nhập mã mời giáo viên tạo cho từng học sinh (`PH-…`, 2 lượt, 30 ngày).

## 6. Bảo mật — những gì đã làm

- Vai trò chỉ đọc từ database theo phiên đã xác thực (`getUser()`), không tin dữ liệu trình duyệt gửi.
- Mỗi trang riêng tư tự kiểm tra ở máy chủ; middleware chỉ làm mới phiên. RLS + hàm `security definer` là lớp quyết định.
- Giáo viên chỉ thấy lớp được phân công (kể cả cùng trường). Học sinh chỉ thấy dữ liệu của mình.
  Phụ huynh chỉ thấy con đã liên kết bằng mã mời hợp lệ.
- Không ai tự cấp vai trò; giáo viên phải được quản trị viên duyệt.
- Kết quả học tập: trình duyệt chỉ gửi mã câu + câu trả lời; máy chủ chấm lại rồi ghi bằng service_role.
  Bảng kết quả không cho tài khoản thường ghi trực tiếp.
- Kết quả game chạy trong trình duyệt nên chỉ được kiểm tra giới hạn hợp lý và coi là kết quả luyện tập.

## 7. Kiểm thử

- `supabase/tests/local/50_classroom_rbac.sql`: kiểm thử phân quyền bằng SQL (PostgreSQL + shim `00_supabase_shim.sql`).
- E2E đã chạy với Supabase giả lập (GoTrue tối thiểu + PostgREST + PostgreSQL thật). Trước khi dùng với học sinh thật,
  cần chạy lại kịch bản trên một project Supabase thật (staging) với JWT thật của từng vai trò.
