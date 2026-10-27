-- 0037 · Phụ huynh nhắn cô giáo: xin phép nghỉ, hỏi han, nhắn khác. Tin nhắn hiện trên trang "Hôm nay" và mục
-- "Tin nhắn phụ huynh" của giáo viên lớp, kèm tên người gửi và tên học sinh. Cô trả lời / đồng ý xin phép ngay trên web;
-- đồng ý xin phép nghỉ thì ghi luôn "Vắng có phép" vào Sổ lớp những ngày đó.
-- Phụ huynh đăng nhập bằng tài khoản của con (mã lớp + PIN) nên người gửi được xác định qua my_student_id().
-- Bảng không mở trực tiếp cho trình duyệt: mọi thao tác qua các hàm bên dưới. CHỈ THÊM MỚI, chạy lại an toàn.

create table if not exists public.parent_messages (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  sender_name text not null check (char_length(sender_name) between 1 and 80),
  sender_relation text check (sender_relation is null or char_length(sender_relation) <= 30),
  kind text not null check (kind in ('leave', 'question', 'other')),
  leave_from date,
  leave_to date,
  body text not null check (char_length(body) between 1 and 1000),
  status text not null default 'new' check (status in ('new', 'read', 'approved', 'declined', 'answered')),
  reply text check (reply is null or char_length(reply) <= 1000),
  replied_at timestamptz,
  replied_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint parent_messages_leave check (
    (kind <> 'leave' and leave_from is null and leave_to is null)
    or (kind = 'leave' and leave_from is not null and leave_to is not null and leave_to >= leave_from and leave_to - leave_from <= 14)
  )
);
create index if not exists parent_messages_class_idx on public.parent_messages (class_id, created_at desc);
create index if not exists parent_messages_student_idx on public.parent_messages (student_id, created_at desc);

alter table public.parent_messages enable row level security;
revoke all on table public.parent_messages from anon, authenticated;
grant select, insert, update, delete on table public.parent_messages to service_role;

-- Phụ huynh gửi tin (phiên đăng nhập của con)
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
  -- chống gửi dồn: tối đa 10 tin mỗi ngày cho mỗi em
  if (select count(*) from public.parent_messages m where m.student_id = v_student and m.created_at > now() - interval '1 day') >= 10 then
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

-- Các tin gia đình đã gửi (kèm lời trả lời của cô)
create or replace function public.parent_messages_mine(p_limit integer default 20)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb) from (
    select m.id, m.kind, m.sender_name, m.sender_relation, m.leave_from, m.leave_to, m.body, m.status, m.reply, m.replied_at, m.created_at
    from public.parent_messages m
    where m.student_id = public.my_student_id()
    order by m.created_at desc
    limit least(greatest(coalesce(p_limit, 20), 1), 50)
  ) x;
$$;
revoke all on function public.parent_messages_mine(integer) from public, anon;
grant execute on function public.parent_messages_mine(integer) to authenticated;

-- Hộp thư của giáo viên lớp: {unread, items: [...]} — tên học sinh lấy từ hồ sơ lớp
create or replace function public.teacher_messages(p_class uuid, p_limit integer default 50)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return jsonb_build_object(
    'unread', (select count(*) from public.parent_messages m where m.class_id = p_class and m.status = 'new'),
    'pending_leave', (select count(*) from public.parent_messages m where m.class_id = p_class and m.kind = 'leave' and m.status in ('new', 'read')),
    'items', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select m.id, m.student_id, s.display_name as student_name, m.sender_name, m.sender_relation, m.kind, m.leave_from, m.leave_to,
             m.body, m.status, m.reply, m.replied_at, m.created_at
      from public.parent_messages m join public.students s on s.id = m.student_id
      where m.class_id = p_class
      order by (m.status = 'new') desc, m.created_at desc
      limit least(greatest(coalesce(p_limit, 50), 1), 200)
    ) x), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.teacher_messages(uuid, integer) from public, anon;
grant execute on function public.teacher_messages(uuid, integer) to authenticated;

-- Cô xử lý tin: 'read' (đã xem), 'answered' (trả lời), 'approved' / 'declined' (xin phép nghỉ).
-- p_diary = true khi đồng ý xin phép: ghi "Vắng có phép" vào Sổ lớp các ngày xin nghỉ (giữ nhãn/ghi chú đã có).
create or replace function public.teacher_message_update(p_id uuid, p_status text, p_reply text default null, p_diary boolean default false)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  m public.parent_messages%rowtype;
  v_uid uuid := auth.uid();
  d date;
  v_days integer := 0;
begin
  select * into m from public.parent_messages where id = p_id for update;
  if not found then raise exception 'not_found' using errcode = '22023'; end if;
  if v_uid is null or not public.teaches_class(m.class_id) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_status not in ('read', 'answered', 'approved', 'declined') then raise exception 'invalid_status' using errcode = '22023'; end if;
  if p_status in ('approved', 'declined') and m.kind <> 'leave' then raise exception 'not_leave' using errcode = '22023'; end if;

  update public.parent_messages set
    status = case when p_status = 'read' and status <> 'new' then status else p_status end,
    reply = coalesce(nullif(left(trim(coalesce(p_reply, '')), 1000), ''), reply),
    replied_at = case when nullif(trim(coalesce(p_reply, '')), '') is not null or p_status in ('approved', 'declined') then now() else replied_at end,
    replied_by = case when p_status <> 'read' then v_uid else replied_by end
  where id = p_id;

  if p_status = 'approved' and p_diary and exists (select 1 from public.class_memberships cm where cm.class_id = m.class_id and cm.student_id = m.student_id and cm.status = 'active') then
    for d in select generate_series(m.leave_from, m.leave_to, interval '1 day')::date loop
      if extract(isodow from d) <= 5 then -- bỏ thứ Bảy, Chủ nhật
        insert into public.class_diary_entries (class_id, student_id, day, status, note, updated_at)
        values (m.class_id, m.student_id, d, 'excused', left('Phụ huynh xin phép: ' || m.body, 500), now())
        on conflict (class_id, day, student_id) do update set status = 'excused',
          note = coalesce(public.class_diary_entries.note, excluded.note), updated_at = now();
        v_days := v_days + 1;
      end if;
    end loop;
  end if;
  return jsonb_build_object('ok', true, 'diary_days', v_days);
end;
$$;
revoke all on function public.teacher_message_update(uuid, text, text, boolean) from public, anon;
grant execute on function public.teacher_message_update(uuid, text, text, boolean) to authenticated;
