-- EduChain Kids 0011: sửa lỗi tài khoản học sinh bị nhận nhầm vai trò "phụ huynh/người lớn".
-- CHỈ THÊM MỚI, chạy lại an toàn.
--
-- Nguyên nhân: khi máy chủ tạo tài khoản học sinh (auth.admin.createUser), Supabase Auth chèn dòng auth.users TRƯỚC,
-- rồi mới ghi app_metadata.account_type = 'student' bằng một lệnh cập nhật sau. Trigger handle_new_auth_user (0008)
-- chạy lúc chèn nên chưa thấy 'student' -> gán vai trò 'parent'. Kết quả: học sinh đăng nhập bằng PIN nhưng hệ thống
-- coi là người lớn, bài làm không được lưu vào lớp.
--
-- Cách sửa: vai trò học sinh dựa vào việc tài khoản được GẮN vào hồ sơ học sinh (students.user_id — chỉ máy chủ ghi),
-- không phụ thuộc thứ tự ghi của Supabase Auth.

create or replace function public.ensure_student_role(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user is null then return; end if;
  if not exists (select 1 from public.user_roles where user_id = p_user and role = 'student') then
    insert into public.user_roles (user_id, role) values (p_user, 'student');
  end if;
  -- Tài khoản học sinh không bao giờ là người lớn
  delete from public.user_roles where user_id = p_user and role = 'parent';
end;
$$;
revoke all on function public.ensure_student_role(uuid) from public, anon, authenticated;

create or replace function public.students_sync_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is not null and (tg_op = 'INSERT' or new.user_id is distinct from old.user_id) then
    perform public.ensure_student_role(new.user_id);
  end if;
  return new;
end;
$$;
revoke all on function public.students_sync_role() from public, anon, authenticated;

drop trigger if exists students_sync_role on public.students;
create trigger students_sync_role
after insert or update of user_id on public.students
for each row execute function public.students_sync_role();

-- Sửa các tài khoản học sinh đã tạo trước đó
do $$
declare r record;
begin
  for r in select user_id from public.students where user_id is not null loop
    perform public.ensure_student_role(r.user_id);
  end loop;
end $$;
