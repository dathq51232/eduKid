-- Kiểm thử 0043: kho file của giáo viên (hoa văn góc vở, vật thể 3D). Chạy sau 112 (dùng giáo viên, học sinh của 112).
\set ON_ERROR_STOP 0
\echo == Giáo viên ghi file vào thư mục của mình (mong doi: 1 | dung_luong > 0)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
insert into public.teacher_assets (kind, name, path, thumb_path, bytes, meta) values ('deco', 'Hoa', '00000000-0000-0000-0000-0000000039f1/deco-1.webp', null, 1000, '{"flip":true}');
select count(*) as so_file from public.teacher_assets; select (public.teacher_assets_usage()->>'bytes')::int > 0 as dung_luong;
commit;
\echo == Ghi vào thư mục người khác / học sinh ghi (mong doi: loi RLS x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
insert into public.teacher_assets (kind, name, path, bytes) values ('deco', 'x', '00000000-0000-0000-0000-0000000039f2/deco-2.webp', 10); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a1';
insert into public.teacher_assets (kind, name, path, bytes) values ('deco', 'x', '00000000-0000-0000-0000-0000000039a1/deco-3.webp', 10); rollback;
\echo == Giáo viên khác không thấy file (mong doi: 0)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f2';
select count(*) as gv_khac_thay from public.teacher_assets; rollback;
\echo == Vượt 100 MB (mong doi: quota)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
insert into public.teacher_assets (kind, name, path, bytes) values ('model', 'a', '00000000-0000-0000-0000-0000000039f1/m1.glb', 20000000);
insert into public.teacher_assets (kind, name, path, bytes) values ('model', 'b', '00000000-0000-0000-0000-0000000039f1/m2.glb', 20000000);
insert into public.teacher_assets (kind, name, path, bytes) values ('model', 'c', '00000000-0000-0000-0000-0000000039f1/m3.glb', 20000000);
insert into public.teacher_assets (kind, name, path, bytes) values ('model', 'd', '00000000-0000-0000-0000-0000000039f1/m4.glb', 20000000);
insert into public.teacher_assets (kind, name, path, bytes) values ('model', 'e', '00000000-0000-0000-0000-0000000039f1/m5.glb', 20000000);
insert into public.teacher_assets (kind, name, path, bytes) values ('model', 'f', '00000000-0000-0000-0000-0000000039f1/m6.glb', 20000000);
rollback;
\echo == Xoá file của mình (mong doi: DELETE 1)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
delete from public.teacher_assets where path = '00000000-0000-0000-0000-0000000039f1/deco-1.webp'; commit;
