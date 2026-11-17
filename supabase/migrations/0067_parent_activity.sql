-- EduChain Kids 0067: "CON LUYỆN TẬP" CỦA PHỤ HUYNH GỘP MỌI HOẠT ĐỘNG CỦA CON.
-- CHỈ THÊM MỚI, chạy lại an toàn.
--  * Ván cờ vua / cờ tướng con đánh với máy được lưu vào game_results (game_id 'chess' | 'xiangqi'):
--    score 2 = thắng, 1 = hoà, 0 = thua; level = mức của máy (1 Dễ, 2 Vừa, 3 Khó).
--  * student_recent_results(p_days): kết quả bài cô giao + phòng thi của chính em, kèm GIỜ NỘP thật
--    (student_my_assignments / student_my_rooms không có giờ nộp). Phiên phụ huynh dùng chung PIN của con
--    nên đây cũng là nguồn cho trang phụ huynh. Chỉ đọc dữ liệu của my_student_id().

alter table public.game_results drop constraint if exists game_results_game_id_check;
alter table public.game_results add constraint game_results_game_id_check
  check (game_id in ('pattern', 'memory', 'maze', 'robot', 'sudoku', 'balance', 'chess', 'xiangqi'));

create or replace function public.student_recent_results(p_days integer default 30)
returns table (kind text, title text, subject text, score numeric, max_score numeric, correct integer, total integer, done_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id(); v_days integer := least(greatest(coalesce(p_days, 30), 1), 120);
begin
  if v_sid is null then return; end if;
  return query
  -- bài cô giao dạng đề: điểm theo đề
  select 'bai-giao'::text, a.title, a.subject, s.score, s.max_score, s.correct::integer, s.total::integer, s.created_at
  from public.assignment_submissions s
  join public.class_assignments a on a.id = s.assignment_id
  where s.student_id = v_sid and s.created_at > now() - make_interval(days => v_days)
  union all
  -- bài cô giao dạng bài học: lần làm đầu tiên sau khi cô giao
  select 'bai-giao'::text, a.title, a.subject, r.score::numeric, r.total::numeric, r.score::integer, r.total::integer, r.created_at
  from public.class_assignments a
  join public.class_memberships cm on cm.class_id = a.class_id and cm.student_id = v_sid
  join lateral (
    select lr.score, lr.total, lr.created_at from public.lesson_results lr
    where lr.student_id = v_sid and lr.lesson_code = a.lesson_code and lr.created_at >= a.created_at
    order by lr.created_at limit 1
  ) r on true
  where a.kind = 'lesson' and (a.student_ids is null or v_sid = any (a.student_ids))
    and r.created_at > now() - make_interval(days => v_days)
  union all
  -- phòng thi: thang 10
  select 'phong-thi'::text, rm.title, rm.subject, x.score, 10::numeric, x.correct::integer, x.total::integer, x.created_at
  from public.exam_room_results x
  join public.exam_rooms rm on rm.id = x.room_id
  where x.student_id = v_sid and x.created_at > now() - make_interval(days => v_days)
  order by 8 desc
  limit 60;
end;
$$;

revoke all on function public.student_recent_results(integer) from public, anon;
grant execute on function public.student_recent_results(integer) to authenticated;
