-- Kiểm thử 0014: điểm kiểm tra định kỳ + khen thưởng, chỉ giáo viên dạy lớp. Dữ liệu demo.
\set ON_ERROR_STOP 0
insert into public.schools(id,name) values ('00000000-0000-0000-0000-0000000014a1','Trường Demo S');
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000014f1','gvS@demo.local'),('00000000-0000-0000-0000-0000000014f2','gvT@demo.local'),('00000000-0000-0000-0000-0000000014e1','hsS@x');
insert into public.user_roles(user_id, role, school_id) values ('00000000-0000-0000-0000-0000000014f1','teacher','00000000-0000-0000-0000-0000000014a1'),('00000000-0000-0000-0000-0000000014f2','teacher','00000000-0000-0000-0000-0000000014a1');
insert into public.classes(id,school_id,name,grade,created_by) values ('00000000-0000-0000-0000-0000000014c1','00000000-0000-0000-0000-0000000014a1','4A',4,'00000000-0000-0000-0000-0000000014f1');
insert into public.class_teachers(class_id,teacher_id) values ('00000000-0000-0000-0000-0000000014c1','00000000-0000-0000-0000-0000000014f1');
insert into public.students(id,school_id,display_name,grade,created_by,user_id) values
 ('00000000-0000-0000-0000-0000000014d1','00000000-0000-0000-0000-0000000014a1','An',4,'00000000-0000-0000-0000-0000000014f1','00000000-0000-0000-0000-0000000014e1'),
 ('00000000-0000-0000-0000-0000000014d2','00000000-0000-0000-0000-0000000014a1','Bình',4,'00000000-0000-0000-0000-0000000014f1',null),
 ('00000000-0000-0000-0000-0000000014d9','00000000-0000-0000-0000-0000000014a1','Ngoài lớp',4,'00000000-0000-0000-0000-0000000014f1',null);
insert into public.class_memberships(class_id,student_id) values ('00000000-0000-0000-0000-0000000014c1','00000000-0000-0000-0000-0000000014d1'),('00000000-0000-0000-0000-0000000014c1','00000000-0000-0000-0000-0000000014d2');
\echo == Luu diem (mong doi: 3 — em ngoai lop bi bo qua)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000014f1';
select public.teacher_save_scores('00000000-0000-0000-0000-0000000014c1','ck1-2026','[
 {"student_id":"00000000-0000-0000-0000-0000000014d1","subject":"toan","score":9.5,"note":""},
 {"student_id":"00000000-0000-0000-0000-0000000014d1","subject":"tieng-viet","score":8,"note":"Đọc tốt"},
 {"student_id":"00000000-0000-0000-0000-0000000014d2","subject":"toan","score":4.25,"note":""},
 {"student_id":"00000000-0000-0000-0000-0000000014d9","subject":"toan","score":10,"note":""}]'); commit;
\echo == Sua 1 diem + xoa 1 o (mong doi: An toan 10, Binh toan bi xoa)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000014f1';
select public.teacher_save_scores('00000000-0000-0000-0000-0000000014c1','ck1-2026','[{"student_id":"00000000-0000-0000-0000-0000000014d1","subject":"toan","score":10,"note":""},{"student_id":"00000000-0000-0000-0000-0000000014d2","subject":"toan","score":null,"note":""}]');
select s.display_name, g.subject, g.score, g.note from public.teacher_get_scores('00000000-0000-0000-0000-0000000014c1','ck1-2026') g join public.students s on s.id=g.student_id order by 1,2; commit;
\echo == Diem ngoai thang 10 (mong doi: check constraint); ky sai (mong doi: check constraint)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000014f1';
select public.teacher_save_scores('00000000-0000-0000-0000-0000000014c1','ck1-2026','[{"student_id":"00000000-0000-0000-0000-0000000014d1","subject":"toan","score":11}]'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000014f1';
select public.teacher_save_scores('00000000-0000-0000-0000-0000000014c1','hk9-2026','[{"student_id":"00000000-0000-0000-0000-0000000014d1","subject":"toan","score":5}]'); rollback;
\echo == Khen thuong: them, liet ke, xoa
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000014f1';
select public.teacher_add_award('00000000-0000-0000-0000-0000000014c1','00000000-0000-0000-0000-0000000014d1','Giải Nhì Trạng nguyên Tiếng Việt','huyen','2026-10-10','') is not null as them_ok;
select public.teacher_add_award('00000000-0000-0000-0000-0000000014c1','00000000-0000-0000-0000-0000000014d2','Bé ngoan tuần','lop',null,'') is not null as them2_ok;
select title, scope from public.teacher_list_awards('00000000-0000-0000-0000-0000000014c1') order by title; commit;
select id as aw from public.student_awards where title='Bé ngoan tuần' \gset
select id as aw2 from public.student_awards where title<>'Bé ngoan tuần' \gset
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000014f1';
select public.teacher_delete_award(:'aw');
select count(*) as con_lai from public.teacher_list_awards('00000000-0000-0000-0000-0000000014c1'); commit;
\echo == Khen em ngoai lop (mong doi: student_not_in_class)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000014f1';
select public.teacher_add_award('00000000-0000-0000-0000-0000000014c1','00000000-0000-0000-0000-0000000014d9','X','lop',null,''); rollback;
\echo == GV khac: doc diem, xoa khen thuong (mong doi: not_allowed x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000014f2';
select * from public.teacher_get_scores('00000000-0000-0000-0000-0000000014c1','ck1-2026'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000014f2';
select public.teacher_delete_award(:'aw2'); rollback;
\echo == Hoc sinh doc truc tiep bang (mong doi: permission denied x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000014e1';
select * from public.school_scores; rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000014e1';
select * from public.student_awards; rollback;
