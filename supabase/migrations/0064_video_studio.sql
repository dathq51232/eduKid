-- EduChain Kids 0064: XƯỞNG VIDEO STICKMAN (giáo viên + quản trị dùng chung).
-- CHỈ THÊM MỚI, chạy lại an toàn. Cần 0061 (public.is_teacher_user: vai trò teacher hoặc system_admin).
--
-- * video_library: nhân vật (kind 'character') và bối cảnh (kind 'setting') với mô tả cố định bằng tiếng Anh
--   + ảnh tham chiếu. shared = true: mọi giáo viên / quản trị thấy và dùng được; chỉ người tạo (hoặc quản trị) sửa, xoá.
-- * video_projects: dự án video (phân cảnh dạng JSON). shared = true: đồng nghiệp xem được; chỉ người tạo / quản trị sửa.
-- * bucket video-refs (riêng tư): ảnh tham chiếu, đường dẫn <id người tải>/<tên file>; giáo viên / quản trị đọc được tất cả
--   (để dùng nhân vật chung), chỉ tải lên và xoá trong thư mục của mình (quản trị xoá được mọi ảnh).

create or replace function public.is_system_admin_user() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'system_admin');
$$;
revoke all on function public.is_system_admin_user() from public, anon;
grant execute on function public.is_system_admin_user() to authenticated;

create table if not exists public.video_library (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('character', 'setting')),
  name text not null check (char_length(name) between 1 and 60),
  note text not null default '' check (char_length(note) <= 200),
  anchor text not null check (char_length(anchor) between 10 and 2000),
  refs text[] not null default '{}' check (cardinality(refs) <= 4),
  shared boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists video_library_kind_idx on public.video_library (kind, created_at desc);
alter table public.video_library enable row level security;
revoke all on public.video_library from anon;
grant select, insert, update, delete on public.video_library to authenticated;
drop policy if exists video_library_read on public.video_library;
create policy video_library_read on public.video_library for select to authenticated
  using (owner = auth.uid() or (shared and public.is_teacher_user()));
drop policy if exists video_library_insert on public.video_library;
create policy video_library_insert on public.video_library for insert to authenticated
  with check (owner = auth.uid() and public.is_teacher_user());
drop policy if exists video_library_update on public.video_library;
create policy video_library_update on public.video_library for update to authenticated
  using (owner = auth.uid() or public.is_system_admin_user()) with check (public.is_teacher_user());
drop policy if exists video_library_delete on public.video_library;
create policy video_library_delete on public.video_library for delete to authenticated
  using (owner = auth.uid() or public.is_system_admin_user());

create table if not exists public.video_projects (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) <= 200000),
  shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists video_projects_owner_idx on public.video_projects (owner, updated_at desc);
alter table public.video_projects enable row level security;
revoke all on public.video_projects from anon;
grant select, insert, update, delete on public.video_projects to authenticated;
drop policy if exists video_projects_read on public.video_projects;
create policy video_projects_read on public.video_projects for select to authenticated
  using (owner = auth.uid() or (shared and public.is_teacher_user()));
drop policy if exists video_projects_insert on public.video_projects;
create policy video_projects_insert on public.video_projects for insert to authenticated
  with check (owner = auth.uid() and public.is_teacher_user());
drop policy if exists video_projects_update on public.video_projects;
create policy video_projects_update on public.video_projects for update to authenticated
  using (owner = auth.uid() or public.is_system_admin_user()) with check (public.is_teacher_user());
drop policy if exists video_projects_delete on public.video_projects;
create policy video_projects_delete on public.video_projects for delete to authenticated
  using (owner = auth.uid() or public.is_system_admin_user());

-- ---------------------------------------------------------------- ảnh tham chiếu
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('video-refs', 'video-refs', false, 5242880, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "video_refs_read" on storage.objects;
create policy "video_refs_read" on storage.objects for select to authenticated
  using (bucket_id = 'video-refs' and public.is_teacher_user());
drop policy if exists "video_refs_insert" on storage.objects;
create policy "video_refs_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'video-refs' and (storage.foldername(name))[1] = auth.uid()::text and public.is_teacher_user());
drop policy if exists "video_refs_delete" on storage.objects;
create policy "video_refs_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'video-refs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_system_admin_user()));
