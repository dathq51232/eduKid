-- EduChain Kids 0045: GIÁO VIÊN MỚI ĐĂNG KÝ ĐƯỢC DÙNG THỬ ĐỦ LỚP (40 học sinh) TRONG 15 NGÀY.
-- CHỈ THÊM MỚI / THAY HÀM, chạy lại an toàn. Cần đã chạy 0018 (học phí) và 0019 (gói giáo viên).
--  * teacher_plans.trial_until: hạn dùng thử. Trong hạn: giới hạn = max(giới hạn gói, 40).
--  * Giáo viên đăng ký mới (được cấp vai trò teacher): tự tạo gói 3 học sinh + dùng thử 15 ngày.
--  * Giáo viên đã đăng ký trong 15 ngày gần đây (chưa có gói riêng): được dùng thử đến hết 15 ngày tính từ ngày đăng ký.
--  * Hết hạn mà quản trị chưa mở gói: chỉ những em vào lớp SỚM NHẤT trong phạm vi gói (3 em) học tiếp;
--    các em còn lại bị TẠM KHOÁ phần học (my_learning_gate trả reason = 'plan_locked'), dữ liệu giữ nguyên.
--    Quản trị nâng giới hạn (admin_set_teacher_limit) là các em học lại ngay.

alter table public.teacher_plans add column if not exists trial_until timestamptz;

create or replace function public.teacher_student_limit(p_teacher uuid)
returns integer
language sql stable security definer set search_path = ''
as $$
  select case when tp.trial_until is not null and tp.trial_until > now() then greatest(coalesce(tp.student_limit, 3), 40)
              else coalesce(tp.student_limit, 3) end::integer
  from (select 1) x left join public.teacher_plans tp on tp.teacher_id = p_teacher;
$$;
revoke all on function public.teacher_student_limit(uuid) from public, anon, authenticated;

