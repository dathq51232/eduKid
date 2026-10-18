-- EduChain Kids 0017: GIAO BÀI cho học sinh (bài luyện tập có hạn nộp, đề làm trực tiếp trên app).
-- CHỈ THÊM MỚI, chạy lại an toàn. Không bảng nào cho đọc/ghi thẳng: mọi thao tác qua hàm có kiểm tra quyền.
--  * kind = 'lesson': giao một bài luyện tập của app (lesson_code, mức). "Đã làm" = có kết quả bài đó trong
--    lesson_results sau lúc giao (máy chủ đã chấm lại khi lưu, xem /api/tien-do).
--  * kind = 'exam'  : giao một đề (bản chụp câu hỏi + đáp án + điểm từng câu). Học sinh chỉ nhận câu hỏi KHÔNG có
--    đáp án; bài nộp do máy chủ chấm (service_role) rồi ghi vào assignment_submissions, mỗi em nộp một lần.
--  * Giao cho cả lớp (student_ids = null) hoặc một nhóm em trong lớp.

create table if not exists public.class_assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  kind text not null check (kind in ('lesson', 'exam')),
  title text not null check (char_length(title) between 2 and 200),
  subject text check (subject is null or subject in ('toan', 'tieng-viet', 'tieng-anh')),
  lesson_code text check (lesson_code is null or char_length(lesson_code) between 1 and 120),
  muc smallint check (muc is null or muc between 1 and 3),
  questions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) <= 40 and pg_column_size(questions) < 300000),
  minutes smallint check (minutes is null or minutes between 5 and 120),
  student_ids uuid[] check (student_ids is null or cardinality(student_ids) between 1 and 60),
  due_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint class_assignments_shape check (
    (kind = 'lesson' and lesson_code is not null and jsonb_array_length(questions) = 0)
    or (kind = 'exam' and jsonb_array_length(questions) between 1 and 40))
);
create index if not exists class_assignments_class_idx on public.class_assignments (class_id, created_at desc);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.class_assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  score numeric(6,2) not null check (score >= 0),
  max_score numeric(6,2) not null check (max_score > 0),
  correct smallint not null check (correct >= 0),
  total smallint not null check (total between 1 and 40),
  answers jsonb not null default '[]'::jsonb check (jsonb_typeof(answers) = 'array' and pg_column_size(answers) < 100000),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  created_at timestamptz not null default now(),
  constraint assignment_submissions_one unique (assignment_id, student_id),
  constraint assignment_submissions_score check (score <= max_score and correct <= total)
);

alter table public.class_assignments enable row level security;
alter table public.assignment_submissions enable row level security;
revoke all on table public.class_assignments, public.assignment_submissions from anon, authenticated;
grant select, insert, update, delete on table public.class_assignments, public.assignment_submissions to service_role;

-- Em có thuộc đối tượng được giao không (đang học lớp đó, và trong nhóm nếu giao cho nhóm)
create or replace function public.assignment_targets(p_assignment uuid, p_student uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.class_assignments a
    join public.class_memberships cm on cm.class_id = a.class_id and cm.student_id = p_student and cm.status = 'active'
    where a.id = p_assignment and (a.student_ids is null or p_student = any (a.student_ids))
  );
$$;
revoke all on function public.assignment_targets(uuid, uuid) from public, anon, authenticated;
grant execute on function public.assignment_targets(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------------------------- Giáo viên
create or replace function public.teacher_create_assignment(
  p_class uuid, p_kind text, p_title text, p_subject text, p_lesson text, p_muc smallint,
  p_questions jsonb, p_minutes smallint, p_due timestamptz, p_students uuid[])
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_id uuid; v_students uuid[];
begin
  if v_uid is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.classes c where c.id = p_class and c.status = 'active') then
    raise exception 'class_inactive' using errcode = '22023';
  end if;
  if p_due is null or p_due < now() - interval '1 hour' or p_due > now() + interval '180 days' then
    raise exception 'invalid_due' using errcode = '22023';
  end if;
  if (select count(*) from public.class_assignments a where a.class_id = p_class and a.status = 'open') >= 200 then
    raise exception 'too_many_assignments' using errcode = '54000';
  end if;
  -- nhóm em: bỏ trùng, mọi em phải đang học lớp này
  if p_students is not null and cardinality(p_students) > 0 then
    select array_agg(distinct s) into v_students from unnest(p_students) s;
    if exists (select 1 from unnest(v_students) s where not exists (
      select 1 from public.class_memberships cm where cm.class_id = p_class and cm.student_id = s and cm.status = 'active')) then
      raise exception 'student_not_in_class' using errcode = '22023';
    end if;
  end if;
  insert into public.class_assignments (class_id, kind, title, subject, lesson_code, muc, questions, minutes, student_ids, due_at, created_by)
  values (p_class, p_kind, trim(p_title), p_subject, nullif(trim(coalesce(p_lesson, '')), ''), p_muc,
          coalesce(p_questions, '[]'::jsonb), p_minutes, v_students, p_due, v_uid)
  returning id into v_id;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'teacher_create_assignment', 'assignment', v_id::text, p_class::text);
  return v_id;
