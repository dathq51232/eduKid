-- EduChain Kids 0006: cấp độ L1–L5, thời gian làm từng câu, thời lượng bài làm và điểm tích luỹ.
-- Chạy SAU 0001–0005.
--
-- Quy tắc (trùng với src/lib/levels.ts — sửa ở đâu thì sửa cả hai nơi):
--   Cấp độ (questions.difficulty): 1 Làm quen · 2 Cơ bản · 3 Vận dụng · 4 Thử thách · 5 Mở rộng
--     (L1–L3 tương ứng Nhận biết – Thông hiểu – Vận dụng; L1–L5 là thang nội bộ, không phải cấp độ của Bộ).
--   Thời gian mặc định = giây theo cấp độ (30/40/50/60/75)
--     + thêm theo dạng câu (điền, chọn nhiều: +10; sắp xếp, ghép cặp: +15)
--     + 10 giây nếu đề dài hơn 60 ký tự; làm tròn 5 giây, trong khoảng 30–120 giây.
--   Điểm câu đúng: 10/15/20/25/30 theo cấp độ; +5 nếu đúng và dùng không quá nửa thời gian.
--   Thưởng hoàn thành bài: đúng hết +20, đúng từ 80% +10.
--   Điểm tích luỹ của học sinh = cộng điểm cao nhất của từng bài (làm lại chỉ được cộng phần vượt kỷ lục).

-- ---------------------------------------------------------------------------
-- A. Cấp độ 1–5 và thời gian từng câu
-- ---------------------------------------------------------------------------
alter table public.questions drop constraint if exists questions_difficulty_check;
alter table public.questions add constraint questions_difficulty_check check (difficulty between 1 and 5);

create or replace function public.default_time_limit(p_type text, p_difficulty smallint, p_prompt text)
returns smallint
language sql
immutable
set search_path = ''
as $$
  select least(120, greatest(30,
    round((
      (case p_difficulty when 1 then 30 when 2 then 40 when 3 then 50 when 4 then 60 when 5 then 75 else 30 end)
      + (case p_type when 'fill_blank' then 10 when 'multiple_choice' then 10 when 'ordering' then 15 when 'matching' then 15 else 0 end)
      + (case when char_length(coalesce(p_prompt, '')) > 60 then 10 else 0 end)
    ) / 5.0) * 5
  ))::smallint;
$$;

create or replace function public.level_points(p_difficulty smallint)
returns smallint
language sql
immutable
set search_path = ''
as $$
  select (case p_difficulty when 1 then 10 when 2 then 15 when 3 then 20 when 4 then 25 when 5 then 30 else 10 end)::smallint;
$$;

alter table public.questions add column if not exists time_limit_sec smallint;
update public.questions
set time_limit_sec = public.default_time_limit(question_type, difficulty, prompt ->> 'text')
where time_limit_sec is null;
alter table public.questions alter column time_limit_sec set not null;
alter table public.questions drop constraint if exists questions_time_limit_check;
alter table public.questions add constraint questions_time_limit_check check (time_limit_sec between 10 and 300);

-- Thêm câu không ghi thời gian thì tự tính
create or replace function public.fill_time_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.time_limit_sec is null then
    new.time_limit_sec := public.default_time_limit(new.question_type, new.difficulty, new.prompt ->> 'text');
  end if;
  return new;
end;
$$;
drop trigger if exists questions_fill_time_limit on public.questions;
create trigger questions_fill_time_limit before insert or update on public.questions
for each row execute function public.fill_time_limit();

-- ---------------------------------------------------------------------------
-- B. Kết quả: thời gian từng câu, thời lượng và điểm của lượt làm
-- ---------------------------------------------------------------------------
alter table public.attempt_answers
  add column if not exists time_spent_ms integer check (time_spent_ms is null or time_spent_ms between 0 and 600000),
  add column if not exists timed_out boolean not null default false;
alter table public.quiz_attempts
  add column if not exists duration_ms integer,
  add column if not exists points integer,
  add column if not exists lesson_bonus integer;

