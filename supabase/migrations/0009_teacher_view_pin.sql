-- EduChain Kids 0009: giáo viên xem lại được PIN của học sinh trong lớp mình. Bỏ mục phụ huynh khỏi giao diện.
-- CHỈ THÊM MỚI, chạy lại an toàn. Không xoá bảng/hàm phụ huynh cũ (dữ liệu cũ vẫn giữ nguyên, giao diện không dùng nữa).
--
-- Thiết kế:
-- * PIN lưu ở bảng riêng public.student_pins. Bật RLS và KHÔNG có policy nào cho anon/authenticated:
--   trình duyệt không đọc/ghi bảng này trực tiếp được. Chỉ máy chủ (service_role) ghi khi giáo viên tạo/đặt PIN.
-- * Giáo viên đọc PIN qua hàm teacher_class_pins(p_class): kiểm tra teaches_class (giáo viên được phân công lớp,
--   quản trị trường của trường đó, hoặc quản trị hệ thống). Mỗi lần xem được ghi nhật ký audit_logs.
-- * Học sinh tạo PIN TRƯỚC khi chạy migration này chưa có PIN lưu lại: giáo viên bấm "Đặt PIN mới" một lần.

create table if not exists public.student_pins (
  student_id uuid primary key references public.students(id) on delete cascade,
  pin text not null check (pin ~ '^[0-9]{6}$'),
  updated_at timestamptz not null default now()
);
alter table public.student_pins enable row level security;
revoke all on table public.student_pins from anon, authenticated;
grant select, insert, update, delete on table public.student_pins to service_role;

create or replace function public.teacher_class_pins(p_class uuid)
returns table (student_id uuid, pin text, updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'teacher_view_pins', 'class', p_class::text, null);
  return query
  select p.student_id, p.pin, p.updated_at
  from public.class_memberships cm
  join public.student_pins p on p.student_id = cm.student_id
  where cm.class_id = p_class and cm.status = 'active';
end;
$$;

revoke all on function public.teacher_class_pins(uuid) from public, anon;
grant execute on function public.teacher_class_pins(uuid) to authenticated;
