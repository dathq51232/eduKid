-- 0053 · Quản trị › Marketing: soạn một lần ra 3 phiên bản chuẩn cho Fanpage / TikTok / Zalo (đăng tay),
-- link có UTM riêng từng kênh, đo lượt bấm link và lượt vào trang Đăng ký theo kênh + chiến dịch.
-- Chỉ quản trị hệ thống đọc/ghi bài marketing; lượt bấm được ghi ẩn danh (mã khách đã băm theo ngày như track_visit).

-- 1. Bài marketing đã soạn
create table if not exists public.marketing_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  campaign text not null check (campaign ~ '^[a-z0-9-]{1,40}$'),     -- utm_campaign
  link text check (link is null or char_length(link) <= 500),
  body text not null default '' check (char_length(body) <= 6000),   -- nội dung gốc
  hashtags text not null default '' check (char_length(hashtags) <= 500),
  variants jsonb not null default '{}'::jsonb,                       -- { facebook, tiktok, zalo }: nội dung từng kênh
  posted jsonb not null default '{}'::jsonb,                         -- { facebook: thời điểm đã đăng, ... }
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.marketing_posts enable row level security;
revoke all on public.marketing_posts from anon;
drop policy if exists marketing_posts_admin on public.marketing_posts;
create policy marketing_posts_admin on public.marketing_posts for all to authenticated
  using (public.has_role('system_admin', null)) with check (public.has_role('system_admin', null));
create index if not exists marketing_posts_recent_idx on public.marketing_posts (created_at desc);

-- 2. Lượt bấm link UTM & lượt vào trang đăng ký (mỗi khách tính 1 lần / ngày / kênh / chiến dịch)
create table if not exists public.marketing_visits (
  day date not null,
  vid text not null,
  source text not null,
  campaign text not null,
  kind text not null check (kind in ('click', 'signup_page')),
  primary key (day, vid, source, campaign, kind)
);
alter table public.marketing_visits enable row level security;
revoke all on public.marketing_visits from anon, authenticated;
create index if not exists marketing_visits_campaign_idx on public.marketing_visits (campaign, source, kind);

-- Ghi lượt (gọi từ /api/track — máy chủ đã băm mã khách và giới hạn tần suất)
create or replace function public.track_campaign(p_vid text, p_source text, p_campaign text, p_kind text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_day date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  if p_vid is null or p_vid !~ '^[0-9a-f]{32}$' then return; end if;
  if p_source is null or p_source !~ '^[a-z0-9_-]{1,20}$' then return; end if;
  if p_campaign is null or p_campaign !~ '^[a-z0-9_-]{1,40}$' then return; end if;
  if p_kind not in ('click', 'signup_page') then return; end if;
  insert into public.marketing_visits (day, vid, source, campaign, kind)
  values (v_day, p_vid, p_source, p_campaign, p_kind) on conflict do nothing;
  if random() < 0.002 then delete from public.marketing_visits where day < v_day - 400; end if;
end;
$$;
revoke all on function public.track_campaign(text, text, text, text) from public;
grant execute on function public.track_campaign(text, text, text, text) to anon, authenticated;

-- Báo cáo cho quản trị: số khách bấm link / vào trang đăng ký theo chiến dịch × kênh trong p_days ngày gần nhất
create or replace function public.admin_campaign_report(p_days integer default 90)
returns table (campaign text, source text, clicks bigint, signups bigint, last_day date)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.has_role('system_admin', null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select v.campaign, v.source,
           count(*) filter (where v.kind = 'click'),
           count(*) filter (where v.kind = 'signup_page'),
           max(v.day)
    from public.marketing_visits v
    where v.day >= (now() at time zone 'Asia/Ho_Chi_Minh')::date - greatest(1, least(p_days, 400))
    group by v.campaign, v.source
    order by max(v.day) desc, 3 desc;
end;
$$;
revoke all on function public.admin_campaign_report(integer) from public, anon;
grant execute on function public.admin_campaign_report(integer) to authenticated;
