-- Kiểm thử 0017: giao bài luyện tập / đề làm trên app. Dữ liệu demo.
\set ON_ERROR_STOP 0
insert into public.schools(id,name) values ('00000000-0000-0000-0000-0000000017a1','Trường Demo GB');
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000017f1','gvGB@demo.local'),('00000000-0000-0000-0000-0000000017f2','gvKhac@demo.local');
insert into public.user_roles(user_id, role, school_id) values
  ('00000000-0000-0000-0000-0000000017f1','teacher','00000000-0000-0000-0000-0000000017a1'),
  ('00000000-0000-0000-0000-0000000017f2','teacher','00000000-0000-0000-0000-0000000017a1');
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017f1';
select public.teacher_create_class('2A', 2::smallint) as c \gset
select count(*) as them from public.teacher_add_students(:'c', array['Demo Một','Demo Hai','Demo Ba'], 'v1', true);
commit;
select student_id as s1 from public.class_memberships cm join public.students s on s.id=cm.student_id where cm.class_id=:'c' and s.display_name='Demo Một' \gset
select student_id as s2 from public.class_memberships cm join public.students s on s.id=cm.student_id where cm.class_id=:'c' and s.display_name='Demo Hai' \gset
select student_id as s3 from public.class_memberships cm join public.students s on s.id=cm.student_id where cm.class_id=:'c' and s.display_name='Demo Ba' \gset
-- tài khoản đăng nhập của 3 em (demo)
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000017e1','hs1@demo.local'),('00000000-0000-0000-0000-0000000017e2','hs2@demo.local'),('00000000-0000-0000-0000-0000000017e3','hs3@demo.local');
update public.students set user_id='00000000-0000-0000-0000-0000000017e1' where id=:'s1';
update public.students set user_id='00000000-0000-0000-0000-0000000017e2' where id=:'s2';
update public.students set user_id='00000000-0000-0000-0000-0000000017e3' where id=:'s3';

\echo == Giao bai luyen tap ca lop (mong doi: assigned 3, done 0)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017f1';
select public.teacher_create_assignment(:'c', 'lesson', 'Ôn bài 5', 'toan', 'toan2-kntt-b05', 2::smallint, null, null, now() + interval '3 days', null) as a1 \gset
select title, assigned, done from public.teacher_list_assignments(:'c'); commit;
\echo == Em 1 lam bai (sau luc giao) -> done 1; detail: em 1 da lam 2 lan, diem tot nhat 9/10
insert into public.lesson_results(student_id, lesson_code, score, total, points) values (:'s1','toan2-kntt-b05',7,10,50),(:'s1','toan2-kntt-b05',9,10,70);
insert into public.lesson_results(student_id, lesson_code, score, total, points, created_at) values (:'s2','toan2-kntt-b05',10,10,80, now() - interval '2 days');
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017f1';
select title, assigned, done from public.teacher_list_assignments(:'c');
select display_name, done, attempts, correct, total from public.teacher_assignment_detail(:'a1') order by display_name; commit;

\echo == Giao nhom (chi em 2) + de 2 cau cho em 1, em 2
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017f1';
select public.teacher_create_assignment(:'c', 'lesson', 'Kèm thêm bài 6', 'toan', 'toan2-kntt-b06', null, null, null, now() + interval '2 days', array[:'s2']::uuid[]) as a2 \gset
select public.teacher_create_assignment(:'c', 'exam', 'Kiểm tra nhanh', 'toan', null, null,
  '[{"type":"single_choice","prompt":"2 + 3 = ?","options":["4","5","6"],"answer":{"correct":"5"},"explanation":"Đếm thêm","pts":5,"muc":1},
    {"type":"fill_blank","prompt":"7 - 2 = ___","options":[],"answer":{"accepted":["5"]},"pts":5,"muc":2}]'::jsonb,
  15::smallint, now() + interval '1 day', array[:'s1', :'s2']::uuid[]) as a3 \gset
select title, kind, assigned, n_questions from public.teacher_list_assignments(:'c') order by created_at; commit;

