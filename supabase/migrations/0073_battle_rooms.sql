-- EduChain Kids 0073: ĐẤU CẶP trong PHÒNG THI LỚP (docs/BAN-SAC-EDUCHAINKIDS.md mục 8.2).
-- Mỗi vòng đấu là MỘT PHÒNG THI bình thường (mã phòng, giờ mở – đóng, làm một lần, máy chủ chấm — migration 0062):
-- các em làm lúc nào cũng được trong giờ mở, không cần vào cùng lúc. Mỗi cặp làm CHUNG một đề (mỗi em đảo thứ tự câu
-- và phương án). Hai em nộp xong → đúng nhiều câu hơn thắng → bằng câu: thời gian làm (máy chủ đo) ít hơn thắng.
-- Thua là dừng; cô mở vòng sau cho các em thắng (đề mới, khó hơn) đến khi còn nhà vô địch.
-- Không bảng nào cho đọc/ghi thẳng: mọi thao tác qua API máy chủ (service_role) có kiểm tra quyền.

-- Bản thử đấu cùng lúc trước đây (chưa dùng): bỏ đi
drop table if exists public.battle_progress;
drop table if exists public.battle_matches;
drop table if exists public.battle_players;
drop table if exists public.battle_rooms;

create table if not exists public.battles (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 200),
  subject text not null check (subject in ('toan', 'tieng-viet', 'tieng-anh')),
  -- quy tắc sinh đề của vòng 1 (ma trận) + số phút; vòng sau máy cô sinh đề khó hơn từ cùng các bài
  plan jsonb not null default '{}'::jsonb check (jsonb_typeof(plan) = 'object' and pg_column_size(plan) < 50000),
  minutes smallint not null check (minutes between 5 and 90),
  status text not null default 'playing' check (status in ('playing', 'done', 'closed')),
  round smallint not null default 1 check (round between 1 and 10),
  champion uuid references public.students(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists battles_class_idx on public.battles (class_id, created_at desc);

create table if not exists public.battle_pairs (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles(id) on delete cascade,
  round smallint not null check (round between 1 and 10),
  slot smallint not null check (slot between 0 and 63),
  a uuid not null references public.students(id) on delete cascade,
  b uuid references public.students(id) on delete cascade, -- null: vé đi tiếp
  room_id uuid references public.exam_rooms(id) on delete set null,
  winner uuid references public.students(id) on delete set null,
  reason text check (reason is null or reason in ('dung', 'thoi_gian', 'nop_truoc', 'bo_thi', 've', 'xu')),
  decided_at timestamptz,
  unique (battle_id, round, slot)
);
create index if not exists battle_pairs_room_idx on public.battle_pairs (room_id);

alter table public.exam_rooms add column if not exists battle_id uuid references public.battles(id) on delete set null;
alter table public.exam_rooms add column if not exists battle_round smallint check (battle_round is null or battle_round between 1 and 10);

alter table public.battles enable row level security;
alter table public.battle_pairs enable row level security;
revoke all on table public.battles, public.battle_pairs from anon, authenticated;
grant select, insert, update, delete on table public.battles, public.battle_pairs to service_role;
