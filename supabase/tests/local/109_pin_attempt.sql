-- Kiểm thử 0027: giữ chỗ lần thử PIN nguyên tử — tối đa 5 lần / 15 phút; chỉ service_role được gọi.
\set ON_ERROR_STOP 0
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000027f1','gv27@demo.local') on conflict do nothing;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000027f1';
select public.request_teacher_role('Trường PIN 27', null) is not null as gv; commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000027f1';
select public.teacher_create_class('2A', 2::smallint) as c \gset
select count(*) as them from public.teacher_add_students(:'c', array['Em PIN'], 'v1', true); commit;
select student_id as s from public.class_memberships where class_id = :'c' limit 1 \gset

\echo == 6 lan thu lien tiep (mong doi: t/4, t/3, t/2, t/1, t/0 khoa 15, f)
select 1 as lan, * from public.student_pin_attempt(:'s', 5, 15);
select 2 as lan, * from public.student_pin_attempt(:'s', 5, 15);
select 3 as lan, * from public.student_pin_attempt(:'s', 5, 15);
select 4 as lan, * from public.student_pin_attempt(:'s', 5, 15);
select 5 as lan, * from public.student_pin_attempt(:'s', 5, 15);
select 6 as lan, * from public.student_pin_attempt(:'s', 5, 15);
\echo == Hoc sinh / giao vien goi truc tiep (mong doi: permission denied)
begin; set local role authenticated; select * from public.student_pin_attempt(:'s', 5, 15); rollback;
begin; set local role anon; select * from public.student_pin_attempt(:'s', 5, 15); rollback;
\echo == Mo khoa (giao vien mo som / dang nhap dung) roi thu lai (mong doi: t/4)
update public.student_login_guards set failed_count = 0, locked_until = null, last_failed_at = null where student_id = :'s';
select * from public.student_pin_attempt(:'s', 5, 15);