-- Giáo viên mới: gói 3 học sinh + 15 ngày dùng thử đủ lớp
create or replace function public.teacher_trial_on_role()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.role = 'teacher' then
    insert into public.teacher_plans (teacher_id, student_limit, trial_until, note)
    values (new.user_id, 3, now() + interval '15 days', 'Dùng thử đủ lớp 15 ngày')
    on conflict (teacher_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.teacher_trial_on_role() from public, anon, authenticated;
drop trigger if exists user_roles_teacher_trial on public.user_roles;
create trigger user_roles_teacher_trial after insert on public.user_roles
for each row execute function public.teacher_trial_on_role();

-- Giáo viên đăng ký gần đây, chưa có gói riêng: dùng thử đến 15 ngày kể từ ngày đăng ký
insert into public.teacher_plans (teacher_id, student_limit, trial_until, note)
select r.user_id, 3, r.created_at + interval '15 days', 'Dùng thử đủ lớp 15 ngày'
from public.user_roles r
where r.role = 'teacher' and r.created_at > now() - interval '15 days'
on conflict (teacher_id) do nothing;

-- Học sinh có bị tạm khoá vì gói của thầy cô đã hết chỗ không.
-- Mỗi giáo viên: xếp học sinh đang học theo ngày vào lớp sớm nhất; em nằm ngoài giới hạn gói của MỌI giáo viên
-- phụ trách lớp em đang học thì bị khoá. Lớp không có giáo viên phụ trách thì không khoá.
create or replace function public.student_plan_locked(p_student uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  with my_teachers as (
    select distinct ct.teacher_id
    from public.class_memberships cm
    join public.classes c on c.id = cm.class_id and c.status = 'active'
    join public.class_teachers ct on ct.class_id = cm.class_id
    where cm.student_id = p_student and cm.status = 'active'
  ),
  ranked as (
    select mt.teacher_id, s.student_id, row_number() over (partition by mt.teacher_id order by s.first_joined, s.student_id) as rn
    from my_teachers mt
    join lateral (
      select cm.student_id, min(cm.joined_at) as first_joined
      from public.class_teachers ct join public.class_memberships cm on cm.class_id = ct.class_id and cm.status = 'active'
      where ct.teacher_id = mt.teacher_id
      group by cm.student_id
    ) s on true
  )
  select exists (select 1 from my_teachers)
     and not exists (
       select 1 from ranked r
       where r.student_id = p_student and r.rn <= public.teacher_student_limit(r.teacher_id)
     );
$$;
revoke all on function public.student_plan_locked(uuid) from public, anon, authenticated;

create or replace function public.my_learning_gate()
returns table (is_student boolean, grade smallint, active boolean, reason text, until timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id(); v_grade smallint; a record;
begin
  if v_sid is null then return query select false, null::smallint, true, 'not_student'::text, null::timestamptz; return; end if;
  select c.grade into v_grade from public.class_memberships cm join public.classes c on c.id = cm.class_id
   where cm.student_id = v_sid and cm.status = 'active' and c.status = 'active' order by c.created_at desc limit 1;
  if v_grade is null then select s.grade into v_grade from public.students s where s.id = v_sid; end if;
  if public.student_plan_locked(v_sid) then
    return query select true, v_grade, false, 'plan_locked'::text, null::timestamptz; return;
  end if;
  select * into a from public.billing_access(v_sid);
  return query select true, v_grade, a.active, a.reason, a.until;
end;
$$;

-- Giáo viên xem gói của mình: thêm hạn dùng thử, giới hạn gói (không tính dùng thử) và số em đang bị tạm khoá
drop function if exists public.teacher_my_plan();
create function public.teacher_my_plan()
returns table (student_limit integer, students_used integer, trial_until timestamptz, base_limit integer, locked integer)
language plpgsql stable security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_lim integer; v_used integer;
begin
  if v_uid is null or not exists (select 1 from public.user_roles where user_id = v_uid and role = 'teacher') then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  v_lim := public.teacher_student_limit(v_uid);
  v_used := public.teacher_students_used(v_uid);
  return query select v_lim, v_used,
    (select tp.trial_until from public.teacher_plans tp where tp.teacher_id = v_uid and tp.trial_until > now()),
    coalesce((select tp.student_limit::integer from public.teacher_plans tp where tp.teacher_id = v_uid), 3),
    greatest(0, v_used - v_lim);
end;
$$;

-- Giáo viên xem em nào trong lớp đang bị tạm khoá (để báo phụ huynh / liên hệ mở gói)
create or replace function public.teacher_locked_students(p_class uuid)
returns table (student_id uuid)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (select 1 from public.class_teachers ct where ct.class_id = p_class and ct.teacher_id = auth.uid()) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query select cm.student_id from public.class_memberships cm
   where cm.class_id = p_class and cm.status = 'active' and public.student_plan_locked(cm.student_id);
end;
$$;

-- Quản trị: thêm cột hạn dùng thử
drop function if exists public.admin_list_teacher_plans(text);
create function public.admin_list_teacher_plans(p_search text)
returns table (teacher_id uuid, display_name text, email text, school_name text, classes integer, students_used integer,
               student_limit integer, note text, joined_at timestamptz, trial_until timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare v_q text := nullif(trim(coalesce(p_search, '')), '');
begin
  if auth.uid() is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query
  select r.user_id, p.display_name, u.email::text, sc.name,
         (select count(*)::integer from public.class_teachers ct where ct.teacher_id = r.user_id),
         public.teacher_students_used(r.user_id), coalesce(tp.student_limit::integer, 3),
         tp.note, r.created_at, tp.trial_until
  from public.user_roles r
  join public.profiles p on p.id = r.user_id
  left join auth.users u on u.id = r.user_id
  left join public.schools sc on sc.id = r.school_id
  left join public.teacher_plans tp on tp.teacher_id = r.user_id
  where r.role = 'teacher'
    and (v_q is null or p.display_name ilike '%' || v_q || '%' or u.email ilike '%' || v_q || '%' or sc.name ilike '%' || v_q || '%')
  order by r.created_at desc
  limit 500;
end;
$$;

-- Quản trị: gia hạn dùng thử (số ngày tính từ hôm nay; 0 = kết thúc dùng thử ngay)
create or replace function public.admin_set_teacher_trial(p_teacher uuid, p_days integer)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_days is null or p_days not between 0 and 365 then raise exception 'invalid_days' using errcode = '22023'; end if;
  if not exists (select 1 from public.user_roles where user_id = p_teacher and role = 'teacher') then
    raise exception 'not_teacher' using errcode = '22023';
  end if;
  insert into public.teacher_plans (teacher_id, student_limit, trial_until, updated_by)
  values (p_teacher, 3, case when p_days = 0 then null else now() + make_interval(days => p_days) end, v_uid)
  on conflict (teacher_id) do update set trial_until = excluded.trial_until, updated_by = v_uid, updated_at = now();
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'admin_set_teacher_trial', 'profile', p_teacher::text, p_days::text || ' ngày dùng thử');
end;
$$;

do $$
declare f text;
begin
  foreach f in array array['public.teacher_my_plan()', 'public.teacher_locked_students(uuid)', 'public.admin_list_teacher_plans(text)', 'public.admin_set_teacher_trial(uuid, integer)'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
