-- Kiểm thử phân quyền lớp học / tài khoản học sinh (migration 0007 + 0008).
-- Chạy trên DB đã có shim + toàn bộ migration. Mỗi khối DO báo 'FAIL: ...' nếu sai; chạy hết không lỗi = đạt.
-- psql -v ON_ERROR_STOP=1 -d edukid_test -f 50_classroom_rbac.sql

\set ON_ERROR_STOP 1
reset role;

-- Người dùng mẫu (dữ liệu giả)
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@vd.test',  '{"display_name":"Quản trị"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'co.lan@vd.test', '{"display_name":"Cô Lan"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'thay.hai@vd.test', '{"display_name":"Thầy Hải"}'),
  ('00000000-0000-0000-0000-0000000000b3', 'cho.duyet@vd.test', '{"display_name":"Cô Mới"}'),
  ('00000000-0000-0000-0000-0000000000c1', 'me.an@vd.test', '{"display_name":"Mẹ An"}'),
  ('00000000-0000-0000-0000-0000000000c2', 'bo.khac@vd.test', '{"display_name":"Bố khác"}');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000a1', 'system_admin');

create or replace function pg_temp.act(p uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p::text, false);
  execute 'set role authenticated';
end $$;
create or replace function pg_temp.must_fail(sql text, what text) returns void language plpgsql as $$
declare ok boolean := false; st text; msg text;
begin
  begin execute sql; exception when others then ok := true; get stacked diagnostics st = returned_sqlstate, msg = message_text; end;
  if not ok then raise exception 'FAIL: % (lệnh lẽ ra phải bị chặn)', what; end if;
  -- lỗi cú pháp / sai tên cột không được tính là "bị chặn"
  if st like '42%' and st <> '42501' then raise exception 'FAIL: % — lỗi kiểm thử % %', what, st, msg; end if;
  raise notice 'chặn đúng: % [% %]', what, st, msg;
end $$;
create or replace function pg_temp.expect(n bigint, want bigint, what text) returns void language plpgsql as $$
begin
  if n is distinct from want then raise exception 'FAIL: % — được %, mong đợi %', what, n, want; end if;
end $$;

-- Người lớn tự đăng ký chỉ có vai trò phụ huynh
select pg_temp.expect((select count(*) from public.user_roles where user_id = '00000000-0000-0000-0000-0000000000b1' and role = 'teacher'), 0, 'mới đăng ký chưa là giáo viên');

-- 1) Giáo viên chưa được duyệt không tạo được lớp
select pg_temp.act('00000000-0000-0000-0000-0000000000b3');
select public.request_teacher_role('Trường Tiểu học Minh Họa', null);
select pg_temp.must_fail($$select public.teacher_create_class('1C', 1::smallint)$$, 'giáo viên chưa duyệt tạo lớp');
select pg_temp.must_fail($$insert into public.user_roles (user_id, role, school_id) values ('00000000-0000-0000-0000-0000000000b3', 'teacher', gen_random_uuid())$$, 'tự cấp vai trò giáo viên');
select pg_temp.must_fail($$select public.review_teacher_application((select id from public.teacher_applications limit 1), true, null)$$, 'tự duyệt yêu cầu');

-- Hai giáo viên được duyệt, cùng một trường
select pg_temp.act('00000000-0000-0000-0000-0000000000b1');
select public.request_teacher_role('Trường Tiểu học Minh Họa', 'Chủ nhiệm 1A');
select pg_temp.act('00000000-0000-0000-0000-0000000000b2');
select public.request_teacher_role('Trường Tiểu học Minh Họa', 'Chủ nhiệm 1B');
select pg_temp.act('00000000-0000-0000-0000-0000000000a1');
select pg_temp.expect((select count(*) from public.admin_list_teacher_applications()), 3, 'quản trị thấy 3 yêu cầu chờ duyệt');
do $$
declare v_school uuid;
begin
  v_school := public.review_teacher_application((select id from public.teacher_applications where user_id = '00000000-0000-0000-0000-0000000000b1'), true, null);
  perform public.review_teacher_application((select id from public.teacher_applications where user_id = '00000000-0000-0000-0000-0000000000b2'), true, v_school);
  perform set_config('test.school', v_school::text, false);
