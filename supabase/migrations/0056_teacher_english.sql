-- EduChain Kids 0056: TIẾNG ANH SƯ PHẠM CHO GIÁO VIÊN (Teacher English Academy).
-- CHỈ THÊM MỚI, chạy lại an toàn.
--
-- * teacher_english_progress: tiến độ lộ trình 24 tuần của từng giáo viên — mỗi bài (tuần) một dòng:
--   các phần đã học, tự đánh giá theo thang 1–4, ghi chú lỗi cần cải thiện, thời điểm hoàn thành.
-- * teacher_english_saved: mẫu câu Classroom English giáo viên đánh dấu "Câu của tôi".
-- Cả hai bảng là dữ liệu RIÊNG: chỉ chính người đó đọc/ghi (RLS theo auth.uid()).
-- Nội dung bài học và ngân hàng câu nằm trong mã nguồn (src/lib/teacher-english/*), bảng chỉ lưu mã bài / mã câu.

create table if not exists public.teacher_english_progress (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^w[0-9]{2}$'),
  sections text[] not null default '{}' check (cardinality(sections) <= 12),
  rating smallint check (rating between 1 and 4),
  note text not null default '' check (char_length(note) <= 1000),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (owner, lesson_id)
);
alter table public.teacher_english_progress enable row level security;
drop policy if exists teacher_english_progress_own on public.teacher_english_progress;
create policy teacher_english_progress_own on public.teacher_english_progress for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.teacher_english_progress from anon;
grant select, insert, update, delete on public.teacher_english_progress to authenticated;

create table if not exists public.teacher_english_saved (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  phrase_id text not null check (char_length(phrase_id) between 1 and 40),
  created_at timestamptz not null default now(),
  primary key (owner, phrase_id)
);
alter table public.teacher_english_saved enable row level security;
drop policy if exists teacher_english_saved_own on public.teacher_english_saved;
create policy teacher_english_saved_own on public.teacher_english_saved for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.teacher_english_saved from anon;
grant select, insert, delete on public.teacher_english_saved to authenticated;
