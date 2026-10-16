-- EduChain Kids 0002: quiz an toàn, tạo hồ sơ con, mã mời lớp.
-- Chạy SAU 0001. Sau 0002 chạy tiếp 0003.
-- Chỉ dùng trên project mới hoặc đã đối chiếu schema. Không đưa dữ liệu trẻ thật vào môi trường phát triển.

-- ---------------------------------------------------------------------------
-- A. Siết quyền của các hàm và cột sẵn có
-- ---------------------------------------------------------------------------

-- Hàm hỗ trợ trong 0001 chỉ thu quyền của PUBLIC; Supabase còn cấp riêng cho anon.
revoke execute on function public.has_role(public.app_role, uuid) from anon;
revoke execute on function public.is_school_member(uuid) from anon;
revoke execute on function public.is_parent_of(uuid) from anon;
revoke execute on function public.teaches_class(uuid) from anon;

-- Mỗi người dùng mới tự có vai trò phụ huynh (quyền thấp: chỉ tạo hồ sơ con của chính mình).
-- Giáo viên, quản trị trường, quản trị hệ thống vẫn chỉ được cấp bởi system_admin.
create unique index if not exists user_roles_global_unique
  on public.user_roles (user_id, role) where school_id is null;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 100), ''), 'Người dùng')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'parent')
  on conflict do nothing;

  return new;
end;
$$;

-- Người dùng chỉ được sửa đúng các cột cho phép (RLS không giới hạn theo cột).
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

revoke update on public.students from anon, authenticated;
grant update (display_name, grade) on public.students to authenticated;

-- Phụ huynh không insert thẳng vào students (không đọc lại được hàng vừa tạo và bỏ qua bước đồng ý).
-- Phụ huynh dùng create_child(); chỉ quản trị trường/hệ thống insert trực tiếp.
drop policy students_insert_guardian_or_school_admin on public.students;
create policy students_insert_school_admin on public.students for insert to authenticated
with check (
  created_by = (select auth.uid()) and (
    (school_id is not null and public.has_role('school_admin', school_id))
    or public.has_role('system_admin', null)
  )
);

create index if not exists class_memberships_student_idx on public.class_memberships (student_id);

-- Phụ huynh xem được lớp mà con mình đang học.
create policy classes_select_parent on public.classes for select to authenticated
using (exists (
  select 1 from public.class_memberships cm
  where cm.class_id = classes.id and public.is_parent_of(cm.student_id)
));

-- ---------------------------------------------------------------------------
-- B. Bài học và câu hỏi: thêm cột, tách đáp án, chặn tự xuất bản
-- ---------------------------------------------------------------------------

alter table public.lessons
  add column if not exists sort_order integer not null default 0,
  add column if not exists book_series text;

alter table public.questions
  add column if not exists skill_code text check (skill_code is null or char_length(skill_code) between 2 and 60);

create table public.question_keys (
  question_id uuid primary key references public.questions(id) on delete cascade,
  answer_key jsonb not null,
  explanation jsonb not null default '{}'::jsonb
);

insert into public.question_keys (question_id, answer_key, explanation)
select id, answer_key, explanation from public.questions;

alter table public.questions drop column answer_key, drop column explanation;

alter table public.question_keys enable row level security;
revoke all on public.question_keys from anon;

-- Người soạn chỉ sửa được bài còn ở trạng thái nháp/chờ duyệt; system_admin sửa mọi bài.
create or replace function public.can_edit_lesson(target_lesson uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lessons l
    where l.id = target_lesson
      and (
        (l.created_by = (select auth.uid()) and l.status in ('draft', 'review'))
        or public.has_role('system_admin', null)
      )
  );
$$;

revoke all on function public.can_edit_lesson(uuid) from public, anon;
grant execute on function public.can_edit_lesson(uuid) to authenticated;

-- Lessons: tạo mới luôn là nháp; trạng thái và người duyệt chỉ đổi qua publish_lesson().
drop policy lessons_insert_teacher_or_admin on public.lessons;
drop policy lessons_update_author_or_admin on public.lessons;
create policy lessons_insert_draft on public.lessons for insert to authenticated
with check (
  created_by = (select auth.uid())
  and status = 'draft' and reviewed_by is null and published_at is null
  and (public.has_role('teacher', null) or public.has_role('system_admin', null))
);
create policy lessons_update_editable on public.lessons for update to authenticated
using (public.can_edit_lesson(id))
with check (public.can_edit_lesson(id));

