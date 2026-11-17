-- EduChain Kids 0066: XƯỞNG VIDEO CHỈ DÀNH CHO QUẢN TRỊ. Chạy sau 0064, chạy lại an toàn.
-- Giáo viên không còn đọc / ghi thư viện nhân vật, bối cảnh, dự án video và ảnh tham chiếu.
-- Mọi quản trị viên dùng chung: thấy và sửa được tất cả nhân vật, bối cảnh, dự án (không còn phân riêng / chung).

drop policy if exists video_library_read on public.video_library;
create policy video_library_read on public.video_library for select to authenticated using (public.is_system_admin_user());
drop policy if exists video_library_insert on public.video_library;
create policy video_library_insert on public.video_library for insert to authenticated with check (owner = auth.uid() and public.is_system_admin_user());
drop policy if exists video_library_update on public.video_library;
create policy video_library_update on public.video_library for update to authenticated using (public.is_system_admin_user()) with check (public.is_system_admin_user());
drop policy if exists video_library_delete on public.video_library;
create policy video_library_delete on public.video_library for delete to authenticated using (public.is_system_admin_user());

drop policy if exists video_projects_read on public.video_projects;
create policy video_projects_read on public.video_projects for select to authenticated using (public.is_system_admin_user());
drop policy if exists video_projects_insert on public.video_projects;
create policy video_projects_insert on public.video_projects for insert to authenticated with check (owner = auth.uid() and public.is_system_admin_user());
drop policy if exists video_projects_update on public.video_projects;
create policy video_projects_update on public.video_projects for update to authenticated using (public.is_system_admin_user()) with check (public.is_system_admin_user());
drop policy if exists video_projects_delete on public.video_projects;
create policy video_projects_delete on public.video_projects for delete to authenticated using (public.is_system_admin_user());

drop policy if exists "video_refs_read" on storage.objects;
create policy "video_refs_read" on storage.objects for select to authenticated
  using (bucket_id = 'video-refs' and public.is_system_admin_user());
drop policy if exists "video_refs_insert" on storage.objects;
create policy "video_refs_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'video-refs' and (storage.foldername(name))[1] = auth.uid()::text and public.is_system_admin_user());
drop policy if exists "video_refs_delete" on storage.objects;
create policy "video_refs_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'video-refs' and public.is_system_admin_user());
