-- Kiểm thử 0020: lưu được kết quả 3 game mới, mã game lạ vẫn bị chặn. Dữ liệu demo.
\set ON_ERROR_STOP 0
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000020f0','gv20@demo.local');
insert into public.schools(id,name) values ('00000000-0000-0000-0000-0000000020a1','Trường Demo 20');
insert into public.students(id,school_id,display_name,grade,created_by) values ('00000000-0000-0000-0000-0000000020d1','00000000-0000-0000-0000-0000000020a1','Em Demo',3,'00000000-0000-0000-0000-0000000020f0');
\echo == 3 game moi + game cu (ok)
insert into public.game_results (student_id, game_id, level, score, max_score, details) values
  ('00000000-0000-0000-0000-0000000020d1','robot',4,3,5,'{"runs":7,"hints":1}'),
  ('00000000-0000-0000-0000-0000000020d1','sudoku',2,7,8,'{"mistakes":1,"hints":0}'),
  ('00000000-0000-0000-0000-0000000020d1','balance',5,6,6,'{}'),
  ('00000000-0000-0000-0000-0000000020d1','maze',1,1,1,'{}');
select game_id, level, score, max_score from public.game_results where student_id='00000000-0000-0000-0000-0000000020d1' order by game_id;
\echo == Ma game la (mong doi: vi pham check)
insert into public.game_results (student_id, game_id, level, score, max_score) values ('00000000-0000-0000-0000-0000000020d1','chess',1,1,1);
\echo == Chay lai migration (an toan)
\i /home/postgres/sql/0020_more_games.sql
select count(*) as van_con from public.game_results where student_id='00000000-0000-0000-0000-0000000020d1';
