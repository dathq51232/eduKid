-- EduChain Kids 0021: KẾ HOẠCH BÀI DẠY của giáo viên (lưu, mở lại, nhân bản sang tiết khác, xuất Word).
-- CHỈ THÊM MỚI, chạy lại an toàn. Giáo án thuộc về giáo viên soạn (owner_id): chỉ người soạn đọc/ghi/xoá,
-- kể cả khi lớp cũ đã lưu trữ — nên dùng lại được giáo án năm trước cho lớp mới.
-- Gắn với một lớp (tuỳ chọn) để lọc theo lớp và hiện ở "Việc hôm nay"; chỉ gắn được lớp mình dạy.
-- Bảng không mở trực tiếp cho trình duyệt; mọi thao tác qua các hàm teacher_*_plan bên dưới.

create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  subject text not null check (subject in ('toan', 'tieng-viet', 'tieng-anh')),
  grade smallint not null check (grade between 1 and 5),
  title text not null check (char_length(title) between 2 and 200),
  teach_date date,
  period smallint check (period between 1 and 10),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 200000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lesson_plans_owner_idx on public.lesson_plans (owner_id, teach_date desc nulls last, updated_at desc);
create index if not exists lesson_plans_class_idx on public.lesson_plans (class_id, teach_date);
alter table public.lesson_plans enable row level security;
revoke all on table public.lesson_plans from anon, authenticated;
grant select, insert, update, delete on table public.lesson_plans to service_role;

-- Danh sách giáo án của chính giáo viên (mọi lớp); p_class khác null thì chỉ lớp đó
create or replace function public.teacher_list_plans(p_class uuid default null)
returns table (id uuid, class_id uuid, class_name text, subject text, grade smallint, title text, teach_date date, period smallint, updated_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not (public.has_role('teacher', null) or public.has_role('school_admin', null) or public.has_role('system_admin', null)) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query
    select p.id, p.class_id, c.name, p.subject, p.grade, p.title, p.teach_date, p.period, p.updated_at
    from public.lesson_plans p left join public.classes c on c.id = p.class_id
    where p.owner_id = auth.uid() and (p_class is null or p.class_id = p_class)
    order by p.teach_date desc nulls last, p.period nulls last, p.updated_at desc
    limit 500;
end;
$$;
revoke all on function public.teacher_list_plans(uuid) from public, anon;
grant execute on function public.teacher_list_plans(uuid) to authenticated;

create or replace function public.teacher_get_plan(p_plan uuid)
returns table (id uuid, class_id uuid, subject text, grade smallint, title text, teach_date date, period smallint, data jsonb, updated_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (select 1 from public.lesson_plans p where p.id = p_plan and p.owner_id = auth.uid()) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query select p.id, p.class_id, p.subject, p.grade, p.title, p.teach_date, p.period, p.data, p.updated_at
  from public.lesson_plans p where p.id = p_plan;
end;
$$;
revoke all on function public.teacher_get_plan(uuid) from public, anon;
grant execute on function public.teacher_get_plan(uuid) to authenticated;

-- Tạo mới (p_plan = null) hoặc cập nhật giáo án của mình. p_class (nếu có) phải là lớp mình dạy.
create or replace function public.teacher_save_plan(p_plan uuid, p_class uuid, p_title text, p_subject text, p_grade smallint, p_date date, p_period smallint, p_data jsonb)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null or not (public.has_role('teacher', null) or public.has_role('school_admin', null) or public.has_role('system_admin', null)) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_class is not null and not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_plan is null then
    if (select count(*) from public.lesson_plans where owner_id = v_uid) >= 2000 then
      raise exception 'too_many_plans' using errcode = '54000';
    end if;
    insert into public.lesson_plans (owner_id, class_id, subject, grade, title, teach_date, period, data)
    values (v_uid, p_class, p_subject, p_grade, trim(p_title), p_date, p_period, p_data) returning id into v_id;
  else
    update public.lesson_plans set class_id = p_class, subject = p_subject, grade = p_grade, title = trim(p_title),
      teach_date = p_date, period = p_period, data = p_data, updated_at = now()
    where id = p_plan and owner_id = v_uid returning id into v_id;
    if v_id is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  end if;
  return v_id;
end;
$$;
revoke all on function public.teacher_save_plan(uuid, uuid, text, text, smallint, date, smallint, jsonb) from public, anon;
grant execute on function public.teacher_save_plan(uuid, uuid, text, text, smallint, date, smallint, jsonb) to authenticated;

create or replace function public.teacher_delete_plan(p_plan uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  delete from public.lesson_plans where id = p_plan and owner_id = auth.uid();
  if not found then raise exception 'not_allowed' using errcode = '42501'; end if;
end;
$$;
revoke all on function public.teacher_delete_plan(uuid) from public, anon;
grant execute on function public.teacher_delete_plan(uuid) to authenticated;
