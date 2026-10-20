-- Kiểm thử 0021: giáo án chỉ người soạn đọc/ghi/xoá; chỉ gắn được lớp mình dạy; học sinh/anon không đọc được. Dữ liệu demo.
\set ON_ERROR_STOP 0
insert into public.schools(id,name) values ('00000000-0000-0000-0000-0000000021a1','Trường Demo 21');
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000021f1','gv21a@demo.local'),('00000000-0000-0000-0000-0000000021f2','gv21b@demo.local'),('00000000-0000-0000-0000-0000000021e1','hs21@x');
insert into public.user_roles(user_id, role, school_id) values ('00000000-0000-0000-0000-0000000021f1','teacher','00000000-0000-0000-0000-0000000021a1'),('00000000-0000-0000-0000-0000000021f2','teacher','00000000-0000-0000-0000-0000000021a1');
insert into public.classes(id,school_id,name,grade,created_by) values
  ('00000000-0000-0000-0000-0000000021c1','00000000-0000-0000-0000-0000000021a1','2A',2,'00000000-0000-0000-0000-0000000021f1'),
  ('00000000-0000-0000-0000-0000000021c2','00000000-0000-0000-0000-0000000021a1','2B',2,'00000000-0000-0000-0000-0000000021f2');
insert into public.class_teachers(class_id,teacher_id) values ('00000000-0000-0000-0000-0000000021c1','00000000-0000-0000-0000-0000000021f1'),('00000000-0000-0000-0000-0000000021c2','00000000-0000-0000-0000-0000000021f2');
\echo == GV A tao, sua, liet ke, mo (mong doi: 1 giao an, tieu de da sua, cung id)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
select public.teacher_save_plan(null, '00000000-0000-0000-0000-0000000021c1', 'Bài 5. Phép cộng', 'toan', 2::smallint, '2026-10-19', 2::smallint, '{"v":1,"title":"Bài 5. Phép cộng"}') as id \gset
select public.teacher_save_plan(:'id', '00000000-0000-0000-0000-0000000021c1', 'Bài 5. Phép cộng (sửa)', 'toan', 2::smallint, '2026-10-19', 2::smallint, '{"v":1,"title":"sua"}') = :'id' as cung_id;
select title, class_name, teach_date, period from public.teacher_list_plans(null);
select data ->> 'title' as noi_dung from public.teacher_get_plan(:'id'); commit;
\echo == GV A khong co lop van luu duoc (giao an rieng); gan lop 2B cua GV khac (mong doi: 1 id, roi not_allowed)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
select public.teacher_save_plan(null, null, 'Giáo án chung', 'tieng-viet', 2::smallint, null, null, '{"v":1}') is not null as luu_khong_lop;
select public.teacher_save_plan(null, '00000000-0000-0000-0000-0000000021c2', 'Gắn lớp người khác', 'toan', 2::smallint, null, null, '{"v":1}'); rollback;
\echo == Mon sai / lop sai / tiet sai (mong doi: check constraint x3)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
select public.teacher_save_plan(null, null, 'X giáo án', 'hoa', 2::smallint, null, null, '{}'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
select public.teacher_save_plan(null, null, 'X giáo án', 'toan', 9::smallint, null, null, '{}'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
select public.teacher_save_plan(null, null, 'X giáo án', 'toan', 2::smallint, null, 12::smallint, '{}'); rollback;
\echo == GV B: liet ke (0 dong), mo, sua, xoa giao an cua A (mong doi: 0, not_allowed x3)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f2';
select count(*) as cua_b from public.teacher_list_plans(null); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f2';
select * from public.teacher_get_plan(:'id'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f2';
select public.teacher_save_plan(:'id', '00000000-0000-0000-0000-0000000021c2', 'Chiếm', 'toan', 2::smallint, null, null, '{}'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f2';
select public.teacher_delete_plan(:'id'); rollback;
\echo == Hoc sinh: doc bang, goi ham (mong doi: permission denied, not_allowed); anon goi ham (permission denied)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021e1';
select * from public.lesson_plans; rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021e1';
select * from public.teacher_list_plans(null); rollback;
begin; set local role anon; select * from public.teacher_list_plans(null); rollback;
\echo == Lop bi xoa: giao an van con, class_id = null (mong doi: tong 1, gan_lop 0)
delete from public.classes where id='00000000-0000-0000-0000-0000000021c1';
select count(*) as tong, count(class_id) as gan_lop from public.lesson_plans where owner_id='00000000-0000-0000-0000-0000000021f1';
\echo == GV A xoa (mong doi: con 0)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
select public.teacher_delete_plan(:'id');
select count(*) as con from public.teacher_list_plans(null); commit;
\echo == Chay lai migration (an toan)
\i /home/postgres/sql/0021_lesson_plans.sql
select count(*) as van_con from public.lesson_plans;
