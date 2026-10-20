-- 0022: Kế hoạch bài dạy cho mọi môn (tạo từ lịch báo giảng Excel): Đạo đức, TNXH, HĐTN, Âm nhạc, Mĩ thuật, GDTC…
-- Trước đây chỉ nhận 3 môn có ngân hàng câu hỏi trong app. Nay nhận mã môn dạng chữ thường ngắn (vd 'dao-duc', 'tnxh').
alter table public.lesson_plans drop constraint if exists lesson_plans_subject_check;
alter table public.lesson_plans add constraint lesson_plans_subject_check
  check (subject ~ '^[a-z][a-z-]{1,19}$');
