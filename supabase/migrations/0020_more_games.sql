-- EduChain Kids 0020: thêm 3 game trí tuệ — Robot lập trình ('robot'), Sudoku mini ('sudoku'), Cân thăng bằng ('balance').
-- Chỉ nới danh sách mã game được phép lưu vào game_results. Chạy lại an toàn, không đổi dữ liệu cũ.

alter table public.game_results drop constraint if exists game_results_game_id_check;
alter table public.game_results add constraint game_results_game_id_check
  check (game_id in ('pattern', 'memory', 'maze', 'robot', 'sudoku', 'balance'));
