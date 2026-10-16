-- EduChain Kids 0005: danh mục chương trình
--   Lớp -> Môn -> Chủ đề -> Yêu cầu cần đạt (YCCĐ) -> Bài học -> Dạng bài
-- và lưu đầy đủ cho mỗi câu hỏi: nội dung, đáp án, lời giải, mức độ, kỹ năng, dạng bài, YCCĐ.
-- Chạy SAU 0001 → 0004. Cuối file có dữ liệu mẫu lớp 1 (Toán, Tiếng Việt, Tiếng Anh).
--
-- Mức độ (questions.difficulty): 1 = Nhận biết, 2 = Thông hiểu, 3 = Vận dụng.
-- Giai đoạn (learning_outcomes.stage): 1, 2, 3 — để tăng dần độ khó, không dạy vượt trước.

-- ---------------------------------------------------------------------------
-- A. Bảng danh mục
-- ---------------------------------------------------------------------------
create table public.curriculum_topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9][A-Z0-9_.-]{1,39}$'),
  title text not null check (char_length(title) between 1 and 180),
  description text not null default '' check (char_length(description) <= 1000),
  sort_order integer not null default 0,
  is_core boolean not null default true,       -- false = nội dung mở rộng (tùy sách/chương trình nhà trường)
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learning_outcomes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.curriculum_topics(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9][A-Z0-9_.-]{1,39}$'),
  description text not null check (char_length(description) between 1 and 500),
  stage smallint not null default 1 check (stage between 1 and 3),
  sort_order integer not null default 0,
  is_core boolean not null default true,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dạng bài: theo "họ môn" (toan, tieng-viet, tieng-anh), dùng chung cho các lớp.
create table public.exercise_forms (
  id uuid primary key default gen_random_uuid(),
  subject_family text not null check (subject_family in ('toan', 'tieng-viet', 'tieng-anh')),
  code text not null unique check (code ~ '^[A-Z0-9][A-Z0-9_.-]{1,39}$'),
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  default_question_type text not null
    check (default_question_type in ('single_choice', 'true_false', 'fill_blank', 'multiple_choice', 'matching', 'ordering')),
  sort_order integer not null default 0,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now()
);

alter table public.lessons add column topic_id uuid references public.curriculum_topics(id) on delete set null;

create table public.lesson_outcomes (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  outcome_id uuid not null references public.learning_outcomes(id) on delete cascade,
  primary key (lesson_id, outcome_id)
);

alter table public.questions
  add column form_id uuid references public.exercise_forms(id) on delete set null,
  add column outcome_id uuid references public.learning_outcomes(id) on delete set null;

-- Lời giải chi tiết: nằm cùng đáp án (học sinh chỉ nhận sau khi đã trả lời)
alter table public.question_keys add column solution jsonb not null default '{}'::jsonb;

create index curriculum_topics_subject_idx on public.curriculum_topics (subject_id, sort_order);
create index learning_outcomes_topic_idx on public.learning_outcomes (topic_id, stage, sort_order);
create index lessons_topic_idx on public.lessons (topic_id);
create index lesson_outcomes_outcome_idx on public.lesson_outcomes (outcome_id);
create index questions_outcome_idx on public.questions (outcome_id);
create index questions_form_idx on public.questions (form_id);

create trigger curriculum_topics_set_updated_at before update on public.curriculum_topics
for each row execute function public.set_updated_at();
create trigger learning_outcomes_set_updated_at before update on public.learning_outcomes
for each row execute function public.set_updated_at();

-- Chủ đề của bài phải cùng môn, cùng lớp với bài (không gắn nhầm sang lớp khác)
create or replace function public.check_lesson_topic()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.topic_id is not null and not exists (
    select 1 from public.curriculum_topics t where t.id = new.topic_id and t.subject_id = new.subject_id
  ) then
    raise exception 'topic_wrong_subject' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger lessons_check_topic before insert or update of topic_id, subject_id on public.lessons
for each row execute function public.check_lesson_topic();

-- ---------------------------------------------------------------------------
-- B. Phân quyền
-- ---------------------------------------------------------------------------
alter table public.curriculum_topics enable row level security;
alter table public.learning_outcomes enable row level security;
alter table public.exercise_forms enable row level security;
alter table public.lesson_outcomes enable row level security;

-- Danh mục là thông tin công khai: ai cũng đọc được mục đang dùng; người đăng nhập đọc cả mục đã tắt.
create policy topics_select_anon on public.curriculum_topics for select to anon using (status = 'active');
create policy topics_select_auth on public.curriculum_topics for select to authenticated using (true);
create policy outcomes_select_anon on public.learning_outcomes for select to anon using (status = 'active');
create policy outcomes_select_auth on public.learning_outcomes for select to authenticated using (true);
create policy forms_select_anon on public.exercise_forms for select to anon using (status = 'active');
create policy forms_select_auth on public.exercise_forms for select to authenticated using (true);

