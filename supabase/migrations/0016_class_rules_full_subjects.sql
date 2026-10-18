-- EduChain Kids 0016: quy tắc lớp + đủ các môn học, phẩm chất, năng lực để giáo viên nhập và tự sinh nhận xét.
-- CHỈ THÊM/SỬA, chạy lại an toàn.
--
-- 1) Mỗi giáo viên chỉ phụ trách 1 lớp ĐANG HOẠT ĐỘNG (lớp đã lưu trữ cuối năm không tính, để năm sau tạo lớp mới).
-- 2) Mỗi lớp tối đa 40 học sinh đang học.
-- 3) Điểm/mức đạt trên trường cho ĐỦ các môn của chương trình tiểu học hiện hành (lớp 1–5):
--    Tiếng Việt, Toán, Tiếng Anh, Đạo đức, Tự nhiên và Xã hội (1–3), Khoa học (4–5), Lịch sử và Địa lí (4–5),
--    Tin học và Công nghệ (3–5), Giáo dục thể chất, Âm nhạc, Mĩ thuật, Hoạt động trải nghiệm.
--    Mỗi môn có MỨC ĐẠT (T/H/C); môn có bài kiểm tra định kỳ có thêm ĐIỂM (thang 10).
-- 4) Phẩm chất (5) và năng lực (3 chung + 7 đặc thù) theo mức Tốt / Đạt / Cần cố gắng (T/D/C).
-- 5) Nhận xét lưu được cho mọi môn + phẩm chất + năng lực.

-- ---------------------------------------------------------------- 1) Một giáo viên — một lớp đang hoạt động
create or replace function public.enforce_one_active_class()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_table_name = 'class_teachers' then
    if exists (select 1 from public.classes c where c.id = new.class_id and c.status = 'active')
       and exists (select 1 from public.class_teachers ct join public.classes c on c.id = ct.class_id
                   where ct.teacher_id = new.teacher_id and ct.class_id <> new.class_id and c.status = 'active') then
      raise exception 'one_class_only' using errcode = '54000';
    end if;
  elsif tg_table_name = 'classes' then
    if new.status = 'active' and old.status is distinct from 'active'
       and exists (select 1 from public.class_teachers me join public.class_teachers other on other.teacher_id = me.teacher_id
                   join public.classes c on c.id = other.class_id
                   where me.class_id = new.id and other.class_id <> new.id and c.status = 'active') then
      raise exception 'one_class_only' using errcode = '54000';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_one_active_class() from public, anon, authenticated;
drop trigger if exists class_teachers_one_class on public.class_teachers;
create trigger class_teachers_one_class before insert or update on public.class_teachers
for each row execute function public.enforce_one_active_class();
drop trigger if exists classes_one_class on public.classes;
create trigger classes_one_class before update of status on public.classes
for each row execute function public.enforce_one_active_class();

-- ---------------------------------------------------------------- 2) Tối đa 40 học sinh / lớp
create or replace function public.enforce_class_size()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from 'active') then
    if (select count(*) from public.class_memberships cm
        where cm.class_id = new.class_id and cm.status = 'active' and cm.student_id <> new.student_id) >= 40 then
      raise exception 'class_full' using errcode = '54000';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_class_size() from public, anon, authenticated;
drop trigger if exists class_memberships_size on public.class_memberships;
create trigger class_memberships_size before insert or update of status on public.class_memberships
for each row execute function public.enforce_class_size();

-- ---------------------------------------------------------------- 3) Đủ các môn + mức đạt
alter table public.school_scores drop constraint if exists school_scores_subject_check;
alter table public.school_scores add constraint school_scores_subject_check check (subject in (
  'tieng-viet', 'toan', 'tieng-anh', 'dao-duc', 'tnxh', 'khoa-hoc', 'lich-su-dia-li', 'tin-hoc-cong-nghe',
  'gdtc', 'am-nhac', 'mi-thuat', 'hdtn'));
alter table public.school_scores add column if not exists level text;
alter table public.school_scores drop constraint if exists school_scores_level_check;
alter table public.school_scores add constraint school_scores_level_check check (level is null or level in ('T', 'H', 'C'));

