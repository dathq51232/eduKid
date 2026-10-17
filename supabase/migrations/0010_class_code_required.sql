-- EduChain Kids 0010: mọi lớp đều có MÃ LỚP riêng, không bao giờ trùng giữa các giáo viên/trường.
-- CHỈ THÊM MỚI, chạy lại an toàn.
--
-- 0008 đã có chỉ mục duy nhất classes_join_code_unique, nhưng còn hai kẽ hở:
--   * lớp tạo trước 0008 hoặc tạo thẳng vào bảng (quản trị trường) có thể có join_code = null -> học sinh không đăng nhập được;
--   * quản trị có thể sửa join_code bằng tay (đặt null, hoặc đổi tùy ý).
-- Bản này: cấp mã cho lớp còn thiếu, tự cấp mã khi thêm lớp, KHÔNG cho đổi mã sau khi đã cấp, và đặt NOT NULL.

-- 1) Cấp mã cho các lớp còn thiếu
update public.classes set join_code = public.new_join_code() where join_code is null;

-- 2) Tự cấp mã khi thêm lớp; giữ nguyên mã cũ khi sửa lớp
create or replace function public.classes_guard_join_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    -- Luôn do hệ thống sinh, không nhận mã tự đặt -> không thể cố tình đặt trùng/đoán mã lớp khác
    new.join_code := public.new_join_code();
  elsif new.join_code is distinct from old.join_code then
    new.join_code := old.join_code; -- mã lớp đã cấp thì cố định
  end if;
  return new;
end;
$$;
revoke all on function public.classes_guard_join_code() from public, anon, authenticated;

drop trigger if exists classes_guard_join_code on public.classes;
create trigger classes_guard_join_code
before insert or update on public.classes
for each row execute function public.classes_guard_join_code();

-- 3) Bắt buộc có mã (chỉ mục duy nhất classes_join_code_unique của 0008 đảm bảo không trùng)
alter table public.classes alter column join_code set not null;
