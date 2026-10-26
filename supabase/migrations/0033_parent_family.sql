-- EduChain Kids 0033: GÓC PHỤ HUYNH — thông tin gia đình (Bố, Mẹ, người đón khác, địa chỉ) + tổng quan cho dashboard.
-- CHỈ THÊM MỚI, chạy lại an toàn (cần 0026, 0028, 0029, 0031).
--
-- * student_family: địa chỉ nhà của từng em (một dòng / em). Không mở bảng cho client, chỉ đọc/ghi qua hàm.
-- * parent_overview(): một lần gọi trả đủ dữ liệu dashboard phụ huynh: tên con, lớp, trường, giáo viên,
--   link nhóm Zalo lớp, hôm nay đi học thế nào, số ngày đi học / lời khen / nhắc nhở trong tháng,
--   địa chỉ và danh bạ của gia đình.
-- * parent_family_save(p_address, p_people): phụ huynh lưu một lần cả Bố / Mẹ / người đón khác + địa chỉ.
-- * teacher_family_addresses / teacher_address_save: giáo viên thấy & sửa địa chỉ trong Danh bạ phụ huynh.

create table if not exists public.student_family (
  student_id uuid primary key references public.students(id) on delete cascade,
  address text check (address is null or char_length(address) <= 200),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.student_family enable row level security;
revoke all on public.student_family from anon, authenticated;

-- 1) Tổng quan cho phụ huynh (phiên PIN của con)
create or replace function public.parent_overview()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_student uuid := public.my_student_id();
  v_class uuid;
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_month date := date_trunc('month', (now() at time zone 'Asia/Ho_Chi_Minh'))::date;
  r jsonb;
begin
  if v_uid is null or v_student is null then return null; end if;
  select m.class_id into v_class
  from public.class_memberships m join public.classes c on c.id = m.class_id
  where m.student_id = v_student and m.status = 'active' and c.status = 'active'
  order by m.joined_at desc limit 1;

  select jsonb_build_object(
    'child', jsonb_build_object('name', s.display_name, 'grade', s.grade),
    'class', case when v_class is null then null else (
      select jsonb_build_object(
        'name', c.name, 'grade', c.grade, 'school', sc.name,
        'teacher', (select p.display_name from public.class_teachers ct join public.profiles p on p.id = ct.teacher_id
                    where ct.class_id = c.id order by ct.created_at limit 1),
        'zalo_group', (select t.data->>'url' from public.class_tool_state t where t.class_id = c.id and t.tool = 'zalo'))
      from public.classes c join public.schools sc on sc.id = c.school_id where c.id = v_class) end,
    'today', case when v_class is null then null else (
      select jsonb_build_object('day', v_today, 'recorded', d.day is not null or e.student_id is not null,
                                'status', coalesce(e.status, 'present'), 'tags', coalesce(e.tags, '{}'::text[]), 'note', e.note)
      from (select 1) x
      left join public.class_diary_days d on d.class_id = v_class and d.day = v_today
      left join public.class_diary_entries e on e.class_id = v_class and e.day = v_today and e.student_id = v_student) end,
    'month', case when v_class is null then null else (
      select jsonb_build_object(
        'days', count(*),
        'present', count(*) filter (where coalesce(e.status, 'present') = 'present'),
        'praise', coalesce(sum((select count(*) from unnest(e.tags) t where t like '★%')), 0),
        'remind', coalesce(sum((select count(*) from unnest(e.tags) t where t not like '★%')), 0))
      from public.class_diary_days d
      left join public.class_diary_entries e on e.class_id = d.class_id and e.day = d.day and e.student_id = v_student
      where d.class_id = v_class and d.day >= v_month and d.day <= v_today) end,
    'address', (select f.address from public.student_family f where f.student_id = v_student),
    'contacts', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'relation', c.relation, 'phone', c.phone,
                                          'zalo', c.zalo, 'note', c.note, 'mine', c.updated_by = v_uid) order by c.updated_at)
      from public.parent_contacts c where c.student_id = v_student), '[]'::jsonb)
  ) into r
  from public.students s where s.id = v_student;
  return r;
end;
$$;