revoke update on public.lessons from anon, authenticated;
grant update (title, content, sort_order, book_series) on public.lessons to authenticated;

-- Questions: học sinh/phụ huynh chỉ thấy đề và lựa chọn của câu đã xuất bản (không có đáp án).
drop policy questions_select_editor_only on public.questions;
drop policy questions_insert_editor on public.questions;
drop policy questions_update_editor on public.questions;

create policy questions_select_published_or_editor on public.questions for select to authenticated
using (
  (status = 'published' and exists (
    select 1 from public.lessons l where l.id = lesson_id and l.status = 'published'
  ))
  or exists (
    select 1 from public.lessons l
    where l.id = lesson_id
      and (l.created_by = (select auth.uid()) or l.reviewed_by = (select auth.uid())
           or public.has_role('system_admin', null))
  )
);
create policy questions_insert_draft on public.questions for insert to authenticated
with check (status = 'draft' and public.can_edit_lesson(lesson_id));
create policy questions_update_editable on public.questions for update to authenticated
using (public.can_edit_lesson(lesson_id))
with check (public.can_edit_lesson(lesson_id));

revoke update on public.questions from anon, authenticated;
grant update (question_type, prompt, options, sort_order, skill_code) on public.questions to authenticated;

-- Answer keys: chỉ người soạn/quản trị mới đọc và sửa; không bao giờ mở cho học sinh/phụ huynh.
create policy question_keys_select_editor on public.question_keys for select to authenticated
using (exists (
  select 1 from public.questions q join public.lessons l on l.id = q.lesson_id
  where q.id = question_id
    and (l.created_by = (select auth.uid()) or l.reviewed_by = (select auth.uid())
         or public.has_role('system_admin', null))
));
create policy question_keys_insert_editor on public.question_keys for insert to authenticated
with check (exists (
  select 1 from public.questions q where q.id = question_id and public.can_edit_lesson(q.lesson_id)
));
create policy question_keys_update_editor on public.question_keys for update to authenticated
using (exists (select 1 from public.questions q where q.id = question_id and public.can_edit_lesson(q.lesson_id)))
with check (exists (select 1 from public.questions q where q.id = question_id and public.can_edit_lesson(q.lesson_id)));

-- ---------------------------------------------------------------------------
-- C. Làm bài: bảng lưu kết quả (chỉ ghi qua hàm server)
-- ---------------------------------------------------------------------------

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete restrict,
  started_by uuid not null references public.profiles(id) on delete restrict,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score smallint,
  total smallint
);

create table public.attempt_answers (
  id bigint generated always as identity primary key,
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  given jsonb not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  constraint attempt_answers_unique unique (attempt_id, question_id)
);

create index quiz_attempts_student_idx on public.quiz_attempts (student_id, started_at desc);
create index quiz_attempts_lesson_idx on public.quiz_attempts (lesson_id);
create index attempt_answers_attempt_idx on public.attempt_answers (attempt_id);
create index attempt_answers_question_idx on public.attempt_answers (question_id);

alter table public.quiz_attempts enable row level security;
alter table public.attempt_answers enable row level security;
revoke all on public.quiz_attempts, public.attempt_answers from anon;
revoke insert, update, delete on public.quiz_attempts, public.attempt_answers from authenticated;

create policy attempts_select_scope on public.quiz_attempts for select to authenticated
using (
  public.is_parent_of(student_id)
  or exists (
    select 1 from public.class_memberships cm
    where cm.student_id = quiz_attempts.student_id and public.teaches_class(cm.class_id)
  )
  or public.has_role('system_admin', null)
);
create policy answers_select_scope on public.attempt_answers for select to authenticated
using (exists (select 1 from public.quiz_attempts a where a.id = attempt_id));

-- ---------------------------------------------------------------------------
-- D. Mã mời lớp
-- ---------------------------------------------------------------------------

create table public.class_invites (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references public.profiles(id) on delete restrict,
  expires_at timestamptz not null,
  max_uses integer not null default 40 check (max_uses between 1 and 200),
  used_count integer not null default 0,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now()
);
create index class_invites_class_idx on public.class_invites (class_id);

alter table public.class_invites enable row level security;
revoke all on public.class_invites from anon;
revoke insert, update, delete on public.class_invites from authenticated;
create policy class_invites_select_teacher on public.class_invites for select to authenticated
using (public.teaches_class(class_id));

-- ---------------------------------------------------------------------------
-- E. Hàm nghiệp vụ (chạy ở server với quyền cao, tự kiểm tra người gọi)
-- ---------------------------------------------------------------------------

