-- Kiểm thử 0006: cấp độ L1–L5, thời gian từng câu, thời lượng và điểm tích luỹ.
-- Chạy sau 10, 20, 30 và sau khi nạp supabase/seed/content_grade1_hk1.sql. Dòng "-- EXPECT" ghi kết quả mong đợi.
\set QUIET on
create temp table lv (k text primary key, v text);
grant all on lv to authenticated;

\echo '--- Thời gian mặc định (EXPECT 30 | 55 | 120)'
select public.default_time_limit('single_choice', 1::smallint, 'Chọn chữ a.') as l1_choice,
       public.default_time_limit('fill_blank', 3::smallint, 'Mai có 2 bút chì') - 5 as l3_fill_minus5,
       public.default_time_limit('matching', 5::smallint, repeat('a', 61)) + 20 as capped_plus20;

\echo '--- Dữ liệu nạp sẵn: số câu theo cấp độ, câu thiếu thời gian, thời gian khác công thức (EXPECT 0 | 0)'
select difficulty, count(*) from public.questions q join public.lessons l on l.id = q.lesson_id
where l.content ? 'seed_id' group by difficulty order by difficulty;
select count(*) filter (where q.time_limit_sec is null) as thieu_thoi_gian,
       count(*) filter (where q.time_limit_sec <> public.default_time_limit(q.question_type, q.difficulty, q.prompt ->> 'text')) as khac_cong_thuc
from public.questions q join public.lessons l on l.id = q.lesson_id where l.content ? 'seed_id';
select count(*) as de_on_tap from public.lessons where content ->> 'kind' = 'review';  -- EXPECT 12

-- ---------------------------------------------------------------------------
\echo '--- Giáo viên soạn câu L5 (thời gian tự tính) và câu L4 (thời gian nhập tay)'
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
insert into public.lessons (subject_id, title, created_by)
  select s.id, 'Thử cấp độ', auth.uid() from public.subjects s where s.code = 'toan-1' returning id \gset l_
select public.save_question(:'l_id', null, 'multiple_choice', 'Chọn các số lớn hơn 5.', '["3","6","9"]', '{"correct":["6","9"]}', '', null, 5::smallint) \gset q5_
select public.save_question(:'l_id', null, 'single_choice', '2 + 2 = ?', '["3","4"]', '{"correct":"4"}', '', null, 4::smallint, null, null, null, 45::smallint) \gset q4_
select difficulty, time_limit_sec from public.questions where id in (:'q5_save_question', :'q4_save_question') order by difficulty;  -- EXPECT 4|45 ; 5|85
\echo '--- Cấp độ 6 (EXPECT invalid_difficulty)'
select public.save_question(:'l_id', null, 'single_choice', 'x', '["a","b"]', '{"correct":"a"}', '', null, 6::smallint);
\echo '--- Thời gian 5 giây (EXPECT invalid_time_limit)'
select public.save_question(:'l_id', null, 'single_choice', 'x', '["a","b"]', '{"correct":"a"}', '', null, 1::smallint, null, null, null, 5::smallint);
\echo '--- Gọi thẳng hàm cũ (EXPECT permission denied)'
select public.save_question_v5(:'l_id', null, 'single_choice', 'x', '["a","b"]', '{"correct":"a"}', '', null, 1::smallint, null, null, null);
reset role;

-- ---------------------------------------------------------------------------
\echo '--- Admin xuất bản đề ôn Toán 1 (10 câu, L1→L5)'
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
select id as de1 from public.lessons where content ->> 'seed_id' = 'toan1-ontap-de1' \gset
select public.publish_lesson(:'de1');
reset role;

-- Đáp án đúng của từng câu (đọc bằng quyền chủ DB, chỉ để kiểm thử)
create temp table keys as
select q.id, q.difficulty, q.time_limit_sec, q.sort_order, q.question_type,
       case q.question_type when 'fill_blank' then to_jsonb(k.answer_key -> 'accepted' ->> 0)
                            when 'ordering' then k.answer_key -> 'order'
                            when 'matching' then k.answer_key -> 'pairs'
                            else k.answer_key -> 'correct' end as ans
from public.questions q join public.question_keys k on k.question_id = q.id where q.lesson_id = :'de1';
grant select on keys to authenticated;

\echo '--- Lượt 1: đúng 9/10 — câu sort_order 1 làm nhanh, câu sort_order 3 hết giờ, còn lại dùng hết 80% thời gian'
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
select id as child from public.students where display_name = 'Bin' limit 1 \gset
select public.start_quiz_attempt(:'child', :'de1') as att \gset
select count(*) filter (where (r ->> 'correct')::boolean) as dung
from (
  select case when sort_order = 3
              then public.submit_quiz_answer(:'att', id, 'null'::jsonb, 0, true)
              else public.submit_quiz_answer(:'att', id, ans,
                     case when sort_order = 1 then 3000 else (time_limit_sec * 800) end, false) end as r
  from keys order by sort_order
) s;  -- EXPECT 9
select time_spent_ms, timed_out from public.attempt_answers a join keys k on k.id = a.question_id
where a.attempt_id = :'att' and k.sort_order in (1, 3) order by k.sort_order;  -- EXPECT 3000|f ; 50000|t
-- Điểm mong đợi: tổng điểm cấp độ của 9 câu đúng + 5 (câu 1 nhanh) + 10 (đúng 90%)
select (select sum(public.level_points(difficulty)) from keys where sort_order <> 3) + 5 + 10 as diem_mong_doi \gset
select public.finish_quiz_attempt(:'att') as fin \gset
select (:'fin'::jsonb ->> 'score') as score, (:'fin'::jsonb ->> 'points')::int = :diem_mong_doi as diem_dung,
       (:'fin'::jsonb ->> 'duration_ms')::int > 0 as co_thoi_luong,
       :'fin'::jsonb ->> 'new_points' = :'fin'::jsonb ->> 'points' as cong_het_lan_dau;  -- EXPECT 9 | t | t | t
select (public.student_points(:'child') ->> 'total')::int = :diem_mong_doi as tich_luy_dung;  -- EXPECT t

\echo '--- Lượt 2: làm kém hơn (chỉ 1 câu) => không cộng thêm điểm tích luỹ'
select public.start_quiz_attempt(:'child', :'de1') as att2 \gset
select public.submit_quiz_answer(:'att2', id, ans) from keys where sort_order = 1;
select public.finish_quiz_attempt(:'att2') as fin2 \gset
select (:'fin2'::jsonb ->> 'new_points')::int as cong_them, (public.student_points(:'child') ->> 'total')::int = :diem_mong_doi as van_giu_ky_luc;  -- EXPECT 0 | t
reset role;

\echo '--- Phụ huynh khác xem điểm của bé (EXPECT not_allowed)'
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false);
select public.student_points(:'child');
reset role;