-- Chỉ quản trị hệ thống sửa danh mục
create policy topics_admin_write on public.curriculum_topics for all to authenticated
  using (public.has_role('system_admin', null)) with check (public.has_role('system_admin', null));
create policy outcomes_admin_write on public.learning_outcomes for all to authenticated
  using (public.has_role('system_admin', null)) with check (public.has_role('system_admin', null));
create policy forms_admin_write on public.exercise_forms for all to authenticated
  using (public.has_role('system_admin', null)) with check (public.has_role('system_admin', null));
revoke insert, update, delete on public.curriculum_topics, public.learning_outcomes, public.exercise_forms from anon;

-- Liên kết bài - YCCĐ: đọc theo quyền xem bài; ghi qua set_lesson_outcomes()
create policy lesson_outcomes_select on public.lesson_outcomes for select to authenticated
  using (exists (select 1 from public.lessons l where l.id = lesson_id));
revoke all on public.lesson_outcomes from anon;
revoke insert, update, delete on public.lesson_outcomes from authenticated;

-- Người soạn được đổi chủ đề của bài (trigger ở trên kiểm tra đúng môn)
grant update (topic_id) on public.lessons to authenticated;

-- ---------------------------------------------------------------------------
-- C. Hàm nghiệp vụ
-- ---------------------------------------------------------------------------

-- Gắn danh sách YCCĐ cho bài (thay toàn bộ). YCCĐ phải cùng môn, cùng lớp với bài.
create or replace function public.set_lesson_outcomes(p_lesson uuid, p_outcomes uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_subject uuid;
begin
  if v_uid is null or not public.can_edit_lesson(p_lesson) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if (select status from public.lessons where id = p_lesson) not in ('draft', 'review') then
    raise exception 'lesson_locked' using errcode = '22023';
  end if;
  select subject_id into v_subject from public.lessons where id = p_lesson;
  if exists (
    select 1 from unnest(coalesce(p_outcomes, '{}')) x(id)
    where not exists (
      select 1 from public.learning_outcomes o join public.curriculum_topics t on t.id = o.topic_id
      where o.id = x.id and t.subject_id = v_subject
    )
  ) then
    raise exception 'outcome_wrong_subject' using errcode = '22023';
  end if;

  delete from public.lesson_outcomes where lesson_id = p_lesson;
  insert into public.lesson_outcomes (lesson_id, outcome_id)
  select distinct p_lesson, x from unnest(coalesce(p_outcomes, '{}')) x;

  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'set_lesson_outcomes', 'lesson', p_lesson::text, coalesce(array_length(p_outcomes, 1), 0)::text || ' YCCĐ');
end;
$$;