create or replace function public.answers_match(given jsonb, expected jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(given) = 'array' and jsonb_typeof(expected) = 'array' then
      coalesce((select array_agg(x order by x) from jsonb_array_elements_text(given) x), '{}'::text[])
      = coalesce((select array_agg(x order by x) from jsonb_array_elements_text(expected) x), '{}'::text[])
    else given = expected
  end;
$$;

create or replace function public.has_learning_consent(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.consent_records c
    where c.subject_student_id = target_student
      and c.purpose = 'learning_progress'
      and c.status = 'granted'
      and c.withdrawn_at is null
  );
$$;

-- Phụ huynh tạo hồ sơ con + liên kết + ghi nhận đồng ý trong một bước.
-- Khuyến nghị giao diện: chỉ nhập tên gọi/biệt danh, không nhập họ tên đầy đủ.
create or replace function public.create_child(
  p_display_name text, p_grade smallint, p_policy_version text, p_consent boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := trim(coalesce(p_display_name, ''));
  v_student uuid;
begin
  if v_uid is null or not public.has_role('parent', null) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_consent is not true then
    raise exception 'consent_required' using errcode = '22023';
  end if;
  if char_length(v_name) not between 1 and 100 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  if p_grade is null or p_grade not between 1 and 5 then
    raise exception 'invalid_grade' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_policy_version, ''))) = 0 then
    raise exception 'policy_version_required' using errcode = '22023';
  end if;
  if (select count(*) from public.parent_student_links where parent_id = v_uid) >= 6 then
    raise exception 'too_many_children' using errcode = '54000';
  end if;

  insert into public.students (display_name, grade, created_by)
  values (v_name, p_grade, v_uid)
  returning id into v_student;

  insert into public.parent_student_links (parent_id, student_id, status, verified_at)
  values (v_uid, v_student, 'active', now());

  insert into public.consent_records (subject_student_id, guardian_id, purpose, policy_version, status)
  values (v_student, v_uid, 'learning_progress', trim(p_policy_version), 'granted');

  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (v_uid, 'create_child', 'student', v_student::text);

  return v_student;
end;
$$;

create or replace function public.start_quiz_attempt(p_student uuid, p_lesson uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null or not public.is_parent_of(p_student) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.students s where s.id = p_student and s.status = 'active') then
    raise exception 'student_inactive' using errcode = '22023';
  end if;
  if not public.has_learning_consent(p_student) then
    raise exception 'consent_required' using errcode = '22023';
  end if;
  if not exists (select 1 from public.lessons l where l.id = p_lesson and l.status = 'published') then
    raise exception 'lesson_not_available' using errcode = '22023';
  end if;

  insert into public.quiz_attempts (student_id, lesson_id, started_by)
  values (p_student, p_lesson, v_uid)
  returning id into v_id;
  return v_id;
end;
$$;

