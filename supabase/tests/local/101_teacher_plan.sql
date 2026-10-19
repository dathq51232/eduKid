-- Kiểm thử 0019: giáo viên đăng ký miễn phí dùng ngay; gói miễn phí tối đa 3 học sinh; quản trị nâng giới hạn. Dữ liệu demo.
\set ON_ERROR_STOP 0
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000019f1','gvMoi@demo.local'),('00000000-0000-0000-0000-0000000019ad','adminGP@demo.local'),('00000000-0000-0000-0000-0000000019e1','hsGP@demo.local');
insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-0000000019ad','system_admin');

\echo == Giao vien moi dang ky -> co quyen ngay, goi 3 hoc sinh
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000019f1';
select public.request_teacher_role('Trường Tiểu học Demo GP', null) is not null as da_dang_ky;
select student_limit, students_used from public.teacher_my_plan(); commit;
select count(*) as vai_tro_gv from public.user_roles where user_id='00000000-0000-0000-0000-0000000019f1' and role='teacher';
select status from public.teacher_applications where user_id='00000000-0000-0000-0000-0000000019f1';
\echo == Dang ky lan 2 (mong doi: already_teacher)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000019f1';
select public.request_teacher_role('Trường khác', null); rollback;

\echo == Tao lop, them 3 em (ok), them em thu 4 (mong doi: plan_limit)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000019f1';
select public.teacher_create_class('1A', 1::smallint) as c1 \gset
select count(*) as them from public.teacher_add_students(:'c1', array['Em Một','Em Hai','Em Ba'], 'v1', true); commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000019f1';
select count(*) from public.teacher_add_students(:'c1', array['Em Bốn'], 'v1', true); rollback;
\echo == Them 2 em mot luc khi da co 3 (mong doi: plan_limit, khong em nao duoc them)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000019f1';
select count(*) from public.teacher_add_students(:'c1', array['Em Năm','Em Sáu'], 'v1', true); rollback;
select count(*) as dang_hoc from public.class_memberships where class_id = :'c1' and status='active';
\echo == Luu tru lop, mo lop moi, them 1 em (mong doi: plan_limit — tinh tren tong hoc sinh cua giao vien)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000019f1';
select public.teacher_set_class_status(:'c1', false);
select public.teacher_create_class('2A', 2::smallint) as c2 \gset
commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000019f1';
select count(*) from public.teacher_add_students(:'c2', array['Em Mới'], 'v1', true); rollback;
\echo == Giao vien tu nang gioi han / xem danh sach (mong doi: not_allowed x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000019f1';
select public.admin_set_teacher_limit('00000000-0000-0000-0000-0000000019f1', 40, null); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000019f1';
select count(*) from public.admin_list_teacher_plans(null); rollback;
\echo == Quan tri nang len 5: them 2 em (ok), em thu 6 (plan_limit)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000019ad';
select public.admin_set_teacher_limit('00000000-0000-0000-0000-0000000019f1', 5, 'Đã liên hệ qua Zalo');
select display_name is not null as co_ten, school_name, classes, students_used, student_limit, note from public.admin_list_teacher_plans('Demo GP'); commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000019f1';
select count(*) as them from public.teacher_add_students(:'c2', array['Em Mới 1','Em Mới 2'], 'v1', true);
select student_limit, students_used from public.teacher_my_plan(); commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000019f1';
select count(*) from public.teacher_add_students(:'c2', array['Em Mới 3'], 'v1', true); rollback;
\echo == Gioi han sai (mong doi: invalid_limit)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000019ad';
select public.admin_set_teacher_limit('00000000-0000-0000-0000-0000000019f1', 0, null); rollback;
\echo == Tai khoan hoc sinh xin lam giao vien (mong doi: not_allowed)
select student_id as s1 from public.class_memberships where class_id = :'c2' limit 1 \gset
update public.students set user_id = '00000000-0000-0000-0000-0000000019e1' where id = :'s1';
insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-0000000019e1','student') on conflict do nothing;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000019e1';
select public.request_teacher_role('Trường X', null); rollback;
\echo == Don cho duyet tu truoc + giao vien cu co 5 em: chay lai migration -> duyet luon, giu gioi han 40
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000019f2','gvCho@demo.local');
insert into public.teacher_applications(user_id, school_name) values ('00000000-0000-0000-0000-0000000019f2', 'Trường Chờ Duyệt');
delete from public.teacher_plans where teacher_id = '00000000-0000-0000-0000-0000000019f1';
\i /home/postgres/sql/0019_teacher_free_plan.sql
select status from public.teacher_applications where user_id = '00000000-0000-0000-0000-0000000019f2';
select count(*) as gv_cho_co_quyen from public.user_roles where user_id = '00000000-0000-0000-0000-0000000019f2' and role = 'teacher';
select student_limit as gioi_han_gv_cu from public.teacher_plans where teacher_id = '00000000-0000-0000-0000-0000000019f1';
