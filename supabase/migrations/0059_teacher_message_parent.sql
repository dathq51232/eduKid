-- EduChain Kids 0059: GIÁO VIÊN NHẮN RIÊNG PHỤ HUYNH TỪNG EM (ngay trong app, không cần số điện thoại).
-- Dùng chung bảng parent_messages (0037, 0041): from_teacher = true là tin cô gửi. Phụ huynh xem ở trang Phụ huynh
-- (đăng nhập bằng tài khoản của con); parent_read_at ghi lúc gia đình đã xem để cô biết.
-- CHỈ THÊM MỚI, chạy lại an toàn (cần 0037, 0041 trước).
alter table public.parent_messages add column if not exists from_teacher boolean not null default false;
alter table public.parent_messages add column if not exists parent_read_at timestamptz;

-- Cô gửi tin cho phụ huynh một em. Trả về id tin.
create or replace function public.teacher_message_send(p_class uuid, p_student uuid, p_body text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_body text := left(trim(coalesce(p_body, '')), 1000);
  v_id uuid;
begin
  if v_uid is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if v_body = '' then raise exception 'need_body' using errcode = '22023'; end if;
  if not exists (select 1 from public.class_memberships m where m.class_id = p_class and m.student_id = p_student and m.status = 'active') then
    raise exception 'not_in_class' using errcode = '22023';
  end if;
  -- chống gửi dồn: tối đa 30 tin mỗi ngày cho mỗi em
  if (select count(*) from public.parent_messages m where m.student_id = p_student and m.from_teacher and m.created_at > now() - interval '1 day') >= 30 then
    raise exception 'too_many' using errcode = '22023';
  end if;
  insert into public.parent_messages (class_id, student_id, sender_name, kind, body, status, replied_by, from_teacher)
  values (p_class, p_student, 'Giáo viên', 'other', v_body, 'read', v_uid, true)
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.teacher_message_send(uuid, uuid, text) from public, anon;
grant execute on function public.teacher_message_send(uuid, uuid, text) to authenticated;

-- Hộp thư của lớp (như 0041) + from_teacher, parent_read_at. Tin cô gửi không tính vào "chưa đọc".
create or replace function public.teacher_messages(p_class uuid, p_limit integer default 50)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return jsonb_build_object(
    'unread', (select count(*) from public.parent_messages m where m.class_id = p_class and m.status = 'new' and not m.from_teacher and m.teacher_deleted_at is null),
    'pending_leave', (select count(*) from public.parent_messages m where m.class_id = p_class and m.kind = 'leave' and m.status in ('new', 'read') and m.teacher_deleted_at is null),
    'items', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select m.id, m.student_id, s.display_name as student_name, m.sender_name, m.sender_relation, m.kind, m.leave_from, m.leave_to,
             m.body, m.status, m.reply, m.replied_at, m.created_at, m.from_teacher, m.parent_read_at
      from public.parent_messages m join public.students s on s.id = m.student_id
      where m.class_id = p_class and m.teacher_deleted_at is null
      order by (m.status = 'new') desc, m.created_at desc
      limit least(greatest(coalesce(p_limit, 50), 1), 200)
    ) x), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.teacher_messages(uuid, integer) from public, anon;
grant execute on function public.teacher_messages(uuid, integer) to authenticated;

-- Tin của gia đình (như 0037) + tin cô gửi
create or replace function public.parent_messages_mine(p_limit integer default 20)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb) from (
    select m.id, m.kind, m.sender_name, m.sender_relation, m.leave_from, m.leave_to, m.body, m.status, m.reply, m.replied_at, m.created_at,
           m.from_teacher, m.parent_read_at
    from public.parent_messages m
    where m.student_id = public.my_student_id()
    order by m.created_at desc
    limit least(greatest(coalesce(p_limit, 20), 1), 50)
  ) x;
$$;
revoke all on function public.parent_messages_mine(integer) from public, anon;
grant execute on function public.parent_messages_mine(integer) to authenticated;

-- Gia đình đã xem các tin cô gửi
create or replace function public.parent_messages_seen()
returns void
language sql security definer set search_path = ''
as $$
  update public.parent_messages m set parent_read_at = now()
   where m.student_id = public.my_student_id() and m.from_teacher and m.parent_read_at is null;
$$;
revoke all on function public.parent_messages_seen() from public, anon;
grant execute on function public.parent_messages_seen() to authenticated;

-- Phụ huynh gửi tin (như 0037) — giới hạn 10 tin/ngày chỉ đếm tin của gia đình, không đếm tin cô gửi
create or replace function public.parent_message_send(p_kind text, p_sender_name text, p_sender_relation text, p_body text, p_from date default null, p_to date default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_student uuid := public.my_student_id();
  v_class uuid := public.my_active_class();
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_id uuid;
begin
  if v_student is null then raise exception 'not_student' using errcode = '42501'; end if;
  if v_class is null then raise exception 'no_class' using errcode = '22023'; end if;
  if p_kind not in ('leave', 'question', 'other') then raise exception 'invalid_kind' using errcode = '22023'; end if;
  if nullif(trim(coalesce(p_sender_name, '')), '') is null then raise exception 'need_name' using errcode = '22023'; end if;
  if nullif(trim(coalesce(p_body, '')), '') is null then raise exception 'need_body' using errcode = '22023'; end if;
  if p_kind = 'leave' then
    if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 14 or p_from < v_today - 7 or p_from > v_today + 60 then
      raise exception 'invalid_days' using errcode = '22023';
    end if;
  end if;
  if (select count(*) from public.parent_messages m where m.student_id = v_student and not m.from_teacher and m.created_at > now() - interval '1 day') >= 10 then
    raise exception 'too_many' using errcode = '22023';
  end if;
  insert into public.parent_messages (class_id, student_id, sender_name, sender_relation, kind, leave_from, leave_to, body)
  values (v_class, v_student, left(trim(p_sender_name), 80), nullif(left(trim(coalesce(p_sender_relation, '')), 30), ''), p_kind,
          case when p_kind = 'leave' then p_from end, case when p_kind = 'leave' then p_to end, left(trim(p_body), 1000))
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.parent_message_send(text, text, text, text, date, date) from public, anon;
grant execute on function public.parent_message_send(text, text, text, text, date, date) to authenticated;
