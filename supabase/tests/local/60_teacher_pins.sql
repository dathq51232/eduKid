-- Kiểm thử 0009: chỉ giáo viên dạy lớp đọc được PIN học sinh; trình duyệt không đọc/ghi trực tiếp bảng student_pins.
-- Chạy sau 00_supabase_shim.sql + migration 0001 → 0009 trên PostgreSQL cục bộ (dữ liệu demo, không phải học sinh thật).
\set ON_ERROR_STOP 0
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000000a1','gv1@demo.local'),('00000000-0000-0000-0000-0000000000a2','gv2@demo.local');
insert into public.profiles(id) select x from (values ('00000000-0000-0000-0000-0000000000a1'::uuid),('00000000-0000-0000-0000-0000000000a2'::uuid)) v(x) where not exists (select 1 from public.profiles p where p.id=x);
insert into public.schools(id,name) values ('00000000-0000-0000-0000-00000000005c','Trường Demo');
insert into public.user_roles(user_id, role, school_id) values ('00000000-0000-0000-0000-0000000000a1','teacher','00000000-0000-0000-0000-00000000005c'),('00000000-0000-0000-0000-0000000000a2','teacher','00000000-0000-0000-0000-00000000005c');
insert into public.classes(id,school_id,name,grade,created_by) values ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-00000000005c','5A',5,'00000000-0000-0000-0000-0000000000a1');
insert into public.class_teachers(class_id,teacher_id) values ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000a1');
insert into public.students(id,school_id,display_name,grade,created_by) values ('00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-00000000005c','An',5,'00000000-0000-0000-0000-0000000000a1');
insert into public.class_memberships(class_id,student_id) values ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000d1');
set role service_role;
insert into public.student_pins(student_id,pin) values ('00000000-0000-0000-0000-0000000000d1','482915');
reset role;
\echo == GV lop 5A doc PIN (mong doi: 482915)
begin; set local role authenticated; set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select student_id, pin from public.teacher_class_pins('00000000-0000-0000-0000-0000000000c1'); commit;
\echo == GV khac truong cung truong nhung khong day lop (mong doi: not_allowed)
begin; set local role authenticated; set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
select * from public.teacher_class_pins('00000000-0000-0000-0000-0000000000c1'); rollback;
\echo == Doc truc tiep bang student_pins bang phien dang nhap (mong doi: permission denied)
begin; set local role authenticated; set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select * from public.student_pins; rollback;
\echo == Anon (mong doi: permission denied)
begin; set local role anon; select * from public.teacher_class_pins('00000000-0000-0000-0000-0000000000c1'); rollback;
\echo == Ghi PIN tu trinh duyet (mong doi: permission denied)
begin; set local role authenticated; set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
update public.student_pins set pin='000000'; rollback;
select action, target_id from public.audit_logs where action='teacher_view_pins';
