-- Kiểm thử 0022: giáo án nhận mọi môn trong lịch báo giảng (mã chữ thường ngắn), vẫn chặn mã môn rác. Chạy sau 103. Dữ liệu demo.
\set ON_ERROR_STOP 0
\echo == Mon ngoai app: dao-duc, tnxh, hdtn, am-nhac (mong doi: 4 id)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
select public.teacher_save_plan(null, null, 'Bài 5: Gia đình của em', s, 2::smallint, '2026-10-06', 4::smallint, '{"v":1}') is not null as luu
  from unnest(array['dao-duc','tnxh','hdtn','am-nhac']) s; rollback;
\echo == Ma mon rac (mong doi: check constraint x3)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
select public.teacher_save_plan(null, null, 'X giáo án', 'Hoa!', 2::smallint, null, null, '{}'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
select public.teacher_save_plan(null, null, 'X giáo án', '', 2::smallint, null, null, '{}'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
select public.teacher_save_plan(null, null, 'X giáo án', 'mot-ma-mon-rat-dai-qua-muc', 2::smallint, null, null, '{}'); rollback;
