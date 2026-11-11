-- EduChain Kids 0049: trang Quản trị mới — lượt truy cập ẩn danh, thông báo cho admin, số liệu tổng quan.
-- CHỈ THÊM MỚI, chạy lại an toàn.
--
-- Bảo vệ dữ liệu trẻ em: KHÔNG lưu IP, tên, đường dẫn đầy đủ. Lượt xem gộp theo GIỜ (trang rút gọn, vai trò, khối, loại thiết bị).
-- "Khách duy nhất" dùng mã băm đổi theo NGÀY do máy chủ tính (không truy ngược được người dùng).
-- Mọi bảng mới chỉ đọc/ghi qua hàm security definer; người dùng không đọc thẳng được (RLS bật, không có policy).

-- =====================================================================================================
-- 1. Bảng
-- =====================================================================================================
create table if not exists public.page_views_hourly (
  bucket timestamptz not null,                       -- đầu giờ (UTC)
  path text not null check (char_length(path) between 1 and 80),
  role text not null check (role in ('student', 'teacher', 'parent', 'admin', 'guest')),
  grade smallint not null default 0 check (grade between 0 and 5),
  device text not null check (device in ('mobile', 'desktop')),
  views integer not null default 0 check (views >= 0),
  primary key (bucket, path, role, grade, device)
);
create index if not exists page_views_hourly_bucket_idx on public.page_views_hourly (bucket desc);

create table if not exists public.visitor_days (
  day date not null,
  vid text not null check (vid ~ '^[0-9a-f]{32}$'),  -- băm(cookie ẩn danh + ngày)
  role text not null,
  primary key (day, vid)
);

create table if not exists public.visitor_presence (
  vid text primary key check (vid ~ '^[0-9a-f]{32}$'),
  role text not null,
  last_seen timestamptz not null default now()
);
create index if not exists visitor_presence_seen_idx on public.visitor_presence (last_seen desc);

create table if not exists public.user_last_seen (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen timestamptz not null default now()
);

create table if not exists public.admin_notifications (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('new_user', 'new_students', 'teacher_application', 'payment', 'lesson_review', 'traffic')),
  title text not null check (char_length(title) between 1 and 200),
  body text check (body is null or char_length(body) <= 300),
  href text check (href is null or (char_length(href) <= 200 and href like '/%')),
  ref_user uuid references auth.users(id) on delete set null,
  group_key text,
  count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists admin_notifications_updated_idx on public.admin_notifications (updated_at desc);
create index if not exists admin_notifications_group_idx on public.admin_notifications (group_key) where group_key is not null;

alter table public.page_views_hourly enable row level security;
alter table public.visitor_days enable row level security;
alter table public.visitor_presence enable row level security;
alter table public.user_last_seen enable row level security;
alter table public.admin_notifications enable row level security;
revoke all on public.page_views_hourly, public.visitor_days, public.visitor_presence, public.user_last_seen, public.admin_notifications from anon, authenticated;