-- Chấm từng câu, ghi thêm thời gian em đã dùng và câu có hết giờ hay không.
-- Hết giờ mà chưa có đáp án: gửi p_answer = 'null'::jsonb, p_timed_out = true.
create or replace function public.submit_quiz_answer(
  p_attempt uuid, p_question uuid, p_answer jsonb, p_time_ms integer, p_timed_out boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_att public.quiz_attempts%rowtype;
  v_key public.question_keys%rowtype;
  v_type text;
  v_limit smallint;
  v_ok boolean;
  v_ms integer;
begin
  select * into v_att from public.quiz_attempts where id = p_attempt;
  if not found or auth.uid() is null or not public.is_parent_of(v_att.student_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if v_att.completed_at is not null then
    raise exception 'attempt_completed' using errcode = '22023';
  end if;
  if p_answer is null or length(p_answer::text) > 500 then
    raise exception 'invalid_answer' using errcode = '22023';
  end if;

  select q.question_type, q.time_limit_sec into v_type, v_limit from public.questions q
  where q.id = p_question and q.lesson_id = v_att.lesson_id and q.status = 'published';
  if not found then
    raise exception 'invalid_question' using errcode = '22023';
  end if;

  select * into v_key from public.question_keys where question_id = p_question;
  if not found then
    raise exception 'question_not_ready' using errcode = '22023';
  end if;

  v_ok := jsonb_typeof(p_answer) <> 'null' and public.grade_answer(v_type, p_answer, v_key.answer_key);
  -- Thời gian do trình duyệt gửi: giới hạn trong khoảng 0 .. thời gian của câu
  v_ms := least(greatest(coalesce(p_time_ms, v_limit * 1000), 0), v_limit * 1000);
  if coalesce(p_timed_out, false) then v_ms := v_limit * 1000; end if;

  begin
    insert into public.attempt_answers (attempt_id, question_id, given, is_correct, time_spent_ms, timed_out)
    values (p_attempt, p_question, p_answer, v_ok, v_ms, coalesce(p_timed_out, false));
  exception when unique_violation then
    raise exception 'already_answered' using errcode = '23505';
  end;

  return jsonb_build_object('correct', v_ok, 'explanation', v_key.explanation, 'solution', v_key.solution);
end;
$$;

-- Lời gọi cũ (3 tham số) vẫn chạy: không có thời gian thì tính như dùng hết thời gian (không được thưởng nhanh)
create or replace function public.submit_quiz_answer(p_attempt uuid, p_question uuid, p_answer jsonb)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public.submit_quiz_answer(p_attempt, p_question, p_answer, null::integer, false);
$$;

-- Điểm tích luỹ của một học sinh: cộng điểm cao nhất của từng bài đã hoàn thành
create or replace function public.student_points(p_student uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_total integer;
  v_lessons jsonb;
begin
  if auth.uid() is null or not (
    public.is_parent_of(p_student)
    or exists (select 1 from public.class_memberships cm where cm.student_id = p_student and public.teaches_class(cm.class_id))
    or public.has_role('system_admin', null)
  ) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  with best as (
    select a.lesson_id, max(coalesce(a.points, 0)) as best
    from public.quiz_attempts a
    where a.student_id = p_student and a.completed_at is not null
    group by a.lesson_id
  )
  select coalesce(sum(best), 0)::integer,
         coalesce(jsonb_agg(jsonb_build_object('lesson_id', lesson_id, 'best', best)), '[]'::jsonb)
  into v_total, v_lessons
  from best;

  return jsonb_build_object('total', v_total, 'lessons', v_lessons);
end;
$$;

-- Kết thúc lượt làm: tính số câu đúng, thời lượng, điểm; trả thêm điểm tích luỹ trước và sau
create or replace function public.finish_quiz_attempt(p_attempt uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_att public.quiz_attempts%rowtype;
  v_total integer;
  v_score integer;
  v_duration integer;
  v_qpoints integer;
  v_bonus integer;
  v_prev_best integer;
  v_before integer;
begin
  select * into v_att from public.quiz_attempts where id = p_attempt;
  if not found or auth.uid() is null or not public.is_parent_of(v_att.student_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if v_att.completed_at is not null then
    return jsonb_build_object('score', v_att.score, 'total', v_att.total, 'points', v_att.points,
                              'duration_ms', v_att.duration_ms, 'lesson_bonus', v_att.lesson_bonus);
  end if;

  v_before := (public.student_points(v_att.student_id) ->> 'total')::integer;
  select coalesce(max(points), 0) into v_prev_best from public.quiz_attempts
  where student_id = v_att.student_id and lesson_id = v_att.lesson_id and completed_at is not null;

  select count(*) into v_total from public.questions q
  where q.lesson_id = v_att.lesson_id and q.status = 'published';

  select count(*) filter (where a.is_correct),
         coalesce(sum(a.time_spent_ms), 0),
         coalesce(sum(case when a.is_correct then
           public.level_points(q.difficulty)
           + case when a.time_spent_ms is not null and a.time_spent_ms <= q.time_limit_sec * 500 then 5 else 0 end
         else 0 end), 0)
  into v_score, v_duration, v_qpoints
  from public.attempt_answers a join public.questions q on q.id = a.question_id
  where a.attempt_id = p_attempt;

  v_bonus := case when v_total > 0 and v_score = v_total then 20
                  when v_total > 0 and v_score * 10 >= v_total * 8 then 10
                  else 0 end;

  update public.quiz_attempts
  set completed_at = now(), score = v_score, total = v_total,
      duration_ms = v_duration, points = v_qpoints + v_bonus, lesson_bonus = v_bonus
  where id = p_attempt;

  return jsonb_build_object(
    'score', v_score, 'total', v_total, 'duration_ms', v_duration,
    'points', v_qpoints + v_bonus, 'question_points', v_qpoints, 'lesson_bonus', v_bonus,
    'new_points', greatest(0, v_qpoints + v_bonus - v_prev_best),
    'previous_total', v_before,
    'total_points', v_before + greatest(0, v_qpoints + v_bonus - v_prev_best)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- C. Soạn câu hỏi: cấp độ 1–5 và thời gian tuỳ chọn
-- Hàm cũ (0005, chỉ nhận cấp độ 1–3) đổi tên thành save_question_v5 và chỉ gọi được từ hàm mới.
-- ---------------------------------------------------------------------------
alter function public.save_question(uuid, uuid, text, text, jsonb, jsonb, text, text, smallint, uuid, uuid, text)
  rename to save_question_v5;
revoke all on function public.save_question_v5(uuid, uuid, text, text, jsonb, jsonb, text, text, smallint, uuid, uuid, text)
  from public, anon, authenticated;

create or replace function public.save_question(
  p_lesson uuid,
  p_question uuid,
  p_type text,
  p_prompt text,
  p_options jsonb,
  p_answer_key jsonb,
  p_explanation text,
  p_skill_code text,
  p_difficulty smallint,
  p_form uuid default null,
  p_outcome uuid default null,
  p_solution text default null,
  p_time_limit smallint default null   -- giây; null = tự tính theo cấp độ và dạng câu
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_difficulty is null or p_difficulty not between 1 and 5 then
    raise exception 'invalid_difficulty' using errcode = '22023';
  end if;
  if p_time_limit is not null and p_time_limit not between 10 and 300 then
    raise exception 'invalid_time_limit' using errcode = '22023';
  end if;

  -- Toàn bộ kiểm tra quyền, nội dung, đáp án nằm ở save_question_v5 (cấp độ 4–5 được ghi lại ngay sau đó)
  v_id := public.save_question_v5(p_lesson, p_question, p_type, p_prompt, p_options, p_answer_key, p_explanation,
                                  p_skill_code, least(p_difficulty, 3)::smallint, p_form, p_outcome, p_solution);

  update public.questions
  set difficulty = p_difficulty,
      time_limit_sec = coalesce(p_time_limit, public.default_time_limit(p_type, p_difficulty, btrim(coalesce(p_prompt, ''))))
  where id = v_id;
  return v_id;
end;
$$;

-- Độ phủ theo YCCĐ: đếm câu đã xuất bản theo 5 cấp độ
drop function if exists public.curriculum_coverage(text);
create function public.curriculum_coverage(p_subject_code text)
returns table (
  topic_id uuid, topic_code text, topic_title text, topic_core boolean, topic_status public.record_status,
  outcome_id uuid, outcome_code text, outcome_text text, stage smallint, outcome_core boolean, outcome_status public.record_status,
  lessons_total integer, lessons_published integer,
  questions_published integer, level1 integer, level2 integer, level3 integer, level4 integer, level5 integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not (public.has_role('system_admin', null) or public.has_role('teacher', null)) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  return query
  select t.id, t.code, t.title, t.is_core, t.status,
         o.id, o.code, o.description, o.stage, o.is_core, o.status,
         (select count(*)::integer from public.lesson_outcomes lo join public.lessons l on l.id = lo.lesson_id
          where lo.outcome_id = o.id and l.status <> 'archived'),
         (select count(*)::integer from public.lesson_outcomes lo join public.lessons l on l.id = lo.lesson_id
          where lo.outcome_id = o.id and l.status = 'published'),
         (select count(*)::integer from public.questions q where q.outcome_id = o.id and q.status = 'published'),
         (select count(*)::integer from public.questions q where q.outcome_id = o.id and q.status = 'published' and q.difficulty = 1),
         (select count(*)::integer from public.questions q where q.outcome_id = o.id and q.status = 'published' and q.difficulty = 2),
         (select count(*)::integer from public.questions q where q.outcome_id = o.id and q.status = 'published' and q.difficulty = 3),
         (select count(*)::integer from public.questions q where q.outcome_id = o.id and q.status = 'published' and q.difficulty = 4),
         (select count(*)::integer from public.questions q where q.outcome_id = o.id and q.status = 'published' and q.difficulty = 5)
  from public.curriculum_topics t
  join public.subjects s on s.id = t.subject_id
  left join public.learning_outcomes o on o.topic_id = t.id
  where s.code = p_subject_code
  order by t.sort_order, t.code, o.stage, o.sort_order, o.code;
end;
$$;

-- ---------------------------------------------------------------------------
-- D. Quyền
-- ---------------------------------------------------------------------------
revoke all on function public.default_time_limit(text, smallint, text) from public, anon;
grant execute on function public.default_time_limit(text, smallint, text) to authenticated;
revoke all on function public.level_points(smallint) from public, anon;
grant execute on function public.level_points(smallint) to authenticated;
revoke all on function public.fill_time_limit() from public, anon, authenticated;
revoke all on function public.submit_quiz_answer(uuid, uuid, jsonb, integer, boolean) from public, anon;
grant execute on function public.submit_quiz_answer(uuid, uuid, jsonb, integer, boolean) to authenticated;
revoke all on function public.submit_quiz_answer(uuid, uuid, jsonb) from public, anon;
grant execute on function public.submit_quiz_answer(uuid, uuid, jsonb) to authenticated;
revoke all on function public.finish_quiz_attempt(uuid) from public, anon;
grant execute on function public.finish_quiz_attempt(uuid) to authenticated;
revoke all on function public.student_points(uuid) from public, anon;
grant execute on function public.student_points(uuid) to authenticated;
revoke all on function public.save_question(uuid, uuid, text, text, jsonb, jsonb, text, text, smallint, uuid, uuid, text, smallint) from public, anon;
grant execute on function public.save_question(uuid, uuid, text, text, jsonb, jsonb, text, text, smallint, uuid, uuid, text, smallint) to authenticated;
revoke all on function public.curriculum_coverage(text) from public, anon;
grant execute on function public.curriculum_coverage(text) to authenticated;
