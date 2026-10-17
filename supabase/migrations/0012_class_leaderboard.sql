-- EduChain Kids 0012: trang Thành tích dùng dữ liệu thật + bảng "bạn điểm cao nhất" tuần/tháng TRONG LỚP.
-- CHỈ THÊM MỚI, chạy lại an toàn.
--
-- Quyết định của chủ dự án (17/10/2026): cho phép bảng xếp hạng NHƯNG chỉ trong phạm vi một lớp:
--   * chỉ học sinh đang học trong lớp và thầy cô dạy lớp đó xem được;
--   * chỉ hiện TÊN GỌI (display_name) và điểm, không hiện gì khác của bạn khác;
--   * người ngoài lớp, khách: không xem được.
-- Điểm của một khoảng thời gian = tổng, theo từng bài, điểm CAO NHẤT em đạt trong khoảng đó
-- (làm lại một bài nhiều lần không cộng dồn — tránh "cày" điểm). Tuần bắt đầu thứ Hai, giờ Việt Nam.

create or replace function public.period_start(p_period text)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select case p_period
    when 'week'  then date_trunc('week',  now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh'
    when 'month' then date_trunc('month', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh'
    else '-infinity'::timestamptz
  end;
$$;

-- Điểm của một học sinh từ một mốc thời gian
create or replace function public.student_points_since(p_student uuid, p_since timestamptz)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(b.best), 0)::integer from (
    select max(r.points) as best from public.lesson_results r
    where r.student_id = p_student and r.created_at >= p_since
    group by r.lesson_code
  ) b;
$$;
revoke all on function public.student_points_since(uuid, timestamptz) from public, anon, authenticated;

-- Lớp hiện tại của học sinh đang đăng nhập (lớp tham gia gần nhất, đang hoạt động)
create or replace function public.my_active_class()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select cm.class_id from public.class_memberships cm
  join public.classes c on c.id = cm.class_id
  where cm.student_id = public.my_student_id() and cm.status = 'active' and c.status = 'active'
  order by cm.joined_at desc limit 1;
$$;
revoke all on function public.my_active_class() from public, anon;
grant execute on function public.my_active_class() to authenticated;

-- Thành tích của chính học sinh đang đăng nhập
create or replace function public.my_achievements()
returns table (student_id uuid, display_name text, class_id uuid, class_name text,
               total_points integer, week_points integer, month_points integer,
               lessons_done integer, lessons_week integer, perfect_lessons integer, games_played integer,
               last_activity timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_sid uuid := public.my_student_id(); v_class uuid := public.my_active_class();
begin
  if v_sid is null then
    raise exception 'not_student' using errcode = '42501';
  end if;
  return query
  select s.id, s.display_name, v_class, (select c.name from public.classes c where c.id = v_class),
         public.student_points_since(s.id, '-infinity'),
         public.student_points_since(s.id, public.period_start('week')),
         public.student_points_since(s.id, public.period_start('month')),
         (select count(distinct r.lesson_code)::integer from public.lesson_results r where r.student_id = s.id),
         (select count(distinct r.lesson_code)::integer from public.lesson_results r where r.student_id = s.id and r.created_at >= public.period_start('week')),
         (select count(distinct r.lesson_code)::integer from public.lesson_results r where r.student_id = s.id and r.score = r.total),
         (select count(*)::integer from public.game_results g where g.student_id = s.id),
         greatest((select max(r.created_at) from public.lesson_results r where r.student_id = s.id),
                  (select max(g.created_at) from public.game_results g where g.student_id = s.id))
  from public.students s where s.id = v_sid;
end;
$$;
revoke all on function public.my_achievements() from public, anon;
grant execute on function public.my_achievements() to authenticated;

-- Bảng điểm cao nhất của MỘT lớp trong tuần/tháng. Trả top p_limit bạn có điểm > 0, cộng thêm dòng của chính em (nếu em không trong top).
create or replace function public.class_leaderboard(p_class uuid, p_period text, p_limit integer default 5)
returns table (rank integer, display_name text, points integer, lessons integer, is_me boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_me uuid := public.my_student_id();
  v_since timestamptz;
  v_limit integer := least(greatest(coalesce(p_limit, 5), 1), 10);
begin
  if p_period not in ('week', 'month') then
    raise exception 'invalid_period' using errcode = '22023';
  end if;
  -- Chỉ thầy cô dạy lớp, hoặc học sinh đang học trong lớp (lớp đang hoạt động)
  if v_uid is null or not (
       public.teaches_class(p_class)
       or exists (select 1 from public.class_memberships cm join public.classes c on c.id = cm.class_id
                  where cm.class_id = p_class and cm.student_id = v_me and cm.status = 'active' and c.status = 'active')
     ) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  v_since := public.period_start(p_period);

  return query
  with pts as (
    select s.id as sid, s.display_name as dname,
           public.student_points_since(s.id, v_since) as p,
           (select count(distinct r.lesson_code)::integer from public.lesson_results r where r.student_id = s.id and r.created_at >= v_since) as l
    from public.class_memberships cm
    join public.students s on s.id = cm.student_id
    where cm.class_id = p_class and cm.status = 'active' and s.status = 'active'
  ), ranked as (
    select (rank() over (order by p desc))::integer as rk, dname, p, l, sid from pts where p > 0
  )
  select rk, dname, p, l, (sid = v_me) from ranked
  where rk <= v_limit or sid = v_me
  order by rk, dname;
end;
$$;
revoke all on function public.class_leaderboard(uuid, text, integer) from public, anon;
grant execute on function public.class_leaderboard(uuid, text, integer) to authenticated;
