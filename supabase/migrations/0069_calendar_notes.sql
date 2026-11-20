-- EduChain Kids 0069: GHI CHÚ NHẮC HẸN TRÊN LỊCH (giáo viên + phụ huynh).
-- CHỈ THÊM MỚI, chạy lại an toàn.
-- Mỗi người tự ghi việc quan trọng vào một ngày (họp, nộp hồ sơ, dự giờ, đóng học phí…), chọn nhắc trước mấy ngày
-- và lặp lại (hằng tuần / tháng / năm). Đến lúc nhắc, việc hiện ở "Việc hôm nay" (giáo viên) và khối Lịch trên trang chủ.
-- done_until: ngày của lần gần nhất đã đánh dấu xong — lần đó thôi nhắc, lần lặp sau vẫn nhắc.
-- Chưa chạy migration này thì app tự lưu ghi chú trên máy (localStorage) — xem src/lib/calendar-notes.ts.

create table if not exists public.calendar_notes (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  at_time text check (at_time is null or at_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  title text not null check (char_length(title) between 1 and 120),
  note text not null default '' check (char_length(note) <= 500),
  remind_days smallint not null default 1 check (remind_days between 0 and 30),
  repeat text not null default 'none' check (repeat in ('none', 'weekly', 'monthly', 'yearly')),
  done_until date,
  created_at timestamptz not null default now()
);
create index if not exists calendar_notes_owner_day on public.calendar_notes (owner, day);
alter table public.calendar_notes enable row level security;
drop policy if exists calendar_notes_own on public.calendar_notes;
create policy calendar_notes_own on public.calendar_notes for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.calendar_notes from anon;
grant select, insert, update, delete on public.calendar_notes to authenticated;