drop function if exists public.teacher_get_scores(uuid, text);
create function public.teacher_get_scores(p_class uuid, p_period text)
returns table (student_id uuid, subject text, score numeric, level text, note text, updated_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query select s.student_id, s.subject, s.score, s.level, s.note, s.updated_at
  from public.school_scores s where s.class_id = p_class and s.period_key = p_period;
end;
$$;
revoke all on function public.teacher_get_scores(uuid, text) from public, anon;
grant execute on function public.teacher_get_scores(uuid, text) to authenticated;

-- p_rows: [{student_id, subject, score (số|null), level ('T'|'H'|'C'|null), note}] — ô trống hoàn toàn = xoá
create or replace function public.teacher_save_scores(p_class uuid, p_period text, p_rows jsonb)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_n integer; v_d integer;
begin
  if v_uid is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 1200 then
    raise exception 'invalid_rows' using errcode = '22023';
  end if;
  delete from public.school_scores sc
  using jsonb_array_elements(p_rows) x
  where sc.class_id = p_class and sc.period_key = p_period
    and sc.student_id = (x ->> 'student_id')::uuid and sc.subject = x ->> 'subject'
    and coalesce(jsonb_typeof(x -> 'score'), 'null') = 'null' and coalesce(x ->> 'level', '') = '' and coalesce(x ->> 'note', '') = '';
  get diagnostics v_d = row_count;
  insert into public.school_scores (class_id, student_id, period_key, subject, score, level, note, updated_by, updated_at)
  select p_class, (x ->> 'student_id')::uuid, p_period, x ->> 'subject',
         case when jsonb_typeof(x -> 'score') = 'number' then round((x ->> 'score')::numeric, 2) end,
         nullif(x ->> 'level', ''), left(coalesce(x ->> 'note', ''), 300), v_uid, now()
  from jsonb_array_elements(p_rows) x
  where exists (select 1 from public.class_memberships cm where cm.class_id = p_class and cm.student_id = (x ->> 'student_id')::uuid)
    and not (coalesce(jsonb_typeof(x -> 'score'), 'null') = 'null' and coalesce(x ->> 'level', '') = '' and coalesce(x ->> 'note', '') = '')
  on conflict (class_id, student_id, period_key, subject) do update
    set score = excluded.score, level = excluded.level, note = excluded.note, updated_by = excluded.updated_by, updated_at = excluded.updated_at;
  get diagnostics v_n = row_count;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'teacher_save_scores', 'class', p_class::text, p_period);
  return v_n + v_d;
end;
$$;
revoke all on function public.teacher_save_scores(uuid, text, jsonb) from public, anon;
grant execute on function public.teacher_save_scores(uuid, text, jsonb) to authenticated;

-- ---------------------------------------------------------------- 4) Phẩm chất, năng lực
create table if not exists public.student_qualities (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  period_key text not null check (period_key ~ '^(gk1|ck1|gk2|ck2)-[0-9]{4}$'),
  item text not null check (item in (
    'pc-yeu-nuoc', 'pc-nhan-ai', 'pc-cham-chi', 'pc-trung-thuc', 'pc-trach-nhiem',
    'nl-tu-chu', 'nl-giao-tiep', 'nl-gqvd',
    'nl-ngon-ngu', 'nl-tinh-toan', 'nl-khoa-hoc', 'nl-cong-nghe', 'nl-tin-hoc', 'nl-tham-mi', 'nl-the-chat')),
  level text not null check (level in ('T', 'D', 'C')),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (class_id, student_id, period_key, item)
);
alter table public.student_qualities enable row level security;
revoke all on table public.student_qualities from anon, authenticated;
grant select, insert, update, delete on table public.student_qualities to service_role;

create or replace function public.teacher_get_qualities(p_class uuid, p_period text)
returns table (student_id uuid, item text, level text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query select q.student_id, q.item, q.level from public.student_qualities q where q.class_id = p_class and q.period_key = p_period;
end;
$$;
revoke all on function public.teacher_get_qualities(uuid, text) from public, anon;
grant execute on function public.teacher_get_qualities(uuid, text) to authenticated;

-- p_rows: [{student_id, item, level ('T'|'D'|'C'|null = xoá)}]
create or replace function public.teacher_save_qualities(p_class uuid, p_period text, p_rows jsonb)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_n integer; v_d integer;
begin
  if v_uid is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 1200 then
    raise exception 'invalid_rows' using errcode = '22023';
  end if;
  delete from public.student_qualities q
  using jsonb_array_elements(p_rows) x
  where q.class_id = p_class and q.period_key = p_period and q.student_id = (x ->> 'student_id')::uuid
    and q.item = x ->> 'item' and coalesce(x ->> 'level', '') = '';
  get diagnostics v_d = row_count;
  insert into public.student_qualities (class_id, student_id, period_key, item, level, updated_by, updated_at)
  select p_class, (x ->> 'student_id')::uuid, p_period, x ->> 'item', x ->> 'level', v_uid, now()
  from jsonb_array_elements(p_rows) x
  where coalesce(x ->> 'level', '') <> ''
    and exists (select 1 from public.class_memberships cm where cm.class_id = p_class and cm.student_id = (x ->> 'student_id')::uuid)
  on conflict (class_id, student_id, period_key, item) do update
    set level = excluded.level, updated_by = excluded.updated_by, updated_at = excluded.updated_at;
  get diagnostics v_n = row_count;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'teacher_save_qualities', 'class', p_class::text, p_period);
  return v_n + v_d;
end;
$$;
revoke all on function public.teacher_save_qualities(uuid, text, jsonb) from public, anon;
grant execute on function public.teacher_save_qualities(uuid, text, jsonb) to authenticated;

-- ---------------------------------------------------------------- 5) Nhận xét cho mọi môn + phẩm chất + năng lực
alter table public.student_comments drop constraint if exists student_comments_subject_check;
alter table public.student_comments add constraint student_comments_subject_check check (subject in (
  'chung', 'pham-chat', 'nang-luc',
  'tieng-viet', 'toan', 'tieng-anh', 'dao-duc', 'tnxh', 'khoa-hoc', 'lich-su-dia-li', 'tin-hoc-cong-nghe',
  'gdtc', 'am-nhac', 'mi-thuat', 'hdtn'));
alter table public.student_comments drop constraint if exists student_comments_level_check;
alter table public.student_comments add constraint student_comments_level_check check (level is null or level in ('T', 'H', 'C', 'D'));
