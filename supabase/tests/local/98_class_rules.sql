-- Kiểm thử 0016: 1 giáo viên – 1 lớp đang hoạt động; tối đa 40 học sinh; đủ môn + mức đạt; phẩm chất – năng lực. Dữ liệu demo.
\set ON_ERROR_STOP 0
insert into public.schools(id,name) values ('00000000-0000-0000-0000-0000000016a1','Trường Demo R2');
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000016f1','gvR@demo.local');
insert into public.user_roles(user_id, role, school_id) values ('00000000-0000-0000-0000-0000000016f1','teacher','00000000-0000-0000-0000-0000000016a1');
-- từ 0019: gói miễn phí 3 học sinh — giáo viên này được quản trị nâng lên 40 để kiểm tra quy tắc 40 em / lớp
insert into public.teacher_plans(teacher_id, student_limit) values ('00000000-0000-0000-0000-0000000016f1', 40);
\echo == GV tao lop 1 (ok) roi lop 2 (mong doi: one_class_only)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000016f1';
select public.teacher_create_class('3A', 3::smallint) as c1 \gset
commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000016f1';
select public.teacher_create_class('3B', 3::smallint); rollback;
\echo == Luu tru lop 3A roi tao lop moi (mong doi: duoc), mo lai lop cu (mong doi: one_class_only)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000016f1';
select public.teacher_set_class_status(:'c1', false);
select public.teacher_create_class('4A', 4::smallint) as c2 \gset
commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000016f1';
select public.teacher_set_class_status(:'c1', true); rollback;
\echo == Them 40 em (ok), them em thu 41 (mong doi: class_full)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000016f1';
select count(*) as them from public.teacher_add_students(:'c2', (select array_agg('Em ' || i) from generate_series(1,40) i), 'v1', true); commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000016f1';
select count(*) from public.teacher_add_students(:'c2', array['Em 41'], 'v1', true); rollback;
select count(*) as dang_hoc from public.class_memberships where class_id = :'c2' and status = 'active';
\echo == Luu muc + diem nhieu mon (mong doi: 3; doc lai co level)
select student_id as s1 from public.class_memberships where class_id = :'c2' limit 1 \gset
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000016f1';
select public.teacher_save_scores(:'c2', 'ck1-2026', jsonb_build_array(
  jsonb_build_object('student_id', :'s1', 'subject', 'toan', 'score', 9, 'level', 'T', 'note', ''),
  jsonb_build_object('student_id', :'s1', 'subject', 'dao-duc', 'score', null, 'level', 'H', 'note', ''),
  jsonb_build_object('student_id', :'s1', 'subject', 'am-nhac', 'score', null, 'level', 'T', 'note', '')));
select subject, score, level from public.teacher_get_scores(:'c2', 'ck1-2026') order by subject;
select public.teacher_save_scores(:'c2', 'ck1-2026', jsonb_build_array(jsonb_build_object('student_id', :'s1', 'subject', 'am-nhac', 'score', null, 'level', null, 'note', '')));
select count(*) as con_lai from public.teacher_get_scores(:'c2', 'ck1-2026'); commit;
\echo == Mon sai / muc sai (mong doi: check constraint x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000016f1';
select public.teacher_save_scores(:'c2', 'ck1-2026', jsonb_build_array(jsonb_build_object('student_id', :'s1', 'subject', 'hoa-hoc', 'level', 'T'))); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000016f1';
select public.teacher_save_scores(:'c2', 'ck1-2026', jsonb_build_array(jsonb_build_object('student_id', :'s1', 'subject', 'toan', 'level', 'X'))); rollback;
\echo == Pham chat - nang luc: luu, doc, xoa
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000016f1';
select public.teacher_save_qualities(:'c2', 'ck1-2026', jsonb_build_array(
  jsonb_build_object('student_id', :'s1', 'item', 'pc-cham-chi', 'level', 'T'),
  jsonb_build_object('student_id', :'s1', 'item', 'nl-tu-chu', 'level', 'D')));
select item, level from public.teacher_get_qualities(:'c2', 'ck1-2026') order by item;
select public.teacher_save_qualities(:'c2', 'ck1-2026', jsonb_build_array(jsonb_build_object('student_id', :'s1', 'item', 'nl-tu-chu', 'level', null)));
select count(*) as con_lai from public.teacher_get_qualities(:'c2', 'ck1-2026'); commit;
\echo == Nhan xet cho mon Dao duc + pham chat (mong doi: 2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000016f1';
select public.teacher_save_comments(:'c2', 'ck1-2026', jsonb_build_array(
  jsonb_build_object('student_id', :'s1', 'subject', 'dao-duc', 'level', 'H', 'comment', 'Biết giúp đỡ bạn.'),
  jsonb_build_object('student_id', :'s1', 'subject', 'pham-chat', 'level', 'D', 'comment', 'Chăm chỉ.'))); commit;
\echo == Hoc sinh doc bang pham chat (mong doi: permission denied)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000016f1';
set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000016e9';
select * from public.student_qualities; rollback;