\echo == Em 1: thay bai ca lop + de (2 bai), khong thay bai nhom cua em 2
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017e1';
select title, kind, done from public.student_my_assignments() order by title; commit;
\echo == Em 2: thay 3 bai
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017e2';
select count(*) as so_bai from public.student_my_assignments(); commit;
\echo == Em 1 mo de: cau hoi KHONG co dap an / loi giai (mong doi: false, false, true)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017e1';
select questions::text like '%answer%' as lo_dap_an, questions::text like '%Đếm thêm%' as lo_loi_giai, questions::text like '%2 + 3%' as co_cau_hoi, submitted from public.student_get_exam(:'a3'); commit;
\echo == Em 3 mo de khong giao cho em (mong doi: not_allowed)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017e3';
select * from public.student_get_exam(:'a3'); rollback;
\echo == Hoc sinh doc thang bang / tu nop bai / tu giao bai (mong doi: permission denied x2, not_allowed)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017e1';
select count(*) from public.class_assignments; rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017e1';
insert into public.assignment_submissions(assignment_id, student_id, score, max_score, correct, total) values (:'a3', :'s1', 10, 10, 2, 2); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017e1';
select public.teacher_create_assignment(:'c', 'lesson', 'Tự giao', 'toan', 'toan2-kntt-b05', null, null, null, now() + interval '1 day', null); rollback;

\echo == May chu ghi bai nop em 1 (5/10); nop lan 2 (mong doi: duplicate key)
insert into public.assignment_submissions(assignment_id, student_id, score, max_score, correct, total, answers)
values (:'a3', :'s1', 5, 10, 1, 2, '[{"i":0,"a":"5","ok":true},{"i":1,"a":"4","ok":false}]');
insert into public.assignment_submissions(assignment_id, student_id, score, max_score, correct, total) values (:'a3', :'s1', 10, 10, 2, 2);
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017e1';
select submitted, score, max_score, answers::text like '%"a"%' as lo_cau_tra_loi, jsonb_array_length(answers) as so_cau from public.student_get_exam(:'a3'); commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017f1';
select display_name, done, score, answers::text like '%"a"%' as gv_thay_cau_tra_loi from public.teacher_assignment_detail(:'a3') order by display_name;
select jsonb_array_length(public.teacher_assignment_questions(:'a3')) as so_cau_gv;
select title, done from public.teacher_list_assignments(:'c') where kind='exam'; commit;

\echo == Giao vien khac xem / xoa (mong doi: not_allowed x3)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017f2';
select * from public.teacher_list_assignments(:'c'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017f2';
select * from public.teacher_assignment_detail(:'a3'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017f2';
select public.teacher_delete_assignment(:'a1'); rollback;

\echo == Du lieu sai (mong doi: invalid_due, student_not_in_class, check x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017f1';
select public.teacher_create_assignment(:'c', 'lesson', 'Hạn đã qua', 'toan', 'toan2-kntt-b05', null, null, null, now() - interval '2 days', null); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017f1';
select public.teacher_create_assignment(:'c', 'lesson', 'Em lạ', 'toan', 'toan2-kntt-b05', null, null, null, now() + interval '1 day', array['00000000-0000-0000-0000-00000000dead']::uuid[]); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017f1';
select public.teacher_create_assignment(:'c', 'lesson', 'Thiếu bài', 'toan', null, null, null, null, now() + interval '1 day', null); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017f1';
select public.teacher_create_assignment(:'c', 'exam', 'Đề rỗng', 'toan', null, null, '[]'::jsonb, 15::smallint, now() + interval '1 day', null); rollback;

\echo == Dong bai, roi xoa (mong doi: closed; con 2 bai)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000017f1';
select public.teacher_set_assignment_status(:'a3', false);
select status from public.teacher_list_assignments(:'c') where kind='exam';
select public.teacher_delete_assignment(:'a2');
select count(*) as con_lai from public.teacher_list_assignments(:'c'); commit;
