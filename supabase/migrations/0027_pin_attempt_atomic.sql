-- 0027: chống dò PIN bằng nhiều yêu cầu song song.
-- Trước đây máy chủ đọc số lần sai, thử đăng nhập, rồi mới ghi lại: gửi hàng trăm yêu cầu cùng lúc thì
-- tất cả cùng đọc "0 lần sai" và đều được thử. Nay mỗi lần thử được "giữ chỗ" NGUYÊN TỬ trong database
-- TRƯỚC khi kiểm tra PIN; đúng PIN thì xoá bộ đếm. Chỉ máy chủ (service_role) gọi được.
create or replace function public.student_pin_attempt(p_student uuid, p_max integer default 5, p_lock_minutes integer default 15)
returns table (allowed boolean, remaining integer, locked_minutes integer)
language plpgsql security definer set search_path = ''
as $$
declare
  v_now timestamptz := now();
  g public.student_login_guards%rowtype;
begin
  insert into public.student_login_guards (student_id) values (p_student) on conflict do nothing;
  select * into g from public.student_login_guards where student_id = p_student for update;
  if g.locked_until is not null and g.locked_until > v_now then
    return query select false, 0, ceil(extract(epoch from (g.locked_until - v_now)) / 60)::integer;
    return;
  end if;
  -- lần sai cũ hơn cửa sổ khoá thì không tính
  if g.last_failed_at is null or v_now - g.last_failed_at > make_interval(mins => p_lock_minutes) then
    g.failed_count := 0;
  end if;
  g.failed_count := g.failed_count + 1; -- giữ chỗ: coi như sai cho tới khi đăng nhập đúng
  update public.student_login_guards
     set failed_count = g.failed_count, last_failed_at = v_now, updated_at = v_now,
         locked_until = case when g.failed_count >= p_max then v_now + make_interval(mins => p_lock_minutes) else null end
   where student_id = p_student;
  return query select true, greatest(0, p_max - g.failed_count), case when g.failed_count >= p_max then p_lock_minutes else 0 end;
end;
$$;
revoke all on function public.student_pin_attempt(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.student_pin_attempt(uuid, integer, integer) to service_role;
