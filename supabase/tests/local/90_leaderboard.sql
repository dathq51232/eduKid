-- Kiểm thử 0012: Thành tích thật + bảng điểm cao nhất tuần/tháng CHỈ trong lớp. Dữ liệu demo.
\set ON_ERROR_STOP 0
insert into public.schools(id,name) values ('00000000-0000-0000-0000-0000000010a1','Trường Demo L');
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000010f1','gvL@demo.local'),('00000000-0000-0000-0000-0000000010f2','gvM@demo.local'),
 ('00000000-0000-0000-0000-0000000010e1','hs1@x'),('00000000-0000-0000-0000-0000000010e2','hs2@x'),('00000000-0000-0000-0000-0000000010e3','hs3@x'),('00000000-0000-0000-0000-0000000010e4','hs4@x');
insert into public.user_roles(user_id, role, school_id) values ('00000000-0000-0000-0000-0000000010f1','teacher','00000000-0000-0000-0000-0000000010a1'),('00000000-0000-0000-0000-0000000010f2','teacher','00000000-0000-0000-0000-0000000010a1');
insert into public.classes(id,school_id,name,grade,created_by) values ('00000000-0000-0000-0000-0000000010c1','00000000-0000-0000-0000-0000000010a1','1A',1,'00000000-0000-0000-0000-0000000010f1'),('00000000-0000-0000-0000-0000000010c2','00000000-0000-0000-0000-0000000010a1','1B',1,'00000000-0000-0000-0000-0000000010f2');
insert into public.class_teachers(class_id,teacher_id) values ('00000000-0000-0000-0000-0000000010c1','00000000-0000-0000-0000-0000000010f1'),('00000000-0000-0000-0000-0000000010c2','00000000-0000-0000-0000-0000000010f2');
insert into public.students(id,school_id,display_name,grade,created_by,user_id) values
 ('00000000-0000-0000-0000-0000000010d1','00000000-0000-0000-0000-0000000010a1','An',1,'00000000-0000-0000-0000-0000000010f1','00000000-0000-0000-0000-0000000010e1'),
 ('00000000-0000-0000-0000-0000000010d2','00000000-0000-0000-0000-0000000010a1','Bình',1,'00000000-0000-0000-0000-0000000010f1','00000000-0000-0000-0000-0000000010e2'),
 ('00000000-0000-0000-0000-0000000010d3','00000000-0000-0000-0000-0000000010a1','Chi',1,'00000000-0000-0000-0000-0000000010f1','00000000-0000-0000-0000-0000000010e3'),
 ('00000000-0000-0000-0000-0000000010d4','00000000-0000-0000-0000-0000000010a1','Dũng',1,'00000000-0000-0000-0000-0000000010f2','00000000-0000-0000-0000-0000000010e4');
insert into public.class_memberships(class_id,student_id) values ('00000000-0000-0000-0000-0000000010c1','00000000-0000-0000-0000-0000000010d1'),('00000000-0000-0000-0000-0000000010c1','00000000-0000-0000-0000-0000000010d2'),('00000000-0000-0000-0000-0000000010c1','00000000-0000-0000-0000-0000000010d3'),('00000000-0000-0000-0000-0000000010c2','00000000-0000-0000-0000-0000000010d4');
-- An: bai1 lam 2 lan trong tuan (100, 300 -> tinh 300) + bai2 thang truoc 500 (chi tinh vao tong)
-- Binh: bai1 200 tuan nay. Chi: bai3 50 tuan nay. Dung (lop khac): 900.
insert into public.lesson_results(student_id,lesson_code,score,total,points,created_at) values
 ('00000000-0000-0000-0000-0000000010d1','b1',5,10,100,now()),('00000000-0000-0000-0000-0000000010d1','b1',10,10,300,now()),
 ('00000000-0000-0000-0000-0000000010d1','b2',10,10,500,now() - interval '40 days'),
 ('00000000-0000-0000-0000-0000000010d2','b1',8,10,200,now()),
 ('00000000-0000-0000-0000-0000000010d3','b3',3,10,50,now()),
 ('00000000-0000-0000-0000-0000000010d4','b1',10,10,900,now());
\echo == An xem thanh tich cua minh (mong doi: tong 800, tuan 300, thang 300, 2 bai, lop 1A)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000010e1';
select display_name, class_name, total_points, week_points, month_points, lessons_done, perfect_lessons from public.my_achievements(); commit;
\echo == An xem bang tuan lop 1A (mong doi: An 300, Binh 200, Chi 50; khong co Dung)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000010e1';
select * from public.class_leaderboard('00000000-0000-0000-0000-0000000010c1','week'); commit;
\echo == Chi xem top 1 (mong doi: An hang 1 + dong cua Chi hang 3, is_me)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000010e3';
select * from public.class_leaderboard('00000000-0000-0000-0000-0000000010c1','week',1); commit;
\echo == GV lop 1A xem (mong doi: 3 dong)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000010f1';
select count(*) from public.class_leaderboard('00000000-0000-0000-0000-0000000010c1','month'); commit;
\echo == Dung (lop 1B) xem bang lop 1A (mong doi: not_allowed)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000010e4';
select * from public.class_leaderboard('00000000-0000-0000-0000-0000000010c1','week'); rollback;
\echo == GV lop 1B xem bang lop 1A (mong doi: not_allowed)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000010f2';
select * from public.class_leaderboard('00000000-0000-0000-0000-0000000010c1','week'); rollback;
\echo == Anon (mong doi: permission denied)
begin; set local role anon; select * from public.class_leaderboard('00000000-0000-0000-0000-0000000010c1','week'); rollback;
\echo == Giao vien goi my_achievements (mong doi: not_student)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000010f1';
select * from public.my_achievements(); rollback;
\echo == Ky khong hop le (mong doi: invalid_period)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000010e1';
select * from public.class_leaderboard('00000000-0000-0000-0000-0000000010c1','year'); rollback;
\echo == Lop luu tru: hoc sinh khong xem duoc nua (mong doi: not_allowed)
update public.classes set status='inactive' where id='00000000-0000-0000-0000-0000000010c1';
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000010e1';
select * from public.class_leaderboard('00000000-0000-0000-0000-0000000010c1','week'); rollback;