end $$;

-- Cô Lan tạo lớp 1A, thầy Hải tạo lớp 1B
select pg_temp.act('00000000-0000-0000-0000-0000000000b1');
select set_config('test.class_a', public.teacher_create_class('1A', 1::smallint)::text, false);
select pg_temp.must_fail($$select public.teacher_add_students(current_setting('test.class_a')::uuid, array['An'], 'v1', false)$$, 'thêm học sinh khi chưa xác nhận đồng ý');
select count(*) from public.teacher_add_students(current_setting('test.class_a')::uuid, array['An', 'Bình'], 'v1', true);
select pg_temp.act('00000000-0000-0000-0000-0000000000b2');
select set_config('test.class_b', public.teacher_create_class('1B', 1::smallint)::text, false);
select count(*) from public.teacher_add_students(current_setting('test.class_b')::uuid, array['Chi'], 'v1', true);

reset role;
select set_config('test.an',   (select id::text from public.students where display_name = 'An'), false);
select set_config('test.binh', (select id::text from public.students where display_name = 'Bình'), false);
select set_config('test.chi',  (select id::text from public.students where display_name = 'Chi'), false);
select pg_temp.expect((select count(*) from public.classes where join_code ~ '^[A-HJ-NP-Z]{3}-[0-9]{3}$'), 2, 'mỗi lớp có mã lớp đúng dạng');

-- 2) Giáo viên lớp 1A không xem/sửa được lớp 1B (dù cùng trường)
select pg_temp.act('00000000-0000-0000-0000-0000000000b1');
select pg_temp.expect((select count(*) from public.classes), 1, 'cô Lan chỉ thấy 1 lớp');
select pg_temp.expect((select count(*) from public.students), 2, 'cô Lan chỉ thấy 2 học sinh lớp mình');
select pg_temp.expect((select count(*) from public.students where id = current_setting('test.chi')::uuid), 0, 'cô Lan không thấy học sinh lớp 1B');
select pg_temp.must_fail($$select * from public.teacher_class_roster(current_setting('test.class_b')::uuid)$$, 'xem danh sách lớp 1B');
select pg_temp.must_fail($$select * from public.class_results_summary(current_setting('test.class_b')::uuid)$$, 'xem tiến độ lớp 1B');
select pg_temp.must_fail($$select public.teacher_manage_student(current_setting('test.class_b')::uuid, current_setting('test.chi')::uuid, 'lock')$$, 'khóa học sinh lớp 1B');
select pg_temp.must_fail($$select public.create_parent_invite(current_setting('test.class_b')::uuid, current_setting('test.chi')::uuid, 30)$$, 'tạo mã phụ huynh cho học sinh lớp 1B');
select pg_temp.must_fail($$select public.teacher_add_students(current_setting('test.class_b')::uuid, array['X'], 'v1', true)$$, 'thêm học sinh vào lớp 1B');
select pg_temp.must_fail($$select public.create_parent_invite(current_setting('test.class_a')::uuid, current_setting('test.chi')::uuid, 30)$$, 'mã phụ huynh cho học sinh không thuộc lớp 1A');
select pg_temp.expect((select count(*) from public.teacher_class_roster(current_setting('test.class_a')::uuid)), 2, 'danh sách lớp 1A có 2 bạn');

-- Tài khoản học sinh (máy chủ tạo bằng service_role, app_metadata.account_type = student)
reset role;
insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', 's-an@students.educhain.invalid', '{"display_name":"An"}', '{"account_type":"student"}'),
  ('00000000-0000-0000-0000-0000000000d3', 's-chi@students.educhain.invalid', '{"display_name":"Chi"}', '{"account_type":"student"}');
