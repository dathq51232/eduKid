-- EduChain Kids 0003: thống nhất loại câu hỏi, chấm điểm theo loại, báo cáo cho giáo viên/phụ huynh,
-- nhận xét của giáo viên. Chạy SAU 0001 và 0002.

-- ---------------------------------------------------------------------------
-- A. Một bộ tên loại câu hỏi dùng chung cho DB, giao diện và file CSV
-- ---------------------------------------------------------------------------
--   single_choice   chọn 1 đáp án          answer_key: {"correct": "7"}
--   true_false      đúng / sai             answer_key: {"correct": "Đúng"}   (hoặc "Sai")
--   fill_blank      điền đáp án            answer_key: {"accepted": ["9", "chín"]}
--   multiple_choice chọn nhiều đáp án      answer_key: {"correct": ["a", "c"]}
--   matching        ghép cặp               answer_key: {"pairs": {"con mèo": "cat", "con chó": "dog"}}
--   ordering        sắp xếp / kéo thả      answer_key: {"order": ["1", "3", "5", "7"]}
-- Học sinh gửi: chuỗi (single_choice, true_false, fill_blank), mảng (multiple_choice, ordering),
-- object (matching).

alter table public.questions drop constraint if exists questions_question_type_check;
alter table public.questions add constraint questions_question_type_check
  check (question_type in ('single_choice', 'true_false', 'fill_blank', 'multiple_choice', 'matching', 'ordering'));

-- Cột khớp với file CSV soạn câu hỏi (docs/soan-cau-hoi.md).
alter table public.questions
  add column if not exists difficulty smallint not null default 1 check (difficulty between 1 and 3);
alter table public.lessons
  add column if not exists semester smallint check (semester is null or semester in (1, 2));
grant update (difficulty) on public.questions to authenticated;
grant update (semester) on public.lessons to authenticated;

