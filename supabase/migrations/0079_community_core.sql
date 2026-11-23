-- EduChain Kids 0079: CỘNG ĐỒNG GIÁO VIÊN (EduChainKids Community) — KHUNG GIAI ĐOẠN 0. CHỈ THÊM MỚI, chạy lại an toàn.
--  • community_profiles: hồ sơ chuyên môn (giới thiệu, môn, khối, bộ sách, có hiện tên trường không). Khoá = profiles.id.
--  • community_resources: tài nguyên đã ĐĂNG — lưu BẢN CHỤP jsonb (snapshot) của bài giảng / giáo án / đề / phiếu lúc đăng,
--    kèm mã băm SHA-256 + giờ máy chủ làm bằng chứng tác giả. Tác giả sửa bài gốc thì bản đã đăng không đổi.
--    Giấy phép: xem (chỉ xem) · dung (dùng, ghi tên) · sua (được sao chép về sửa, ghi tác giả gốc) · bao_luu (bảo lưu mọi quyền).
--    Mức hiển thị: truong (giáo viên cùng trường) · giao_vien (mọi giáo viên đã được duyệt).
--    remixed_from: bản này sao chép-sửa từ tài nguyên nào (ghi công tác giả gốc).
--  • community_saves: tài nguyên đã lưu; community_reports: báo vi phạm (bản quyền, dữ liệu học sinh, sai kiến thức…).
--  • slide_decks.remixed_from: bài giảng chép về từ Cộng đồng.
-- Bảng KHÔNG mở trực tiếp cho trình duyệt; mọi thao tác qua các hàm community_* (security definer) bên dưới.
-- Chỉ giáo viên (is_teacher_user) dùng được. Ảnh / âm thanh trong bài giảng còn nằm ở kho riêng teacher-assets:
-- giai đoạn 1 sẽ chép sang kho cộng đồng khi đăng (chưa làm ở đây).

create table if not exists public.community_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  bio text not null default '' check (char_length(bio) <= 500),
  subjects text[] not null default '{}' check (cardinality(subjects) <= 12),
  grades smallint[] not null default '{}' check (cardinality(grades) <= 5),
  book text not null default '' check (char_length(book) <= 60),
  show_school boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.community_profiles enable row level security;
revoke all on public.community_profiles from anon, authenticated;

create table if not exists public.community_resources (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  kind text not null check (kind in ('bai_giang', 'giao_an', 'de_kiem_tra', 'phieu', 'cau_hoi')),
  title text not null check (char_length(title) between 3 and 160),
  summary text not null default '' check (char_length(summary) <= 600),
  subject text not null default '' check (char_length(subject) <= 40),
  grade smallint check (grade between 1 and 5),
  book text not null default '' check (char_length(book) <= 60),
  lesson_ref text not null default '' check (char_length(lesson_ref) <= 160),
  license text not null default 'sua' check (license in ('xem', 'dung', 'sua', 'bao_luu')),
  visibility text not null default 'truong' check (visibility in ('truong', 'giao_vien')),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object' and pg_column_size(snapshot) < 1000000),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  source_table text check (source_table is null or source_table in ('slide_decks', 'lesson_plans', 'exam_papers', 'teacher_questions')),
  source_id uuid,
  remixed_from uuid references public.community_resources(id) on delete set null,
  status text not null default 'hien' check (status in ('hien', 'an', 'go')), -- an: tác giả ẩn; go: quản trị gỡ
  saves int not null default 0,
  copies int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_resources_list_idx on public.community_resources (status, visibility, created_at desc);
create index if not exists community_resources_owner_idx on public.community_resources (owner, created_at desc);
create index if not exists community_resources_filter_idx on public.community_resources (subject, grade, kind);
alter table public.community_resources enable row level security;
revoke all on public.community_resources from anon, authenticated;

create table if not exists public.community_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references public.community_resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);
alter table public.community_saves enable row level security;
revoke all on public.community_saves from anon, authenticated;

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.community_resources(id) on delete cascade,
  reporter uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason text not null check (reason in ('ban_quyen', 'hoc_sinh', 'sai_kien_thuc', 'khong_phu_hop', 'khac')),
  note text not null default '' check (char_length(note) <= 500),
  status text not null default 'moi' check (status in ('moi', 'da_xu_ly', 'bo_qua')),
  created_at timestamptz not null default now(),
  unique (resource_id, reporter)
);
alter table public.community_reports enable row level security;
revoke all on public.community_reports from anon, authenticated;

