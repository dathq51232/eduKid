-- Bộ đếm giới hạn số lần gọi DÙNG CHUNG cho mọi bản máy chủ (Vercel chạy nhiều bản song song, bộ đếm trong bộ nhớ
-- của từng bản không đủ chặn dò mã lớp / dò PIN / lạm dụng API đọc chữ). Chỉ máy chủ (service_role) được gọi.
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits int not null default 0
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Tính thêm 1 lần gọi cho khoá p_key trong cửa sổ p_window_seconds giây; trả true nếu còn trong giới hạn.
-- p_count = false: chỉ xem khoá đã vượt giới hạn chưa, không cộng thêm (vd. chỉ đếm lần nhập SAI mã lớp).
create or replace function public.rate_hit(p_key text, p_limit int, p_window_seconds int, p_count boolean default true)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_hits int;
begin
  if not p_count then
    select hits into v_hits from public.rate_limits
      where key = left(p_key, 200) and window_start >= now() - make_interval(secs => p_window_seconds);
    return coalesce(v_hits, 0) < p_limit;
  end if;
  insert into public.rate_limits as r (key, window_start, hits) values (left(p_key, 200), now(), 1)
  on conflict (key) do update set
    hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into v_hits;
  -- Thỉnh thoảng dọn các khoá đã cũ để bảng không phình
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;
  return v_hits <= p_limit;
end;
$$;
revoke all on function public.rate_hit(text, int, int, boolean) from public, anon, authenticated;
grant execute on function public.rate_hit(text, int, int, boolean) to service_role;
