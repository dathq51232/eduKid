-- EduChain Kids 0060: TIẾNG ANH SƯ PHẠM — ÔN MỖI NGÀY THEO LỊCH NHẮC LẠI (spaced repetition).
-- CHỈ THÊM MỚI, chạy lại an toàn. Dữ liệu RIÊNG của từng giáo viên (RLS theo auth.uid()).
-- Mỗi thẻ một dòng: card_id ('v:w01:hello' từ vựng, 'e:w01:0' mẫu câu, 'p:<mã câu>' Câu của tôi),
-- box = mức nhớ (1…7, càng cao càng lâu mới ôn lại), due = ngày đến hạn ôn, reps / lapses = số lần ôn / quên.
-- Nội dung thẻ nằm trong mã nguồn (src/lib/teacher-english/*), bảng chỉ lưu lịch ôn.
create table if not exists public.teacher_english_review (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  card_id text not null check (char_length(card_id) between 3 and 80),
  box smallint not null default 1 check (box between 0 and 8),
  due date not null,
  reps integer not null default 0 check (reps >= 0),
  lapses integer not null default 0 check (lapses >= 0),
  updated_at timestamptz not null default now(),
  primary key (owner, card_id)
);
create index if not exists teacher_english_review_due_idx on public.teacher_english_review (owner, due);
alter table public.teacher_english_review enable row level security;
drop policy if exists teacher_english_review_own on public.teacher_english_review;
create policy teacher_english_review_own on public.teacher_english_review for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.teacher_english_review from anon;
grant select, insert, update, delete on public.teacher_english_review to authenticated;
