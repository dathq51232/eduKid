\set ON_ERROR_STOP 1
-- Người dùng giả lập
insert into auth.users (id, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a', '{"display_name":"Admin"}'),
 ('00000000-0000-0000-0000-00000000000b', '{"display_name":"Cô Lan"}'),
 ('00000000-0000-0000-0000-00000000000c', '{"display_name":"Mẹ Bin"}'),
 ('00000000-0000-0000-0000-00000000000d', '{"display_name":"Bố Na"}');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000a','system_admin');
insert into public.schools (id, name) values ('10000000-0000-0000-0000-000000000001','Trường Thử');
insert into public.user_roles (user_id, role, school_id) values ('00000000-0000-0000-0000-00000000000b','teacher','10000000-0000-0000-0000-000000000001');
insert into public.classes (id, school_id, name, grade, created_by) values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','1A',1,'00000000-0000-0000-0000-00000000000a');
insert into public.class_teachers (class_id, teacher_id) values ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000b');

-- Giáo viên soạn bài
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
insert into public.lessons (id, subject_id, title, created_by)
  select '30000000-0000-0000-0000-000000000001', id, 'Phép cộng trong phạm vi 10', auth.uid() from public.subjects where code='toan-1';
-- Soạn câu qua save_question (0004): câu hỏi + đáp án lưu cùng lúc, đáp án được kiểm tra định dạng
create temp table qids (n int primary key, id uuid);
grant all on qids to authenticated;
insert into qids values
 (1, public.save_question('30000000-0000-0000-0000-000000000001', null, 'single_choice', '4+3=?', '["6","7","8"]', '{"correct":"7"}', '4+3=7', 'cong_10', 1::smallint)),
 (2, public.save_question('30000000-0000-0000-0000-000000000001', null, 'fill_blank', '3+6=...', '[]', '{"accepted":["9","chín"]}', '', 'cong_10', 1::smallint)),
 (3, public.save_question('30000000-0000-0000-0000-000000000001', null, 'true_false', '2+2=5', '[]', '{"correct":"Sai"}', '', 'cong_10', 1::smallint)),
 (4, public.save_question('30000000-0000-0000-0000-000000000001', null, 'ordering', 'Xếp từ bé đến lớn', '[]', '{"order":["1","3","5"]}', '', 'so_sanh', 2::smallint)),
 (5, public.save_question('30000000-0000-0000-0000-000000000001', null, 'matching', 'Ghép', '[]', '{"pairs":{"mèo":"cat","chó":"dog"}}', '', 'tu_vung', 2::smallint));
select 'saved questions' as step, count(*) from public.questions;
select public.set_lesson_status('30000000-0000-0000-0000-000000000001', 'review');
select 'teacher sends for review' as step, status from public.lessons;
select 'teacher invite' as step, public.create_class_invite('20000000-0000-0000-0000-000000000001') is not null as ok;
reset role;

-- Admin xuất bản
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
select public.publish_lesson('30000000-0000-0000-0000-000000000001');
reset role;

-- Phụ huynh: tạo con, vào lớp, làm bài
create temp table ctx (k text primary key, v text);
grant all on ctx to authenticated;
insert into ctx select 'code', code from public.class_invites limit 1;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
insert into ctx values ('child', public.create_child('Bin', 1::smallint, 'v1', true)::text);
select 'redeem' as step, public.redeem_class_invite(lower((select v from ctx where k='code')), (select v::uuid from ctx where k='child')) is not null as ok;
select 'questions visible (no answer col)' as step, count(*) from public.questions;
insert into ctx values ('att', public.start_quiz_attempt((select v::uuid from ctx where k='child'), '30000000-0000-0000-0000-000000000001')::text);
select 'q1 7'      as step, public.submit_quiz_answer((select v::uuid from ctx where k='att'),(select id from qids where n=1),'"7"')->'correct';
select 'q2 " Chín "' as step, public.submit_quiz_answer((select v::uuid from ctx where k='att'),(select id from qids where n=2),'" Chín "')->'correct';
select 'q3 đúng (sai)' as step, public.submit_quiz_answer((select v::uuid from ctx where k='att'),(select id from qids where n=3),'"Đúng"')->'correct';
select 'q4 order'  as step, public.submit_quiz_answer((select v::uuid from ctx where k='att'),(select id from qids where n=4),'["1","3","5"]')->'correct';
select 'q5 match'  as step, public.submit_quiz_answer((select v::uuid from ctx where k='att'),(select id from qids where n=5),'{"chó":"Dog","mèo":"cat"}')->'correct';
select 'finish' as step, public.finish_quiz_attempt((select v::uuid from ctx where k='att'));
reset role;

-- Giáo viên xem báo cáo, viết nhận xét
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
select 'class progress' as step, student_name, lesson_title, attempts, best_score, total from public.get_class_progress('20000000-0000-0000-0000-000000000001');
select 'skills' as step, * from public.get_student_skill_report((select v::uuid from ctx where k='child'));
insert into public.teacher_notes (student_id, class_id, author_id, body)
  values ((select v::uuid from ctx where k='child'), '20000000-0000-0000-0000-000000000001', auth.uid(), 'Bin cộng tốt, cần luyện thêm đúng/sai.');
reset role;

-- Phụ huynh xem nhận xét; phụ huynh khác không thấy gì
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
select 'parent sees notes' as step, count(*) from public.teacher_notes;
select 'parent reads keys (expect 0)' as step, count(*) from public.question_keys;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false);
select 'other parent: students/notes/attempts (expect 0,0,0)' as step,
  (select count(*) from public.students), (select count(*) from public.teacher_notes), (select count(*) from public.quiz_attempts);
reset role;
