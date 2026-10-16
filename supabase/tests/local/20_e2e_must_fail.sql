-- Các thao tác phải bị từ chối
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false);
\echo '--- other parent get_class_progress (expect not_allowed)'
select public.get_class_progress('20000000-0000-0000-0000-000000000001');
\echo '--- other parent skill report of Bin (expect not_allowed)'
select public.get_student_skill_report((select id from public.students limit 1));
\echo '--- other parent grants self admin (expect RLS error)'
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000d','system_admin');
reset role;
\echo '--- answer twice (expect already_answered)'
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
select public.submit_quiz_answer((select id from public.quiz_attempts limit 1),(select id from public.questions order by sort_order limit 1),'"7"');

reset role;
\echo '--- 0004: parent writes question directly (expect permission denied)'
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
insert into public.questions (lesson_id, question_type, prompt) values ('30000000-0000-0000-0000-000000000001','single_choice','{}');
\echo '--- 0004: teacher edits published lesson (expect not_allowed or lesson_locked)'
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
select public.save_question('30000000-0000-0000-0000-000000000001', null, 'fill_blank', 'x', '[]', '{"accepted":["1"]}', '', null, 1::smallint);
\echo '--- 0004: teacher reads admin overview (expect not_allowed)'
select public.admin_overview();
\echo '--- 0004: admin saves into published lesson (expect lesson_locked)'
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
select public.save_question('30000000-0000-0000-0000-000000000001', null, 'fill_blank', 'x', '[]', '{"accepted":["1"]}', '', null, 1::smallint);
\echo '--- 0004: wrong answer key shape (expect invalid_answer_key)'
select public.set_lesson_status('30000000-0000-0000-0000-000000000001', 'draft');
select public.save_question('30000000-0000-0000-0000-000000000001', null, 'single_choice', 'x', '["a","b"]', '{"accepted":["a"]}', '', null, 1::smallint);
\echo '--- 0004: answer not in options (expect answer_not_in_options)'
select public.save_question('30000000-0000-0000-0000-000000000001', null, 'single_choice', 'x', '["a","b"]', '{"correct":"c"}', '', null, 1::smallint);
\echo '--- 0004: delete answered question -> archived (expect archived)'
select public.delete_question((select id from public.questions order by sort_order limit 1));
\echo '--- 0004: delete lesson with attempts (expect lesson_has_attempts)'
select public.delete_lesson('30000000-0000-0000-0000-000000000001');
\echo '--- 0004: admin overview works'
select public.admin_overview() -> 'lessons' as lessons, public.admin_overview() -> 'attempts_done' as done;
\echo '--- 0004: admin removes own admin role (expect cannot_revoke_self)'
select public.admin_set_role('00000000-0000-0000-0000-00000000000a', 'system_admin', null, false);
\echo '--- 0004: teacher role without school (expect school_required)'
select public.admin_set_role('00000000-0000-0000-0000-00000000000d', 'teacher', null, true);
\echo '--- 0004: admin lists users (expect 4 rows)'
select count(*) from public.admin_list_users(null);
\echo '--- 0004: parent lists users (expect not_allowed)'
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
select count(*) from public.admin_list_users(null);
