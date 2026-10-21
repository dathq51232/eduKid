-- Kiểm thử 0025: chỉ quản trị hệ thống sửa được tên giáo viên và tên trường.
\set ON_ERROR_STOP 0
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000025f1','gv25@demo.local'),('00000000-0000-0000-0000-0000000025ad','admin25@demo.local'),('00000000-0000-0000-0000-0000000025f2','gv25b@demo.local');
insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-0000000025ad','system_admin');
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000025f1';
select public.request_teacher_role('Truong cu', null) is not null as gv1; commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000025f2';
select public.request_teacher_role('Truong B', null) is not null as gv2; commit;

\echo == Quan tri sua ten + truong (mong doi: 1 = chi rieng giao vien nay)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000025ad';
select public.admin_update_teacher('00000000-0000-0000-0000-0000000025f1', 'Cô Nguyễn Thị Lan', 'Trường Tiểu học An Bình') as dung_chung; commit;
select p.display_name, s.name as truong from public.profiles p join public.user_roles r on r.user_id = p.id and r.role = 'teacher' join public.schools s on s.id = r.school_id where p.id = '00000000-0000-0000-0000-0000000025f1';
\echo == Truong cua giao vien khac khong doi (mong doi: Truong B)
select s.name from public.user_roles r join public.schools s on s.id = r.school_id where r.user_id = '00000000-0000-0000-0000-0000000025f2' and r.role = 'teacher';
\echo == Giao vien tu sua (mong doi: not_allowed)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000025f1';
select public.admin_update_teacher('00000000-0000-0000-0000-0000000025f2', 'Hack', 'Hack'); rollback;
\echo == Ten rong / truong qua ngan (mong doi: invalid_name, invalid_school_name)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000025ad';
select public.admin_update_teacher('00000000-0000-0000-0000-0000000025f1', '  ', 'Trường A'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000025ad';
select public.admin_update_teacher('00000000-0000-0000-0000-0000000025f1', 'Cô Lan', 'A'); rollback;
\echo == Khong phai giao vien (mong doi: not_teacher)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000025ad';
select public.admin_update_teacher('00000000-0000-0000-0000-0000000025ad', 'X', 'Trường X'); rollback;
\echo == Khach khong goi duoc (mong doi: permission denied)
begin; set local role anon; select public.admin_update_teacher('00000000-0000-0000-0000-0000000025f1', 'X', 'Trường X'); rollback;
select count(*) as nhat_ky from public.audit_logs where action = 'admin_update_teacher';
