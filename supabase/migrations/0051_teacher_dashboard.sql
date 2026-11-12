-- EduChain Kids 0051: số liệu nhỏ cho trang "Hôm nay" của giáo viên.
-- CHỈ THÊM MỚI, chạy lại an toàn (cần 0028).
--
-- * teacher_contact_gaps(p_class): số em đang học trong lớp CHƯA có số điện thoại phụ huynh nào.
--   Chỉ trả một con số (không lộ số điện thoại) nên KHÔNG ghi nhật ký xem danh bạ — khác teacher_contacts.

create or replace function public.teacher_contact_gaps(p_class uuid)
returns integer
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return (
    select count(*)::int
    from public.class_memberships m
    where m.class_id = p_class and m.status = 'active'
      and not exists (select 1 from public.parent_contacts c where c.student_id = m.student_id));
end;
$$;

revoke all on function public.teacher_contact_gaps(uuid) from public, anon;
grant execute on function public.teacher_contact_gaps(uuid) to authenticated;
