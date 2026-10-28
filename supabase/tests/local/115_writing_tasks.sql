-- Kiểm thử 0042: cô giao bài luyện chữ (trang vở A4), học sinh lớp chỉ thấy bài đang mở. Chạy sau 112 (dùng lớp, em của 112).
\set ON_ERROR_STOP 0
select c.id as c from public.classes c join public.class_teachers ct on ct.class_id = c.id where ct.teacher_id = '00000000-0000-0000-0000-0000000039f1' limit 1 \gset
\echo == Cô lưu 2 bài, bài 2 đóng; dòng trống bị bỏ (mong doi: 2 dong | so_bai 2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.writing_task_save(:'c', null, 'Ca dao tuần 8', array['Công cha như núi Thái Sơn', '  ', 'Nghĩa mẹ như nước trong nguồn chảy ra'], '{"font":"hp4n","paper":4}', true) as t1 \gset
select public.writing_task_save(:'c', null, 'Tục ngữ', array['Có chí thì nên'], '{}', false) as t2 \gset
select jsonb_array_length((select x->'lines' from jsonb_array_elements(public.writing_task_list(:'c')) x where x->>'id' = :'t1')) as dong,
       jsonb_array_length(public.writing_task_list(:'c')) as so_bai;
commit;
\echo == Học sinh lớp chỉ thấy bài đang mở, không thấy cài đặt in (mong doi: 1 | t | {})
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a1';
select jsonb_array_length(public.writing_task_list(:'c')) as hs_thay, (public.writing_task_list(:'c')->0->>'id') = :'t1' as dung_bai, public.writing_task_list(:'c')->0->'sheet' as sheet;
commit;
\echo == Cô mở bài 2, sửa bài 1 (mong doi: hs thấy 2 | tieu de moi)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.writing_task_set_active(:'t2', true);
select public.writing_task_save(:'c', :'t1', 'Ca dao tuần 9', array['Anh em như thể tay chân'], '{}', null) = :'t1' as sua_dung;
select (select x->>'title' from jsonb_array_elements(public.writing_task_list(:'c')) x where x->>'id' = :'t1') as tieu_de;
commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a1';
select jsonb_array_length(public.writing_task_list(:'c')) as hs_thay; commit;
\echo == Bài rỗng / giáo viên khác / học sinh không lưu, không xoá được (mong doi: empty, not_allowed x3)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.writing_task_save(:'c', null, 'x', array['   '], '{}', true); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f2';
select public.writing_task_save(:'c', null, 'x', array['a'], '{}', true); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f2';
select public.writing_task_delete(:'t1'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a1';
select public.writing_task_delete(:'t1'); rollback;
\echo == Cô xoá bài (mong doi: con 1)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.writing_task_delete(:'t2');
select jsonb_array_length(public.writing_task_list(:'c')) as con; commit;
delete from public.writing_tasks where class_id = :'c';
