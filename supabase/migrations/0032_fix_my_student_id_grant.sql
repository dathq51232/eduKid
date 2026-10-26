-- EduChain Kids 0032: SỬA GẤP — bản 0031 trước đó thu hồi quyền chạy public.my_student_id() của authenticated.
-- Các chính sách RLS (classes, students, lesson_results…) gọi hàm này nên giáo viên/học sinh không thấy lớp nào.
-- Chạy file này một lần (an toàn khi chạy lại). Trả lại đúng định nghĩa và quyền như 0008.
create or replace function public.my_student_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.id from public.students s where s.user_id = (select auth.uid()) and s.status = 'active' limit 1;
$$;
revoke all on function public.my_student_id() from public, anon;
grant execute on function public.my_student_id() to authenticated;