-- =====================================================================================================
-- 2. Ghi lượt truy cập (gọi từ /api/track — máy chủ đã băm mã khách và giới hạn tần suất)
-- =====================================================================================================
create or replace function public.track_visit(p_vid text, p_path text, p_device text, p_view boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text := 'guest';
  v_grade smallint := 0;
  v_day date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_path text := p_path;
  v_device text := case when p_device = 'mobile' then 'mobile' else 'desktop' end;
begin
  if p_vid is null or p_vid !~ '^[0-9a-f]{32}$' then return; end if;
  if v_path is null or char_length(v_path) > 80 or v_path !~ '^/[a-z0-9/:_-]*$' then v_path := '/khac'; end if;

  if v_uid is not null then
    if exists (select 1 from public.user_roles where user_id = v_uid and role = 'system_admin') then v_role := 'admin';
    elsif exists (select 1 from public.user_roles where user_id = v_uid and role in ('teacher', 'school_admin')) then v_role := 'teacher';
    elsif exists (select 1 from public.user_roles where user_id = v_uid and role = 'student') then
      v_role := 'student';
      select coalesce(s.grade, 0) into v_grade from public.students s where s.user_id = v_uid and s.status = 'active' limit 1;
      v_grade := coalesce(v_grade, 0);
    else v_role := 'parent';
    end if;
    insert into public.user_last_seen (user_id, last_seen) values (v_uid, now())
    on conflict (user_id) do update set last_seen = now();
  end if;

  if p_view then
    insert into public.page_views_hourly (bucket, path, role, grade, device, views)
    values (date_trunc('hour', now()), v_path, v_role, v_grade, v_device, 1)
    on conflict (bucket, path, role, grade, device) do update set views = public.page_views_hourly.views + 1;
    insert into public.visitor_days (day, vid, role) values (v_day, p_vid, v_role) on conflict do nothing;
  end if;

  insert into public.visitor_presence (vid, role, last_seen) values (p_vid, v_role, now())
  on conflict (vid) do update set role = excluded.role, last_seen = now();

  -- dọn dữ liệu cũ thỉnh thoảng (không cần lịch chạy riêng)
  if random() < 0.002 then
    delete from public.visitor_presence where last_seen < now() - interval '2 days';
    delete from public.visitor_days where day < v_day - 400;
    delete from public.page_views_hourly where bucket < now() - interval '400 days';
  end if;
end;
$$;
revoke all on function public.track_visit(text, text, text, boolean) from public;
grant execute on function public.track_visit(text, text, text, boolean) to anon, authenticated;

-- =====================================================================================================
-- 3. Thông báo cho admin (ghi tự động bằng trigger)
-- =====================================================================================================
create or replace function public.admin_notify(p_kind text, p_title text, p_body text, p_href text, p_ref uuid, p_group text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_group is not null then
    update public.admin_notifications
      set count = count + 1, title = p_title, body = p_body, updated_at = now()
      where group_key = p_group and read_at is null;
    if found then return; end if;
  end if;
  insert into public.admin_notifications (kind, title, body, href, ref_user, group_key)
  values (p_kind, left(p_title, 200), left(p_body, 300), p_href, p_ref, p_group);
end;
$$;
revoke all on function public.admin_notify(text, text, text, text, uuid, text) from public, anon, authenticated;

-- Tài khoản mới (vai trò thật xem lúc đọc: tài khoản học sinh không báo ở đây mà gộp ở trigger students)
create or replace function public.notify_new_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_notify('new_user', new.display_name || ' vừa đăng ký', 'Tài khoản mới', '/quan-tri/nguoi-dung?moi=7', new.id, null);
  return new;
exception when others then return new; -- thông báo lỗi không được chặn việc đăng ký
end;
$$;
drop trigger if exists admin_notify_new_profile on public.profiles;
create trigger admin_notify_new_profile after insert on public.profiles for each row execute function public.notify_new_profile();

-- Học sinh mới: gộp theo người tạo trong ngày ("5 học sinh mới do Cô Lan tạo")
create or replace function public.notify_new_student()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_by text;
  v_key text := 'students:' || new.created_by::text || ':' || to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD');
  v_n integer;
begin
  select display_name into v_by from public.profiles where id = new.created_by;
  select count + 1 into v_n from public.admin_notifications where group_key = v_key and read_at is null;
  v_n := coalesce(v_n, 1);
  perform public.admin_notify('new_students', v_n || ' học sinh mới do ' || coalesce(v_by, 'giáo viên') || ' tạo',
    'Mới nhất: ' || new.display_name || ' · lớp ' || new.grade, '/quan-tri/nguoi-dung?vai=student&moi=7', new.created_by, v_key);
  return new;
exception when others then return new;
end;
$$;
drop trigger if exists admin_notify_new_student on public.students;
create trigger admin_notify_new_student after insert on public.students for each row execute function public.notify_new_student();

create or replace function public.notify_teacher_application()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_name text;
begin
  select display_name into v_name from public.profiles where id = new.user_id;
  perform public.admin_notify('teacher_application', coalesce(v_name, 'Một người dùng') || ' xin quyền giáo viên', new.school_name, '/quan-tri/duyet-giao-vien', new.user_id, null);
  return new;
exception when others then return new;
end;
$$;
drop trigger if exists admin_notify_teacher_application on public.teacher_applications;
create trigger admin_notify_teacher_application after insert on public.teacher_applications for each row execute function public.notify_teacher_application();

create or replace function public.notify_payment_request()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_student text;
begin
  select display_name into v_student from public.students where id = new.student_id;
  perform public.admin_notify('payment', 'Yêu cầu thanh toán ' || case when new.plan = 'year' then 'gói năm' else 'gói tháng' end || ' — ' || replace(to_char(new.amount, 'FM999,999,999'), ',', '.') || ' ₫',
    'Học sinh ' || coalesce(v_student, '') || ' · mã ' || new.code, '/quan-tri/thu-phi', new.requested_by, null);
  return new;
exception when others then return new;
end;
$$;
drop trigger if exists admin_notify_payment_request on public.payment_requests;
create trigger admin_notify_payment_request after insert on public.payment_requests for each row execute function public.notify_payment_request();

create or replace function public.notify_lesson_review()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_by text;
begin
  if new.status::text = 'review' and old.status::text is distinct from 'review' then
    select display_name into v_by from public.profiles where id = new.created_by;
    perform public.admin_notify('lesson_review', 'Bài "' || left(new.title, 120) || '" chờ duyệt', coalesce(v_by, '') || ' gửi duyệt', '/quan-tri/bai-hoc/' || new.id::text, new.created_by, null);
  end if;
  return new;
exception when others then return new;
end;
$$;
drop trigger if exists admin_notify_lesson_review on public.lessons;
create trigger admin_notify_lesson_review after update of status on public.lessons for each row execute function public.notify_lesson_review();

-- Bất thường truy cập: hôm qua so với cùng thứ tuần trước (chênh > 30%, đủ lớn mới báo; mỗi ngày tối đa một lần)
create or replace function public.admin_check_traffic()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_key text := 'traffic:' || (v_today - 1)::text;
  v_a bigint; v_b bigint; v_pct integer;
begin
  if exists (select 1 from public.admin_notifications where group_key = v_key) then return; end if;
  select coalesce(sum(views), 0) into v_a from public.page_views_hourly where (bucket at time zone 'Asia/Ho_Chi_Minh')::date = v_today - 1;
  select coalesce(sum(views), 0) into v_b from public.page_views_hourly where (bucket at time zone 'Asia/Ho_Chi_Minh')::date = v_today - 8;
  if v_b < 50 or v_a < 20 then return; end if;
  v_pct := round((v_a - v_b) * 100.0 / v_b);
  if abs(v_pct) < 30 then return; end if;
  insert into public.admin_notifications (kind, title, body, href, group_key)
  values ('traffic', 'Truy cập hôm qua ' || case when v_pct > 0 then 'tăng ' else 'giảm ' end || abs(v_pct) || '%',
          v_a || ' lượt xem, tuần trước cùng ngày ' || v_b || ' lượt', '/quan-tri/truy-cap?k=7', v_key);
end;
$$;
revoke all on function public.admin_check_traffic() from public, anon, authenticated;

-- =====================================================================================================
-- 4. Hàm đọc cho admin
-- =====================================================================================================
create or replace function public.admin_require()
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.has_role('system_admin', null) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.admin_require() from public, anon;
grant execute on function public.admin_require() to authenticated;

-- Thông báo hiển thị được (bỏ "tài khoản mới" của học sinh — đã gộp ở new_students)
create or replace view public.admin_notifications_visible with (security_invoker = true) as
  select n.* from public.admin_notifications n
  where n.kind <> 'new_user' or n.ref_user is null
     or not exists (select 1 from public.user_roles r where r.user_id = n.ref_user and r.role = 'student');
revoke all on public.admin_notifications_visible from anon, authenticated;

create or replace function public.admin_nav_counts()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.admin_require();
  return jsonb_build_object(
    'unread', (select count(*) from public.admin_notifications_visible where read_at is null),
    'teachers_pending', (select count(*) from public.teacher_applications where status = 'pending'),
    'lessons_review', (select count(*) from public.lessons where status = 'review'),
    'payments_pending', (select count(*) from public.payment_requests where status = 'pending')
  );
end;
$$;

create or replace function public.admin_list_notifications(p_group text default null, p_unread boolean default false, p_limit integer default 50)
returns table (id bigint, kind text, title text, body text, href text, count integer, created_at timestamptz, updated_at timestamptz, read_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.admin_require();
  return query
  select n.id, n.kind, n.title, n.body, n.href, n.count, n.created_at, n.updated_at, n.read_at
  from public.admin_notifications_visible n
  where (not p_unread or n.read_at is null)
    and (p_group is null
      or (p_group = 'user' and n.kind in ('new_user', 'new_students'))
      or (p_group = 'teacher' and n.kind = 'teacher_application')
      or (p_group = 'payment' and n.kind = 'payment')
      or (p_group = 'content' and n.kind in ('lesson_review', 'traffic')))
  order by n.updated_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
end;
$$;

create or replace function public.admin_mark_notifications_read(p_ids bigint[] default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_require();
  update public.admin_notifications set read_at = now()
  where read_at is null and (p_ids is null or id = any (p_ids));
end;
$$;

-- Số liệu cho trang Tổng quan + trang Truy cập. p_days: 1 (hôm nay, theo giờ) | 7 | 30 | 365
create or replace function public.admin_insights(p_days integer default 7)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  tz constant text := 'Asia/Ho_Chi_Minh';
  v_days integer := case when p_days in (1, 7, 30, 365) then p_days else 7 end;
  v_today date := (now() at time zone tz)::date;
  v_from date := v_today - (v_days - 1);
  v_prev date := v_from - v_days;
  v_month date := date_trunc('month', now() at time zone tz)::date;
  r jsonb;
begin
  perform public.admin_require();
  perform public.admin_check_traffic();

  with pv as (
    select (bucket at time zone tz) as t, path, role, grade, device, views from public.page_views_hourly
    where bucket >= ((v_prev::timestamp) at time zone tz)
  ),
  cur as (select * from pv where t::date >= v_from),
  prev as (select * from pv where t::date < v_from)
  select jsonb_build_object(
    'days', v_days,
    'online', coalesce((select jsonb_object_agg(role, n) from (select role, count(*) n from public.visitor_presence where last_seen > now() - interval '5 minutes' group by role) x), '{}'::jsonb),
    'views', (select coalesce(sum(views), 0) from cur),
    'views_prev', (select coalesce(sum(views), 0) from prev),
    'visitors', (select count(*) from public.visitor_days where day >= v_from),
    'visitors_prev', (select count(*) from public.visitor_days where day >= v_prev and day < v_from),
    'new_users', (select count(*) from public.profiles p where (p.created_at at time zone tz)::date >= v_from
                    and not exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role = 'student'))
                 + (select count(*) from public.students s where (s.created_at at time zone tz)::date >= v_from),
    'new_users_prev', (select count(*) from public.profiles p where (p.created_at at time zone tz)::date >= v_prev and (p.created_at at time zone tz)::date < v_from
                    and not exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role = 'student'))
                 + (select count(*) from public.students s where (s.created_at at time zone tz)::date >= v_prev and (s.created_at at time zone tz)::date < v_from),
    'attempts', (select count(*) from public.lesson_results where (created_at at time zone tz)::date >= v_from),
    'accuracy', (select case when sum(total) > 0 then round(sum(score) * 100.0 / sum(total)) end from public.lesson_results where (created_at at time zone tz)::date >= v_from),
    'study_minutes', (select case when count(distinct student_id) > 0 then round(sum(coalesce(duration_ms, 0)) / 60000.0 / count(distinct student_id)) end
                      from public.lesson_results where (created_at at time zone tz)::date >= v_from),
    'revenue_month', (select coalesce(sum(amount), 0) from public.payment_requests where status = 'confirmed' and (confirmed_at at time zone tz)::date >= v_month),
    'paid_month', (select count(*) from public.payment_requests where status = 'confirmed' and (confirmed_at at time zone tz)::date >= v_month),
    'series', coalesce((
      select jsonb_agg(jsonb_build_object('k', k, 'student', st, 'teacher', te, 'parent', pa, 'guest', gu, 'admin', ad) order by k)
      from (
        select case when v_days = 1 then to_char(t, 'HH24') else to_char(t::date, 'YYYY-MM-DD') end k,
               sum(views) filter (where role = 'student') st, sum(views) filter (where role = 'teacher') te,
               sum(views) filter (where role = 'parent') pa, sum(views) filter (where role = 'guest') gu,
               sum(views) filter (where role = 'admin') ad
        from cur group by 1
      ) s), '[]'::jsonb),
    'heat', coalesce((
      select jsonb_agg(jsonb_build_object('d', d, 'h', h, 'v', v))
      from (select extract(isodow from t)::int d, extract(hour from t)::int h, sum(views) v
            from pv where t::date > v_today - 7 group by 1, 2) x), '[]'::jsonb),
    'by_grade', coalesce((select jsonb_object_agg(grade, v) from (select grade, sum(views) v from cur where role = 'student' and grade > 0 group by grade) x), '{}'::jsonb),
    'by_device', coalesce((select jsonb_object_agg(device, v) from (select device, sum(views) v from cur group by device) x), '{}'::jsonb),
    'by_role', coalesce((select jsonb_object_agg(role, v) from (select role, sum(views) v from cur group by role) x), '{}'::jsonb),
    'top_paths', coalesce((select jsonb_agg(jsonb_build_object('path', path, 'v', v) order by v desc) from (select path, sum(views) v from cur group by path order by 2 desc limit 8) x), '[]'::jsonb),
    'subjects', coalesce((select jsonb_agg(jsonb_build_object('s', s, 'n', n) order by n desc) from (
        select case when lesson_code ~ '^nc[1-5]-' then 'nang-cao' else coalesce(subject_code, 'khac') end s, count(*) n
        from public.lesson_results where (created_at at time zone tz)::date >= v_from group by 1) x), '[]'::jsonb),
    'tasks', jsonb_build_object(
      'teachers_pending', (select count(*) from public.teacher_applications where status = 'pending'),
      'lessons_review', (select count(*) from public.lessons where status = 'review'),
      'payments_pending', (select count(*) from public.payment_requests where status = 'pending')),
    'recent_users', coalesce((select jsonb_agg(u order by (u ->> 'at') desc) from (
        select jsonb_build_object('name', x.name, 'kind', x.kind, 'grade', x.grade, 'at', x.ts, 'pending', x.pending, 'by', x.by_name) u
        from (
          (select p.display_name name,
                  case when exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role in ('teacher', 'school_admin')) then 'teacher'
                       when exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role = 'system_admin') then 'admin'
                       else 'parent' end kind,
                  null::smallint as grade, p.created_at as ts, exists (select 1 from public.teacher_applications ta where ta.user_id = p.id and ta.status = 'pending') pending, null::text by_name
           from public.profiles p
           where not exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role = 'student')
           order by p.created_at desc limit 8)
          union all
          (select s.display_name, 'student', s.grade, s.created_at as ts, false, (select display_name from public.profiles where id = s.created_by)
           from public.students s order by s.created_at desc limit 8)
        ) x order by x.ts desc limit 8) y), '[]'::jsonb)
  ) into r;
  return r;
