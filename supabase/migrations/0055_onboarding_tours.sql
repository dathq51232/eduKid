-- Hướng dẫn từng bước lần đầu đăng nhập (giáo viên, phụ huynh): ghi nhớ tour nào đã xem để không hiện lại
-- trên máy khác. Cột tours: { "<mã tour>": "<thời điểm xem xong>" }. Người dùng không sửa thẳng bảng profiles
-- (0002 chỉ cho sửa display_name) nên đọc / ghi qua 2 hàm dưới, luôn theo auth.uid().
alter table public.profiles add column if not exists tours jsonb not null default '{}'::jsonb;

create or replace function public.my_tours()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.tours from public.profiles p where p.id = auth.uid()), '{}'::jsonb);
$$;

create or replace function public.mark_tour(p_key text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;
  if p_key is null or p_key !~ '^[a-z0-9-]{1,40}$' then raise exception 'Mã hướng dẫn không hợp lệ'; end if;
  update public.profiles p
     set tours = p.tours || jsonb_build_object(p_key, now())
   where p.id = auth.uid()
     and (p.tours ? p_key or (select count(*) from jsonb_object_keys(p.tours)) < 60);
end;
$$;

revoke all on function public.my_tours() from public, anon;
revoke all on function public.mark_tour(text) from public, anon;
grant execute on function public.my_tours() to authenticated;
grant execute on function public.mark_tour(text) to authenticated;
