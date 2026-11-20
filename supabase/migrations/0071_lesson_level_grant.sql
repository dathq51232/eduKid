-- EduChain Kids 0071: cho người soạn bài sửa CẤP BÀI (cơ bản / nâng cao) và BÀI CẦN HỌC TRƯỚC (cột thêm ở 0070).
-- CHỈ THÊM MỚI, chạy lại an toàn. Bảng lessons chỉ mở quyền sửa từng cột (0002, 0003, 0005); RLS vẫn giới hạn người soạn bài / admin.
grant update (level, prerequisite_lesson_id) on public.lessons to authenticated;
