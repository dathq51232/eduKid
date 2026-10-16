-- EduChain Kids 0007: thêm vai trò "student" (học sinh có tài khoản do giáo viên tạo).
-- Chạy SAU 0006, TRƯỚC 0008. Tách riêng vì giá trị enum mới chỉ dùng được sau khi giao dịch tạo nó kết thúc.
-- Chạy lặp lại an toàn.

alter type public.app_role add value if not exists 'student';
