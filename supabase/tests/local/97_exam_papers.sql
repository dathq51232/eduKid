-- Kiểm thử 0015: lưu / mở / xoá đề kiểm tra, chỉ giáo viên dạy lớp. Dữ liệu demo.
\set ON_ERROR_STOP 0
insert into public.schools(id,name) values ('00000000-0000-0000-0000-0000000015a1','Trường Demo E');
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000015f1','gvE@demo.local'),('00000000-0000-0000-0000-0000000015f2','gvF@demo.local'),('00000000-0000-0000-0000-0000000015e1','hsE@x');
insert into public.user_roles(user_id, role, school_id) values ('00000000-0000-0000-0000-0000000015f1','teacher','00000000-0000-0000-0000-0000000015a1'),('00000000-0000-0000-0000-0000000015f2','teacher','00000000-0000-0000-0000-0000000015a1');
insert into public.classes(id,school_id,name,grade,created_by) values ('00000000-0000-0000-0000-0000000015c1','00000000-0000-0000-0000-0000000015a1','3A',3,'00000000-0000-0000-0000-0000000015f1');
insert into public.class_teachers(class_id,teacher_id) values ('00000000-0000-0000-0000-0000000015c1','00000000-0000-0000-0000-0000000015f1');
\echo == GV tao de, sua de, liet ke, mo (mong doi: 1 de, tieu de da sua)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000015f1';
select public.teacher_save_exam('00000000-0000-0000-0000-0000000015c1', null, 'Đề Toán cuối HK I', 'toan', 'ck1-2026', '{"matrix":{"rows":[]},"papers":[]}') as id \gset
select public.teacher_save_exam('00000000-0000-0000-0000-0000000015c1', :'id', 'Đề Toán cuối HK I (sửa)', 'toan', 'ck1-2026', '{"matrix":{"rows":[]},"papers":[{"code":"A"}]}') = :'id' as cung_id;
select title, subject, exam_code from public.teacher_list_exams('00000000-0000-0000-0000-0000000015c1');
select data -> 'papers' -> 0 ->> 'code' as ma_de from public.teacher_get_exam(:'id'); commit;
\echo == Ma ky sai / mon sai (mong doi: check constraint x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000015f1';
select public.teacher_save_exam('00000000-0000-0000-0000-0000000015c1', null, 'X đề', 'toan', 'hk9-2026', '{}'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000015f1';
select public.teacher_save_exam('00000000-0000-0000-0000-0000000015c1', null, 'X đề', 'hoa', 'ck1-2026', '{}'); rollback;
\echo == GV khac: liet ke, mo, sua, xoa (mong doi: not_allowed x4)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000015f2';
select * from public.teacher_list_exams('00000000-0000-0000-0000-0000000015c1'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000015f2';
select * from public.teacher_get_exam(:'id'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000015f2';
select public.teacher_save_exam('00000000-0000-0000-0000-0000000015c1', :'id', 'Chiếm đề', 'toan', 'ck1-2026', '{}'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000015f2';
select public.teacher_delete_exam(:'id'); rollback;
\echo == Hoc sinh / anon doc bang (mong doi: permission denied x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000015e1';
select * from public.exam_papers; rollback;
begin; set local role anon; select * from public.teacher_list_exams('00000000-0000-0000-0000-0000000015c1'); rollback;
\echo == GV xoa (mong doi: con 0)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000015f1';
select public.teacher_delete_exam(:'id');
select count(*) as con from public.teacher_list_exams('00000000-0000-0000-0000-0000000015c1'); commit;
