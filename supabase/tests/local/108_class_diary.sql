-- Kiểm thử 0026: sổ lớp hằng ngày — chỉ giáo viên của lớp đọc/ghi; lưu lại cả ngày giữ dấu đã chép tin nhắn; tổng hợp theo khoảng ngày.
\set ON_ERROR_STOP 0
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000026f1','gv26@demo.local'),('00000000-0000-0000-0000-0000000026f2','gv26b@demo.local');
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000026f1';
select public.request_teacher_role('Trường SL 26', null) is not null as gv1; commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000026f2';
select public.request_teacher_role('Trường SL 26b', null) is not null as gv2; commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000026f1';
select public.teacher_create_class('1A', 1::smallint) as c \gset
select count(*) as them from public.teacher_add_students(:'c', array['Em Một','Em Hai','Em Ba'], 'v1', true); commit;
select student_id as s1 from public.class_memberships m join public.students s on s.id = m.student_id where m.class_id = :'c' and s.display_name = 'Em Một' \gset
select student_id as s2 from public.class_memberships m join public.students s on s.id = m.student_id where m.class_id = :'c' and s.display_name = 'Em Hai' \gset

\echo == Luu ngay 20/10: Em Mot vang khong phep, Em Hai co nhan khen + ghi chu (mong doi: 2 dong)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000026f1';
select public.teacher_diary_save(:'c', date '2026-10-20', jsonb_build_array(
  jsonb_build_object('student_id', :'s1', 'status', 'unexcused'),
  jsonb_build_object('student_id', :'s2', 'status', 'present', 'tags', jsonb_build_array('★ Tiến bộ', 'Quên đồ dùng'), 'note', 'Đọc trơn bài 8')), 'Bài về nhà: Toán trang 34') is not null as luu;
select jsonb_array_length(public.teacher_diary_day(:'c', date '2026-10-20')->'entries') as so_dong,
       public.teacher_diary_day(:'c', date '2026-10-20')->>'announcement' as thong_bao; commit;
\echo == Chep tin cho Em Mot, roi luu lai ngay do khong con Em Mot (mong doi: Em Mot giu dong, status present, copied true)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000026f1';
select public.teacher_diary_copied(:'c', date '2026-10-20', :'s1');
select public.teacher_diary_save(:'c', date '2026-10-20', jsonb_build_array(jsonb_build_object('student_id', :'s2', 'tags', jsonb_build_array('★ Tiến bộ'))), null) is not null as luu2;
select e->>'status' as trang_thai, e->>'copied' as da_chep from jsonb_array_elements(public.teacher_diary_day(:'c', date '2026-10-20')->'entries') e where e->>'student_id' = :'s1'; commit;
\echo == Tong hop khoang ngay (mong doi: 1 ngay, 2 dong)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000026f1';
select jsonb_array_length(r->'days') as so_ngay, jsonb_array_length(r->'entries') as so_dong from public.teacher_diary_range(:'c', date '2026-10-01', date '2026-10-31') r; commit;
\echo == Giao vien khac doc / ghi (mong doi: not_allowed x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000026f2';
select public.teacher_diary_day(:'c', date '2026-10-20'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000026f2';
select public.teacher_diary_save(:'c', date '2026-10-21', '[]'::jsonb, null); rollback;
\echo == Hoc sinh khong thuoc lop (mong doi: not_in_class), trang thai la (invalid_status), ngay tuong lai (invalid_day)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000026f1';
select public.teacher_diary_save(:'c', date '2026-10-21', jsonb_build_array(jsonb_build_object('student_id', gen_random_uuid())), null); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000026f1';
select public.teacher_diary_save(:'c', date '2026-10-21', jsonb_build_array(jsonb_build_object('student_id', :'s1', 'status', 'nghi')), null); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000026f1';
select public.teacher_diary_save(:'c', current_date + 30, '[]'::jsonb, null); rollback;
\echo == Doc bang truc tiep (mong doi: permission denied), khach goi ham (mong doi: permission denied)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000026f1';
select count(*) from public.class_diary_entries; rollback;
begin; set local role anon; select public.teacher_diary_day(:'c', date '2026-10-20'); rollback;
