-- "Kho của tôi": ảnh / mô hình giáo viên tự tải lên để dùng làm hoa văn góc vở (trang vở luyện chữ)
-- và vật thể trong Xưởng bài giảng 3D. File đã được chuẩn hoá ngay trên trình duyệt trước khi tải lên
-- (cắt viền, thu về khung vuông, nén ảnh; mô hình .glb: thu về 1 ô sa bàn, đặt đáy chạm sàn, giảm ảnh bề mặt).
-- Mỗi giáo viên chỉ thấy file của mình. Giới hạn 100 MB và 300 file mỗi người.

-- ---------------------------------------------------------------- bucket (riêng tư, đọc qua đường dẫn ký)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('teacher-assets', 'teacher-assets', false, 20971520,
        array['image/webp', 'image/png', 'image/jpeg', 'model/gltf-binary', 'application/octet-stream'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Đường dẫn: <id người dùng>/<tên file>. Chỉ giáo viên / quản trị được tải lên, chỉ trong thư mục của mình.
drop policy if exists "teacher_assets_read" on storage.objects;
create policy "teacher_assets_read" on storage.objects for select to authenticated
  using (bucket_id = 'teacher-assets' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "teacher_assets_insert" on storage.objects;
create policy "teacher_assets_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'teacher-assets' and (storage.foldername(name))[1] = auth.uid()::text
              and exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role in ('teacher', 'system_admin')));
drop policy if exists "teacher_assets_delete" on storage.objects;
create policy "teacher_assets_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'teacher-assets' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- danh sách file
create table if not exists public.teacher_assets (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('deco', 'model', 'image')),
  name text not null default '' check (char_length(name) <= 80),
  path text not null check (char_length(path) <= 300),
  thumb_path text check (char_length(thumb_path) <= 300),
  bytes integer not null default 0 check (bytes >= 0 and bytes <= 20971520),
  meta jsonb not null default '{}'::jsonb check (pg_column_size(meta) <= 4000),
  created_at timestamptz not null default now()
);
create index if not exists teacher_assets_owner_idx on public.teacher_assets (owner, kind, created_at desc);
alter table public.teacher_assets enable row level security;
revoke all on public.teacher_assets from anon;
grant select, insert, update, delete on public.teacher_assets to authenticated;

drop policy if exists teacher_assets_owner_select on public.teacher_assets;
create policy teacher_assets_owner_select on public.teacher_assets for select to authenticated using (owner = auth.uid());
drop policy if exists teacher_assets_owner_insert on public.teacher_assets;
create policy teacher_assets_owner_insert on public.teacher_assets for insert to authenticated
  with check (owner = auth.uid()
              and split_part(path, '/', 1) = auth.uid()::text
              and (thumb_path is null or split_part(thumb_path, '/', 1) = auth.uid()::text)
              and exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role in ('teacher', 'system_admin')));
drop policy if exists teacher_assets_owner_update on public.teacher_assets;
create policy teacher_assets_owner_update on public.teacher_assets for update to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid() and split_part(path, '/', 1) = auth.uid()::text);
drop policy if exists teacher_assets_owner_delete on public.teacher_assets;
create policy teacher_assets_owner_delete on public.teacher_assets for delete to authenticated using (owner = auth.uid());

-- Giới hạn dung lượng: 100 MB và 300 file mỗi giáo viên
create or replace function public.teacher_assets_quota() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_n integer; v_bytes bigint;
begin
  select count(*), coalesce(sum(bytes), 0) into v_n, v_bytes from public.teacher_assets where owner = new.owner;
  if v_n >= 300 then raise exception 'too_many' using errcode = '22023'; end if;
  if v_bytes + new.bytes > 104857600 then raise exception 'quota' using errcode = '22023'; end if;
  return new;
end;
$$;
drop trigger if exists teacher_assets_quota on public.teacher_assets;
create trigger teacher_assets_quota before insert on public.teacher_assets for each row execute function public.teacher_assets_quota();
revoke all on function public.teacher_assets_quota() from public, anon, authenticated;

-- Dung lượng đã dùng (để hiện "đã dùng x / 100 MB")
create or replace function public.teacher_assets_usage()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('files', count(*), 'bytes', coalesce(sum(bytes), 0), 'limit', 104857600)
  from public.teacher_assets where owner = auth.uid();
$$;
revoke all on function public.teacher_assets_usage() from public, anon;
grant execute on function public.teacher_assets_usage() to authenticated;
