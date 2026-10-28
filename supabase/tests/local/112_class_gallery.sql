-- Kiểm thử 0039: phòng triển lãm lớp — giáo viên treo / duyệt / xoá; học sinh (phụ huynh dùng tài khoản của con) xem, thả tim,
-- tự nộp (chờ duyệt); người lớp khác, giáo viên khác không đọc được; tên rút gọn khi chọn chế độ "tên gọi".
-- Cần giả lập schema storage (như 106) trước khi chạy 0039.
\set ON_ERROR_STOP 0
create schema if not exists storage;
create table if not exists storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table if not exists storage.objects (id uuid default gen_random_uuid() primary key, bucket_id text, name text, owner uuid);
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000039f1','gv39@demo.local'),('00000000-0000-0000-0000-0000000039f2','gv39b@demo.local'),
  ('00000000-0000-0000-0000-0000000039a1','hs39a@demo.local'),('00000000-0000-0000-0000-0000000039a2','hs39b@demo.local'),('00000000-0000-0000-0000-0000000039a3','hs39c@demo.local')
  on conflict do nothing;
-- chạy lại được: xoá lớp thử của lần trước
update public.students set user_id = null where user_id::text like '00000000-0000-0000-0000-0000000039a_';
delete from public.classes where id in (select class_id from public.class_teachers where teacher_id in ('00000000-0000-0000-0000-0000000039f1','00000000-0000-0000-0000-0000000039f2'));
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.request_teacher_role('Trường TL 39', null) is not null as gv1; commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f2';
select public.request_teacher_role('Trường TL 39b', null) is not null as gv2; commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.teacher_create_class('3A', 3::smallint) as c \gset
select count(*) as them from public.teacher_add_students(:'c', array['Nguyễn Văn An','Trần Thị Bình'], 'v1', true); commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f2';
select public.teacher_create_class('3B', 3::smallint) as c2 \gset
select count(*) as them from public.teacher_add_students(:'c2', array['Lê Văn Cường'], 'v1', true); commit;
select s.id as s1 from public.class_memberships m join public.students s on s.id = m.student_id where m.class_id = :'c' and s.display_name = 'Nguyễn Văn An' \gset
select s.id as s2 from public.class_memberships m join public.students s on s.id = m.student_id where m.class_id = :'c' and s.display_name = 'Trần Thị Bình' \gset
select s.id as s3 from public.class_memberships m join public.students s on s.id = m.student_id where m.class_id = :'c2' \gset
update public.students set user_id = '00000000-0000-0000-0000-0000000039a1' where id = :'s1';
update public.students set user_id = '00000000-0000-0000-0000-0000000039a2' where id = :'s2';
update public.students set user_id = '00000000-0000-0000-0000-0000000039a3' where id = :'s3';

\echo == Giáo viên treo 2 tác phẩm (mong doi: 2 id, hiện ngay)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.gallery_add(:'c', :'s1', 'art', 'Ngôi nhà của em', 'Màu tươi sáng', :'c' || '/a1.webp', 800, 600) as i1 \gset
select public.gallery_add(:'c', :'s2', 'praise', 'Thư khen tháng 10', '', :'c' || '/p1.webp', 1414, 1000) as i2 \gset
select (select count(*) from jsonb_array_elements(public.gallery_list(:'c')->'items') i where i->>'status' = 'shown') as dang_treo; commit;

\echo == Đường dẫn file của lớp khác / em lớp khác (mong doi: invalid_path, not_in_class)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.gallery_add(:'c', :'s1', 'art', 'x', '', :'c2' || '/x.webp', 100, 100); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.gallery_add(:'c', :'s3', 'art', 'x', '', :'c' || '/x.webp', 100, 100); rollback;