end;
$$;

-- Danh sách bài đã giao + số em được giao / đã làm
create or replace function public.teacher_list_assignments(p_class uuid)
returns table (id uuid, kind text, title text, subject text, lesson_code text, muc smallint, minutes smallint,
               n_questions integer, student_ids uuid[], due_at timestamptz, status text, created_at timestamptz,
               assigned integer, done integer)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query
  select a.id, a.kind, a.title, a.subject, a.lesson_code, a.muc, a.minutes, jsonb_array_length(a.questions),
         a.student_ids, a.due_at, a.status, a.created_at,
         (select count(*)::integer from public.class_memberships cm
            where cm.class_id = a.class_id and cm.status = 'active' and (a.student_ids is null or cm.student_id = any (a.student_ids))),
         (select count(*)::integer from public.class_memberships cm
            where cm.class_id = a.class_id and cm.status = 'active' and (a.student_ids is null or cm.student_id = any (a.student_ids))
              and case when a.kind = 'exam'
                    then exists (select 1 from public.assignment_submissions s where s.assignment_id = a.id and s.student_id = cm.student_id)
                    else exists (select 1 from public.lesson_results r where r.student_id = cm.student_id
                                   and r.lesson_code = a.lesson_code and r.created_at >= a.created_at) end)
  from public.class_assignments a
  where a.class_id = p_class
  order by a.created_at desc
  limit 300;
end;
$$;

-- Tình hình từng em của một bài giao (bài luyện tập: lần làm tốt nhất; đề: bài nộp, kèm câu trả lời để thống kê)
create or replace function public.teacher_assignment_detail(p_assignment uuid)
returns table (student_id uuid, display_name text, done boolean, attempts integer, score numeric, max_score numeric,
               correct integer, total integer, finished_at timestamptz, answers jsonb)
