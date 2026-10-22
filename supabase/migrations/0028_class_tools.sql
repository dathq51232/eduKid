-- EduChain Kids 0028: CÔNG CỤ TRÊN LỚP — chia nhóm, sơ đồ chỗ ngồi, thi đua tổ, danh bạ phụ huynh.
-- CHỈ THÊM MỚI, chạy lại an toàn. Chỉ giáo viên dạy lớp (teaches_class) đọc/ghi. Bảng không mở trực tiếp cho trình duyệt;
-- mọi thao tác qua các hàm teacher_* bên dưới.
--  * class_tool_state: cấu hình của từng công cụ theo lớp (nhóm vừa chia + cặp không xếp chung, sơ đồ chỗ ngồi, danh sách tổ).
--  * class_team_points: mỗi lần cộng / trừ điểm thi đua tổ (để xem lại, hoàn tác, tổng kết tuần).
--  * parent_contacts: số điện thoại phụ huynh của từng em (tối đa 3 người / em). DỮ LIỆU CÁ NHÂN:
--    chỉ giáo viên của lớp em đang học xem được; mọi lần xem / sửa / xóa đều ghi vào parent_contact_log.

create table if not exists public.class_tool_state (
  class_id uuid not null references public.classes(id) on delete cascade,
  tool text not null check (tool in ('groups', 'seating', 'teams')),
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (class_id, tool)
);

create table if not exists public.class_team_points (
  id bigint generated always as identity primary key,
  class_id uuid not null references public.classes(id) on delete cascade,
  team smallint not null check (team between 1 and 12),
  delta smallint not null check (delta between -10 and 10 and delta <> 0),
  reason text check (reason is null or char_length(reason) <= 80),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists class_team_points_class_idx on public.class_team_points (class_id, created_at desc);

create table if not exists public.parent_contacts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 80),
  relation text not null default '' check (char_length(relation) <= 30),
  phone text not null check (phone ~ '^\+?[0-9]{8,13}$'),
  note text check (note is null or char_length(note) <= 200),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create index if not exists parent_contacts_student_idx on public.parent_contacts (student_id);

create table if not exists public.parent_contact_log (
  id bigint generated always as identity primary key,
  class_id uuid references public.classes(id) on delete set null,
  student_id uuid,
  actor uuid references auth.users(id) on delete set null,
  action text not null check (action in ('view', 'save', 'delete', 'import')),
  at timestamptz not null default now()
);
create index if not exists parent_contact_log_class_idx on public.parent_contact_log (class_id, at desc);

alter table public.class_tool_state enable row level security;
alter table public.class_team_points enable row level security;
alter table public.parent_contacts enable row level security;
alter table public.parent_contact_log enable row level security;
revoke all on table public.class_tool_state, public.class_team_points, public.parent_contacts, public.parent_contact_log from anon, authenticated;
grant select, insert, update, delete on table public.class_tool_state, public.class_team_points, public.parent_contacts, public.parent_contact_log to service_role;

/* ------------------------------------------------------------------ cấu hình công cụ */
create or replace function public.teacher_tool_get(p_class uuid, p_tool text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return (select s.data from public.class_tool_state s where s.class_id = p_class and s.tool = p_tool);
end;
$$;

create or replace function public.teacher_tool_save(p_class uuid, p_tool text, p_data jsonb)
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare v_now timestamptz := now();
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_tool not in ('groups', 'seating', 'teams') then raise exception 'invalid_tool' using errcode = '22023'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 65536 then
    raise exception 'invalid_data' using errcode = '22023';
  end if;
  insert into public.class_tool_state (class_id, tool, data, updated_by, updated_at)
  values (p_class, p_tool, p_data, auth.uid(), v_now)
  on conflict (class_id, tool) do update set data = excluded.data, updated_by = excluded.updated_by, updated_at = v_now;
  return v_now;
end;
$$;

/* ------------------------------------------------------------------ thi đua tổ */
create or replace function public.teacher_team_point(p_class uuid, p_team integer, p_delta integer, p_reason text default null)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare r public.class_team_points%rowtype;
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_team is null or p_team < 1 or p_team > 12 or p_delta is null or p_delta = 0 or abs(p_delta) > 10 then
    raise exception 'invalid_point' using errcode = '22023';
  end if;
  insert into public.class_team_points (class_id, team, delta, reason, created_by)
  values (p_class, p_team, p_delta, nullif(left(trim(coalesce(p_reason, '')), 80), ''), auth.uid())
  returning * into r;
  return jsonb_build_object('id', r.id, 'team', r.team, 'delta', r.delta, 'reason', r.reason, 'at', r.created_at);
end;
$$;

-- Hoàn tác: xóa lần cộng/trừ có id cho trước (chỉ trong 7 ngày gần đây)
create or replace function public.teacher_team_undo(p_class uuid, p_id bigint)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  delete from public.class_team_points where id = p_id and class_id = p_class and created_at > now() - interval '7 days';
  return found;
end;
$$;

-- Điểm trong khoảng ngày (giờ Việt Nam): [{id, team, delta, reason, at}]
create or replace function public.teacher_team_points(p_class uuid, p_from date, p_to date)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 400 then raise exception 'invalid_range' using errcode = '22023'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', p.id, 'team', p.team, 'delta', p.delta, 'reason', p.reason, 'at', p.created_at) order by p.created_at)
    from public.class_team_points p
    where p.class_id = p_class
      and (p.created_at at time zone 'Asia/Ho_Chi_Minh')::date between p_from and p_to
  ), '[]'::jsonb);
end;
$$;

