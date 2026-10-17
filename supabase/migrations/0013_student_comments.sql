-- EduChain Kids 0013: NHẬN XÉT học sinh (tuần / học kỳ / cả năm) cho giáo viên, gợi ý tự động từ dữ liệu học trong app.
-- CHỈ THÊM MỚI, chạy lại an toàn.
--
-- * class_period_stats(p_class, p_from, p_to): số liệu học tập từng em, từng môn trong khoảng thời gian — chỉ giáo viên dạy lớp.
-- * student_comments: nhận xét giáo viên đã duyệt/sửa (mức T/H/C + lời nhận xét) theo kỳ và môn.
--   Chỉ giáo viên dạy lớp đọc/ghi qua hàm; học sinh/khách không đọc được (nhận xét gửi nhà trường, không hiển thị cho bạn khác).

create or replace function public.class_period_stats(p_class uuid, p_from timestamptz, p_to timestamptz)
returns table (student_id uuid, display_name text, subject_code text,
               lessons integer, attempts integer, avg_percent integer, perfect integer, active_days integer,
               weak_lessons text[], strong_lessons text[])
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to <= p_from or p_to - p_from > interval '400 days' then
    raise exception 'invalid_range' using errcode = '22023';
  end if;
  return query
  with members as (
    select s.id, s.display_name from public.class_memberships cm
    join public.students s on s.id = cm.student_id
    where cm.class_id = p_class and cm.status = 'active'
  ), r as (
    select r.student_id as sid, coalesce(r.subject_code, 'khac') as subj, r.lesson_code,
           coalesce(r.lesson_title, r.lesson_code) as title, r.score, r.total, r.created_at
    from public.lesson_results r
    where r.student_id in (select id from members) and r.created_at >= p_from and r.created_at < p_to
  ), best as (
    -- lần làm tốt nhất của mỗi bài trong kỳ
    select r.sid, r.subj, r.lesson_code, max(r.title) as title, max(r.score * 100.0 / r.total) as pct, count(*) as tries
    from r group by r.sid, r.subj, r.lesson_code
  )
  select m.id, m.display_name, b.subj,
         count(*)::integer,
         sum(b.tries)::integer,
         round(avg(b.pct))::integer,
         count(*) filter (where b.pct >= 100)::integer,
         (select count(distinct (x.created_at at time zone 'Asia/Ho_Chi_Minh')::date)::integer from r x where x.sid = m.id and x.subj = b.subj),
         (array_agg(b.title order by b.pct asc) filter (where b.pct < 50))[1:3],
         (array_agg(b.title order by b.pct desc) filter (where b.pct >= 90))[1:3]
  from members m
  join best b on b.sid = m.id
  group by m.id, m.display_name, b.subj
  order by m.display_name, b.subj;
end;
$$;
revoke all on function public.class_period_stats(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.class_period_stats(uuid, timestamptz, timestamptz) to authenticated;

create table if not exists public.student_comments (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  period_key text not null check (period_key ~ '^[a-z0-9:_-]{3,60}$'),
  subject text not null check (subject in ('chung', 'toan', 'tieng-viet', 'tieng-anh')),
  level text check (level is null or level in ('T', 'H', 'C')),
  comment text not null default '' check (char_length(comment) <= 1000),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (class_id, student_id, period_key, subject)
);
alter table public.student_comments enable row level security;
revoke all on table public.student_comments from anon, authenticated;
grant select, insert, update, delete on table public.student_comments to service_role;

-- Đọc nhận xét đã lưu của một kỳ
create or replace function public.teacher_get_comments(p_class uuid, p_period text)
returns table (student_id uuid, subject text, level text, comment text, updated_at timestamptz)
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
  select c.student_id, c.subject, c.level, c.comment, c.updated_at
  from public.student_comments c where c.class_id = p_class and c.period_key = p_period;
end;
$$;
revoke all on function public.teacher_get_comments(uuid, text) from public, anon;
grant execute on function public.teacher_get_comments(uuid, text) to authenticated;

-- Lưu (ghi đè) nhận xét của nhiều em một lần. p_rows: [{student_id, subject, level, comment}]
create or replace function public.teacher_save_comments(p_class uuid, p_period text, p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_n integer;
begin
  if v_uid is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 400 then
    raise exception 'invalid_rows' using errcode = '22023';
  end if;
  insert into public.student_comments (class_id, student_id, period_key, subject, level, comment, updated_by, updated_at)
  select p_class, (x ->> 'student_id')::uuid, p_period, x ->> 'subject', nullif(x ->> 'level', ''), left(coalesce(x ->> 'comment', ''), 1000), v_uid, now()
  from jsonb_array_elements(p_rows) x
  -- chỉ học sinh đang thuộc lớp này
  where exists (select 1 from public.class_memberships cm where cm.class_id = p_class and cm.student_id = (x ->> 'student_id')::uuid)
  on conflict (class_id, student_id, period_key, subject) do update
    set level = excluded.level, comment = excluded.comment, updated_by = excluded.updated_by, updated_at = excluded.updated_at;
  get diagnostics v_n = row_count;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'teacher_save_comments', 'class', p_class::text, p_period);
  return v_n;
end;
$$;
revoke all on function public.teacher_save_comments(uuid, text, jsonb) from public, anon;
grant execute on function public.teacher_save_comments(uuid, text, jsonb) to authenticated;