alter table public.slide_decks add column if not exists remixed_from uuid references public.community_resources(id) on delete set null;

-- Người đang xem có được thấy tài nguyên này không (giáo viên; cùng trường hoặc mức "mọi giáo viên"; tác giả luôn thấy bài mình)
create or replace function public.community_can_see(p_owner uuid, p_school uuid, p_visibility text, p_status text)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and public.is_teacher_user() and (
    p_owner = auth.uid()
    or (p_status = 'hien' and (p_visibility = 'giao_vien' or (p_school is not null and p_school = public.library_school())))
  );
$$;
revoke all on function public.community_can_see(uuid, uuid, text, text) from public, anon;
grant execute on function public.community_can_see(uuid, uuid, text, text) to authenticated;

-- Thẻ tài nguyên (KHÔNG kèm snapshot — snapshot chỉ tải khi mở xem)
create or replace function public.community_card(r public.community_resources)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', r.id, 'kind', r.kind, 'title', r.title, 'summary', r.summary, 'subject', r.subject, 'grade', r.grade,
    'book', r.book, 'lessonRef', r.lesson_ref, 'license', r.license, 'visibility', r.visibility, 'status', r.status,
    'saves', r.saves, 'copies', r.copies, 'createdAt', r.created_at, 'remixedFrom', r.remixed_from,
    'mine', r.owner = auth.uid(),
    'saved', exists (select 1 from public.community_saves s where s.resource_id = r.id and s.user_id = auth.uid()),
    'author', jsonb_build_object(
      'id', r.owner,
      'name', coalesce((select p.display_name from public.profiles p where p.id = r.owner), 'Giáo viên'),
      'school', case when coalesce((select cp.show_school from public.community_profiles cp where cp.user_id = r.owner), true)
                     then (select s.name from public.schools s where s.id = r.school_id) end
    )
  );
$$;
revoke all on function public.community_card(public.community_resources) from public, anon;

-- Danh sách kho chia sẻ: lọc theo chữ (tên, tóm tắt, bài), môn, khối, loại; p_tab: 'kho' | 'da_dang' | 'da_luu'
create or replace function public.community_list(
  p_tab text default 'kho', p_q text default '', p_subject text default '', p_grade int default null, p_kind text default '',
  p_limit int default 24, p_offset int default 0
) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_q text := lower(trim(coalesce(p_q, '')));
begin
  if auth.uid() is null or not public.is_teacher_user() then raise exception 'not_allowed' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(public.community_card(t) order by t.created_at desc)
    from public.community_resources t
    where t.id in (
      select r.id from public.community_resources r
      where public.community_can_see(r.owner, r.school_id, r.visibility, r.status)
        and (p_tab <> 'da_dang' or r.owner = auth.uid())
        and (p_tab <> 'da_luu' or exists (select 1 from public.community_saves s where s.resource_id = r.id and s.user_id = auth.uid()))
        and (p_tab <> 'kho' or r.status = 'hien')
        and (v_q = '' or position(v_q in lower(r.title || ' ' || r.summary || ' ' || r.lesson_ref)) > 0)
        and (coalesce(p_subject, '') = '' or r.subject = p_subject)
        and (p_grade is null or r.grade = p_grade)
        and (coalesce(p_kind, '') = '' or r.kind = p_kind)
      order by r.created_at desc
      limit least(greatest(p_limit, 1), 60) offset greatest(p_offset, 0)
    )
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.community_list(text, text, text, int, text, int, int) from public, anon;
grant execute on function public.community_list(text, text, text, int, text, int, int) to authenticated;

