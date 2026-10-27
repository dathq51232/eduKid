-- 0036 · Cờ tướng trực tuyến: dùng chung bảng của cờ vua (0035), thêm cột variant ('chess' | 'xiangqi').
-- Điểm Elo tách riêng cho từng loại cờ. Nước cờ tướng lưu dạng UCCI (vd "h2e2"), máy chủ kiểm tra bằng bộ luật cờ tướng.

alter table public.chess_games add column if not exists variant text not null default 'chess';
alter table public.chess_seeks add column if not exists variant text not null default 'chess';
alter table public.chess_ratings add column if not exists variant text not null default 'chess';

do $$ begin
  alter table public.chess_games drop constraint if exists chess_games_variant_check;
  alter table public.chess_games add constraint chess_games_variant_check check (variant in ('chess', 'xiangqi'));
  alter table public.chess_seeks drop constraint if exists chess_seeks_variant_check;
  alter table public.chess_seeks add constraint chess_seeks_variant_check check (variant in ('chess', 'xiangqi'));
  alter table public.chess_ratings drop constraint if exists chess_ratings_variant_check;
  alter table public.chess_ratings add constraint chess_ratings_variant_check check (variant in ('chess', 'xiangqi'));
  -- Lý do kết thúc của cờ tướng: chiếu dai, luật 60 nước
  alter table public.chess_games drop constraint if exists chess_games_reason_check;
  alter table public.chess_games add constraint chess_games_reason_check check (reason in
    ('checkmate', 'stalemate', 'repetition', 'fifty', 'material', 'timeout', 'timeout_vs_material', 'resign', 'agreement', 'perpetual_check', 'move_limit'));
end $$;

-- Mỗi em có một điểm cho mỗi loại cờ
alter table public.chess_ratings drop constraint if exists chess_ratings_pkey;
alter table public.chess_ratings add constraint chess_ratings_pkey primary key (student_id, variant);
drop index if exists public.chess_ratings_school_idx;
create index if not exists chess_ratings_school_idx on public.chess_ratings (school_id, variant, rating desc);

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
  if g.ply < 2 then update public.chess_games set rated = true where id = p_game; return; end if;

  insert into public.chess_ratings (student_id, school_id, variant) values (g.white, g.school_id, g.variant), (g.black, g.school_id, g.variant)
  on conflict (student_id, variant) do nothing;
  select rating into rw from public.chess_ratings where student_id = g.white and variant = g.variant for update;
  select rating into rb from public.chess_ratings where student_id = g.black and variant = g.variant for update;

  sw := case g.result when '1-0' then 1 when '0-1' then 0 else 0.5 end;
  ew := 1 / (1 + power(10, (rb - rw) / 400.0));
  nw := greatest(100, least(3000, round(rw + k * (sw - ew))::integer));
  nb := greatest(100, least(3000, round(rb + k * ((1 - sw) - (1 - ew)))::integer));

  update public.chess_ratings set rating = nw, games = games + 1,
    wins = wins + (sw = 1)::integer, draws = draws + (sw = 0.5)::integer, losses = losses + (sw = 0)::integer,
    school_id = g.school_id, updated_at = now()
  where student_id = g.white and variant = g.variant;
  update public.chess_ratings set rating = nb, games = games + 1,
    wins = wins + (sw = 0)::integer, draws = draws + (sw = 0.5)::integer, losses = losses + (sw = 1)::integer,
    school_id = g.school_id, updated_at = now()
  where student_id = g.black and variant = g.variant;
  update public.chess_games set rated = true where id = p_game;
end;
$$;
revoke all on function public.chess_apply_rating(uuid) from public, anon, authenticated;
grant execute on function public.chess_apply_rating(uuid) to service_role;
