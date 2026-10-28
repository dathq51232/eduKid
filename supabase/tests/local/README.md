# Chạy thử migration trên PostgreSQL cục bộ

Dùng để kiểm tra nhanh schema và phân quyền mà không cần project Supabase.
Không thay thế được kiểm thử trên Supabase thật.

1. Tạo database trống trên PostgreSQL 15+.
2. Chạy theo thứ tự:
   - `00_supabase_shim.sql` (giả lập vai trò `anon`, `authenticated`, bảng `auth.users`, hàm `auth.uid()`)
   - `../../migrations/0001_platform_foundation.sql`
   - `../../migrations/0002_quiz_security_and_onboarding.sql`
   - `../../migrations/0003_question_types_and_reports.sql`
   - `../../migrations/0004_admin_authoring.sql`
   - `../../migrations/0005_curriculum_catalog.sql`
   - `10_e2e_happy_path.sql`: admin, giáo viên, phụ huynh; soạn bài → xuất bản → tạo con → vào lớp → làm bài → báo cáo → nhận xét
   - `20_e2e_must_fail.sql`: từng câu lệnh phải báo lỗi (not_allowed, RLS, attempt_completed, lesson_locked, invalid_answer_key, cannot_revoke_self...)

   - `30_curriculum.sql`: danh mục chương trình — chặn gắn nhầm môn, lời giải chỉ trả sau khi trả lời, độ phủ YCCĐ
   - `0006`, `0007_student_role.sql`, `0008_classroom_accounts.sql` rồi `50_classroom_rbac.sql`: giáo viên chờ duyệt, lớp 1A/1B cùng trường, học sinh, phụ huynh, mã mời, khóa PIN, tự nâng quyền. Chạy hết không có dòng `FAIL` và in `TẤT CẢ KIỂM THỬ PHÂN QUYỀN LỚP HỌC ĐẠT`.

Ví dụ: `psql -d edukid_test -f 00_supabase_shim.sql` rồi lần lượt các file còn lại.

Kết quả mong đợi của 10_e2e: q1 true, q2 true, q3 false, q4 true, q5 true, finish = 4/5; phụ huynh khác thấy 0 dòng ở mọi bảng.

- `0021_lesson_plans.sql` rồi `103_lesson_plans.sql`: giáo án chỉ người soạn đọc/ghi/xoá, chỉ gắn được lớp mình dạy, học sinh/anon không đọc được, xoá lớp giữ giáo án, chạy lại migration an toàn.
- `0022_lesson_plans_subjects.sql` rồi `104_lesson_plan_subjects.sql`: giáo án nhận mọi môn trong lịch báo giảng (Đạo đức, TNXH, HĐTN…), vẫn chặn mã môn rác.
- `0023_plan_library.sql` rồi `105_plan_library.sql`: kho giáo án dùng chung trong trường (nạp lại cùng file thì thay, không nhân đôi), trường khác / học sinh / khách không đọc được.
- `106_plan_library_images.sql` (tự tạo giả lập schema storage rồi chạy 0024): hình kho giáo án chỉ trường mình đọc/ghi, nạp giáo án theo từng phần, giáo án lớn (bản gốc HTML) lưu được.
- `0025_admin_edit_teacher.sql` rồi `107_admin_edit_teacher.sql`: chỉ quản trị hệ thống sửa được tên giáo viên và tên trường; giáo viên khác, khách bị chặn; mỗi lần sửa ghi nhật ký.
- `0026_class_diary.sql` rồi `108_class_diary.sql`: sổ lớp chỉ giáo viên của lớp đọc/ghi; lưu lại cả ngày giữ dấu đã chép tin nhắn; chặn học sinh lớp khác, trạng thái lạ, ngày tương lai; bảng không đọc trực tiếp được.
- `112_class_gallery.sql` (tự tạo giả lập schema storage rồi chạy 0039): phòng triển lãm — giáo viên treo / duyệt / xoá, học sinh tự nộp vào thư mục riêng (chờ duyệt), không nộp hộ bạn / không nộp thư khen, gia đình thả tim; lớp khác, giáo viên khác, khách bị chặn; tên các bạn rút gọn khi chọn "tên gọi".
