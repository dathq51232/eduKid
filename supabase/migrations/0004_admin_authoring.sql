-- EduChain Kids 0004: hàm cho trang quản trị /quan-tri (soạn bài, quản lý trạng thái, tổng quan).
-- Chạy SAU 0001, 0002, 0003.
--
-- Nguyên tắc: trình duyệt không ghi thẳng vào questions/question_keys. Mọi thao tác soạn đi qua các hàm
-- dưới đây để (1) câu hỏi và đáp án luôn được lưu cùng nhau, (2) đáp án được kiểm tra định dạng,
-- (3) bài đã xuất bản không bị sửa ngầm khi học sinh đang làm.

-- Sửa 0003: đáp án thiếu khóa phải trả về false (trước đây trả NULL nên bị bỏ lọt khi kiểm tra).
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
revoke all on function public.answer_key_is_valid(text, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- A. Lưu một câu hỏi (thêm mới hoặc sửa) cùng đáp án
-- ---------------------------------------------------------------------------
create or replace function public.save_question(
  p_lesson uuid,
  p_question uuid,          -- null = thêm mới
  p_type text,
  p_prompt text,
  p_options jsonb,          -- mảng chuỗi; xem quy ước theo loại ở dưới
  p_answer_key jsonb,       -- định dạng như mô tả trong 0003
  p_explanation text,
  p_skill_code text,
  p_difficulty smallint
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
begin
  if v_uid is null or not public.can_edit_lesson(p_lesson) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select status into v_status from public.lessons where id = p_lesson;
  if v_status not in ('draft', 'review') then
    raise exception 'lesson_locked' using errcode = '22023',
      hint = 'Bài đã xuất bản hoặc lưu trữ. Chuyển về nháp trước khi sửa.';
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
    insert into public.questions (lesson_id, question_type, prompt, options, skill_code, difficulty, sort_order, status)
    values (p_lesson, p_type, v_prompt_json, v_options, v_skill, p_difficulty, v_sort, 'draft')
    returning id into v_id;
    insert into public.question_keys (question_id, answer_key, explanation)
    values (v_id, p_answer_key, case when v_expl = '' then '{}'::jsonb else jsonb_build_object('text', v_expl) end);
  else
    update public.questions
    set question_type = p_type, prompt = v_prompt_json, options = v_options,
        skill_code = v_skill, difficulty = p_difficulty
    where id = p_question and lesson_id = p_lesson and status <> 'archived'
    returning id into v_id;
    if v_id is null then
      raise exception 'question_not_found' using errcode = '22023';
    end if;
    insert into public.question_keys (question_id, answer_key, explanation)
    values (v_id, p_answer_key, case when v_expl = '' then '{}'::jsonb else jsonb_build_object('text', v_expl) end)
    on conflict (question_id) do update set answer_key = excluded.answer_key, explanation = excluded.explanation;
  end if;

  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (v_uid, case when p_question is null then 'create_question' else 'update_question' end, 'question', v_id::text);
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- B. Xóa câu hỏi: chưa ai làm thì xóa hẳn, đã có bài làm thì chuyển sang lưu trữ để giữ lịch sử
-- ---------------------------------------------------------------------------
create or replace function public.delete_question(p_question uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_lesson uuid;
  v_status public.lesson_status;
begin
  select q.lesson_id, l.status into v_lesson, v_status
  from public.questions q join public.lessons l on l.id = q.lesson_id where q.id = p_question;
  if v_lesson is null or v_uid is null or not public.can_edit_lesson(v_lesson) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if v_status not in ('draft', 'review') then
    raise exception 'lesson_locked' using errcode = '22023';
  end if;

  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (v_uid, 'delete_question', 'question', p_question::text);

  if exists (select 1 from public.attempt_answers where question_id = p_question) then
    update public.questions set status = 'archived' where id = p_question;
    return 'archived';
  end if;
  delete from public.questions where id = p_question;
  return 'deleted';
end;
$$;

-- Sắp xếp lại thứ tự câu hỏi trong bài theo mảng id truyền vào.
create or replace function public.reorder_questions(p_lesson uuid, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.can_edit_lesson(p_lesson) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if (select status from public.lessons where id = p_lesson) not in ('draft', 'review') then
    raise exception 'lesson_locked' using errcode = '22023';
  end if;
  update public.questions q set sort_order = t.n
  from unnest(p_ids) with ordinality t(id, n)
  where q.id = t.id and q.lesson_id = p_lesson;
end;
$$;

-- ---------------------------------------------------------------------------
-- C. Trạng thái bài học (xuất bản vẫn dùng publish_lesson ở 0003)
--   draft -> review    : người soạn gửi duyệt
--   review -> draft    : người soạn rút lại, hoặc admin trả về
--   published -> draft : admin gỡ xuống để sửa (học sinh không thấy bài nữa)
--   * -> archived      : admin lưu trữ
--   archived -> draft  : admin khôi phục
-- ---------------------------------------------------------------------------
create or replace function public.set_lesson_status(p_lesson uuid, p_status public.lesson_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_lesson public.lessons%rowtype;
  v_admin boolean := public.has_role('system_admin', null);
begin
  select * into v_lesson from public.lessons where id = p_lesson;
  if not found or v_uid is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if p_status = 'published' then
    raise exception 'use_publish_lesson' using errcode = '22023';
  elsif p_status = 'review' then
    if v_lesson.status <> 'draft' or not (v_admin or v_lesson.created_by = v_uid) then
      raise exception 'not_allowed' using errcode = '42501';
    end if;
  elsif p_status = 'draft' then
    if not (v_admin or (v_lesson.created_by = v_uid and v_lesson.status = 'review')) then
      raise exception 'not_allowed' using errcode = '42501';
    end if;
  elsif p_status = 'archived' then
    if not v_admin then
      raise exception 'not_allowed' using errcode = '42501';
    end if;
  end if;

  update public.lessons
  set status = p_status,
      published_at = case when p_status = 'draft' then null else published_at end
  where id = p_lesson;

  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'set_lesson_status', 'lesson', p_lesson::text, v_lesson.status::text || ' -> ' || p_status::text);
end;
$$;

-- Xóa hẳn bài nháp chưa có lượt làm nào (người soạn hoặc admin).
create or replace function public.delete_lesson(p_lesson uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.can_edit_lesson(p_lesson) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if (select status from public.lessons where id = p_lesson) <> 'draft' then
    raise exception 'only_draft' using errcode = '22023';
  end if;
  if exists (select 1 from public.quiz_attempts where lesson_id = p_lesson) then
    raise exception 'lesson_has_attempts' using errcode = '22023', hint = 'Bài đã có học sinh làm, hãy lưu trữ thay vì xóa.';
  end if;
  delete from public.lessons where id = p_lesson;
  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (v_uid, 'delete_lesson', 'lesson', p_lesson::text);
end;
$$;

-- ---------------------------------------------------------------------------
-- D. Số liệu tổng quan cho admin
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- E. Quản lý người dùng và vai trò (chỉ system_admin)
-- ---------------------------------------------------------------------------

-- Danh sách tài khoản kèm email (bảng auth.users không đọc được từ trình duyệt).
create or replace function public.admin_list_users(p_search text default null)
returns table (
  user_id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  roles jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.has_role('system_admin', null) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  return query
  select p.id, u.email::text, p.display_name, p.created_at,
         coalesce((
           select jsonb_agg(jsonb_build_object('role', ur.role, 'school_id', ur.school_id, 'school_name', sc.name) order by ur.role)
           from public.user_roles ur left join public.schools sc on sc.id = ur.school_id
           where ur.user_id = p.id
         ), '[]'::jsonb)
  from public.profiles p
  join auth.users u on u.id = p.id
  where p_search is null or btrim(p_search) = ''
     or u.email ilike '%' || btrim(p_search) || '%'
     or p.display_name ilike '%' || btrim(p_search) || '%'
  order by p.created_at desc
  limit 200;
end;
$$;

create or replace function public.admin_set_role(p_user uuid, p_role public.app_role, p_school uuid, p_grant boolean)
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
  if p_role in ('teacher', 'school_admin') and p_school is null then
    raise exception 'school_required' using errcode = '22023';
  end if;
  if p_role in ('parent', 'system_admin') then
    p_school := null;
  end if;
  -- Không cho admin tự gỡ quyền admin của chính mình (tránh khóa hệ thống).
  if not p_grant and p_role = 'system_admin' and p_user = v_uid then
    raise exception 'cannot_revoke_self' using errcode = '22023';
  end if;

  if p_grant then
    insert into public.user_roles (user_id, role, school_id, granted_by)
    values (p_user, p_role, p_school, v_uid)
    on conflict do nothing;
  else
    delete from public.user_roles
    where user_id = p_user and role = p_role and school_id is not distinct from p_school;
  end if;

  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, case when p_grant then 'grant_role' else 'revoke_role' end, 'user', p_user::text,
          p_role::text || coalesce(' @' || p_school::text, ''));
end;
$$;

revoke all on function public.admin_list_users(text) from public, anon;
revoke all on function public.admin_set_role(uuid, public.app_role, uuid, boolean) from public, anon;
grant execute on function public.admin_list_users(text) to authenticated;
grant execute on function public.admin_set_role(uuid, public.app_role, uuid, boolean) to authenticated;

-- Quyền: chỉ người đã đăng nhập; mỗi hàm tự kiểm tra vai trò.
revoke all on function public.save_question(uuid, uuid, text, text, jsonb, jsonb, text, text, smallint) from public, anon;
revoke all on function public.delete_question(uuid) from public, anon;
revoke all on function public.reorder_questions(uuid, uuid[]) from public, anon;
revoke all on function public.set_lesson_status(uuid, public.lesson_status) from public, anon;
revoke all on function public.delete_lesson(uuid) from public, anon;
revoke all on function public.admin_overview() from public, anon;
grant execute on function public.save_question(uuid, uuid, text, text, jsonb, jsonb, text, text, smallint) to authenticated;
grant execute on function public.delete_question(uuid) to authenticated;
grant execute on function public.reorder_questions(uuid, uuid[]) to authenticated;
grant execute on function public.set_lesson_status(uuid, public.lesson_status) to authenticated;
grant execute on function public.delete_lesson(uuid) to authenticated;
grant execute on function public.admin_overview() to authenticated;

-- Trình duyệt không còn ghi thẳng vào câu hỏi/đáp án: chỉ qua save_question.
drop policy if exists questions_insert_draft on public.questions;
drop policy if exists questions_update_editable on public.questions;
drop policy if exists question_keys_insert_editor on public.question_keys;
drop policy if exists question_keys_update_editor on public.question_keys;
revoke insert, update, delete on public.questions, public.question_keys from anon, authenticated;
