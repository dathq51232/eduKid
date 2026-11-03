-- EduChain Kids 0046: BÀI THAO GIẢNG — bài trình chiếu kiểu PowerPoint (trang, hiệu ứng, kích hoạt khi bấm, âm thanh,
-- câu hỏi, kéo thả, chèn cảnh 3D). CHỈ THÊM MỚI, chạy lại an toàn.
-- Mỗi bài lưu gọn trong cột data (jsonb): chữ, toạ độ, hiệu ứng; hình / âm thanh tải lên nằm ở kho teacher-assets (0043).
-- Quyền: chỉ người soạn đọc / sửa / xoá bài của mình (RLS), giống bài giảng 3D (0034).

create table if not exists public.slide_decks (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  title text not null default 'Bài thao giảng' check (char_length(title) between 1 and 120),
  grade smallint not null default 1 check (grade between 1 and 5),
  data jsonb not null default '{}'::jsonb check (octet_length(data::text) <= 600000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists slide_decks_owner_idx on public.slide_decks (owner, updated_at desc);
alter table public.slide_decks enable row level security;

drop policy if exists slide_decks_owner_select on public.slide_decks;
create policy slide_decks_owner_select on public.slide_decks for select to authenticated using (owner = auth.uid());
drop policy if exists slide_decks_owner_insert on public.slide_decks;
create policy slide_decks_owner_insert on public.slide_decks for insert to authenticated
  with check (owner = auth.uid() and exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role in ('teacher', 'system_admin')));
drop policy if exists slide_decks_owner_update on public.slide_decks;
create policy slide_decks_owner_update on public.slide_decks for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists slide_decks_owner_delete on public.slide_decks;
create policy slide_decks_owner_delete on public.slide_decks for delete to authenticated using (owner = auth.uid());

revoke all on public.slide_decks from anon;
grant select, insert, update, delete on public.slide_decks to authenticated;

create or replace function public.slide_decks_touch() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); new.owner := old.owner; return new; end; $$;
drop trigger if exists slide_decks_touch on public.slide_decks;
create trigger slide_decks_touch before update on public.slide_decks for each row execute function public.slide_decks_touch();

-- tối đa 200 bài / giáo viên
create or replace function public.slide_decks_limit() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.slide_decks where owner = new.owner) >= 200 then raise exception 'too_many_decks' using errcode = 'P0003'; end if;
  return new;
end; $$;
drop trigger if exists slide_decks_limit on public.slide_decks;
create trigger slide_decks_limit before insert on public.slide_decks for each row execute function public.slide_decks_limit();
revoke all on function public.slide_decks_limit() from public, anon, authenticated;

-- Kho của tôi nhận thêm âm thanh (ghi âm giọng cô, file .mp3) cho bài thao giảng
alter table public.teacher_assets drop constraint if exists teacher_assets_kind_check;
alter table public.teacher_assets add constraint teacher_assets_kind_check check (kind in ('deco', 'model', 'image', 'audio'));
update storage.buckets
   set allowed_mime_types = array['image/webp', 'image/png', 'image/jpeg', 'model/gltf-binary', 'application/octet-stream',
                                  'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/wav', 'audio/x-wav']
 where id = 'teacher-assets';
