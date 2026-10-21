-- EduChain Kids 0026: SỔ LỚP HẰNG NGÀY — điểm danh, ghi chú nhanh từng em, tin nhắn phụ huynh soạn sẵn, tổng hợp tháng.
-- CHỈ THÊM MỚI, chạy lại an toàn. Chỉ giáo viên dạy lớp (teaches_class) đọc/ghi. Bảng không mở trực tiếp cho trình duyệt;
-- mọi thao tác qua các hàm teacher_diary_* bên dưới.
--  * class_diary_days: ngày đã điểm danh (= một buổi học) và thông báo chung cho cả lớp hôm đó.
--  * class_diary_entries: chỉ lưu em KHÁC mặc định (vắng, có nhãn, có ghi chú, hoặc đã chép tin nhắn). Không có dòng = có mặt.

create table if not exists public.class_diary_days (
  class_id uuid not null references public.classes(id) on delete cascade,
  day date not null,
  announcement text check (announcement is null or char_length(announcement) <= 1500),
  saved_by uuid references auth.users(id) on delete set null,
  saved_at timestamptz not null default now(),
  primary key (class_id, day)
);

create table if not exists public.class_diary_entries (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  day date not null,
  status text not null default 'present' check (status in ('present', 'excused', 'unexcused')),
  tags text[] not null default '{}' check (cardinality(tags) <= 12),
  note text check (note is null or char_length(note) <= 500),
  msg_copied_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (class_id, day, student_id)
);
create index if not exists class_diary_entries_student_idx on public.class_diary_entries (student_id, day);

alter table public.class_diary_days enable row level security;
alter table public.class_diary_entries enable row level security;
revoke all on table public.class_diary_days from anon, authenticated;
revoke all on table public.class_diary_entries from anon, authenticated;
grant select, insert, update, delete on table public.class_diary_days, public.class_diary_entries to service_role;

-- Một ngày: {saved_at, announcement, entries: [{student_id, status, tags, note, copied}]}
create or replace function public.teacher_diary_day(p_class uuid, p_day date)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare v jsonb;
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  select jsonb_build_object(
    'saved_at', (select d.saved_at from public.class_diary_days d where d.class_id = p_class and d.day = p_day),
    'announcement', (select d.announcement from public.class_diary_days d where d.class_id = p_class and d.day = p_day),
    'entries', coalesce((select jsonb_agg(jsonb_build_object('student_id', e.student_id, 'status', e.status, 'tags', to_jsonb(e.tags),
                          'note', e.note, 'copied', e.msg_copied_at is not null))
                         from public.class_diary_entries e where e.class_id = p_class and e.day = p_day), '[]'::jsonb)
  ) into v;
  return v;
end;
$$;

-- Lưu cả ngày: p_entries = [{student_id, status, tags[], note}] chỉ gồm em khác mặc định. Em không có trong danh sách = có mặt.
-- Giữ dấu "đã chép tin nhắn". Trả về thời điểm lưu.
create or replace function public.teacher_diary_save(p_class uuid, p_day date, p_entries jsonb, p_announcement text default null)
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  e jsonb;
  v_student uuid; v_status text; v_tags text[]; v_note text;
  v_ids uuid[] := '{}';
begin
  if v_uid is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_day is null or p_day > (now() at time zone 'Asia/Ho_Chi_Minh')::date + 1 or p_day < date '2020-01-01' then
    raise exception 'invalid_day' using errcode = '22023';
  end if;
  if p_entries is null or jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries) > 200 then
    raise exception 'invalid_entries' using errcode = '22023';
  end if;

  for e in select * from jsonb_array_elements(p_entries) loop
    v_student := (e->>'student_id')::uuid;
    v_status := coalesce(e->>'status', 'present');
    v_tags := coalesce(array(select left(trim(t), 40) from jsonb_array_elements_text(coalesce(e->'tags', '[]'::jsonb)) t where trim(t) <> ''), '{}');
    v_note := nullif(left(trim(coalesce(e->>'note', '')), 500), '');
    if v_status not in ('present', 'excused', 'unexcused') then raise exception 'invalid_status' using errcode = '22023'; end if;
    if not exists (select 1 from public.class_memberships m where m.class_id = p_class and m.student_id = v_student and m.status = 'active') then
      raise exception 'not_in_class' using errcode = '22023';
    end if;
    insert into public.class_diary_entries (class_id, student_id, day, status, tags, note, updated_at)
    values (p_class, v_student, p_day, v_status, v_tags[1:12], v_note, v_now)
    on conflict (class_id, day, student_id) do update
      set status = excluded.status, tags = excluded.tags, note = excluded.note, updated_at = v_now;
    v_ids := v_ids || v_student;
  end loop;

  -- em không còn trong danh sách: về mặc định (xoá dòng; nếu đã chép tin nhắn thì giữ dòng để nhớ)
  delete from public.class_diary_entries x
   where x.class_id = p_class and x.day = p_day and not (x.student_id = any (v_ids)) and x.msg_copied_at is null;
  update public.class_diary_entries x set status = 'present', tags = '{}', note = null, updated_at = v_now
   where x.class_id = p_class and x.day = p_day and not (x.student_id = any (v_ids));

  insert into public.class_diary_days (class_id, day, announcement, saved_by, saved_at)
  values (p_class, p_day, nullif(left(trim(coalesce(p_announcement, '')), 1500), ''), v_uid, v_now)
  on conflict (class_id, day) do update set announcement = excluded.announcement, saved_by = v_uid, saved_at = v_now;
  return v_now;
end;
$$;

-- Đánh dấu đã chép tin nhắn cho một em (để không nhắn trùng)
create or replace function public.teacher_diary_copied(p_class uuid, p_day date, p_student uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if not exists (select 1 from public.class_memberships m where m.class_id = p_class and m.student_id = p_student and m.status = 'active') then
    raise exception 'not_in_class' using errcode = '22023';
  end if;
  insert into public.class_diary_entries (class_id, student_id, day, msg_copied_at) values (p_class, p_student, p_day, now())
  on conflict (class_id, day, student_id) do update set msg_copied_at = now();
end;
$$;

-- Một khoảng ngày (tổng hợp tháng): {days: [{day, announcement}], entries: [{student_id, day, status, tags}]}
create or replace function public.teacher_diary_range(p_class uuid, p_from date, p_to date)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 400 then raise exception 'invalid_range' using errcode = '22023'; end if;
  return jsonb_build_object(
    'days', coalesce((select jsonb_agg(jsonb_build_object('day', d.day, 'announcement', d.announcement) order by d.day)
                      from public.class_diary_days d where d.class_id = p_class and d.day between p_from and p_to), '[]'::jsonb),
    'entries', coalesce((select jsonb_agg(jsonb_build_object('student_id', e.student_id, 'day', e.day, 'status', e.status, 'tags', to_jsonb(e.tags)))
                         from public.class_diary_entries e where e.class_id = p_class and e.day between p_from and p_to), '[]'::jsonb)
  );
end;
$$;

do $$
declare f text;
begin
  foreach f in array array['public.teacher_diary_day(uuid, date)', 'public.teacher_diary_save(uuid, date, jsonb, text)',
                           'public.teacher_diary_copied(uuid, date, uuid)', 'public.teacher_diary_range(uuid, date, date)'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