language plpgsql stable security definer set search_path = ''
as $$
declare a public.class_assignments;
begin
  select * into a from public.class_assignments x where x.id = p_assignment;
  if auth.uid() is null or a.id is null or not public.teaches_class(a.class_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if a.kind = 'exam' then
    return query
    select st.id, st.display_name, sub.id is not null, case when sub.id is null then 0 else 1 end,
           sub.score, sub.max_score, sub.correct::integer, sub.total::integer, sub.created_at, coalesce(sub.answers, '[]'::jsonb)
    from public.class_memberships cm
    join public.students st on st.id = cm.student_id
    left join public.assignment_submissions sub on sub.assignment_id = a.id and sub.student_id = st.id
    where cm.class_id = a.class_id and cm.status = 'active' and (a.student_ids is null or st.id = any (a.student_ids))
    order by st.display_name;
  else
    return query
    select st.id, st.display_name, coalesce(b.n, 0) > 0, coalesce(b.n, 0), b.score::numeric, b.total::numeric, b.score, b.total, b.last_at, '[]'::jsonb
    from public.class_memberships cm
    join public.students st on st.id = cm.student_id
    left join lateral (
      select count(*) over ()::integer as n, r.score::integer as score, r.total::integer as total,
             max(r.created_at) over () as last_at
      from public.lesson_results r
      where r.student_id = st.id and r.lesson_code = a.lesson_code and r.created_at >= a.created_at
      order by r.score * 1.0 / r.total desc, r.created_at desc
      limit 1
    ) b on true
    where cm.class_id = a.class_id and cm.status = 'active' and (a.student_ids is null or st.id = any (a.student_ids))
    order by st.display_name;
  end if;
end;
$$;

-- Câu hỏi + đáp án của đề đã giao (để giáo viên xem thống kê từng câu)
create or replace function public.teacher_assignment_questions(p_assignment uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare v_class uuid; v_q jsonb;
begin
  select a.class_id, a.questions into v_class, v_q from public.class_assignments a where a.id = p_assignment;
  if auth.uid() is null or v_class is null or not public.teaches_class(v_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return v_q;
end;
$$;

-- Đóng / mở lại (đóng: học sinh không nộp đề được nữa, bài vẫn hiện trong danh sách)
create or replace function public.teacher_set_assignment_status(p_assignment uuid, p_open boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_class uuid;
begin
  select a.class_id into v_class from public.class_assignments a where a.id = p_assignment;
  if auth.uid() is null or v_class is null or not public.teaches_class(v_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  update public.class_assignments set status = case when p_open then 'open' else 'closed' end where id = p_assignment;
end;
$$;

create or replace function public.teacher_delete_assignment(p_assignment uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_class uuid;
begin
  select a.class_id into v_class from public.class_assignments a where a.id = p_assignment;
  if auth.uid() is null or v_class is null or not public.teaches_class(v_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  delete from public.class_assignments where id = p_assignment;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (auth.uid(), 'teacher_delete_assignment', 'assignment', p_assignment::text, v_class::text);
end;
$$;

-- ---------------------------------------------------------------------------------------------- Học sinh
-- Bài thầy cô giao cho em (đang mở, hoặc giao trong 60 ngày gần đây)
create or replace function public.student_my_assignments()
returns table (id uuid, kind text, title text, subject text, lesson_code text, muc smallint, minutes smallint,
               n_questions integer, due_at timestamptz, status text, created_at timestamptz, grade smallint,
               done boolean, score numeric, max_score numeric)
language plpgsql stable security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id();
begin
  if v_sid is null then return; end if;
  return query
  select a.id, a.kind, a.title, a.subject, a.lesson_code, a.muc, a.minutes, jsonb_array_length(a.questions),
         a.due_at, a.status, a.created_at, c.grade,
         case when a.kind = 'exam' then sub.id is not null
              else exists (select 1 from public.lesson_results r where r.student_id = v_sid
                             and r.lesson_code = a.lesson_code and r.created_at >= a.created_at) end,
         sub.score, sub.max_score
  from public.class_assignments a
  join public.classes c on c.id = a.class_id
  join public.class_memberships cm on cm.class_id = a.class_id and cm.student_id = v_sid and cm.status = 'active'
  left join public.assignment_submissions sub on sub.assignment_id = a.id and sub.student_id = v_sid
  where (a.student_ids is null or v_sid = any (a.student_ids))
    and (a.status = 'open' or a.created_at > now() - interval '60 days')
  order by (a.status = 'open') desc, a.due_at asc
  limit 50;
end;
$$;

-- Đề để làm: câu hỏi KHÔNG kèm đáp án / lời giải. Đã nộp thì trả thêm kết quả (đúng/sai từng câu).
create or replace function public.student_get_exam(p_assignment uuid)
returns table (id uuid, title text, subject text, minutes smallint, due_at timestamptz, status text,
               questions jsonb, submitted boolean, score numeric, max_score numeric, correct integer, total integer, answers jsonb)
language plpgsql stable security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id();
begin
  if v_sid is null or not public.assignment_targets(p_assignment, v_sid) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query
  select a.id, a.title, a.subject, a.minutes, a.due_at, a.status,
         (select coalesce(jsonb_agg(q - 'answer' - 'explanation' - 'key' order by o), '[]'::jsonb)
            from jsonb_array_elements(a.questions) with ordinality as e(q, o)),
         sub.id is not null, sub.score, sub.max_score, sub.correct::integer, sub.total::integer,
         (select coalesce(jsonb_agg(jsonb_build_object('i', x->'i', 'ok', x->'ok') order by (x->>'i')::int), '[]'::jsonb)
            from jsonb_array_elements(coalesce(sub.answers, '[]'::jsonb)) x)
  from public.class_assignments a
  left join public.assignment_submissions sub on sub.assignment_id = a.id and sub.student_id = v_sid
  where a.id = p_assignment and a.kind = 'exam';
end;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.teacher_create_assignment(uuid, text, text, text, text, smallint, jsonb, smallint, timestamptz, uuid[])',
    'public.teacher_list_assignments(uuid)',
    'public.teacher_assignment_detail(uuid)',
    'public.teacher_assignment_questions(uuid)',
    'public.teacher_set_assignment_status(uuid, boolean)',
    'public.teacher_delete_assignment(uuid)',
    'public.student_my_assignments()',
    'public.student_get_exam(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