end;
$$;

-- Danh sách người dùng có lọc vai trò / mới đăng ký và "lần cuối truy cập"
create or replace function public.admin_list_users_v2(p_search text default null, p_role text default null, p_new_days integer default null)
returns table (user_id uuid, email text, display_name text, created_at timestamptz, roles jsonb, last_seen timestamptz, grade smallint, pending_teacher boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.admin_require();
  return query
  select p.id, u.email::text, p.display_name, p.created_at,
         coalesce((select jsonb_agg(jsonb_build_object('role', ur.role, 'school_id', ur.school_id, 'school_name', sc.name) order by ur.role)
                   from public.user_roles ur left join public.schools sc on sc.id = ur.school_id where ur.user_id = p.id), '[]'::jsonb),
         ls.last_seen,
         (select s.grade from public.students s where s.user_id = p.id limit 1),
         exists (select 1 from public.teacher_applications ta where ta.user_id = p.id and ta.status = 'pending')
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.user_last_seen ls on ls.user_id = p.id
  where (p_search is null or btrim(p_search) = '' or u.email ilike '%' || btrim(p_search) || '%' or p.display_name ilike '%' || btrim(p_search) || '%')
    and (p_role is null or exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role::text = p_role)
         or (p_role = 'teacher' and exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role = 'school_admin')))
    and (p_new_days is null or p.created_at >= now() - make_interval(days => p_new_days))
  order by p.created_at desc
  limit 300;
end;
$$;

revoke all on function public.admin_nav_counts() from public, anon;
revoke all on function public.admin_list_notifications(text, boolean, integer) from public, anon;
revoke all on function public.admin_mark_notifications_read(bigint[]) from public, anon;
revoke all on function public.admin_insights(integer) from public, anon;
revoke all on function public.admin_list_users_v2(text, text, integer) from public, anon;
grant execute on function public.admin_nav_counts() to authenticated;
grant execute on function public.admin_list_notifications(text, boolean, integer) to authenticated;
grant execute on function public.admin_mark_notifications_read(bigint[]) to authenticated;
grant execute on function public.admin_insights(integer) to authenticated;
grant execute on function public.admin_list_users_v2(text, text, integer) to authenticated;