-- Độ phủ theo YCCĐ của một môn-lớp (vd 'toan-1'): mỗi YCCĐ có bao nhiêu bài, bao nhiêu câu đã xuất bản ở từng mức độ.
create or replace function public.curriculum_coverage(p_subject_code text)
returns table (
  topic_id uuid, topic_code text, topic_title text, topic_core boolean, topic_status public.record_status,
  outcome_id uuid, outcome_code text, outcome_text text, stage smallint, outcome_core boolean, outcome_status public.record_status,
  lessons_total integer, lessons_published integer,
  questions_published integer, level1 integer, level2 integer, level3 integer
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
         (select count(*)::integer from public.questions q where q.outcome_id = o.id and q.status = 'published' and q.difficulty = 3)
  from public.curriculum_topics t
  join public.subjects s on s.id = t.subject_id
  left join public.learning_outcomes o on o.topic_id = t.id
  where s.code = p_subject_code
  order by t.sort_order, t.code, o.stage, o.sort_order, o.code;
end;
$$;

-- save_question: thêm dạng bài, YCCĐ, lời giải (tham số mới có mặc định, lời gọi cũ vẫn chạy)
drop function public.save_question(uuid, uuid, text, text, jsonb, jsonb, text, text, smallint);

create or replace function public.save_question(
  p_lesson uuid,
  p_question uuid,          -- null = thêm mới
  p_type text,
  p_prompt text,
  p_options jsonb,          -- mảng chuỗi; xem quy ước theo loại ở dưới
  p_answer_key jsonb,       -- định dạng như mô tả trong 0003
  p_explanation text,
  p_skill_code text,
  p_difficulty smallint,
  p_form uuid default null,       -- dạng bài (exercise_forms)
  p_outcome uuid default null,    -- yêu cầu cần đạt (learning_outcomes)
  p_solution text default null    -- lời giải chi tiết
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_status public.lesson_status;
  v_prompt text := btrim(coalesce(p_prompt, ''));
  v_expl text := btrim(coalesce(p_explanation, ''));
  v_skill text := nullif(lower(btrim(coalesce(p_skill_code, ''))), '');
  v_options jsonb := coalesce(p_options, '[]'::jsonb);
  v_opts text[];
  v_id uuid;
  v_sort integer;
  v_left jsonb;
  v_prompt_json jsonb;
  v_sol text := btrim(coalesce(p_solution, ''));
  v_subject uuid;
  v_family text;
begin
  if v_uid is null or not public.can_edit_lesson(p_lesson) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select status into v_status from public.lessons where id = p_lesson;
  if v_status not in ('draft', 'review') then
    raise exception 'lesson_locked' using errcode = '22023',
      hint = 'Bài đã xuất bản hoặc lưu trữ. Chuyển về nháp trước khi sửa.';
  end if;

  select l.subject_id, regexp_replace(s.code, '-[0-9]+$', '') into v_subject, v_family
  from public.lessons l join public.subjects s on s.id = l.subject_id where l.id = p_lesson;

  if char_length(v_sol) > 2000 then
    raise exception 'solution_too_long' using errcode = '22023';
  end if;
  -- Dạng bài phải thuộc đúng môn của bài học
  if p_form is not null and not exists (
    select 1 from public.exercise_forms f where f.id = p_form and f.subject_family = v_family and f.status = 'active'
  ) then
    raise exception 'form_wrong_subject' using errcode = '22023';
  end if;
  -- YCCĐ phải thuộc đúng môn, đúng lớp của bài; nếu bài đã gắn YCCĐ thì chỉ được chọn trong số đó
  if p_outcome is not null then
    if not exists (
      select 1 from public.learning_outcomes o join public.curriculum_topics t on t.id = o.topic_id
      where o.id = p_outcome and t.subject_id = v_subject
    ) then
      raise exception 'outcome_wrong_subject' using errcode = '22023';
    end if;
    if exists (select 1 from public.lesson_outcomes where lesson_id = p_lesson)
       and not exists (select 1 from public.lesson_outcomes where lesson_id = p_lesson and outcome_id = p_outcome) then
      raise exception 'outcome_not_in_lesson' using errcode = '22023';
    end if;
  end if;

  if p_type not in ('single_choice', 'true_false', 'fill_blank', 'multiple_choice', 'matching', 'ordering') then
    raise exception 'invalid_type' using errcode = '22023';
  end if;
  if char_length(v_prompt) not between 1 and 1000 then
    raise exception 'invalid_prompt' using errcode = '22023';
  end if;
  if char_length(v_expl) > 1000 then
    raise exception 'explanation_too_long' using errcode = '22023';
  end if;
  if v_skill is not null and v_skill !~ '^[a-z0-9_]{2,60}$' then
    raise exception 'invalid_skill_code' using errcode = '22023',
      hint = 'Mã kỹ năng chỉ gồm chữ thường không dấu, số và dấu gạch dưới, ví dụ cong_10.';
  end if;
  if p_difficulty is null or p_difficulty not between 1 and 3 then
    raise exception 'invalid_difficulty' using errcode = '22023';
  end if;
  if jsonb_typeof(v_options) <> 'array' or jsonb_array_length(v_options) > 8 then
    raise exception 'invalid_options' using errcode = '22023';
  end if;
  if not public.answer_key_is_valid(p_type, p_answer_key) then
    raise exception 'invalid_answer_key' using errcode = '22023';
  end if;

  select coalesce(array_agg(btrim(x)), '{}') into v_opts from jsonb_array_elements_text(v_options) x;
  if exists (select 1 from unnest(v_opts) o where char_length(o) not between 1 and 200) then
    raise exception 'invalid_options' using errcode = '22023';
  end if;
  if (select count(distinct public.normalize_answer(o)) from unnest(v_opts) o) <> coalesce(array_length(v_opts, 1), 0) then
    raise exception 'duplicate_options' using errcode = '22023';
  end if;

  -- Quy ước lựa chọn theo loại câu
  if p_type in ('single_choice', 'multiple_choice') then
    if coalesce(array_length(v_opts, 1), 0) < 2 then
      raise exception 'need_two_options' using errcode = '22023';
    end if;
    if p_type = 'single_choice' and not exists (
      select 1 from unnest(v_opts) o where public.normalize_answer(o) = public.normalize_answer(p_answer_key ->> 'correct')
    ) then
      raise exception 'answer_not_in_options' using errcode = '22023';
    end if;
    if p_type = 'multiple_choice' and exists (
      select 1 from jsonb_array_elements_text(p_answer_key -> 'correct') c
      where not exists (select 1 from unnest(v_opts) o where public.normalize_answer(o) = public.normalize_answer(c))
    ) then
      raise exception 'answer_not_in_options' using errcode = '22023';
    end if;
  elsif p_type in ('true_false', 'fill_blank') then
    v_options := '[]'::jsonb;  -- Đúng/Sai do giao diện tự sinh; điền đáp án không có lựa chọn
  elsif p_type = 'ordering' then
    -- Lựa chọn = các mục cần xếp, lưu theo thứ tự ngẫu nhiên để không lộ đáp án
    select jsonb_agg(x order by random()) into v_options
    from jsonb_array_elements_text(p_answer_key -> 'order') x;
  elsif p_type = 'matching' then
    -- Lựa chọn = các vế phải (thứ tự ngẫu nhiên); vế trái lưu trong prompt.left để hiển thị
    select jsonb_agg(value order by random()) into v_options from jsonb_each_text(p_answer_key -> 'pairs');
    select jsonb_agg(key order by random()) into v_left from jsonb_each_text(p_answer_key -> 'pairs');
  end if;

  v_prompt_json := case when v_left is null then jsonb_build_object('text', v_prompt)
                        else jsonb_build_object('text', v_prompt, 'left', v_left) end;

  if p_question is null then
    select coalesce(max(sort_order), 0) + 1 into v_sort from public.questions where lesson_id = p_lesson;
    insert into public.questions (lesson_id, question_type, prompt, options, skill_code, difficulty, sort_order, status, form_id, outcome_id)
    values (p_lesson, p_type, v_prompt_json, v_options, v_skill, p_difficulty, v_sort, 'draft', p_form, p_outcome)
    returning id into v_id;
    insert into public.question_keys (question_id, answer_key, explanation, solution)
    values (v_id, p_answer_key,
            case when v_expl = '' then '{}'::jsonb else jsonb_build_object('text', v_expl) end,
            case when v_sol = '' then '{}'::jsonb else jsonb_build_object('text', v_sol) end);
  else
    update public.questions
    set question_type = p_type, prompt = v_prompt_json, options = v_options,
        skill_code = v_skill, difficulty = p_difficulty, form_id = p_form, outcome_id = p_outcome
    where id = p_question and lesson_id = p_lesson and status <> 'archived'
    returning id into v_id;
    if v_id is null then
      raise exception 'question_not_found' using errcode = '22023';
    end if;
    insert into public.question_keys (question_id, answer_key, explanation, solution)
    values (v_id, p_answer_key,
            case when v_expl = '' then '{}'::jsonb else jsonb_build_object('text', v_expl) end,
            case when v_sol = '' then '{}'::jsonb else jsonb_build_object('text', v_sol) end)
    on conflict (question_id) do update
      set answer_key = excluded.answer_key, explanation = excluded.explanation, solution = excluded.solution;
  end if;

  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (v_uid, case when p_question is null then 'create_question' else 'update_question' end, 'question', v_id::text);
  return v_id;
end;
$$;

-- submit_quiz_answer: trả thêm lời giải sau khi học sinh trả lời
create or replace function public.submit_quiz_answer(p_attempt uuid, p_question uuid, p_answer jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_att public.quiz_attempts%rowtype;
  v_key public.question_keys%rowtype;
  v_type text;
  v_ok boolean;
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

  select q.question_type into v_type from public.questions q
  where q.id = p_question and q.lesson_id = v_att.lesson_id and q.status = 'published';
  if not found then
    raise exception 'invalid_question' using errcode = '22023';
  end if;

  select * into v_key from public.question_keys where question_id = p_question;
  if not found then
    raise exception 'question_not_ready' using errcode = '22023';
  end if;

  v_ok := public.grade_answer(v_type, p_answer, v_key.answer_key);

  begin
    insert into public.attempt_answers (attempt_id, question_id, given, is_correct)
    values (p_attempt, p_question, p_answer, v_ok);
  exception when unique_violation then
    raise exception 'already_answered' using errcode = '23505';
  end;

  return jsonb_build_object('correct', v_ok, 'explanation', v_key.explanation, 'solution', v_key.solution);
end;
$$;

-- admin_overview: thêm số YCCĐ đã có câu hỏi xuất bản
create or replace function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.has_role('system_admin', null) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'lessons', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
                from (select status::text, count(*) n from public.lessons group by status) s),
    'questions_published', (select count(*) from public.questions where status = 'published'),
    'students', (select count(*) from public.students where status = 'active'),
    'classes', (select count(*) from public.classes where status = 'active'),
    'schools', (select count(*) from public.schools where status = 'active'),
    'attempts_7d', (select count(*) from public.quiz_attempts where started_at > now() - interval '7 days'),
    'attempts_done', (select count(*) from public.quiz_attempts where completed_at is not null),
    'accuracy_7d', (select round(100.0 * count(*) filter (where is_correct) / nullif(count(*), 0), 1)
                    from public.attempt_answers where answered_at > now() - interval '7 days'),
    'outcomes_total', (select count(*) from public.learning_outcomes where status = 'active'),
    'outcomes_covered', (select count(distinct q.outcome_id) from public.questions q
                         join public.learning_outcomes o on o.id = q.outcome_id
                         where q.status = 'published' and o.status = 'active'),
    'coverage', (
      select coalesce(jsonb_agg(jsonb_build_object('code', s.code, 'name', s.name, 'grade', s.grade,
               'published', (select count(*) from public.lessons l where l.subject_id = s.id and l.status = 'published'),
               'total', (select count(*) from public.lessons l where l.subject_id = s.id and l.status <> 'archived'))
             order by s.grade, s.code), '[]'::jsonb)
      from public.subjects s
    )
  );
end;
$$;

revoke all on function public.save_question(uuid, uuid, text, text, jsonb, jsonb, text, text, smallint, uuid, uuid, text) from public, anon;
grant execute on function public.save_question(uuid, uuid, text, text, jsonb, jsonb, text, text, smallint, uuid, uuid, text) to authenticated;
revoke all on function public.set_lesson_outcomes(uuid, uuid[]) from public, anon;
grant execute on function public.set_lesson_outcomes(uuid, uuid[]) to authenticated;
revoke all on function public.curriculum_coverage(text) from public, anon;
grant execute on function public.curriculum_coverage(text) to authenticated;
revoke all on function public.check_lesson_topic() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- D. Dữ liệu lớp 1 (sinh từ src/lib/curriculum/grade1.ts)
-- ---------------------------------------------------------------------------
-- SINH TỰ ĐỘNG từ src/lib/curriculum/grade1.ts — không sửa tay, hãy sửa file nguồn rồi sinh lại.
-- Chạy lại nhiều lần không sao: dòng đã có (trùng code) được giữ nguyên.
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T1.SO', 'Đếm, đọc, viết và so sánh số', 'Số tự nhiên trong phạm vi 10, 20 rồi 100, theo từng giai đoạn.', 1, true from public.subjects where code = 'toan-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.SO.01', 'Đếm, đọc, viết được các số trong phạm vi 10.', 1, 1, true from public.curriculum_topics where code = 'T1.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.SO.02', 'So sánh, xếp thứ tự các số trong phạm vi 10; dùng dấu >, <, =.', 1, 2, true from public.curriculum_topics where code = 'T1.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.SO.03', 'Đếm, đọc, viết được các số trong phạm vi 20.', 2, 3, true from public.curriculum_topics where code = 'T1.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.SO.04', 'Đếm, đọc, viết được các số trong phạm vi 100.', 3, 4, true from public.curriculum_topics where code = 'T1.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.SO.05', 'Nhận biết được chục và đơn vị, số tròn chục.', 3, 5, true from public.curriculum_topics where code = 'T1.SO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.SO.06', 'So sánh, xếp thứ tự các số trong phạm vi 100 (nhóm không quá 4 số).', 3, 6, true from public.curriculum_topics where code = 'T1.SO'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T1.PT', 'Phép cộng, phép trừ và bài toán có lời văn', 'Ý nghĩa phép cộng, trừ; tính nhẩm; giải quyết vấn đề đơn giản.', 2, true from public.subjects where code = 'toan-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.PT.01', 'Nhận biết được ý nghĩa của phép cộng, phép trừ.', 1, 1, true from public.curriculum_topics where code = 'T1.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.PT.02', 'Thực hiện được tính nhẩm phép cộng, phép trừ trong phạm vi 10.', 1, 2, true from public.curriculum_topics where code = 'T1.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.PT.03', 'Nhận biết ý nghĩa thực tế của phép cộng, phép trừ qua tranh ảnh, tình huống thực tế.', 1, 3, true from public.curriculum_topics where code = 'T1.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.PT.04', 'Thực hiện được phép cộng, phép trừ (không nhớ) các số trong phạm vi 100.', 3, 4, true from public.curriculum_topics where code = 'T1.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.PT.05', 'Tính nhẩm được phép cộng, phép trừ các số tròn chục.', 3, 5, true from public.curriculum_topics where code = 'T1.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.PT.06', 'Làm quen với việc thực hiện tính toán có hai dấu phép tính, theo thứ tự từ trái sang phải.', 2, 6, true from public.curriculum_topics where code = 'T1.PT'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.PT.07', 'Viết được phép tính thích hợp với câu trả lời của bài toán có lời văn và tính đúng kết quả.', 2, 7, true from public.curriculum_topics where code = 'T1.PT'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'T1.HH', 'Hình học trực quan, đo lường và vận dụng', 'Vị trí, hình phẳng, hình khối, độ dài, giờ và lịch; vận dụng vào đời sống.', 3, true from public.subjects where code = 'toan-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.01', 'Nhận biết vị trí, định hướng: trên – dưới, phải – trái, trước – sau, ở giữa.', 1, 1, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.02', 'Nhận dạng hình vuông, hình tròn, hình tam giác, hình chữ nhật qua đồ vật thật.', 1, 2, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.03', 'Nhận dạng khối lập phương, khối hộp chữ nhật.', 2, 3, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.04', 'Lắp ghép, xếp được các hình đơn giản.', 2, 4, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.05', 'Nhận biết dài hơn, ngắn hơn; đơn vị xăng-ti-mét; đọc, viết số đo độ dài trong phạm vi 100 cm.', 3, 5, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.06', 'Đo, ước lượng độ dài bằng đơn vị không chính thức (gang tay, bước chân) và bằng thước cm.', 3, 6, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.07', 'Biết một tuần có 7 ngày, tên và thứ tự các ngày trong tuần.', 3, 7, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.08', 'Đọc giờ đúng trên đồng hồ; xem lịch tờ hằng ngày.', 3, 8, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'T1.HH.09', 'Giải quyết vấn đề thực tế đơn giản liên quan đến đo độ dài, xem giờ, xem lịch.', 3, 9, true from public.curriculum_topics where code = 'T1.HH'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V1.AM', 'Âm, chữ, vần và thanh điệu', 'Nhận biết âm, chữ cái, vần, thanh điệu và dấu thanh; quy tắc chính tả cơ bản.', 1, true from public.subjects where code = 'tieng-viet-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.AM.01', 'Nhận biết và đọc đúng các âm, chữ cái.', 1, 1, true from public.curriculum_topics where code = 'V1.AM'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.AM.02', 'Nhận biết thanh điệu và dấu thanh; đặt dấu thanh đúng vị trí.', 1, 2, true from public.curriculum_topics where code = 'V1.AM'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.AM.03', 'Nhận biết và đọc đúng các vần.', 2, 3, true from public.curriculum_topics where code = 'V1.AM'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.AM.04', 'Phân biệt quy tắc chính tả c/k, g/gh, ng/ngh.', 2, 4, true from public.curriculum_topics where code = 'V1.AM'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V1.DOC', 'Ghép tiếng, đọc từ, câu và đoạn ngắn', 'Đọc đúng, đọc trơn và hiểu nội dung đơn giản theo tiến trình học.', 2, true from public.subjects where code = 'tieng-viet-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.DOC.01', 'Ghép âm, vần, thanh thành tiếng; đọc đúng tiếng, từ.', 1, 1, true from public.curriculum_topics where code = 'V1.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.DOC.02', 'Đọc đúng, rõ ràng câu và đoạn văn ngắn (khoảng 40–60 tiếng/phút).', 3, 2, true from public.curriculum_topics where code = 'V1.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.DOC.03', 'Ngắt nghỉ hơi đúng ở dấu phẩy, dấu chấm, chỗ kết thúc dòng thơ.', 3, 3, true from public.curriculum_topics where code = 'V1.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.DOC.04', 'Trả lời câu hỏi đơn giản về chi tiết nổi bật, tường minh trong văn bản.', 2, 4, true from public.curriculum_topics where code = 'V1.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.DOC.05', 'Liên hệ tranh minh hoạ với chi tiết trong văn bản.', 2, 5, true from public.curriculum_topics where code = 'V1.DOC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.DOC.06', 'Nhận biết trình tự sự việc trong văn bản thông tin ngắn; hiểu kí hiệu đơn giản, quen thuộc.', 3, 6, true from public.curriculum_topics where code = 'V1.DOC'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V1.VIET', 'Viết chữ, chính tả, từ ngữ và câu đơn giản', 'Kĩ thuật viết, chính tả, vốn từ và viết câu ngắn.', 3, true from public.subjects where code = 'tieng-viet-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.VIET.01', 'Viết đúng chữ thường, chữ số 0–9; bước đầu viết chữ hoa.', 1, 1, true from public.curriculum_topics where code = 'V1.VIET'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.VIET.02', 'Viết đúng chính tả bài nghe – viết, nhìn – viết khoảng 30–35 chữ.', 3, 2, true from public.curriculum_topics where code = 'V1.VIET'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.VIET.03', 'Viết hoa chữ cái đầu câu, đầu tên riêng.', 3, 3, true from public.curriculum_topics where code = 'V1.VIET'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.VIET.04', 'Mở rộng vốn từ: từ ngữ chỉ sự vật, hoạt động, đặc điểm quen thuộc.', 2, 4, true from public.curriculum_topics where code = 'V1.VIET'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.VIET.05', 'Dùng đúng dấu chấm, dấu chấm hỏi.', 3, 5, true from public.curriculum_topics where code = 'V1.VIET'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.VIET.06', 'Điền phần thông tin còn trống; viết câu trả lời, chú thích cho tranh.', 3, 6, true from public.curriculum_topics where code = 'V1.VIET'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'V1.NN', 'Nghe và nói', 'Nói rõ ràng thành câu, nghe hiểu, giao tiếp lịch sự theo yêu cầu từng giai đoạn.', 4, true from public.subjects where code = 'tieng-viet-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.NN.01', 'Nói rõ ràng, thành câu; biết chào hỏi, cảm ơn, xin lỗi, xin phép phù hợp.', 1, 1, true from public.curriculum_topics where code = 'V1.NN'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.NN.02', 'Nghe hiểu thông báo, hướng dẫn, yêu cầu, nội quy trong lớp học.', 1, 2, true from public.curriculum_topics where code = 'V1.NN'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.NN.03', 'Nghe câu chuyện, trả lời được câu hỏi: ai, cái gì, khi nào, ở đâu.', 2, 3, true from public.curriculum_topics where code = 'V1.NN'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'V1.NN.04', 'Kể lại câu chuyện ngắn dựa vào tranh và câu hỏi gợi ý.', 3, 4, true from public.curriculum_topics where code = 'V1.NN'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A1.HELLO', 'Chào hỏi và làm quen', 'Cụm từ chào hỏi, giới thiệu tên, mệnh lệnh lớp học đơn giản.', 1, true from public.subjects where code = 'tieng-anh-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.HELLO.01', 'Nghe và đáp lại lời chào: Hello, Hi, Goodbye.', 1, 1, true from public.curriculum_topics where code = 'A1.HELLO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.HELLO.02', 'Hiểu và làm theo chỉ dẫn đơn giản trong lớp (Stand up, Sit down…).', 1, 2, true from public.curriculum_topics where code = 'A1.HELLO'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.HELLO.03', 'Nói câu giới thiệu tên: I’m …', 2, 3, false from public.curriculum_topics where code = 'A1.HELLO'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A1.ABC', 'Chữ cái và âm đầu', 'Khoảng 13 chữ cái đầu tiên và âm đầu của từ.', 2, true from public.subjects where code = 'tieng-anh-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.ABC.01', 'Nghe, nhận biết khoảng 13 chữ cái đã học.', 1, 1, true from public.curriculum_topics where code = 'A1.ABC'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.ABC.02', 'Nhận biết âm đầu của từ quen thuộc.', 2, 2, true from public.curriculum_topics where code = 'A1.ABC'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A1.NUM', 'Số đếm 1–10', 'Nghe, nói số đếm trong phạm vi 10.', 3, true from public.subjects where code = 'tieng-anh-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.NUM.01', 'Nghe hiểu các số đếm trong phạm vi 10.', 1, 1, true from public.curriculum_topics where code = 'A1.NUM'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.NUM.02', 'Đếm và nói số lượng đồ vật (1–10).', 2, 2, true from public.curriculum_topics where code = 'A1.NUM'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A1.COLOUR', 'Màu sắc', 'Từ vựng màu sắc cơ bản.', 4, true from public.subjects where code = 'tieng-anh-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.COLOUR.01', 'Nghe, nhận biết và nói tên các màu cơ bản.', 1, 1, true from public.curriculum_topics where code = 'A1.COLOUR'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.COLOUR.02', 'Trả lời câu hỏi What colour is it? ở mức từ.', 2, 2, true from public.curriculum_topics where code = 'A1.COLOUR'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A1.SCHOOL', 'Đồ dùng học tập', 'Đồ vật trong lớp: pen, book, ruler, bag…', 5, true from public.subjects where code = 'tieng-anh-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.SCHOOL.01', 'Nghe, nhận biết và nói tên đồ dùng học tập quen thuộc.', 2, 1, true from public.curriculum_topics where code = 'A1.SCHOOL'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A1.FAMILY', 'Gia đình', 'Thành viên gia đình: mother, father, brother, sister…', 6, true from public.subjects where code = 'tieng-anh-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.FAMILY.01', 'Nghe, nhận biết và nói tên thành viên trong gia đình.', 2, 1, true from public.curriculum_topics where code = 'A1.FAMILY'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.FAMILY.02', 'Giới thiệu thành viên gia đình bằng câu This is my …', 3, 2, false from public.curriculum_topics where code = 'A1.FAMILY'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A1.ANIMAL', 'Con vật', 'Con vật quen thuộc: cat, dog, fish, bird…', 7, true from public.subjects where code = 'tieng-anh-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.ANIMAL.01', 'Nghe, nhận biết và nói tên các con vật quen thuộc.', 3, 1, true from public.curriculum_topics where code = 'A1.ANIMAL'
on conflict (code) do nothing;
insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)
select id, 'A1.EXTRA', 'Chủ đề mở rộng', 'Đồ chơi, quả và đồ ăn, bộ phận cơ thể — chọn theo sách nhà trường dùng.', 8, false from public.subjects where code = 'tieng-anh-1'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.EXTRA.01', 'Nhận biết tên đồ chơi quen thuộc.', 3, 1, false from public.curriculum_topics where code = 'A1.EXTRA'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.EXTRA.02', 'Nhận biết tên quả và đồ ăn quen thuộc.', 3, 2, false from public.curriculum_topics where code = 'A1.EXTRA'
on conflict (code) do nothing;
insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)
select id, 'A1.EXTRA.03', 'Nhận biết tên bộ phận cơ thể.', 3, 3, false from public.curriculum_topics where code = 'A1.EXTRA'
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.DEM', 'Đếm số lượng', 'Đếm đồ vật, chọn số đúng.', 'single_choice', 1)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.DOCVIET', 'Đọc, viết số', 'Viết số theo cách đọc và ngược lại.', 'fill_blank', 2)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.SOSANH', 'So sánh số (>, <, =)', 'Điền hoặc chọn dấu so sánh.', 'single_choice', 3)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.SAPXEP', 'Sắp xếp thứ tự số', 'Xếp từ bé đến lớn hoặc ngược lại.', 'ordering', 4)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.TINH', 'Tính cộng, trừ', 'Tính kết quả phép tính.', 'fill_blank', 5)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.SOTHIEU', 'Tìm số còn thiếu', 'Điền số vào chỗ trống trong phép tính hoặc dãy số.', 'fill_blank', 6)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.LOIVAN', 'Bài toán có lời văn', 'Đọc tình huống, viết phép tính và kết quả.', 'fill_blank', 7)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.HINH', 'Nhận dạng hình', 'Hình phẳng, hình khối, vị trí.', 'single_choice', 8)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.DODAI', 'Đo độ dài', 'Dài hơn/ngắn hơn, đo bằng cm.', 'fill_blank', 9)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.GIOLICH', 'Xem giờ, xem lịch', 'Giờ đúng, ngày trong tuần.', 'single_choice', 10)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('toan', 'TOAN.DUNGSAI', 'Đúng hay sai', 'Nhận định phép tính, so sánh đúng hay sai.', 'true_false', 11)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.AMCHU', 'Nhận biết âm, chữ', 'Chọn âm/chữ đầu của tiếng, từ.', 'single_choice', 1)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.GHEPVAN', 'Ghép âm, vần thành tiếng', 'Điền âm/vần còn thiếu.', 'fill_blank', 2)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.DAUTHANH', 'Chọn dấu thanh', 'Chọn dấu thanh đúng cho tiếng.', 'single_choice', 3)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.CHINHTA', 'Chính tả c/k, g/gh, ng/ngh', 'Điền chữ đúng quy tắc chính tả.', 'fill_blank', 4)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.NOITU', 'Nối từ với tranh, nghĩa', 'Ghép từ với nghĩa hoặc tranh.', 'matching', 5)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.XEPCAU', 'Sắp xếp từ thành câu', 'Xếp các từ thành câu đúng.', 'ordering', 6)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.DOCHIEU', 'Đọc hiểu câu, đoạn ngắn', 'Trả lời câu hỏi về chi tiết tường minh.', 'single_choice', 7)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.DAUCAU', 'Điền dấu câu', 'Dấu chấm, dấu chấm hỏi.', 'single_choice', 8)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-viet', 'TV.TUNGU', 'Tìm từ chỉ sự vật, hoạt động, đặc điểm', 'Chọn các từ cùng nhóm.', 'multiple_choice', 9)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-anh', 'TA.TUVUNG', 'Nhận biết từ vựng', 'Chọn từ đúng với nghĩa hoặc tranh.', 'single_choice', 1)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-anh', 'TA.NOINGHIA', 'Nối từ với nghĩa', 'Ghép từ tiếng Anh với nghĩa tiếng Việt.', 'matching', 2)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-anh', 'TA.CHUCAI', 'Điền chữ cái còn thiếu', 'Hoàn thành từ bằng chữ cái.', 'fill_blank', 3)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-anh', 'TA.SODEM', 'Đếm và chọn số', 'Nghe/đọc số đếm 1–10.', 'single_choice', 4)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-anh', 'TA.NHOMTU', 'Chọn các từ cùng nhóm', 'Chọn tất cả từ thuộc một chủ đề.', 'multiple_choice', 5)
on conflict (code) do nothing;
insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)
values ('tieng-anh', 'TA.MAUCAU', 'Hoàn thành mẫu câu', 'Điền từ vào mẫu câu quen thuộc.', 'fill_blank', 6)
on conflict (code) do nothing;
