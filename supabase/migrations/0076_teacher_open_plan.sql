-- EduChain Kids 0076: ĐÃ BẬT THU PHÍ → THẦY CÔ DÙNG MIỄN PHÍ, ĐỦ LỚP (40 EM / LỚP), KHÔNG CÒN GIỚI HẠN 3 EM SAU DÙNG THỬ.
-- CHỈ THAY HÀM, chạy lại an toàn. Cần đã chạy 0018, 0019, 0045, 0074.
--  * Mô hình: phụ huynh trả học phí cho từng em (gói lớp học) → cô là kênh giới thiệu, dùng app miễn phí.
--  * Khi billing_settings.enabled = true: giới hạn học sinh của cô = max(giới hạn cũ, 40 × số lớp ở trường cô đang dạy);
--    mỗi lớp vẫn tối đa 40 em (enforce_class_size). Em đang bị "tạm khoá (gói)" được mở ngay.
--  * Tắt thu phí: quay về như cũ (gói miễn phí 3 em sau 15 ngày dùng thử, quản trị nâng giới hạn).

create or replace function public.teacher_student_limit(p_teacher uuid)
returns integer
language sql stable security definer set search_path = ''
as $$
  select greatest(
    case when tp.trial_until is not null and tp.trial_until > now() then greatest(coalesce(tp.student_limit, 3), 40)
         else coalesce(tp.student_limit, 3) end,
    case when coalesce((select s.enabled from public.billing_settings s where s.id = 1), false)
         then 40 * greatest(1, (select count(*) from public.class_teachers ct join public.classes c on c.id = ct.class_id
                                 where ct.teacher_id = p_teacher and c.status = 'active' and c.kind = 'school'))
         else 0 end
  )::integer
  from (select 1) x left join public.teacher_plans tp on tp.teacher_id = p_teacher;
$$;
revoke all on function public.teacher_student_limit(uuid) from public, anon, authenticated;

-- Gói của cô: thêm open_plan (đang thu phí học sinh → cô dùng miễn phí đủ lớp)
drop function if exists public.teacher_my_plan();
create function public.teacher_my_plan()
returns table (student_limit integer, students_used integer, trial_until timestamptz, base_limit integer, locked integer, open_plan boolean)
language plpgsql stable security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_lim integer; v_used integer; v_open boolean;
begin
  if v_uid is null or not exists (select 1 from public.user_roles where user_id = v_uid and role = 'teacher') then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  v_lim := public.teacher_student_limit(v_uid);
  v_used := public.teacher_students_used(v_uid);
  v_open := coalesce((select s.enabled from public.billing_settings s where s.id = 1), false);
  return query select v_lim, v_used,
    (select tp.trial_until from public.teacher_plans tp where tp.teacher_id = v_uid and tp.trial_until > now()),
    coalesce((select tp.student_limit::integer from public.teacher_plans tp where tp.teacher_id = v_uid), 3),
    greatest(0, v_used - v_lim),
    v_open;
end;
$$;
revoke all on function public.teacher_my_plan() from public, anon;
grant execute on function public.teacher_my_plan() to authenticated;
