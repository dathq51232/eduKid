-- 0025: Quản trị sửa tên giáo viên và tên trường.
-- Tên giáo viên: profiles.display_name. Tên trường: schools.name của trường giáo viên đang thuộc
-- (mỗi giáo viên tự đăng ký có trường riêng; nếu nhiều giáo viên chung một trường thì đổi tên áp dụng cho cả trường).
create or replace function public.admin_update_teacher(p_teacher uuid, p_display_name text, p_school_name text)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := trim(coalesce(p_display_name, ''));
  v_school_name text := trim(coalesce(p_school_name, ''));
  v_school uuid;
  v_shared integer := 0;
begin
  if v_uid is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  select r.school_id into v_school from public.user_roles r where r.user_id = p_teacher and r.role = 'teacher' order by r.created_at limit 1;
  if v_school is null then raise exception 'not_teacher' using errcode = '22023'; end if;
  if char_length(v_name) not between 1 and 100 then raise exception 'invalid_name' using errcode = '22023'; end if;
  if char_length(v_school_name) not between 2 and 180 then raise exception 'invalid_school_name' using errcode = '22023'; end if;

  update public.profiles set display_name = v_name, updated_at = now() where id = p_teacher;
  update public.schools set name = v_school_name where id = v_school and name is distinct from v_school_name;
  select count(distinct r.user_id)::integer into v_shared from public.user_roles r where r.school_id = v_school and r.role = 'teacher';

  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'admin_update_teacher', 'profile', p_teacher::text, left(v_name || ' · ' || v_school_name, 300));
  return v_shared; -- số giáo viên dùng chung trường này (1 = chỉ riêng giáo viên này)
end;
$$;
revoke all on function public.admin_update_teacher(uuid, text, text) from public, anon;
grant execute on function public.admin_update_teacher(uuid, text, text) to authenticated;