-- Mở một tài nguyên (kèm snapshot)
create or replace function public.community_get(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r public.community_resources;
begin
  select * into r from public.community_resources where id = p_id;
  if r.id is null or not public.community_can_see(r.owner, r.school_id, r.visibility, r.status) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  return public.community_card(r) || jsonb_build_object('snapshot', r.snapshot, 'contentHash', r.content_hash);
end;
$$;
revoke all on function public.community_get(uuid) from public, anon;
grant execute on function public.community_get(uuid) to authenticated;

-- Đăng tài nguyên. Bản chụp do trình soạn gửi lên; nguồn (nếu có) phải là bài của chính người đăng.
-- Mã băm tính ở máy chủ. Tối đa 30 lần đăng / giờ / người (chống spam).
create or replace function public.community_publish(
  p_kind text, p_title text, p_summary text, p_subject text, p_grade int, p_book text, p_lesson_ref text,
  p_license text, p_visibility text, p_snapshot jsonb, p_source_table text default null, p_source_id uuid default null,
  p_remixed_from uuid default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_owner_ok boolean := true;
begin
  if auth.uid() is null or not public.is_teacher_user() then raise exception 'not_allowed' using errcode = '42501'; end if;
  if not public.rate_hit('community_publish:' || auth.uid()::text, 30, 3600) then raise exception 'rate_limited' using errcode = '54000'; end if;
  if p_source_table = 'slide_decks' then
    v_owner_ok := exists (select 1 from public.slide_decks d where d.id = p_source_id and d.owner = auth.uid());
  elsif p_source_table is not null then
    v_owner_ok := p_source_id is not null; -- các nguồn khác: kiểm quyền ở giai đoạn 1 khi nối trình soạn tương ứng
  end if;
  if not v_owner_ok then raise exception 'not_owner' using errcode = '42501'; end if;
  insert into public.community_resources (owner, school_id, kind, title, summary, subject, grade, book, lesson_ref, license, visibility,
    snapshot, content_hash, source_table, source_id, remixed_from)
  values (auth.uid(), public.library_school(), p_kind, trim(p_title), coalesce(trim(p_summary), ''), coalesce(p_subject, ''), p_grade,
    coalesce(p_book, ''), coalesce(trim(p_lesson_ref), ''), p_license, p_visibility,
    p_snapshot, encode(sha256(convert_to(p_snapshot::text, 'UTF8')), 'hex'), p_source_table, p_source_id, p_remixed_from)
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.community_publish(text, text, text, text, int, text, text, text, text, jsonb, text, uuid, uuid) from public, anon;
grant execute on function public.community_publish(text, text, text, text, int, text, text, text, text, jsonb, text, uuid, uuid) to authenticated;

-- Tác giả ẩn / hiện lại bài của mình; quản trị hệ thống gỡ ('go')
create or replace function public.community_set_status(p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_status = 'go' then
    if not public.is_system_admin_user() then raise exception 'not_allowed' using errcode = '42501'; end if;
  elsif p_status in ('hien', 'an') then
    if not exists (select 1 from public.community_resources where id = p_id and owner = auth.uid() and status <> 'go') then
      raise exception 'not_allowed' using errcode = '42501';
    end if;
  else raise exception 'bad_status';
  end if;
  update public.community_resources set status = p_status, updated_at = now() where id = p_id;
end;
$$;
revoke all on function public.community_set_status(uuid, text) from public, anon;
grant execute on function public.community_set_status(uuid, text) to authenticated;

-- Lưu / bỏ lưu (trả về trạng thái mới)
create or replace function public.community_toggle_save(p_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare r public.community_resources;
begin
  select * into r from public.community_resources where id = p_id;
  if r.id is null or not public.community_can_see(r.owner, r.school_id, r.visibility, r.status) then raise exception 'not_found' using errcode = 'P0002'; end if;
  if exists (select 1 from public.community_saves where user_id = auth.uid() and resource_id = p_id) then
    delete from public.community_saves where user_id = auth.uid() and resource_id = p_id;
    update public.community_resources set saves = greatest(saves - 1, 0) where id = p_id;
    return false;
  end if;
  insert into public.community_saves (user_id, resource_id) values (auth.uid(), p_id);
  update public.community_resources set saves = saves + 1 where id = p_id;
  return true;
end;
$$;
revoke all on function public.community_toggle_save(uuid) from public, anon;
grant execute on function public.community_toggle_save(uuid) to authenticated;

-- Báo vi phạm: mỗi người báo một lần mỗi tài nguyên; báo tin cho quản trị
create or replace function public.community_report(p_id uuid, p_reason text, p_note text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare r public.community_resources;
begin
  select * into r from public.community_resources where id = p_id;
  if r.id is null or not public.community_can_see(r.owner, r.school_id, r.visibility, r.status) then raise exception 'not_found' using errcode = 'P0002'; end if;
  if not public.rate_hit('community_report:' || auth.uid()::text, 20, 3600) then raise exception 'rate_limited' using errcode = '54000'; end if;
  insert into public.community_reports (resource_id, reason, note) values (p_id, p_reason, coalesce(p_note, ''))
  on conflict (resource_id, reporter) do update set reason = excluded.reason, note = excluded.note, status = 'moi', created_at = now();
end;
$$;
revoke all on function public.community_report(uuid, text, text) from public, anon;
grant execute on function public.community_report(uuid, text, text) to authenticated;

-- Hồ sơ cộng đồng: đọc (của mình hoặc người khác) và lưu (của mình)
create or replace function public.community_profile(p_user uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_user uuid := coalesce(p_user, auth.uid()); v jsonb;
begin
  if auth.uid() is null or not public.is_teacher_user() then raise exception 'not_allowed' using errcode = '42501'; end if;
  select jsonb_build_object(
    'id', p.id, 'name', p.display_name,
    'bio', coalesce(cp.bio, ''), 'subjects', coalesce(to_jsonb(cp.subjects), '[]'), 'grades', coalesce(to_jsonb(cp.grades), '[]'),
    'book', coalesce(cp.book, ''), 'showSchool', coalesce(cp.show_school, true),
    'verified', exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role = 'teacher'),
    'resources', (select count(*) from public.community_resources r where r.owner = p.id and r.status = 'hien'),
    'copies', (select coalesce(sum(r.copies), 0) from public.community_resources r where r.owner = p.id and r.status = 'hien')
  ) into v
  from public.profiles p left join public.community_profiles cp on cp.user_id = p.id
  where p.id = v_user;
  return v;
end;
$$;
revoke all on function public.community_profile(uuid) from public, anon;
grant execute on function public.community_profile(uuid) to authenticated;

create or replace function public.community_save_profile(p_bio text, p_subjects text[], p_grades smallint[], p_book text, p_show_school boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.is_teacher_user() then raise exception 'not_allowed' using errcode = '42501'; end if;
  insert into public.community_profiles (user_id, bio, subjects, grades, book, show_school, updated_at)
  values (auth.uid(), coalesce(trim(p_bio), ''), coalesce(p_subjects, '{}'), coalesce(p_grades, '{}'), coalesce(trim(p_book), ''), coalesce(p_show_school, true), now())
  on conflict (user_id) do update set bio = excluded.bio, subjects = excluded.subjects, grades = excluded.grades,
    book = excluded.book, show_school = excluded.show_school, updated_at = now();
end;
$$;
revoke all on function public.community_save_profile(text, text[], smallint[], text, boolean) from public, anon;
grant execute on function public.community_save_profile(text, text[], smallint[], text, boolean) to authenticated;
