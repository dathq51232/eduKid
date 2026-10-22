-- Kiểm thử 0028: chia nhóm / sơ đồ / thi đua tổ / danh bạ phụ huynh — chỉ giáo viên của lớp đọc/ghi; số phụ huynh có nhật ký.
\set ON_ERROR_STOP 0
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000028f1','gv28@demo.local'),('00000000-0000-0000-0000-0000000028f2','gv28b@demo.local') on conflict do nothing;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000028f1';
select public.request_teacher_role('Trường CC 28', null) is not null as gv1; commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000028f2';
select public.request_teacher_role('Trường CC 28b', null) is not null as gv2; commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000028f1';
select public.teacher_create_class('3A', 3::smallint) as c \gset
select count(*) as them from public.teacher_add_students(:'c', array['Em Một','Em Hai'], 'v1', true); commit;
select student_id as s1 from public.class_memberships m join public.students s on s.id = m.student_id where m.class_id = :'c' and s.display_name = 'Em Một' \gset

\echo == Luu so do + to (mong doi: 2 dong ngay luu, doc lai dung 4 day)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000028f1';
select public.teacher_tool_save(:'c', 'seating', '{"rows":4,"perRow":4,"seats":[]}') is not null as luu_so_do;
select public.teacher_tool_save(:'c', 'teams', '{"teams":[{"name":"Tổ 1"},{"name":"Tổ 2"}]}') is not null as luu_to;
select public.teacher_tool_get(:'c', 'seating')->>'rows' as so_day; commit;
\echo == Cong 3 lan, tru 1, hoan tac lan cuoi (mong doi: 3 dong, tong to 1 = 2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000028f1';
select public.teacher_team_point(:'c', 1, 1, 'Phát biểu')->>'team' as to1;
select public.teacher_team_point(:'c', 1, 1, 'Trật tự')->>'team' as to1b;
select public.teacher_team_point(:'c', 2, 1, null)->>'team' as to2;
select (public.teacher_team_point(:'c', 1, -1, 'Quên đồ dùng')->>'id')::bigint as pid \gset
select public.teacher_team_undo(:'c', :pid) as hoan_tac;
select jsonb_array_length(p) as so_lan, (select sum((x->>'delta')::int) from jsonb_array_elements(p) x where x->>'team' = '1') as tong_to1
  from public.teacher_team_points(:'c', current_date - 1, current_date + 1) p; commit;
\echo == Danh ba: them so (co dau cach), so sai, dan Excel (mong doi: so luu khong dau cach, invalid_phone, saved 1 skipped 1)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000028f1';
select public.teacher_contact_save(:'c', :'s1', null, 'Nguyễn Văn Hùng', 'Bố', '0912 345 678', null) is not null as luu;
commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000028f1';
select public.teacher_contact_save(:'c', :'s1', null, 'X', 'Mẹ', '12ab', null); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000028f1';
select public.teacher_contacts_import(:'c', jsonb_build_array(jsonb_build_object('student_id', :'s1', 'name', 'Trần Thị Lan', 'relation', 'Mẹ', 'phone', '0987.112.233'),
  jsonb_build_object('student_id', '00000000-0000-0000-0000-000000000000', 'phone', '0900000000'))) as nhap;
select x->>'phone' as so from jsonb_array_elements(public.teacher_contacts(:'c')) x order by 1; commit;
\echo == Giao vien khac doc / ghi (mong doi: not_allowed x4)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000028f2';
select public.teacher_contacts(:'c'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000028f2';
select public.teacher_tool_get(:'c', 'seating'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000028f2';
select public.teacher_team_point(:'c', 1, 5, null); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000028f2';
select public.teacher_contact_save(:'c', :'s1', null, 'A', 'B', '0912345678', null); rollback;
\echo == Doc truc tiep bang (mong doi: permission denied x2) va nhat ky (mong doi: view/save/import)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000028f1';
select * from public.parent_contacts; rollback;
begin; set local role anon; select * from public.class_team_points; rollback;
select string_agg(distinct action, ',' order by action) as nhat_ky from public.parent_contact_log where class_id = :'c';
