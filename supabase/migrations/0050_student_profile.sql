-- EduChain Kids 0050: HỒ SƠ HỌC SINH — số thứ tự theo sổ của trường, ngày sinh (thêm vào student_family của 0033).
-- CHỈ THÊM MỚI, chạy lại an toàn (cần 0028, 0033).
--
-- * student_family.roll_no / birth_date: STT theo danh sách nhà trường và ngày sinh; địa chỉ dùng lại cột address.
-- * teacher_student_profiles(p_class): {student_id: {roll, birth, address}} cho các em đang học trong lớp.
-- * teacher_profiles_save(p_class, p_rows): lưu nhiều em một lần (dán từ Excel / sửa trong bảng).
--   p_rows = [{student_id, roll, birth ('YYYY-MM-DD' hoặc null), address}]; mọi lần lưu có nhật ký (parent_contact_log).

alter table public.student_family add column if not exists roll_no smallint check (roll_no is null or roll_no between 1 and 99);
alter table public.student_family add column if not exists birth_date date check (birth_date is null or birth_date between date '2005-01-01' and date '2030-12-31');

create or replace function public.teacher_student_profiles(p_class uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_object_agg(f.student_id, jsonb_build_object('roll', f.roll_no, 'birth', f.birth_date, 'address', f.address))
    from public.student_family f
    join public.class_memberships m on m.student_id = f.student_id and m.class_id = p_class and m.status = 'active'), '{}'::jsonb);
end;
$$;

create or replace function public.teacher_profiles_save(p_class uuid, p_rows jsonb)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  r jsonb;
  v_sid uuid;
  v_roll smallint;
  v_birth date;
  v_addr text;
  n integer := 0;
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 60 then raise exception 'invalid_rows' using errcode = '22023'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    v_sid := (r->>'student_id')::uuid;
    if not public.student_in_class(p_class, v_sid) then raise exception 'not_allowed' using errcode = '42501'; end if;
    v_roll := nullif(r->>'roll', '')::smallint;
    v_birth := nullif(r->>'birth', '')::date;
    v_addr := nullif(trim(coalesce(r->>'address', '')), '');
    if char_length(coalesce(v_addr, '')) > 200 then raise exception 'invalid_address' using errcode = '22023'; end if;
    insert into public.student_family (student_id, roll_no, birth_date, address, updated_by, updated_at)
    values (v_sid, v_roll, v_birth, v_addr, auth.uid(), now())
    on conflict (student_id) do update
      set roll_no = excluded.roll_no, birth_date = excluded.birth_date, address = excluded.address, updated_by = auth.uid(), updated_at = now();
    insert into public.parent_contact_log (class_id, student_id, actor, action) values (p_class, v_sid, auth.uid(), 'save');
    n := n + 1;
  end loop;
  return n;
end;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.teacher_student_profiles(uuid)',
    'public.teacher_profiles_save(uuid, jsonb)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
