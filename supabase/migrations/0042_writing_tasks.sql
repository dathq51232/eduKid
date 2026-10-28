-- Bài luyện chữ cô giao (trang vở A4): câu thơ, ca dao... cô tự nhập, kèm cài đặt trang vở để in lại.
-- Bài đang mở hiện cho học sinh lớp đó luyện trên màn hình (mục "Cô giao" ở trang Luyện chữ).
-- Chỉ đọc / ghi qua các hàm bên dưới; bảng không mở trực tiếp cho người dùng.

create table if not exists public.writing_tasks (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null default '' check (char_length(title) <= 120),
  lines text[] not null check (cardinality(lines) between 1 and 60),
  sheet jsonb not null default '{}'::jsonb check (pg_column_size(sheet) <= 16000),
  active boolean not null default true,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists writing_tasks_class_idx on public.writing_tasks (class_id, created_at desc);
alter table public.writing_tasks enable row level security;
revoke all on public.writing_tasks from anon, authenticated;

-- Danh sách bài của lớp: giáo viên thấy tất cả; học sinh / phụ huynh của lớp chỉ thấy bài đang mở.
create or replace function public.writing_task_list(p_class uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_teacher boolean := public.teaches_class(p_class);
begin
  if auth.uid() is null or not (v_teacher or public.gallery_can_view(p_class)) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'lines', to_jsonb(t.lines), 'sheet', case when v_teacher then t.sheet else '{}'::jsonb end,
                                        'active', t.active, 'created_at', t.created_at, 'updated_at', t.updated_at) order by t.created_at desc)
    from public.writing_tasks t
    where t.class_id = p_class and (v_teacher or t.active)
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.writing_task_list(uuid) from public, anon;
grant execute on function public.writing_task_list(uuid) to authenticated;

-- Lưu bài (thêm mới khi p_id null, sửa khi có p_id). Trả về id.
create or replace function public.writing_task_save(p_class uuid, p_id uuid, p_title text, p_lines text[], p_sheet jsonb, p_active boolean)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_lines text[];
  v_id uuid;
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  select coalesce(array_agg(left(btrim(x), 200) order by o), '{}') into v_lines
  from unnest(coalesce(p_lines, '{}')) with ordinality as u(x, o)
  where btrim(x) <> '';
  if cardinality(v_lines) = 0 then raise exception 'empty' using errcode = '22023'; end if;
  if cardinality(v_lines) > 60 then raise exception 'too_many' using errcode = '22023'; end if;
  if p_id is null then
    insert into public.writing_tasks (class_id, title, lines, sheet, active)
    values (p_class, left(coalesce(btrim(p_title), ''), 120), v_lines, coalesce(p_sheet, '{}'::jsonb), coalesce(p_active, true))
    returning id into v_id;
  else
    update public.writing_tasks
       set title = left(coalesce(btrim(p_title), ''), 120), lines = v_lines, sheet = coalesce(p_sheet, '{}'::jsonb),
           active = coalesce(p_active, active), updated_at = now()
     where id = p_id and class_id = p_class
    returning id into v_id;
    if v_id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  end if;
  return v_id;
end;
$$;
revoke all on function public.writing_task_save(uuid, uuid, text, text[], jsonb, boolean) from public, anon;
grant execute on function public.writing_task_save(uuid, uuid, text, text[], jsonb, boolean) to authenticated;

-- Mở / đóng bài cho học sinh luyện trên màn hình
create or replace function public.writing_task_set_active(p_id uuid, p_active boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_class uuid;
begin
  select class_id into v_class from public.writing_tasks where id = p_id;
  if v_class is null or auth.uid() is null or not public.teaches_class(v_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  update public.writing_tasks set active = coalesce(p_active, false), updated_at = now() where id = p_id;
end;
$$;
revoke all on function public.writing_task_set_active(uuid, boolean) from public, anon;
grant execute on function public.writing_task_set_active(uuid, boolean) to authenticated;

create or replace function public.writing_task_delete(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_class uuid;
begin
  select class_id into v_class from public.writing_tasks where id = p_id;
  if v_class is null or auth.uid() is null or not public.teaches_class(v_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  delete from public.writing_tasks where id = p_id;
end;
$$;
revoke all on function public.writing_task_delete(uuid) from public, anon;
grant execute on function public.writing_task_delete(uuid) to authenticated;