-- 2) Phụ huynh lưu thông tin gia đình một lần (tối đa 3 người như danh bạ).
--    p_people: [{ "id": uuid|null, "relation": "Bố", "name": "...", "phone": "...", "zalo": "..."|null, "remove": bool }]
--    Bỏ trống một người đã có (remove = true): chỉ xoá được số do chính gia đình nhập; số do cô nhập giữ nguyên.
create or replace function public.parent_family_save(p_address text, p_people jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_student uuid := public.my_student_id();
  v_class uuid;
  p jsonb;
  v_id uuid;
  v_phone text;
  v_zalo text;
  v_kept int := 0;
begin
  if v_uid is null or v_student is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_people is null or jsonb_typeof(p_people) <> 'array' or jsonb_array_length(p_people) > 3 then
    raise exception 'invalid_data' using errcode = '22023';
  end if;
  if char_length(coalesce(p_address, '')) > 200 then raise exception 'invalid_address' using errcode = '22023'; end if;

  -- kiểm tra hết trước khi ghi
  for p in select * from jsonb_array_elements(p_people) loop
    v_id := nullif(p->>'id', '')::uuid;
    if v_id is not null and not exists (select 1 from public.parent_contacts c where c.id = v_id and c.student_id = v_student) then
      raise exception 'not_allowed' using errcode = '42501';
    end if;
    if coalesce((p->>'remove')::boolean, false) then continue; end if;
    v_phone := regexp_replace(coalesce(p->>'phone', ''), '[^0-9+]', '', 'g');
    v_zalo := nullif(regexp_replace(coalesce(p->>'zalo', ''), '[^0-9+]', '', 'g'), '');
    if v_phone !~ '^\+?[0-9]{8,13}$' then raise exception 'invalid_phone:%', coalesce(p->>'relation', '') using errcode = '22023'; end if;
    if v_zalo is not null and v_zalo !~ '^\+?[0-9]{8,13}$' then raise exception 'invalid_zalo:%', coalesce(p->>'relation', '') using errcode = '22023'; end if;
  end loop;

  for p in select * from jsonb_array_elements(p_people) loop
    v_id := nullif(p->>'id', '')::uuid;
    if coalesce((p->>'remove')::boolean, false) then
      if v_id is not null then
        delete from public.parent_contacts c where c.id = v_id and c.student_id = v_student and c.updated_by = v_uid;
      end if;
      continue;
    end if;
    v_phone := regexp_replace(coalesce(p->>'phone', ''), '[^0-9+]', '', 'g');
    v_zalo := nullif(regexp_replace(coalesce(p->>'zalo', ''), '[^0-9+]', '', 'g'), '');
    if v_id is null then
      insert into public.parent_contacts (student_id, name, relation, phone, zalo, updated_by)
      values (v_student, left(trim(coalesce(p->>'name', '')), 80), left(trim(coalesce(p->>'relation', '')), 30), v_phone, v_zalo, v_uid);
    else
      -- giữ updated_by: số do cô nhập vẫn là của cô (phụ huynh sửa được, không xoá được)
      update public.parent_contacts c
         set name = left(trim(coalesce(p->>'name', '')), 80), relation = left(trim(coalesce(p->>'relation', '')), 30),
             phone = v_phone, zalo = v_zalo, updated_at = now()
       where c.id = v_id and c.student_id = v_student;
    end if;
  end loop;

  if (select count(*) from public.parent_contacts c where c.student_id = v_student) > 3 then
    raise exception 'too_many_contacts' using errcode = 'P0003';
  end if;

  insert into public.student_family (student_id, address, updated_by, updated_at)
  values (v_student, nullif(left(trim(coalesce(p_address, '')), 200), ''), v_uid, now())
  on conflict (student_id) do update set address = excluded.address, updated_by = v_uid, updated_at = now();

  select m.class_id into v_class from public.class_memberships m
  where m.student_id = v_student and m.status = 'active' order by m.joined_at desc limit 1;
  insert into public.parent_contact_log (class_id, student_id, actor, action) values (v_class, v_student, v_uid, 'save');
  return public.parent_overview();
end;
$$;

-- 3) Giáo viên: địa chỉ của các em trong lớp
create or replace function public.teacher_family_addresses(p_class uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_object_agg(f.student_id, f.address)
    from public.student_family f
    join public.class_memberships m on m.student_id = f.student_id and m.class_id = p_class and m.status = 'active'
    where f.address is not null), '{}'::jsonb);
end;
$$;

create or replace function public.teacher_address_save(p_class uuid, p_student uuid, p_address text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) or not public.student_in_class(p_class, p_student) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if char_length(coalesce(p_address, '')) > 200 then raise exception 'invalid_address' using errcode = '22023'; end if;
  insert into public.student_family (student_id, address, updated_by, updated_at)
  values (p_student, nullif(trim(coalesce(p_address, '')), ''), auth.uid(), now())
  on conflict (student_id) do update set address = excluded.address, updated_by = auth.uid(), updated_at = now();
  insert into public.parent_contact_log (class_id, student_id, actor, action) values (p_class, p_student, auth.uid(), 'save');
end;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.parent_overview()',
    'public.parent_family_save(text, jsonb)',
    'public.teacher_family_addresses(uuid)',
    'public.teacher_address_save(uuid, uuid, text)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- my_student_id() phải luôn chạy được với authenticated (RLS của lớp/học sinh dùng nó) — xem 0032
grant execute on function public.my_student_id() to authenticated;