\echo == Cài chế độ tên gọi; em Bình xem: tên bạn An rút gọn "An", tên mình đầy đủ (mong doi: An | Trần Thị Bình | 2 bài)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.gallery_set_settings(:'c', 'given', 'tet'); commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a2';
select (select i->>'student_name' from jsonb_array_elements(public.gallery_list(:'c')->'items') i where i->>'kind' = 'art') as ban,
       (select i->>'student_name' from jsonb_array_elements(public.gallery_list(:'c')->'items') i where i->>'kind' = 'praise') as minh,
       jsonb_array_length(public.gallery_list(:'c')->'items') as so_bai, public.gallery_list(:'c')->'settings'->>'theme' as theme; commit;

\echo == Em Bình tự nộp bài luyện chữ (mong doi: pending, thư mục riêng; bạn An không thấy bài chờ duyệt)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a2';
select public.gallery_student_may_upload(:'c' || '/s-' || :'s2' || '/w1.webp') as duoc_tai,
       public.gallery_student_may_upload(:'c' || '/s-' || :'s1' || '/w1.webp') as thu_muc_ban;
select public.gallery_add(:'c', :'s2', 'writing', 'Chữ A hoa', '', :'c' || '/s-' || :'s2' || '/w1.webp', 600, 400) as i3 \gset
select (select i->>'status' from jsonb_array_elements(public.gallery_list(:'c')->'items') i where i->>'id' = :'i3') as trang_thai; commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a1';
select jsonb_array_length(public.gallery_list(:'c')->'items') as an_thay; commit;

\echo == Học sinh nộp hộ bạn / nộp thư khen / thư mục chung (mong doi: not_allowed x3)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a2';
select public.gallery_add(:'c', :'s1', 'art', 'x', '', :'c' || '/s-' || :'s2' || '/x.webp', 100, 100); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a2';
select public.gallery_add(:'c', :'s2', 'praise', 'x', '', :'c' || '/s-' || :'s2' || '/x.webp', 100, 100); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a2';
select public.gallery_add(:'c', :'s2', 'art', 'x', '', :'c' || '/x.webp', 100, 100); rollback;

\echo == Học sinh không duyệt / xoá được (mong doi: not_allowed x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a2';
select public.gallery_update(:'i3', 'shown'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a2';
select public.gallery_delete(:'i1'); rollback;

\echo == Cô duyệt bài (mong doi: shown; An thấy 3 bài)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.gallery_update(:'i3', 'shown', null, 'Nét chữ đều, đẹp');
select (select i->>'status' || ' / ' || (i->>'note') from jsonb_array_elements(public.gallery_list(:'c')->'items') i where i->>'id' = :'i3') as duyet; commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a1';
select jsonb_array_length(public.gallery_list(:'c')->'items') as an_thay; commit;

\echo == Thả tim, đổi sticker, bấm lại để bỏ (mong doi: 1 heart | 1 star | 0 null)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a1';
select public.gallery_heart(:'i1', 'heart') as lan1; select public.gallery_heart(:'i1', 'star') as lan2; select public.gallery_heart(:'i1', 'star') as lan3; commit;

\echo == Lớp khác / giáo viên khác / khách (mong doi: not_allowed x4, gallery_can_view f)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a3';
select public.gallery_list(:'c'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a3';
select public.gallery_heart(:'i1', 'heart'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f2';
select public.gallery_list(:'c'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f2';
select public.gallery_can_view(:'c') as gv_khac_xem; select public.gallery_delete(:'i1'); rollback;
begin; set local role anon;
select public.gallery_list(:'c'); rollback;

\echo == Bảng không đọc trực tiếp (mong doi: permission denied)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a1';
select count(*) from public.gallery_items; rollback;

\echo == Cô xoá: trả về đường dẫn file để xoá trong Storage (mong doi: ["<c>/a1.webp"], tim cũng bị xoá)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.gallery_delete(:'i1') = jsonb_build_array(:'c' || '/a1.webp') as dung_duong_dan; commit;
select count(*) as tim_con_lai from public.gallery_hearts where item_id = :'i1';
