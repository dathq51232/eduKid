-- EduChain Kids 0063: Phòng thi lớp — BẮT BUỘC nhập đúng MÃ PHÒNG mới được bắt đầu làm bài.
-- (0062: em thấy phòng ở trang của mình và bấm “Vào thi” là bắt đầu được, không cần mã.)
-- CHỈ THÊM MỚI / THAY HÀM, chạy lại an toàn.
--  * student_start_room(p_room, p_code): lần đầu bắt đầu phải gửi đúng mã của phòng.
--  * Đã bắt đầu rồi (tải lại trang, mất mạng): làm tiếp không cần nhập lại mã.

drop function if exists public.student_start_room(uuid);

create or replace function public.student_start_room(p_room uuid, p_code text)
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id(); v_at timestamptz; v_code text;
begin
  if v_sid is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  select p.started_at into v_at from public.exam_room_papers p where p.room_id = p_room and p.student_id = v_sid;
  if not found then raise exception 'not_allowed' using errcode = '42501'; end if;
  if v_at is not null then return v_at; end if;  -- đã bắt đầu: làm tiếp
  select r.code into v_code from public.exam_rooms r
    join public.class_memberships cm on cm.class_id = r.class_id and cm.student_id = v_sid and cm.status = 'active'
    where r.id = p_room and r.status = 'open' and now() >= r.opens_at and now() < r.closes_at;
  if v_code is null then raise exception 'room_closed' using errcode = '22023'; end if;
  if v_code <> upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g')) then
    raise exception 'wrong_code' using errcode = '22023';
  end if;
  update public.exam_room_papers set started_at = now()
  where room_id = p_room and student_id = v_sid and started_at is null
  returning started_at into v_at;
  if v_at is null then
    select p.started_at into v_at from public.exam_room_papers p where p.room_id = p_room and p.student_id = v_sid;
  end if;
  return v_at;
end;
$$;

revoke all on function public.student_start_room(uuid, text) from public, anon;
grant execute on function public.student_start_room(uuid, text) to authenticated;
