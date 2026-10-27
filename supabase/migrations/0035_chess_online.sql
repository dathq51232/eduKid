-- 0035 · Cờ vua trực tuyến trong trường: lời mời đấu (sảnh), ván đấu, điểm xếp hạng Elo theo trường.
-- Mọi thao tác GHI (mời, nhận lời, đi quân, xin hòa, xin thua, hết giờ) chỉ chạy ở máy chủ bằng service_role
-- (API /api/co-vua/*): máy chủ dùng chess.js kiểm tra từng nước và tự tính đồng hồ, trình duyệt không ghi thẳng.
-- Học sinh chỉ ĐỌC: ván của mình, lời mời và bảng điểm của trường mình. Phụ huynh đã liên kết xem được ván của con.

-- Trường của học sinh đang đăng nhập = trường của lớp đang học
create or replace function public.chess_my_school()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.school_id from public.classes c where c.id = public.my_active_class();
$$;
revoke all on function public.chess_my_school() from public, anon;
grant execute on function public.chess_my_school() to authenticated;

create table if not exists public.chess_ratings (
  student_id uuid primary key references public.students(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  rating integer not null default 1000 check (rating between 100 and 3000),
  games integer not null default 0,
  wins integer not null default 0,
  draws integer not null default 0,
  losses integer not null default 0,
  updated_at timestamptz not null default now()
);
create index if not exists chess_ratings_school_idx on public.chess_ratings (school_id, rating desc);

-- Lời mời đấu: to_student null = mời cả trường; có giá trị = thách đấu riêng một bạn. Mỗi em chỉ treo 1 lời mời.
create table if not exists public.chess_seeks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null unique references public.students(id) on delete cascade,
  to_student uuid references public.students(id) on delete cascade,
  base integer not null check (base in (180, 300, 600, 900)),
  inc integer not null default 0 check (inc between 0 and 30),
  color text not null default 'r' check (color in ('w', 'b', 'r')),
  created_at timestamptz not null default now()
);
create index if not exists chess_seeks_school_idx on public.chess_seeks (school_id, created_at desc);

create table if not exists public.chess_games (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  white uuid not null references public.students(id) on delete cascade,
  black uuid not null references public.students(id) on delete cascade,
  base integer not null check (base between 60 and 3600),
  inc integer not null default 0 check (inc between 0 and 60),
  moves text[] not null default '{}',               -- các nước dạng UCI (e2e4, e7e8q)
  ply integer not null default 0,                    -- = số phần tử moves; dùng chống ghi trùng
  fen text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  white_ms integer not null,
  black_ms integer not null,
  turn_at timestamptz not null default now(),        -- lúc bắt đầu tính giờ cho bên đang đi
  status text not null default 'active' check (status in ('active', 'finished', 'aborted')),
  result text check (result in ('1-0', '0-1', '1/2-1/2')),
  reason text check (reason in ('checkmate', 'stalemate', 'repetition', 'fifty', 'material', 'timeout', 'timeout_vs_material', 'resign', 'agreement')),
  draw_offer text check (draw_offer in ('w', 'b')),
  emote jsonb,                                       -- {"by":"w","code":"gg","at":"..."} — chỉ biểu cảm soạn sẵn, không có chat
  rated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint chess_games_players check (white <> black),
  constraint chess_games_ply check (ply = coalesce(array_length(moves, 1), 0))
);
create index if not exists chess_games_white_idx on public.chess_games (white, created_at desc);
create index if not exists chess_games_black_idx on public.chess_games (black, created_at desc);
create index if not exists chess_games_school_idx on public.chess_games (school_id, status);

alter table public.chess_ratings enable row level security;
alter table public.chess_seeks enable row level security;
alter table public.chess_games enable row level security;

drop policy if exists chess_ratings_read on public.chess_ratings;
create policy chess_ratings_read on public.chess_ratings for select to authenticated
using (school_id = public.chess_my_school());

drop policy if exists chess_seeks_read on public.chess_seeks;
create policy chess_seeks_read on public.chess_seeks for select to authenticated
using (school_id = public.chess_my_school() and (to_student is null or to_student = public.my_student_id() or student_id = public.my_student_id()));

drop policy if exists chess_games_read on public.chess_games;
create policy chess_games_read on public.chess_games for select to authenticated
using (
  white = public.my_student_id() or black = public.my_student_id()
  or exists (
    select 1 from public.parent_student_links l
    where l.parent_id = (select auth.uid()) and l.status = 'active' and l.student_id in (chess_games.white, chess_games.black)
  )
);
-- Không có policy insert/update/delete: chỉ máy chủ (service_role) ghi.

-- Cập nhật điểm Elo khi ván kết thúc (gọi một lần cho mỗi ván, có khóa dòng nên gọi trùng cũng không cộng hai lần).
create or replace function public.chess_apply_rating(p_game uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.chess_games%rowtype;
  rw integer; rb integer; nw integer; nb integer;
  sw numeric; ew numeric; k integer := 32;
begin
  select * into g from public.chess_games where id = p_game for update;
  if not found or g.status <> 'finished' or g.rated or g.result is null then return; end if;
  -- Ván dưới 2 nước (mỗi bên chưa đi) không tính điểm
  if g.ply < 2 then update public.chess_games set rated = true where id = p_game; return; end if;

  insert into public.chess_ratings (student_id, school_id) values (g.white, g.school_id), (g.black, g.school_id)
  on conflict (student_id) do nothing;
  select rating into rw from public.chess_ratings where student_id = g.white for update;
  select rating into rb from public.chess_ratings where student_id = g.black for update;

  sw := case g.result when '1-0' then 1 when '0-1' then 0 else 0.5 end;
  ew := 1 / (1 + power(10, (rb - rw) / 400.0));
  nw := greatest(100, least(3000, round(rw + k * (sw - ew))::integer));
  nb := greatest(100, least(3000, round(rb + k * ((1 - sw) - (1 - ew)))::integer));

  update public.chess_ratings set rating = nw, games = games + 1,
    wins = wins + (sw = 1)::integer, draws = draws + (sw = 0.5)::integer, losses = losses + (sw = 0)::integer,
    school_id = g.school_id, updated_at = now()
  where student_id = g.white;
  update public.chess_ratings set rating = nb, games = games + 1,
    wins = wins + (sw = 0)::integer, draws = draws + (sw = 0.5)::integer, losses = losses + (sw = 1)::integer,
    school_id = g.school_id, updated_at = now()
  where student_id = g.black;
  update public.chess_games set rated = true where id = p_game;
end;
$$;
revoke all on function public.chess_apply_rating(uuid) from public, anon, authenticated;
grant execute on function public.chess_apply_rating(uuid) to service_role;

-- Cập nhật tức thời (Supabase Realtime) cho ván đấu; nếu dự án chưa có publication thì bỏ qua — giao diện vẫn tự tải lại định kỳ.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chess_games') then
    execute 'alter publication supabase_realtime add table public.chess_games';
  end if;
end $$;
