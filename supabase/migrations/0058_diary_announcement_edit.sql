-- EduChain Kids 0058: SỔ LỚP — xoá / sửa thông báo cả lớp của những ngày đã qua (việc chung hết hạn).
-- CHỈ THÊM MỚI, chạy lại an toàn (cần 0026 trước). Chỉ đổi cột announcement của ngày đã có, không đụng điểm danh,
-- không đổi saved_at (giờ điểm danh giữ nguyên). p_text rỗng / null = xoá cả thông báo ngày đó.
create or replace function public.teacher_diary_set_announcement(p_class uuid, p_day date, p_text text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  update public.class_diary_days d
     set announcement = nullif(left(trim(coalesce(p_text, '')), 1500), '')
   where d.class_id = p_class and d.day = p_day;
end;
$$;

revoke all on function public.teacher_diary_set_announcement(uuid, date, text) from public, anon;
grant execute on function public.teacher_diary_set_announcement(uuid, date, text) to authenticated;