-- Chuẩn hóa câu trả lời: bỏ khoảng trắng thừa, không phân biệt hoa thường, cùng dạng Unicode NFC
-- (gõ tiếng Việt bằng Unikey/Telex có thể ra 2 dạng mã khác nhau).
create or replace function public.normalize_answer(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(regexp_replace(btrim(normalize(coalesce(p, ''), NFC)), '\s+', ' ', 'g'));
$$;

-- Kiểm tra answer_key có đúng định dạng của loại câu hỏi không.
create or replace function public.answer_key_is_valid(p_type text, p_key jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(case p_type
    when 'single_choice'   then jsonb_typeof(p_key -> 'correct') = 'string'
    when 'true_false'      then p_key ->> 'correct' in ('Đúng', 'Sai')
    when 'fill_blank'      then jsonb_typeof(p_key -> 'accepted') = 'array' and jsonb_array_length(p_key -> 'accepted') > 0
    when 'multiple_choice' then jsonb_typeof(p_key -> 'correct') = 'array' and jsonb_array_length(p_key -> 'correct') > 0
    when 'matching'        then jsonb_typeof(p_key -> 'pairs') = 'object' and p_key -> 'pairs' <> '{}'::jsonb
    when 'ordering'        then jsonb_typeof(p_key -> 'order') = 'array' and jsonb_array_length(p_key -> 'order') > 1
    else false
  end, false);
$$;

-- Chấm một câu theo loại. Không hợp lệ thì trả false, không báo lỗi.
create or replace function public.grade_answer(p_type text, p_given jsonb, p_key jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_given text[];
  v_expected text[];
begin
  if p_given is null or p_key is null then
    return false;
  end if;

  if p_type in ('single_choice', 'true_false') then
    return jsonb_typeof(p_given) = 'string'
       and public.normalize_answer(p_given #>> '{}') = public.normalize_answer(p_key ->> 'correct');

  elsif p_type = 'fill_blank' then
    return jsonb_typeof(p_given) = 'string' and exists (
      select 1 from jsonb_array_elements_text(p_key -> 'accepted') a
      where public.normalize_answer(a) = public.normalize_answer(p_given #>> '{}')
    );

  elsif p_type = 'multiple_choice' then
    if jsonb_typeof(p_given) <> 'array' then return false; end if;
    select coalesce(array_agg(distinct public.normalize_answer(x) order by public.normalize_answer(x)), '{}')
      into v_given from jsonb_array_elements_text(p_given) x;
    select coalesce(array_agg(distinct public.normalize_answer(x) order by public.normalize_answer(x)), '{}')
      into v_expected from jsonb_array_elements_text(p_key -> 'correct') x;
    return v_given = v_expected;

  elsif p_type = 'ordering' then
    if jsonb_typeof(p_given) <> 'array' then return false; end if;
    select coalesce(array_agg(public.normalize_answer(x) order by n), '{}')
      into v_given from jsonb_array_elements_text(p_given) with ordinality t(x, n);
    select coalesce(array_agg(public.normalize_answer(x) order by n), '{}')
      into v_expected from jsonb_array_elements_text(p_key -> 'order') with ordinality t(x, n);
    return v_given = v_expected;

  elsif p_type = 'matching' then
    if jsonb_typeof(p_given) <> 'object' then return false; end if;
    return (select count(*) from jsonb_object_keys(p_given)) = (select count(*) from jsonb_object_keys(p_key -> 'pairs'))
       and not exists (
         select 1 from jsonb_each_text(p_key -> 'pairs') k
         where public.normalize_answer(p_given ->> k.key) is distinct from public.normalize_answer(k.value)
       );
  end if;

  return false;
end;
$$;

revoke all on function public.normalize_answer(text) from public, anon, authenticated;
revoke all on function public.answer_key_is_valid(text, jsonb) from public, anon, authenticated;
revoke all on function public.grade_answer(text, jsonb, jsonb) from public, anon, authenticated;

-- Không xuất bản bài nếu có câu mà đáp án sai định dạng.
create or replace function public.publish_lesson(p_lesson uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.has_role('system_admin', null) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.lessons where id = p_lesson and status in ('draft', 'review')) then
    raise exception 'invalid_lesson' using errcode = '22023';
  end if;
  if not exists (select 1 from public.questions q where q.lesson_id = p_lesson and q.status <> 'archived') then
    raise exception 'no_questions' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.questions q
    left join public.question_keys k on k.question_id = q.id
    where q.lesson_id = p_lesson and q.status <> 'archived'
      and (k.question_id is null or not public.answer_key_is_valid(q.question_type, k.answer_key))
  ) then
    raise exception 'missing_or_invalid_answer_key' using errcode = '22023';
  end if;

  update public.lessons
  set status = 'published', reviewed_by = v_uid, published_at = now()
  where id = p_lesson;
  update public.questions set status = 'published'
  where lesson_id = p_lesson and status <> 'archived';

  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (v_uid, 'publish_lesson', 'lesson', p_lesson::text);
end;
$$;

-- Chấm từng câu ở server theo loại câu hỏi. Trả {"correct": bool, "explanation": {...}}; không trả answer_key.
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

  return jsonb_build_object('correct', v_ok, 'explanation', v_key.explanation);
end;
$$;

revoke all on function public.submit_quiz_answer(uuid, uuid, jsonb) from public, anon;
grant execute on function public.submit_quiz_answer(uuid, uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- B. Báo cáo: giáo viên xem theo lớp, phụ huynh/giáo viên xem kỹ năng của từng em
-- ---------------------------------------------------------------------------

-- Ai được xem kết quả học của một học sinh: phụ huynh đã xác minh, giáo viên dạy lớp của em, system_admin.
create or replace function public.can_view_student(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_parent_of(target_student)
    or exists (
      select 1 from public.class_memberships cm
      where cm.student_id = target_student and cm.status = 'active' and public.teaches_class(cm.class_id)
    )
    or public.has_role('system_admin', null);
$$;
revoke all on function public.can_view_student(uuid) from public, anon;
grant execute on function public.can_view_student(uuid) to authenticated;

-- Tiến độ của cả lớp: mỗi dòng = 1 học sinh x 1 bài đã làm (chỉ tính lượt đã nộp).
create or replace function public.get_class_progress(p_class uuid)
returns table (
  student_id uuid,
  student_name text,
  subject_name text,
  lesson_id uuid,
  lesson_title text,
  attempts integer,
  best_score integer,
  total integer,
  last_completed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  return query
  select s.id, s.display_name, sub.name, l.id, l.title,
         count(a.id)::integer,
         max(a.score)::integer,
         max(a.total)::integer,
         max(a.completed_at)
  from public.class_memberships cm
  join public.students s on s.id = cm.student_id
  join public.quiz_attempts a on a.student_id = s.id and a.completed_at is not null
  join public.lessons l on l.id = a.lesson_id
  join public.subjects sub on sub.id = l.subject_id
  where cm.class_id = p_class and cm.status = 'active' and s.status = 'active'
  group by s.id, s.display_name, sub.name, l.id, l.title
  order by s.display_name, sub.name, l.title;
end;
$$;
revoke all on function public.get_class_progress(uuid) from public, anon;
grant execute on function public.get_class_progress(uuid) to authenticated;

-- Kỹ năng của một em theo skill_code: dùng để gợi ý lộ trình và giáo viên nhận xét.
create or replace function public.get_student_skill_report(p_student uuid)
returns table (
  skill_code text,
  answered integer,
  correct integer,
  accuracy numeric,
  last_answered_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.can_view_student(p_student) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  return query
  select coalesce(q.skill_code, 'chua_phan_loai'),
         count(*)::integer,
         count(*) filter (where aa.is_correct)::integer,
         round(100.0 * count(*) filter (where aa.is_correct) / count(*), 1),
         max(aa.answered_at)
  from public.quiz_attempts a
  join public.attempt_answers aa on aa.attempt_id = a.id
  join public.questions q on q.id = aa.question_id
  where a.student_id = p_student
  group by coalesce(q.skill_code, 'chua_phan_loai')
  order by 4 asc, 2 desc;
end;
$$;
revoke all on function public.get_student_skill_report(uuid) from public, anon;
grant execute on function public.get_student_skill_report(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- C. Nhận xét của giáo viên cho từng học sinh
-- ---------------------------------------------------------------------------

create table public.teacher_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  visible_to_parent boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index teacher_notes_student_idx on public.teacher_notes (student_id, created_at desc);
create index teacher_notes_class_idx on public.teacher_notes (class_id);

alter table public.teacher_notes enable row level security;
revoke all on public.teacher_notes from anon;

-- Giáo viên của lớp xem mọi nhận xét trong lớp; phụ huynh chỉ xem nhận xét được đánh dấu cho phụ huynh.
create policy teacher_notes_select on public.teacher_notes for select to authenticated
using (
  public.teaches_class(class_id)
  or (visible_to_parent and public.is_parent_of(student_id))
);
-- Chỉ giáo viên dạy lớp, và học sinh phải đang ở lớp đó.
create policy teacher_notes_insert on public.teacher_notes for insert to authenticated
with check (
  author_id = (select auth.uid())
  and public.teaches_class(class_id)
  and exists (
    select 1 from public.class_memberships cm
    where cm.class_id = teacher_notes.class_id and cm.student_id = teacher_notes.student_id and cm.status = 'active'
  )
);
create policy teacher_notes_update_author on public.teacher_notes for update to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));
create policy teacher_notes_delete_author on public.teacher_notes for delete to authenticated
using (author_id = (select auth.uid()));

revoke update on public.teacher_notes from authenticated;
grant update (body, visible_to_parent) on public.teacher_notes to authenticated;

create trigger teacher_notes_set_updated_at before update on public.teacher_notes
for each row execute function public.set_updated_at();