set role service_role;
update public.students set user_id = '00000000-0000-0000-0000-0000000000d1' where id = current_setting('test.an')::uuid;
update public.students set user_id = '00000000-0000-0000-0000-0000000000d3' where id = current_setting('test.chi')::uuid;
insert into public.lesson_results (student_id, lesson_code, score, total, points) values
  (current_setting('test.an')::uuid, 'toan1-kntt-b01', 9, 10, 120),
  (current_setting('test.binh')::uuid, 'toan1-kntt-b01', 7, 10, 90),
  (current_setting('test.chi')::uuid, 'toan1-kntt-b01', 10, 10, 150);
insert into public.game_results (student_id, game_id, level, score, max_score) values (current_setting('test.an')::uuid, 'maze', 2, 1, 1);
reset role;
select pg_temp.expect((select count(*) from public.user_roles where user_id = '00000000-0000-0000-0000-0000000000d1' and role = 'student'), 1, 'tài khoản học sinh có vai trò student');
select pg_temp.expect((select count(*) from public.user_roles where user_id = '00000000-0000-0000-0000-0000000000d1' and role = 'parent'), 0, 'tài khoản học sinh không có vai trò phụ huynh');

-- 3) Học sinh chỉ thấy dữ liệu của chính mình
select pg_temp.act('00000000-0000-0000-0000-0000000000d1');
select pg_temp.expect((select count(*) from public.students), 1, 'học sinh An chỉ thấy hồ sơ của mình');
select pg_temp.expect((select count(*) from public.lesson_results), 1, 'học sinh An chỉ thấy kết quả của mình');
select pg_temp.expect((select count(*) from public.lesson_results where student_id = current_setting('test.chi')::uuid), 0, 'An không thấy kết quả của Chi');
select pg_temp.expect((select count(*) from public.classes), 1, 'An thấy đúng lớp của mình');
select pg_temp.expect((select count(*) from public.game_results), 1, 'An thấy kết quả game của mình');
select pg_temp.must_fail($$insert into public.lesson_results (student_id, lesson_code, score, total, points) values (public.my_student_id(), 'x', 10, 10, 9999)$$, 'học sinh tự ghi điểm');
select pg_temp.must_fail($$update public.lesson_results set score = 10$$, 'học sinh sửa điểm');
select pg_temp.must_fail($$insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000d1', 'teacher')$$, 'học sinh tự nâng quyền');
select pg_temp.must_fail($$update public.students set user_id = null where id = public.my_student_id()$$, 'học sinh đổi liên kết tài khoản');
select pg_temp.must_fail($$select * from public.student_login_guards$$, 'học sinh đọc bộ đếm PIN');
select pg_temp.must_fail($$select public.redeem_parent_invite('PH-12345678')$$, 'học sinh dùng mã phụ huynh');
select pg_temp.must_fail($$select public.request_teacher_role('Trường X', null)$$, 'học sinh xin làm giáo viên');

-- 4) Phụ huynh chỉ xem con đã liên kết bằng mã mời
select pg_temp.act('00000000-0000-0000-0000-0000000000c1');
select pg_temp.expect((select count(*) from public.students), 0, 'phụ huynh chưa liên kết không thấy học sinh nào');
select pg_temp.expect((select count(*) from public.lesson_results), 0, 'phụ huynh chưa liên kết không thấy kết quả');
select pg_temp.must_fail($$insert into public.parent_student_links (parent_id, student_id, status, verified_at) values ('00000000-0000-0000-0000-0000000000c1', current_setting('test.chi')::uuid, 'active', now())$$, 'phụ huynh tự liên kết với trẻ khác');
select pg_temp.act('00000000-0000-0000-0000-0000000000b1');
select set_config('test.code', public.create_parent_invite(current_setting('test.class_a')::uuid, current_setting('test.an')::uuid, 30), false);
select pg_temp.act('00000000-0000-0000-0000-0000000000c1');
select pg_temp.expect((select count(*) from public.class_invites), 0, 'phụ huynh không đọc được bảng mã mời');
select pg_temp.expect((select (public.redeem_parent_invite('sai-ma') is null)::int), 1, 'mã sai trả về null');
select pg_temp.expect((select (public.redeem_parent_invite(lower(current_setting('test.code'))) = current_setting('test.an')::uuid)::int), 1, 'nhập đúng mã liên kết với An');
select pg_temp.expect((select count(*) from public.students), 1, 'phụ huynh chỉ thấy An');
select pg_temp.expect((select count(*) from public.students where id in (current_setting('test.binh')::uuid, current_setting('test.chi')::uuid)), 0, 'phụ huynh không thấy Bình, Chi');
select pg_temp.expect((select count(*) from public.lesson_results), 1, 'phụ huynh chỉ thấy kết quả của An');
select pg_temp.must_fail($$select * from public.teacher_class_roster(current_setting('test.class_a')::uuid)$$, 'phụ huynh xem danh sách lớp');
select pg_temp.must_fail($$update public.profiles set status = 'active' where id = '00000000-0000-0000-0000-0000000000c1'$$, 'tự đổi trạng thái hồ sơ');
select pg_temp.must_fail($$select public.admin_set_role('00000000-0000-0000-0000-0000000000c1', 'system_admin', null, true)$$, 'tự cấp quyền quản trị');