/* ------------------------------------------------------------------ danh bạ phụ huynh */
-- Em có đang học lớp này không (chỉ lấy số phụ huynh của em trong lớp mình dạy)
create or replace function public.student_in_class(p_class uuid, p_student uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.class_memberships m where m.class_id = p_class and m.student_id = p_student and m.status = 'active');
$$;
revoke all on function public.student_in_class(uuid, uuid) from public, anon, authenticated;

create or replace function public.teacher_contacts(p_class uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v jsonb;
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'student_id', c.student_id, 'name', c.name, 'relation', c.relation,
                                               'phone', c.phone, 'note', c.note, 'updated_at', c.updated_at) order by c.student_id, c.updated_at), '[]'::jsonb)
    into v
    from public.parent_contacts c
    join public.class_memberships m on m.student_id = c.student_id and m.class_id = p_class and m.status = 'active';
  insert into public.parent_contact_log (class_id, actor, action) values (p_class, auth.uid(), 'view');
  return v;
end;
$$;

-- Thêm (p_id null) hoặc sửa một số. Trả về id.
create or replace function public.teacher_contact_save(p_class uuid, p_student uuid, p_id uuid, p_name text, p_relation text, p_phone text, p_note text default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v_id uuid;
begin
  if auth.uid() is null or not public.teaches_class(p_class) or not public.student_in_class(p_class, p_student) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if v_phone !~ '^\+?[0-9]{8,13}$' then raise exception 'invalid_phone' using errcode = '22023'; end if;
  if p_id is null then
    if (select count(*) from public.parent_contacts where student_id = p_student) >= 3 then raise exception 'too_many_contacts' using errcode = '22023'; end if;
    insert into public.parent_contacts (student_id, name, relation, phone, note, updated_by)
    values (p_student, left(trim(coalesce(p_name, '')), 80), left(trim(coalesce(p_relation, '')), 30), v_phone,
            nullif(left(trim(coalesce(p_note, '')), 200), ''), auth.uid())
    returning id into v_id;
  else
    update public.parent_contacts
       set name = left(trim(coalesce(p_name, '')), 80), relation = left(trim(coalesce(p_relation, '')), 30), phone = v_phone,
           note = nullif(left(trim(coalesce(p_note, '')), 200), ''), updated_by = auth.uid(), updated_at = now()
     where id = p_id and student_id = p_student
    returning id into v_id;
    if v_id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  end if;
  insert into public.parent_contact_log (class_id, student_id, actor, action) values (p_class, p_student, auth.uid(), 'save');
  return v_id;
end;
$$;

create or replace function public.teacher_contact_delete(p_class uuid, p_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_student uuid;
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  select student_id into v_student from public.parent_contacts where id = p_id;
  if v_student is null or not public.student_in_class(p_class, v_student) then raise exception 'not_allowed' using errcode = '42501'; end if;
  delete from public.parent_contacts where id = p_id;
  insert into public.parent_contact_log (class_id, student_id, actor, action) values (p_class, v_student, auth.uid(), 'delete');
  return true;
end;
$$;

-- Dán từ Excel: p_rows = [{student_id, name, relation, phone, note}]. Cùng em + cùng số thì cập nhật, khác số thì thêm
-- (tối đa 3 số / em). Bỏ qua dòng sai số hoặc em không thuộc lớp. Trả về {saved, skipped}.
create or replace function public.teacher_contacts_import(p_class uuid, p_rows jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  r jsonb; v_student uuid; v_phone text; v_saved integer := 0; v_skipped integer := 0; v_id uuid;
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 300 then raise exception 'invalid_rows' using errcode = '22023'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    begin
      v_student := (r->>'student_id')::uuid;
    exception when others then v_student := null;
    end;
    v_phone := regexp_replace(coalesce(r->>'phone', ''), '[^0-9+]', '', 'g');
    if v_student is null or not public.student_in_class(p_class, v_student) or v_phone !~ '^\+?[0-9]{8,13}$' then
      v_skipped := v_skipped + 1; continue;
    end if;
    select id into v_id from public.parent_contacts where student_id = v_student and phone = v_phone limit 1;
    if v_id is not null then
      update public.parent_contacts
         set name = coalesce(nullif(left(trim(coalesce(r->>'name', '')), 80), ''), name),
             relation = coalesce(nullif(left(trim(coalesce(r->>'relation', '')), 30), ''), relation),
             note = coalesce(nullif(left(trim(coalesce(r->>'note', '')), 200), ''), note),
             updated_by = auth.uid(), updated_at = now()
       where id = v_id;
      v_saved := v_saved + 1;
    elsif (select count(*) from public.parent_contacts where student_id = v_student) < 3 then
      insert into public.parent_contacts (student_id, name, relation, phone, note, updated_by)
      values (v_student, left(trim(coalesce(r->>'name', '')), 80), left(trim(coalesce(r->>'relation', '')), 30), v_phone,
              nullif(left(trim(coalesce(r->>'note', '')), 200), ''), auth.uid());
      v_saved := v_saved + 1;
    else
      v_skipped := v_skipped + 1;
    end if;
  end loop;
  insert into public.parent_contact_log (class_id, actor, action) values (p_class, auth.uid(), 'import');
  return jsonb_build_object('saved', v_saved, 'skipped', v_skipped);
end;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.teacher_tool_get(uuid, text)', 'public.teacher_tool_save(uuid, text, jsonb)',
    'public.teacher_team_point(uuid, integer, integer, text)', 'public.teacher_team_undo(uuid, bigint)',
    'public.teacher_team_points(uuid, date, date)',
    'public.teacher_contacts(uuid)', 'public.teacher_contact_save(uuid, uuid, uuid, text, text, text, text)',
    'public.teacher_contact_delete(uuid, uuid)', 'public.teacher_contacts_import(uuid, jsonb)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
