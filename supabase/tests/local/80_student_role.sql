-- Kiểm thử 0011: tài khoản học sinh luôn có vai trò 'student' (không phải 'parent'), kể cả khi Supabase Auth
-- ghi app_metadata SAU khi chèn auth.users (đúng cách auth.admin.createUser chạy thật). Dữ liệu demo.
\set ON_ERROR_STOP 0
insert into public.schools(id,name) values ('00000000-0000-0000-0000-0000000008a1','Trường Demo R');
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000008f0','gvr@demo.local');
insert into public.students(id,school_id,display_name,grade,created_by) values ('00000000-0000-0000-0000-0000000008d1','00000000-0000-0000-0000-0000000008a1','Bảo An',1,'00000000-0000-0000-0000-0000000008f0'),('00000000-0000-0000-0000-0000000008d2','00000000-0000-0000-0000-0000000008a1','Bình',1,'00000000-0000-0000-0000-0000000008f0');
\echo == Mo phong createUser: chen auth.users chua co account_type, roi moi cap nhat app_metadata
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000008e1','hs-1@students.local');
update auth.users set raw_app_meta_data = '{"account_type":"student"}' where id='00000000-0000-0000-0000-0000000008e1';
update public.students set user_id='00000000-0000-0000-0000-0000000008e1' where id='00000000-0000-0000-0000-0000000008d1';
\echo == Vai tro sau khi gan (mong doi: chi student)
select role from public.user_roles where user_id='00000000-0000-0000-0000-0000000008e1' order by role;
\echo == Hoc sinh tu doc ho so cua minh (mong doi: Bao An)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000008e1';
select display_name from public.students where user_id = auth.uid(); select public.has_role('student', null) as la_hoc_sinh, public.has_role('parent', null) as la_phu_huynh; commit;
\echo == Nguoi lon tu dang ky van la parent (khong bi anh huong)
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000008e9','nguoilon@demo.local');
select role from public.user_roles where user_id='00000000-0000-0000-0000-0000000008e9';
\echo == Hoc sinh khong tu doi user_id cua ho so (mong doi: 0 dong / bi chan)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000008e9';
update public.students set user_id='00000000-0000-0000-0000-0000000008e9' where id='00000000-0000-0000-0000-0000000008d2'; rollback;
select count(*) as nguoi_lon_thanh_hoc_sinh from public.user_roles where user_id='00000000-0000-0000-0000-0000000008e9' and role='student';