select pg_temp.act('00000000-0000-0000-0000-0000000000c2');
select pg_temp.expect((select (public.redeem_parent_invite(current_setting('test.code')) = current_setting('test.an')::uuid)::int), 1, 'mã dùng được tối đa 2 lần (bố mẹ)');
reset role;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000c3', 'nguoi.thu.ba@vd.test');
select pg_temp.act('00000000-0000-0000-0000-0000000000c3');
select pg_temp.expect((select (public.redeem_parent_invite(current_setting('test.code')) is null)::int), 1, 'mã hết lượt dùng');
select pg_temp.expect((select count(*) from public.students), 0, 'người thứ ba không thấy An');

-- 5) Giáo viên: khóa/mở, bộ đếm PIN (do máy chủ tăng), đổi tên, cho rời lớp
reset role;
update public.student_login_guards set failed_count = 5, locked_until = now() + interval '15 minutes' where student_id = current_setting('test.an')::uuid;
select pg_temp.act('00000000-0000-0000-0000-0000000000b1');
select pg_temp.expect((select count(*) from public.teacher_class_roster(current_setting('test.class_a')::uuid) where locked_until > now()), 1, 'giáo viên thấy An đang bị khóa do nhập sai');
select public.teacher_manage_student(current_setting('test.class_a')::uuid, current_setting('test.an')::uuid, 'reset_attempts');
select pg_temp.expect((select count(*) from public.teacher_class_roster(current_setting('test.class_a')::uuid) where failed_count > 0), 0, 'mở khóa nhập sai');
select public.teacher_manage_student(current_setting('test.class_a')::uuid, current_setting('test.binh')::uuid, 'lock');
select pg_temp.expect((select count(*) from public.students where status = 'inactive'), 1, 'khóa tài khoản Bình');
select public.teacher_rename_student(current_setting('test.class_a')::uuid, current_setting('test.binh')::uuid, '  Bình   Minh ');
select pg_temp.expect((select count(*) from public.students where display_name = 'Bình Minh'), 1, 'đổi tên gọn khoảng trắng');
select pg_temp.expect((select count(*) from public.class_results_summary(current_setting('test.class_a')::uuid)), 2, 'tổng hợp tiến độ lớp 1A');
select pg_temp.must_fail($$select public.teacher_set_class_status(current_setting('test.class_b')::uuid, false)$$, 'lưu trữ lớp của người khác');

-- 6) Mã lớp 'class' và mã 'parent' không dùng lẫn
select set_config('test.cinv', public.create_class_invite(current_setting('test.class_a')::uuid, 14), false);
select pg_temp.act('00000000-0000-0000-0000-0000000000c2');
select pg_temp.expect((select (public.redeem_parent_invite(current_setting('test.cinv')) is null)::int), 1, 'mã vào lớp không dùng làm mã phụ huynh');

reset role;
select 'TẤT CẢ KIỂM THỬ PHÂN QUYỀN LỚP HỌC ĐẠT' as ket_qua;
