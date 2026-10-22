-- Kiểm thử 0029: link nhóm Zalo lớp — chỉ nhận https://zalo.me/g/...; chỉ giáo viên của lớp đọc/ghi.
\set ON_ERROR_STOP 0
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000029f1','gv29@demo.local'),('00000000-0000-0000-0000-0000000029f2','gv29b@demo.local') on conflict do nothing;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000029f1';
select public.request_teacher_role('Trường ZL 29', null) is not null as gv1; commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000029f2';
select public.request_teacher_role('Trường ZL 29b', null) is not null as gv2; commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000029f1';
select public.teacher_create_class('4A', 4::smallint) as c \gset
commit;
\echo == Lưu link đúng, đọc lại (mong doi: https://zalo.me/g/abcd1234)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000029f1';
select public.teacher_tool_save(:'c', 'zalo', '{"url":"https://zalo.me/g/abcd1234"}') is not null as luu;
select public.teacher_tool_get(:'c', 'zalo')->>'url' as link; commit;
\echo == Link lạ / link cá nhân (mong doi: invalid_zalo_link x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000029f1';
select public.teacher_tool_save(:'c', 'zalo', '{"url":"https://evil.example/g/abcd1234"}'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000029f1';
select public.teacher_tool_save(:'c', 'zalo', '{"url":"javascript:alert(1)"}'); rollback;
\echo == Xóa link (mong doi: rong)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000029f1';
select public.teacher_tool_save(:'c', 'zalo', '{"url":""}') is not null as xoa;
select coalesce(public.teacher_tool_get(:'c', 'zalo')->>'url', '') = '' as da_xoa; commit;
\echo == Giáo viên khác (mong doi: not_allowed x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000029f2';
select public.teacher_tool_get(:'c', 'zalo'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000029f2';
select public.teacher_tool_save(:'c', 'zalo', '{"url":"https://zalo.me/g/abcd1234"}'); rollback;
\echo == Cac cong cu cu van luu duoc (mong doi: t)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000029f1';
select public.teacher_tool_save(:'c', 'seating', '{"rows":3}') is not null as so_do; commit;
