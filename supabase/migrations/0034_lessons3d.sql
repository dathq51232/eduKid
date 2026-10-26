-- EduChain Kids 0034: XƯỞNG BÀI GIẢNG 3D — giáo viên tự soạn bài giảng 3D (đồ vật, cảnh, điểm chạm, thử thách).
-- CHỈ THÊM MỚI, chạy lại an toàn. Mỗi bài lưu gọn trong cột data (jsonb, thường vài KB).
-- Quyền: chỉ người soạn đọc / sửa / xoá bài của mình (RLS). Chia sẻ cho tổ / trường: làm ở bước sau.

create table if not exists public.lessons3d (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  title text not null default 'Bài giảng 3D' check (char_length(title) between 1 and 120),
  grade smallint not null default 1 check (grade between 1 and 5),
  stem_ref text check (stem_ref is null or stem_ref ~ '^[1-5]-[0-9]{1,2}$'),
  data jsonb not null default '{}'::jsonb check (octet_length(data::text) <= 200000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lessons3d_owner_idx on public.lessons3d (owner, updated_at desc);
alter table public.lessons3d enable row level security;

drop policy if exists lessons3d_owner_select on public.lessons3d;
create policy lessons3d_owner_select on public.lessons3d for select to authenticated using (owner = auth.uid());
drop policy if exists lessons3d_owner_insert on public.lessons3d;
create policy lessons3d_owner_insert on public.lessons3d for insert to authenticated
  with check (owner = auth.uid() and exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role in ('teacher', 'system_admin')));
drop policy if exists lessons3d_owner_update on public.lessons3d;
create policy lessons3d_owner_update on public.lessons3d for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists lessons3d_owner_delete on public.lessons3d;
create policy lessons3d_owner_delete on public.lessons3d for delete to authenticated using (owner = auth.uid());

revoke all on public.lessons3d from anon;
grant select, insert, update, delete on public.lessons3d to authenticated;

-- Tự cập nhật updated_at khi sửa
create or replace function public.lessons3d_touch() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); new.owner := old.owner; return new; end; $$;
drop trigger if exists lessons3d_touch on public.lessons3d;
create trigger lessons3d_touch before update on public.lessons3d for each row execute function public.lessons3d_touch();

-- Giới hạn 200 bài / giáo viên để tránh lạm dụng dung lượng
create or replace function public.lessons3d_limit() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.lessons3d where owner = new.owner) >= 200 then raise exception 'too_many_lessons' using errcode = 'P0003'; end if;
  return new;
end; $$;
drop trigger if exists lessons3d_limit on public.lessons3d;
create trigger lessons3d_limit before insert on public.lessons3d for each row execute function public.lessons3d_limit();
revoke all on function public.lessons3d_limit() from public, anon, authenticated;
