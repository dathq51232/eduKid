-- "Câu của cô" trong bài học: giáo viên bật cho từng câu (thường theo cả bài) để học sinh các lớp mình dạy
-- (cùng khối với câu) gặp câu đó khi luyện bài tương ứng ở trang Làm bài.
-- Học sinh KHÔNG đọc thẳng bảng (RLS giữ nguyên: chỉ chủ sở hữu). Máy chủ (/api/hoc-sinh/cau-cua-co) dùng quyền cao,
-- kiểm tra em thuộc lớp của cô, trả câu không kèm đáp án và chấm từng câu phía máy chủ.

alter table public.teacher_questions add column if not exists for_class boolean not null default false;

create index if not exists teacher_questions_for_class_idx
  on public.teacher_questions (owner, grade, lesson_id) where for_class;
