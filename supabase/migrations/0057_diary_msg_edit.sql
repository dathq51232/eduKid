-- EduChain Kids 0057: SỔ LỚP — sửa / xoá / cập nhật tin nhắn phụ huynh soạn sẵn.
-- CHỈ THÊM MỚI, chạy lại an toàn (cần 0026 trước).
--  * msg_text: tin nhắn thầy cô đã sửa tay (null = dùng bản app tự viết từ điểm danh & ghi chú).
--  * msg_hidden: thầy cô đã xoá tin nhắn của em này trong ngày (không hiện, không đếm; khôi phục được).
alter table public.class_diary_entries add column if not exists msg_text text;
alter table public.class_diary_entries add column if not exists msg_hidden boolean not null default false;
do $$ begin
  alter table public.class_diary_entries add constraint class_diary_entries_msg_text_len check (msg_text is null or char_length(msg_text) <= 1500);
exception when duplicate_object then null; end $$;

-- Một ngày: thêm msg_text, hidden vào từng em
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
                          'note', e.note, 'copied', e.msg_copied_at is not null, 'msg_text', e.msg_text, 'hidden', e.msg_hidden))
                         from public.class_diary_entries e where e.class_id = p_class and e.day = p_day), '[]'::jsonb)
  ) into v;
  return v;
end;
$$;

-- Lưu cả ngày (như 0026) nhưng giữ dòng của em có tin nhắn đã sửa / đã xoá
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

  -- em không còn trong danh sách: về mặc định (xoá dòng; nếu đã chép / đã sửa / đã xoá tin nhắn thì giữ dòng để nhớ)
  delete from public.class_diary_entries x
   where x.class_id = p_class and x.day = p_day and not (x.student_id = any (v_ids))
     and x.msg_copied_at is null and x.msg_text is null and not x.msg_hidden;
  update public.class_diary_entries x set status = 'present', tags = '{}', note = null, updated_at = v_now
   where x.class_id = p_class and x.day = p_day and not (x.student_id = any (v_ids));

  insert into public.class_diary_days (class_id, day, announcement, saved_by, saved_at)
  values (p_class, p_day, nullif(left(trim(coalesce(p_announcement, '')), 1500), ''), v_uid, v_now)
  on conflict (class_id, day) do update set announcement = excluded.announcement, saved_by = v_uid, saved_at = v_now;
  return v_now;
end;
$$;

-- Sửa / xoá / khôi phục tin nhắn của một em trong một ngày.
--  p_text: nội dung đã sửa (null hoặc rỗng = trở lại bản app tự viết); p_hidden: true = xoá (ẩn), false = hiện.
--  Khi nội dung đổi, bỏ dấu "đã chép" để thầy cô biết cần gửi lại bản mới.
create or replace function public.teacher_diary_msg(p_class uuid, p_day date, p_student uuid, p_text text, p_hidden boolean default false)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_text text := nullif(left(trim(coalesce(p_text, '')), 1500), '');
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_day is null or p_day > (now() at time zone 'Asia/Ho_Chi_Minh')::date + 1 or p_day < date '2020-01-01' then
    raise exception 'invalid_day' using errcode = '22023';
  end if;
  if not exists (select 1 from public.class_memberships m where m.class_id = p_class and m.student_id = p_student and m.status = 'active') then
    raise exception 'not_in_class' using errcode = '22023';
  end if;
  insert into public.class_diary_entries (class_id, student_id, day, msg_text, msg_hidden, updated_at)
  values (p_class, p_student, p_day, v_text, coalesce(p_hidden, false), now())
  on conflict (class_id, day, student_id) do update
    set msg_text = v_text,
        msg_hidden = coalesce(p_hidden, false),
        msg_copied_at = case when public.class_diary_entries.msg_text is distinct from v_text then null
                             else public.class_diary_entries.msg_copied_at end,
        updated_at = now();
end;
$$;

revoke all on function public.teacher_diary_msg(uuid, date, uuid, text, boolean) from public, anon;
grant execute on function public.teacher_diary_msg(uuid, date, uuid, text, boolean) to authenticated;