-- Chấm từng câu ở server. Trả {"correct": bool, "explanation": {...}}; không bao giờ trả answer_key.
create or replace function public.submit_quiz_answer(p_attempt uuid, p_question uuid, p_answer jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_att public.quiz_attempts%rowtype;
  v_key public.question_keys%rowtype;
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
  if not exists (
    select 1 from public.questions q
    where q.id = p_question and q.lesson_id = v_att.lesson_id and q.status = 'published'
  ) then
    raise exception 'invalid_question' using errcode = '22023';
  end if;

  select * into v_key from public.question_keys where question_id = p_question;
  if not found then
    raise exception 'question_not_ready' using errcode = '22023';
  end if;

  v_ok := public.answers_match(p_answer, v_key.answer_key);

  begin
    insert into public.attempt_answers (attempt_id, question_id, given, is_correct)
    values (p_attempt, p_question, p_answer, v_ok);
  exception when unique_violation then
    raise exception 'already_answered' using errcode = '23505';
  end;

  return jsonb_build_object('correct', v_ok, 'explanation', v_key.explanation);
end;
$$;

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
begin
  select * into v_att from public.quiz_attempts where id = p_attempt;
  if not found or auth.uid() is null or not public.is_parent_of(v_att.student_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if v_att.completed_at is not null then
    return jsonb_build_object('score', v_att.score, 'total', v_att.total);
  end if;

  select count(*) into v_total from public.questions q
  where q.lesson_id = v_att.lesson_id and q.status = 'published';
  select count(*) into v_score from public.attempt_answers a
  where a.attempt_id = p_attempt and a.is_correct;

  update public.quiz_attempts
  set completed_at = now(), score = v_score, total = v_total
  where id = p_attempt;

  return jsonb_build_object('score', v_score, 'total', v_total);
end;
$$;

-- Giáo viên (hoặc quản trị trường) tạo mã mời lớp, mặc định hết hạn sau 14 ngày.
create or replace function public.create_class_invite(p_class uuid, p_days integer default 14)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
begin
  if v_uid is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_days is null or p_days not between 1 and 60 then
    raise exception 'invalid_days' using errcode = '22023';
  end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.class_invites (class_id, code, created_by, expires_at)
  values (p_class, v_code, v_uid, now() + make_interval(days => p_days));

  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (v_uid, 'create_class_invite', 'class', p_class::text);

  return v_code;
end;
$$;

-- Phụ huynh nhập mã để xếp con vào lớp. Mã sai trả về null (và được ghi nhận để giới hạn thử sai).
create or replace function public.redeem_class_invite(p_code text, p_student uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.class_invites%rowtype;
  v_class_grade smallint;
  v_student_grade smallint;
  v_rows integer;
begin
  if v_uid is null or not public.is_parent_of(p_student) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if (select count(*) from public.audit_logs
      where actor_id = v_uid and action = 'class_invite_failed'
        and created_at > now() - interval '10 minutes') >= 10 then
    raise exception 'too_many_attempts' using errcode = '54000';
  end if;

  select * into v_inv from public.class_invites
  where code = upper(trim(coalesce(p_code, '')))
    and status = 'active' and expires_at > now() and used_count < max_uses
  for update;

  if not found then
    insert into public.audit_logs (actor_id, action, target_type)
    values (v_uid, 'class_invite_failed', 'class_invite');
    return null;
  end if;

  select grade into v_class_grade from public.classes where id = v_inv.class_id;
  select grade into v_student_grade from public.students where id = p_student;
  if v_class_grade is distinct from v_student_grade then
    raise exception 'grade_mismatch' using errcode = '22023';
  end if;

  insert into public.class_memberships (class_id, student_id)
  values (v_inv.class_id, p_student)
  on conflict do nothing;
  get diagnostics v_rows = row_count;

  if v_rows > 0 then
    update public.class_invites set used_count = used_count + 1 where id = v_inv.id;
    insert into public.audit_logs (actor_id, action, target_type, target_id)
    values (v_uid, 'redeem_class_invite', 'student', p_student::text);
  end if;

  return v_inv.class_id;
end;
$$;

-- Chỉ system_admin xuất bản bài: đây là bước "người thật duyệt" trước khi trẻ nhìn thấy nội dung.
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
    where q.lesson_id = p_lesson and q.status <> 'archived' and k.question_id is null
  ) then
    raise exception 'missing_answer_key' using errcode = '22023';
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

-- Quyền thực thi: chỉ người đã đăng nhập; hàm nội bộ không mở ra API.
revoke all on function public.answers_match(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.has_learning_consent(uuid) from public, anon, authenticated;
revoke all on function public.create_child(text, smallint, text, boolean) from public, anon;
revoke all on function public.start_quiz_attempt(uuid, uuid) from public, anon;
revoke all on function public.submit_quiz_answer(uuid, uuid, jsonb) from public, anon;
revoke all on function public.finish_quiz_attempt(uuid) from public, anon;
revoke all on function public.create_class_invite(uuid, integer) from public, anon;
revoke all on function public.redeem_class_invite(text, uuid) from public, anon;
revoke all on function public.publish_lesson(uuid) from public, anon;
grant execute on function public.create_child(text, smallint, text, boolean) to authenticated;
grant execute on function public.start_quiz_attempt(uuid, uuid) to authenticated;
grant execute on function public.submit_quiz_answer(uuid, uuid, jsonb) to authenticated;
grant execute on function public.finish_quiz_attempt(uuid) to authenticated;
grant execute on function public.create_class_invite(uuid, integer) to authenticated;
grant execute on function public.redeem_class_invite(text, uuid) to authenticated;
grant execute on function public.publish_lesson(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- F. Dữ liệu môn học: Toán, Tiếng Việt, Tiếng Anh, lớp 1-5
-- ---------------------------------------------------------------------------

insert into public.subjects (code, name, grade)
select s.code || '-' || g::text, s.name, g::smallint
from (values ('toan', 'Toán'), ('tieng-viet', 'Tiếng Việt'), ('tieng-anh', 'Tiếng Anh')) as s(code, name),
     generate_series(1, 5) as g
on conflict (code) do nothing;
