-- Kiểm thử 0040: sắp xếp phòng triển lãm (thứ tự, cỡ khung, cỡ từng tường) và sửa thông tin tác phẩm. Chạy sau 112.
\set ON_ERROR_STOP 0
select c.id as c from public.classes c join public.class_teachers ct on ct.class_id = c.id where ct.teacher_id = '00000000-0000-0000-0000-0000000039f1' limit 1 \gset
select s.id as s1 from public.class_memberships m join public.students s on s.id = m.student_id where m.class_id = :'c' and s.display_name = 'Nguyễn Văn An' \gset
select s.id as s3 from public.students s where s.user_id = '00000000-0000-0000-0000-0000000039a3' \gset
\echo == Cô treo 2 thư khen, xếp thứ tự + cỡ (mong doi: 2 | thứ tự B rồi A | cỡ 0.6 | praise 0.7, art 3 bị giới hạn còn 1.4)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.gallery_add(:'c', :'s1', 'praise', 'Thư A', '', :'c' || '/pa.webp', 1414, 1000) as pa \gset
select public.gallery_add(:'c', null, 'praise', 'Thư B', '', :'c' || '/pb.webp', 1414, 1000) as pb \gset
select public.gallery_arrange(:'c', '{"praise":0.7,"art":3}', jsonb_build_array(jsonb_build_object('id', :'pb', 'pos', 0, 'scale', 0.6), jsonb_build_object('id', :'pa', 'pos', 1))) as so_dong;
select string_agg(i->>'title', ',' order by ord) as thu_tu from jsonb_array_elements(public.gallery_list(:'c')->'items') with ordinality t(i, ord) where i->>'kind' = 'praise';
select (select i->>'scale' from jsonb_array_elements(public.gallery_list(:'c')->'items') i where i->>'id' = :'pb') as co_b,
       public.gallery_list(:'c')->'settings'->'sizes' as sizes; commit;
\echo == Sửa: đổi tên, gắn cả lớp -> gắn em An, chuyển sang tường tranh (mong doi: Thư khen tháng 10 | art | có em)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.gallery_edit(:'pb', 'Thư khen tháng 10', 'Giỏi lắm', :'s1', false, 'art');
select (select (i->>'title') || ' | ' || (i->>'kind') || ' | ' || coalesce(i->>'student_id', 'cả lớp') from jsonb_array_elements(public.gallery_list(:'c')->'items') i where i->>'id' = :'pb') as sau_sua; commit;
\echo == Sai: gắn em lớp khác, loại lạ, cỡ sai kiểu (mong doi: not_in_class, invalid_kind, invalid_sizes)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.gallery_edit(:'pb', null, null, :'s3', false, null); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.gallery_edit(:'pb', null, null, null, false, 'video'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.gallery_arrange(:'c', '{"praise":"to"}', null); rollback;
\echo == Học sinh / giáo viên khác không sắp xếp, không sửa được (mong doi: not_allowed x3)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a1';
select public.gallery_arrange(:'c', null, jsonb_build_array(jsonb_build_object('id', :'pa', 'pos', 5))); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a1';
select public.gallery_edit(:'pa', 'x', null, null, false, null); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f2';
select public.gallery_arrange(:'c', '{"praise":0.5}', null); rollback;
