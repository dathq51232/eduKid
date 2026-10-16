-- Kiểm thử danh mục chương trình (0005). Chạy sau 10 và 20 trên cùng database.
-- Dòng "-- EXPECT" ghi kết quả mong đợi.
\set QUIET on
create temp table cur (k text primary key, v text);
grant all on cur to authenticated;

-- Giáo viên tạo bài Toán 1, gắn chủ đề Phép cộng, trừ và 2 YCCĐ
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
insert into public.lessons (subject_id, title, created_by, topic_id)
  select s.id, 'Cộng trừ trong phạm vi 10', auth.uid(), t.id
  from public.subjects s, public.curriculum_topics t where s.code = 'toan-1' and t.code = 'T1.PT'
  returning id \gset lesson_
insert into cur values ('lesson', :'lesson_id');
select public.set_lesson_outcomes(:'lesson_id', array(select id from public.learning_outcomes where code in ('T1.PT.02','T1.PT.07')));
select 'lesson outcomes' as step, count(*) from public.lesson_outcomes where lesson_id = :'lesson_id';  -- EXPECT 2

select public.save_question(:'lesson_id', null, 'fill_blank', '4 + 3 = ...', '[]', '{"accepted":["7"]}', 'Đếm thêm 3 từ 4.', 'cong_10', 1::smallint,
  (select id from public.exercise_forms where code = 'TOAN.TINH'),
  (select id from public.learning_outcomes where code = 'T1.PT.02'),
  'Bước 1: Bắt đầu từ 4. Bước 2: Đếm thêm 3 bước: 5, 6, 7. Vậy 4 + 3 = 7.') is not null as saved_with_catalog;
select public.save_question(:'lesson_id', null, 'fill_blank', 'Lan có 5 cái kẹo, ăn 2 cái. Còn mấy cái?', '[]', '{"accepted":["3"]}', '', 'tru_10', 3::smallint,
  (select id from public.exercise_forms where code = 'TOAN.LOIVAN'),
  (select id from public.learning_outcomes where code = 'T1.PT.07'),
  'Phép tính: 5 - 2 = 3. Trả lời: Lan còn 3 cái kẹo.') is not null as saved_word_problem;
select 'solution stored' as step, k.solution ->> 'text' from public.question_keys k join public.questions q on q.id = k.question_id where q.lesson_id = :'lesson_id' order by q.sort_order limit 1;

\echo '--- topic of another subject (EXPECT topic_wrong_subject)'
update public.lessons set topic_id = (select id from public.curriculum_topics where code = 'V1.AM') where id = :'lesson_id';
\echo '--- outcome of Tiếng Việt (EXPECT outcome_wrong_subject)'
select public.set_lesson_outcomes(:'lesson_id', array(select id from public.learning_outcomes where code = 'V1.AM.01'));
\echo '--- form of Tiếng Việt (EXPECT form_wrong_subject)'
select public.save_question(:'lesson_id', null, 'fill_blank', 'x', '[]', '{"accepted":["1"]}', '', null, 1::smallint, (select id from public.exercise_forms where code = 'TV.AMCHU'), null, null);
\echo '--- outcome not attached to lesson (EXPECT outcome_not_in_lesson)'
select public.save_question(:'lesson_id', null, 'fill_blank', 'x', '[]', '{"accepted":["1"]}', '', null, 1::smallint, null, (select id from public.learning_outcomes where code = 'T1.SO.01'), null);
\echo '--- teacher edits catalog (EXPECT RLS error)'
insert into public.curriculum_topics (subject_id, code, title) select id, 'T1.XX', 'Thử' from public.subjects where code = 'toan-1';
\echo '--- teacher reads coverage (EXPECT rows)'
select outcome_code, questions_published from public.curriculum_coverage('toan-1') where outcome_code in ('T1.PT.02','T1.PT.07');
reset role;

-- Admin xuất bản; phụ huynh làm bài và nhận lời giải
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
select public.publish_lesson(:'lesson_id');
select 'coverage after publish' as step, outcome_code, questions_published, level1, level3 from public.curriculum_coverage('toan-1') where outcome_code in ('T1.PT.02','T1.PT.07');  -- EXPECT 1/1/0 và 1/0/1
select 'overview' as step, public.admin_overview() -> 'outcomes_total' as total, public.admin_overview() -> 'outcomes_covered' as covered;  -- EXPECT 58, 2
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
select public.start_quiz_attempt((select id from public.students limit 1), :'lesson_id') as att \gset
select 'submit returns solution' as step, public.submit_quiz_answer(:'att', (select id from public.questions where lesson_id = :'lesson_id' order by sort_order limit 1), '"7"') -> 'solution' ->> 'text';
select 'parent cannot read keys' as step, count(*) from public.question_keys;  -- EXPECT 0
reset role;

set role anon;
select 'anon reads catalog' as step, count(*) from public.curriculum_topics;  -- EXPECT 15
reset role;
