-- Kiểm thử 0013: số liệu theo kỳ + lưu nhận xét, chỉ giáo viên dạy lớp. Dữ liệu demo.
\set ON_ERROR_STOP 0
insert into public.schools(id,name) values ('00000000-0000-0000-0000-0000000013a1','Trường Demo N');
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000013f1','gvN@demo.local'),('00000000-0000-0000-0000-0000000013f2','gvO@demo.local'),('00000000-0000-0000-0000-0000000013e1','hsN@x');
insert into public.user_roles(user_id, role, school_id) values ('00000000-0000-0000-0000-0000000013f1','teacher','00000000-0000-0000-0000-0000000013a1'),('00000000-0000-0000-0000-0000000013f2','teacher','00000000-0000-0000-0000-0000000013a1');
insert into public.classes(id,school_id,name,grade,created_by) values ('00000000-0000-0000-0000-0000000013c1','00000000-0000-0000-0000-0000000013a1','2A',2,'00000000-0000-0000-0000-0000000013f1');
insert into public.class_teachers(class_id,teacher_id) values ('00000000-0000-0000-0000-0000000013c1','00000000-0000-0000-0000-0000000013f1');
insert into public.students(id,school_id,display_name,grade,created_by,user_id) values
 ('00000000-0000-0000-0000-0000000013d1','00000000-0000-0000-0000-0000000013a1','An',2,'00000000-0000-0000-0000-0000000013f1','00000000-0000-0000-0000-0000000013e1'),
 ('00000000-0000-0000-0000-0000000013d2','00000000-0000-0000-0000-0000000013a1','Bình',2,'00000000-0000-0000-0000-0000000013f1',null);
insert into public.class_memberships(class_id,student_id) values ('00000000-0000-0000-0000-0000000013c1','00000000-0000-0000-0000-0000000013d1'),('00000000-0000-0000-0000-0000000013c1','00000000-0000-0000-0000-0000000013d2');
insert into public.lesson_results(student_id,lesson_code,lesson_title,subject_code,score,total,points,created_at) values
 ('00000000-0000-0000-0000-0000000013d1','t1','Phép cộng','toan',4,10,50,now()-interval '2 days'),
 ('00000000-0000-0000-0000-0000000013d1','t1','Phép cộng','toan',9,10,200,now()-interval '1 days'),
 ('00000000-0000-0000-0000-0000000013d1','t2','Phép trừ','toan',3,10,40,now()),
 ('00000000-0000-0000-0000-0000000013d1','v1','Đọc hiểu','tieng-viet',10,10,300,now()),
 ('00000000-0000-0000-0000-0000000013d2','t1','Phép cộng','toan',10,10,300,now()-interval '60 days');
\echo == GV xem so lieu 7 ngay (mong doi: An toan 2 bai, TB 60, yeu: Phep tru, gioi: Phep cong; An TV 100; Binh khong co dong)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000013f1';
select display_name, subject_code, lessons, attempts, avg_percent, perfect, active_days, weak_lessons, strong_lessons from public.class_period_stats('00000000-0000-0000-0000-0000000013c1', now()-interval '7 days', now()+interval '1 minute'); commit;
\echo == GV luu nhan xet (mong doi: 2), luu lai (ghi de, van 2 dong)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000013f1';
select public.teacher_save_comments('00000000-0000-0000-0000-0000000013c1','hk1-2026','[{"student_id":"00000000-0000-0000-0000-0000000013d1","subject":"toan","level":"H","comment":"Em làm tốt phép cộng."},{"student_id":"00000000-0000-0000-0000-0000000013d1","subject":"chung","level":null,"comment":"Chăm chỉ."},{"student_id":"00000000-0000-0000-0000-0000000013e1","subject":"toan","level":"T","comment":"khong phai hoc sinh lop"}]');
select public.teacher_save_comments('00000000-0000-0000-0000-0000000013c1','hk1-2026','[{"student_id":"00000000-0000-0000-0000-0000000013d1","subject":"toan","level":"T","comment":"Sửa lại."}]');
select subject, level, comment from public.teacher_get_comments('00000000-0000-0000-0000-0000000013c1','hk1-2026') order by subject; commit;
\echo == GV khac (mong doi: not_allowed x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000013f2';
select * from public.class_period_stats('00000000-0000-0000-0000-0000000013c1', now()-interval '7 days', now()); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000013f2';
select * from public.teacher_get_comments('00000000-0000-0000-0000-0000000013c1','hk1-2026'); rollback;
\echo == Hoc sinh doc bang nhan xet (mong doi: permission denied / not_allowed)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000013e1';
select * from public.student_comments; rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000013e1';
select * from public.teacher_get_comments('00000000-0000-0000-0000-0000000013c1','hk1-2026'); rollback;
\echo == Muc sai (mong doi: check constraint)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000013f1';
select public.teacher_save_comments('00000000-0000-0000-0000-0000000013c1','hk1-2026','[{"student_id":"00000000-0000-0000-0000-0000000013d1","subject":"toan","level":"X","comment":"a"}]'); rollback;
\echo == Khoang thoi gian sai (mong doi: invalid_range)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000013f1';
select * from public.class_period_stats('00000000-0000-0000-0000-0000000013c1', now(), now()-interval '1 day'); rollback;
