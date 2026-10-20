-- EduChain Kids 0024: KHO GIÁO ÁN GIỮ NGUYÊN BẢN GỐC (chữ, bảng tô màu, hình ảnh).
-- CHỈ THÊM MỚI / NỚI GIỚI HẠN, chạy lại an toàn. Cần chạy sau 0021, 0023.
-- 1) Bucket Storage "plan-library" (riêng tư): hình trong giáo án, mỗi trường một thư mục <school_id>/<sha1>.<đuôi>.
--    Chỉ giáo viên / quản lí của trường đọc, thêm, xoá hình trong thư mục trường mình.
-- 2) Nới giới hạn cỡ dữ liệu một giáo án (bản gốc dạng HTML lớn hơn bản tóm tắt).
-- 3) library_import nhận từng phần (p_append) để nạp file lớn không vượt giới hạn một lần gửi.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('plan-library', 'plan-library', false, 5242880, array['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "plan_library_images_read" on storage.objects;
create policy "plan_library_images_read" on storage.objects for select to authenticated
  using (bucket_id = 'plan-library' and (storage.foldername(name))[1] = public.library_school()::text);
drop policy if exists "plan_library_images_insert" on storage.objects;
create policy "plan_library_images_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'plan-library' and (storage.foldername(name))[1] = public.library_school()::text);
drop policy if exists "plan_library_images_update" on storage.objects;
create policy "plan_library_images_update" on storage.objects for update to authenticated
  using (bucket_id = 'plan-library' and (storage.foldername(name))[1] = public.library_school()::text)
  with check (bucket_id = 'plan-library' and (storage.foldername(name))[1] = public.library_school()::text);
drop policy if exists "plan_library_images_delete" on storage.objects;
create policy "plan_library_images_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'plan-library' and (storage.foldername(name))[1] = public.library_school()::text);

-- giới hạn cỡ (pg_column_size đo sau nén): 1,5 MB một giáo án
alter table public.plan_library drop constraint if exists plan_library_data_check;
alter table public.plan_library add constraint plan_library_data_check check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 1500000);
alter table public.lesson_plans drop constraint if exists lesson_plans_data_check;
alter table public.lesson_plans add constraint lesson_plans_data_check check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 1500000);

-- Nạp giáo án của một file nguồn; p_append = false (lần đầu) thì thay toàn bộ giáo án cũ của file đó
drop function if exists public.library_import(text, jsonb);
create or replace function public.library_import(p_source text, p_items jsonb, p_append boolean default false)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_school uuid := public.library_school(); v_n integer;
begin
  if auth.uid() is null or v_school is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 300 then raise exception 'invalid_items' using errcode = '22023'; end if;
  if (select count(*) from public.plan_library where school_id = v_school and (p_append or source <> trim(p_source))) + jsonb_array_length(p_items) > 20000 then
    raise exception 'library_full' using errcode = '54000';
  end if;
  if not p_append then delete from public.plan_library where school_id = v_school and source = trim(p_source); end if;
  insert into public.plan_library (school_id, source, subject, extra, grade, week, lesson_no, periods, ppct, title, topic, data, created_by)
  select v_school, trim(p_source), i->>'subject', coalesce((i->>'extra')::boolean, false), (i->>'grade')::smallint,
         nullif(i->>'week', '')::smallint, nullif(i->>'lessonNo', '')::smallint,
         coalesce(array(select jsonb_array_elements_text(coalesce(i->'periods', '[]'::jsonb))::smallint), '{}'),
         nullif(i->>'ppct', '')::smallint, left(i->>'title', 300), left(coalesce(i->>'topic', ''), 300), i->'plan', auth.uid()
  from jsonb_array_elements(p_items) i;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke all on function public.library_import(text, jsonb, boolean) from public, anon;
grant execute on function public.library_import(text, jsonb, boolean) to authenticated;
