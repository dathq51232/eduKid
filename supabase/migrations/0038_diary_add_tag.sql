-- 0038 · Gọi tên – Dò bài: em trả lời đúng / phát biểu hay thì tự thêm nhãn "★ Phát biểu tốt" vào Sổ lớp hôm nay.
-- Chỉ THÊM một nhãn vào dòng của em (không đụng điểm danh, ghi chú, nhãn khác); trùng nhãn thì bỏ qua.
-- Không tạo "ngày đã ghi Sổ lớp" (class_diary_days) để phụ huynh không thấy nhầm là cô đã điểm danh. Chạy lại an toàn.
create or replace function public.teacher_diary_add_tag(p_class uuid, p_student uuid, p_tag text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_day date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_tag text := left(trim(coalesce(p_tag, '')), 40);
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if v_tag = '' then raise exception 'invalid_tag' using errcode = '22023'; end if;
  if not exists (select 1 from public.class_memberships m where m.class_id = p_class and m.student_id = p_student and m.status = 'active') then
    raise exception 'not_in_class' using errcode = '22023';
  end if;
  insert into public.class_diary_entries (class_id, student_id, day, status, tags, updated_at)
  values (p_class, p_student, v_day, 'present', array[v_tag], now())
  on conflict (class_id, day, student_id) do update
    set tags = case when v_tag = any (public.class_diary_entries.tags) then public.class_diary_entries.tags
                    else (public.class_diary_entries.tags || v_tag)[1:12] end,
        updated_at = case when v_tag = any (public.class_diary_entries.tags) then public.class_diary_entries.updated_at else now() end;
  return jsonb_build_object('ok', true, 'day', v_day);
end;
$$;
revoke all on function public.teacher_diary_add_tag(uuid, uuid, text) from public, anon;
grant execute on function public.teacher_diary_add_tag(uuid, uuid, text) to authenticated;
