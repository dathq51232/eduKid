-- EduChain Kids 0073: ĐẤU CẶP MẮT XÍCH — phòng đấu loại trực tiếp của lớp (docs/BAN-SAC-EDUCHAINKIDS.md mục 8.2).
-- CHỈ THÊM MỚI, chạy lại an toàn. Không bảng nào cho đọc/ghi thẳng (kể cả giáo viên): mọi thao tác qua API máy chủ
-- (/api/giao-vien/dau-cap, /api/hoc-sinh/dau-cap) dùng service_role, kiểm tra quyền (teaches_class / em thuộc lớp).
--  * Cô tạo phòng (sảnh chờ) → em nhập mã vào → cô bốc thăm: máy chủ ghép cặp ngẫu nhiên, mỗi trận một bộ câu (có đáp án,
--    chỉ máy chủ đọc). Thời gian từng câu do máy chủ đo (served_at → lúc nhận đáp án).
--  * Đúng nhiều hơn thắng; bằng → tổng thời gian ít hơn; vẫn bằng → nộp câu cuối trước. Thua là dừng ở vòng đó.

create table if not exists public.battle_rooms (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  title text not null check (char_length(title) between 2 and 200),
  subject text not null check (subject in ('toan', 'tieng-viet', 'tieng-anh')),
  grade smallint not null check (grade between 1 and 5),
  lessons text[] not null default '{}' check (cardinality(lessons) between 1 and 60),
  n_questions smallint not null check (n_questions between 3 and 10),
  sec_per_q smallint not null check (sec_per_q between 10 and 180),
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'done', 'closed')),
  round smallint not null default 0 check (round between 0 and 10),
  champion uuid references public.students(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists battle_rooms_class_idx on public.battle_rooms (class_id, created_at desc);

create table if not exists public.battle_players (
  room_id uuid not null references public.battle_rooms(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 100),
  byes smallint not null default 0 check (byes >= 0),
  out_round smallint check (out_round is null or out_round between 1 and 10),
  joined_at timestamptz not null default now(),
  primary key (room_id, student_id)
);

create table if not exists public.battle_matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.battle_rooms(id) on delete cascade,
  round smallint not null check (round between 1 and 10),
  slot smallint not null check (slot between 0 and 63),
  a uuid not null references public.students(id) on delete cascade,
  b uuid references public.students(id) on delete cascade, -- null: vé đi tiếp
  questions jsonb not null default '[]'::jsonb check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) <= 10 and pg_column_size(questions) < 120000),
  status text not null default 'playing' check (status in ('playing', 'done')),
  winner uuid references public.students(id) on delete set null,
  reason text check (reason is null or reason in ('dung', 'thoi_gian', 'nop_truoc', 've', 'xu')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (room_id, round, slot)
);
create index if not exists battle_matches_room_idx on public.battle_matches (room_id, round);

-- Tiến độ của một em trong một trận: câu đang làm (i), lúc máy chủ gửi câu đó, các câu đã làm
create table if not exists public.battle_progress (
  match_id uuid not null references public.battle_matches(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  i smallint not null default 0 check (i between 0 and 10),
  served_at timestamptz,
  answers jsonb not null default '[]'::jsonb check (jsonb_typeof(answers) = 'array' and pg_column_size(answers) < 40000),
  correct smallint not null default 0 check (correct >= 0),
  time_ms integer not null default 0 check (time_ms >= 0),
  finished_at timestamptz,
  primary key (match_id, student_id)
);

alter table public.battle_rooms enable row level security;
alter table public.battle_players enable row level security;
alter table public.battle_matches enable row level security;
alter table public.battle_progress enable row level security;
revoke all on table public.battle_rooms, public.battle_players, public.battle_matches, public.battle_progress from anon, authenticated;
grant select, insert, update, delete on table public.battle_rooms, public.battle_players, public.battle_matches, public.battle_progress to service_role;
