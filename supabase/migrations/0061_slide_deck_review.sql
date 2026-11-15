-- EduChain Kids 0061: GÓP Ý BÀI THAO GIẢNG THEO TRANG (tổ chuyên môn duyệt bài, kiểu bình luận của Canva).
-- CHỈ THÊM MỚI, chạy lại an toàn.
--  • Cô soạn bài bật "Link góp ý" → mã review_token (uuid). Giáo viên khác (đã đăng nhập, vai trò giáo viên) mở link
--    /gop-y/<mã> xem từng trang (chỉ xem) và viết góp ý cho từng trang.
--  • Cô soạn bài đọc góp ý ngay trong trình soạn, trả lời, đánh dấu "Đã sửa", xoá. Tắt link thì người khác hết xem được.

alter table public.slide_decks add column if not exists review_token uuid;
create unique index if not exists slide_decks_review_token_idx on public.slide_decks (review_token) where review_token is not null;

create table if not exists public.slide_deck_comments (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.slide_decks(id) on delete cascade,
  slide_id text not null check (char_length(slide_id) between 1 and 40),
  author uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text not null default 'Giáo viên' check (char_length(author_name) between 1 and 80),
  body text not null check (char_length(body) between 1 and 1000),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists slide_deck_comments_deck_idx on public.slide_deck_comments (deck_id, created_at);
alter table public.slide_deck_comments enable row level security;

-- đọc: cô soạn bài (mọi góp ý của bài mình) hoặc người viết (góp ý của mình)
drop policy if exists sdc_select on public.slide_deck_comments;
create policy sdc_select on public.slide_deck_comments for select to authenticated using (
  author = auth.uid() or exists (select 1 from public.slide_decks d where d.id = deck_id and d.owner = auth.uid()));
-- đánh dấu đã sửa: chỉ cô soạn bài
drop policy if exists sdc_update on public.slide_deck_comments;
create policy sdc_update on public.slide_deck_comments for update to authenticated
  using (exists (select 1 from public.slide_decks d where d.id = deck_id and d.owner = auth.uid()))
  with check (exists (select 1 from public.slide_decks d where d.id = deck_id and d.owner = auth.uid()));
-- xoá: cô soạn bài hoặc người viết
drop policy if exists sdc_delete on public.slide_deck_comments;
create policy sdc_delete on public.slide_deck_comments for delete to authenticated using (
  author = auth.uid() or exists (select 1 from public.slide_decks d where d.id = deck_id and d.owner = auth.uid()));
revoke all on public.slide_deck_comments from anon;
grant select, update, delete on public.slide_deck_comments to authenticated;
-- chỉ sửa được cột resolved
revoke update on public.slide_deck_comments from authenticated;
grant update (resolved) on public.slide_deck_comments to authenticated;

create or replace function public.is_teacher_user() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role in ('teacher', 'system_admin'));
$$;
revoke all on function public.is_teacher_user() from public, anon;
grant execute on function public.is_teacher_user() to authenticated;

-- bật / tắt link góp ý (chỉ cô soạn bài). Bật lại khi đã có mã: giữ mã cũ.
create or replace function public.deck_review_link(p_deck uuid, p_on boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_tok uuid;
begin
  if auth.uid() is null or not exists (select 1 from public.slide_decks where id = p_deck and owner = auth.uid()) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_on then
    update public.slide_decks set review_token = coalesce(review_token, gen_random_uuid()) where id = p_deck returning review_token into v_tok;
  else
    update public.slide_decks set review_token = null where id = p_deck;
    v_tok := null;
  end if;
  return v_tok;
end; $$;
revoke all on function public.deck_review_link(uuid, boolean) from public, anon;
grant execute on function public.deck_review_link(uuid, boolean) to authenticated;

-- người góp ý mở bài theo mã (chỉ giáo viên đã đăng nhập)
create or replace function public.deck_review_get(p_token uuid)
returns table (deck_id uuid, title text, data jsonb, owner_name text, is_owner boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.is_teacher_user() then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query
    select d.id, d.title, d.data, coalesce(p.display_name, 'Giáo viên')::text, d.owner = auth.uid()
      from public.slide_decks d left join public.profiles p on p.id = d.owner
     where d.review_token = p_token;
end; $$;
revoke all on function public.deck_review_get(uuid) from public, anon;
grant execute on function public.deck_review_get(uuid) to authenticated;

-- mọi góp ý của bài (người góp ý thấy cả góp ý của đồng nghiệp — như thảo luận của tổ)
create or replace function public.deck_review_comments(p_token uuid)
returns table (id uuid, slide_id text, author_name text, body text, resolved boolean, created_at timestamptz, mine boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.is_teacher_user() then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query
    select c.id, c.slide_id, c.author_name, c.body, c.resolved, c.created_at, c.author = auth.uid()
      from public.slide_deck_comments c join public.slide_decks d on d.id = c.deck_id
     where d.review_token = p_token
     order by c.created_at;
end; $$;
revoke all on function public.deck_review_comments(uuid) from public, anon;
grant execute on function public.deck_review_comments(uuid) to authenticated;

-- viết góp ý: cô soạn bài (trả lời) hoặc người có mã link đang bật. Tối đa 300 góp ý / bài, 60 / người / ngày.
create or replace function public.deck_comment_add(p_deck uuid, p_slide text, p_body text, p_token uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_name text;
begin
  if auth.uid() is null or not public.is_teacher_user() then raise exception 'not_allowed' using errcode = '42501'; end if;
  if not exists (select 1 from public.slide_decks d where d.id = p_deck
                  and (d.owner = auth.uid() or (d.review_token is not null and d.review_token = p_token))) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_body, ''))) = 0 then raise exception 'empty' using errcode = '22023'; end if;
  if (select count(*) from public.slide_deck_comments where deck_id = p_deck) >= 300 then raise exception 'too_many' using errcode = 'P0003'; end if;
  if (select count(*) from public.slide_deck_comments where author = auth.uid() and created_at > now() - interval '1 day') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0004';
  end if;
  select coalesce(nullif(trim(display_name), ''), 'Giáo viên') into v_name from public.profiles where id = auth.uid();
  insert into public.slide_deck_comments (deck_id, slide_id, author, author_name, body)
    values (p_deck, left(p_slide, 40), auth.uid(), left(coalesce(v_name, 'Giáo viên'), 80), left(trim(p_body), 1000))
    returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.deck_comment_add(uuid, text, text, uuid) from public, anon;
grant execute on function public.deck_comment_add(uuid, text, text, uuid) to authenticated;
