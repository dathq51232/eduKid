-- Kiểm thử 0023: kho giáo án dùng chung trong TRƯỜNG; trường khác, học sinh, khách không đọc được. Chạy sau 103/104. Dữ liệu demo.
\set ON_ERROR_STOP 0
insert into public.schools(id,name) values ('00000000-0000-0000-0000-0000000023a2','Trường Demo 23B') on conflict do nothing;
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000023f3','gv23c@demo.local') on conflict do nothing;
insert into public.user_roles(user_id, role, school_id) values ('00000000-0000-0000-0000-0000000023f3','teacher','00000000-0000-0000-0000-0000000023a2') on conflict do nothing;
\echo == GV A nap 2 giao an tu 1 file, nap lai cung file (mong doi: 2, 2 — thay, khong nhan doi)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
select public.library_import('TOÁN K1/TOÁN TUẦN 5.docx', '[{"subject":"toan","extra":false,"grade":1,"week":5,"lessonNo":4,"periods":[4],"ppct":null,"title":"BÀI 4: SO SÁNH SỐ - TIẾT 4","topic":"","plan":{"v":1,"title":"Bài 4"}},{"subject":"toan","grade":1,"week":5,"lessonNo":5,"periods":[1],"title":"BÀI 5: MẤY VÀ MẤY - TIẾT 1","plan":{"v":1}}]'::jsonb) as lan1;
select public.library_import('TOÁN K1/TOÁN TUẦN 5.docx', '[{"subject":"toan","grade":1,"week":5,"lessonNo":4,"periods":[4],"title":"BÀI 4: SO SÁNH SỐ - TIẾT 4","plan":{"v":1,"title":"Bài 4 (sửa)"}},{"subject":"hdtn","grade":1,"week":5,"periods":[],"title":"SINH HOẠT DƯỚI CỜ","plan":{"v":1}}]'::jsonb) as lan2;
select count(*) as tong, string_agg(subject, ',' order by subject) as mon, max(periods::text) as tiet from public.library_list(1::smallint); commit;
\echo == GV B cung truong: thay danh muc va noi dung (mong doi: 2, "Bài 4 (sửa)")
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f2';
select count(*) as gv_b_thay from public.library_list(null);
select data->>'title' as noi_dung from public.library_get(array(select id from public.library_list(1::smallint) where subject = 'toan')); rollback;
select string_agg(id::text, ',') as ids from public.plan_library \gset
\echo == GV truong khac: 0 dong, get 0 dong, xoa 0 (mong doi: 0, 0, 0)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000023f3';
select count(*) as truong_khac from public.library_list(null);
select count(*) as get_truong_khac from public.library_get(string_to_array(:'ids', ',')::uuid[]);
select public.library_delete(null) as xoa_truong_khac; rollback;
\echo == Hoc sinh / khach (mong doi: not_allowed, permission denied x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021e1';
select * from public.library_list(null); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021e1';
select * from public.plan_library; rollback;
begin; set local role anon;
select * from public.library_list(null); rollback;
\echo == Du lieu sai (mong doi: check constraint, invalid_items)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
select public.library_import('x.docx', '[{"subject":"Toán!","grade":1,"title":"x","plan":{}}]'::jsonb); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
select public.library_import('x.docx', '{"a":1}'::jsonb); rollback;
\echo == Xoa theo file (mong doi: 2, roi 0 dong)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
select public.library_delete('TOÁN K1/TOÁN TUẦN 5.docx') as da_xoa;
select count(*) as con_lai from public.library_list(null); commit;
