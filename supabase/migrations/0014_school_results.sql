-- EduChain Kids 0014: KẾT QUẢ HỌC TẬP TRÊN TRƯỜNG do giáo viên nhập — điểm kiểm tra định kỳ và khen thưởng/thành tích.
-- CHỈ THÊM MỚI, chạy lại an toàn.
--
-- * school_scores: điểm bài kiểm tra định kỳ (thang 10) theo kỳ (giữa/cuối học kỳ) và môn.
-- * student_awards: khen thưởng, giải thưởng, thành tích của học sinh (cấp lớp/trường/huyện/tỉnh/quốc gia).
-- Chỉ giáo viên dạy lớp (teaches_class) đọc/ghi qua các hàm bên dưới; trình duyệt không chạm bảng trực tiếp.
-- Học sinh và người khác KHÔNG xem được (thông tin gửi nhà trường).

create table if not exists public.school_scores (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  period_key text not null check (period_key ~ '^(gk1|ck1|gk2|ck2)-[0-9]{4}$'),
  subject text not null check (subject in ('tieng-viet', 'toan', 'tieng-anh', 'khoa-hoc', 'lich-su-dia-li', 'tin-hoc-cong-nghe')),
  score numeric(4,2) check (score is null or (score >= 0 and score <= 10)),
  note text not null default '' check (char_length(note) <= 300),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (class_id, student_id, period_key, subject)
);
alter table public.school_scores enable row level security;
revoke all on table public.school_scores from anon, authenticated;
grant select, insert, update, delete on table public.school_scores to service_role;

create table if not exists public.student_awards (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 200),
  scope text not null default 'lop' check (scope in ('lop', 'truong', 'huyen', 'tinh', 'quoc-gia', 'khac')),
  awarded_on date not null default current_date,
  note text not null default '' check (char_length(note) <= 300),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists student_awards_class_idx on public.student_awards (class_id, awarded_on desc);
alter table public.student_awards enable row level security;
revoke all on table public.student_awards from anon, authenticated;
grant select, insert, update, delete on table public.student_awards to service_role;

-- ---------------------------------------------------------------- Điểm kiểm tra
create or replace function public.teacher_get_scores(p_class uuid, p_period text)
returns table (student_id uuid, subject text, score numeric, note text, updated_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query select s.student_id, s.subject, s.score, s.note, s.updated_at
  from public.school_scores s where s.class_id = p_class and s.period_key = p_period;
end;
$$;
revoke all on function public.teacher_get_scores(uuid, text) from public, anon;
grant execute on function public.teacher_get_scores(uuid, text) to authenticated;

-- p_rows: [{student_id, subject, score (số hoặc null = xoá), note}]
create or replace function public.teacher_save_scores(p_class uuid, p_period text, p_rows jsonb)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_n integer; v_d integer;
begin
  if v_uid is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 600 then
    raise exception 'invalid_rows' using errcode = '22023';
  end if;
  -- ô để trống (không điểm, không ghi chú) = xoá
  delete from public.school_scores sc
  using jsonb_array_elements(p_rows) x
  where sc.class_id = p_class and sc.period_key = p_period
    and sc.student_id = (x ->> 'student_id')::uuid and sc.subject = x ->> 'subject'
    and (x -> 'score' is null or jsonb_typeof(x -> 'score') = 'null') and coalesce(x ->> 'note', '') = '';
  get diagnostics v_d = row_count;
  insert into public.school_scores (class_id, student_id, period_key, subject, score, note, updated_by, updated_at)
  select p_class, (x ->> 'student_id')::uuid, p_period, x ->> 'subject',
         case when jsonb_typeof(x -> 'score') = 'number' then round((x ->> 'score')::numeric, 2) end,
         left(coalesce(x ->> 'note', ''), 300), v_uid, now()
  from jsonb_array_elements(p_rows) x
  where exists (select 1 from public.class_memberships cm where cm.class_id = p_class and cm.student_id = (x ->> 'student_id')::uuid)
    and not ((x -> 'score' is null or jsonb_typeof(x -> 'score') = 'null') and coalesce(x ->> 'note', '') = '')
  on conflict (class_id, student_id, period_key, subject) do update
    set score = excluded.score, note = excluded.note, updated_by = excluded.updated_by, updated_at = excluded.updated_at;
  get diagnostics v_n = row_count;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'teacher_save_scores', 'class', p_class::text, p_period);
  return v_n + v_d;
end;
$$;
revoke all on function public.teacher_save_scores(uuid, text, jsonb) from public, anon;
grant execute on function public.teacher_save_scores(uuid, text, jsonb) to authenticated;

-- ---------------------------------------------------------------- Khen thưởng / thành tích
create or replace function public.teacher_list_awards(p_class uuid)
returns table (id uuid, student_id uuid, title text, scope text, awarded_on date, note text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query select a.id, a.student_id, a.title, a.scope, a.awarded_on, a.note
  from public.student_awards a where a.class_id = p_class order by a.awarded_on desc, a.created_at desc;
end;
$$;
revoke all on function public.teacher_list_awards(uuid) from public, anon;
grant execute on function public.teacher_list_awards(uuid) to authenticated;

create or replace function public.teacher_add_award(p_class uuid, p_student uuid, p_title text, p_scope text, p_date date, p_note text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.class_memberships cm where cm.class_id = p_class and cm.student_id = p_student) then
    raise exception 'student_not_in_class' using errcode = '22023';
  end if;
  insert into public.student_awards (class_id, student_id, title, scope, awarded_on, note, created_by)
  values (p_class, p_student, trim(p_title), coalesce(p_scope, 'lop'), coalesce(p_date, current_date), left(coalesce(p_note, ''), 300), v_uid)
  returning id into v_id;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'teacher_add_award', 'student', p_student::text, p_class::text);
  return v_id;
end;
$$;
revoke all on function public.teacher_add_award(uuid, uuid, text, text, date, text) from public, anon;
grant execute on function public.teacher_add_award(uuid, uuid, text, text, date, text) to authenticated;

create or replace function public.teacher_delete_award(p_award uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_class uuid;
begin
  select a.class_id into v_class from public.student_awards a where a.id = p_award;
  if v_uid is null or v_class is null or not public.teaches_class(v_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  delete from public.student_awards where id = p_award;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'teacher_delete_award', 'award', p_award::text, v_class::text);
end;
$$;
revoke all on function public.teacher_delete_award(uuid) from public, anon;
grant execute on function public.teacher_delete_award(uuid) to authenticated;
