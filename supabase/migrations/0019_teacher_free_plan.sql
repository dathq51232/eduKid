-- EduChain Kids 0019: GIÁO VIÊN ĐĂNG KÝ MIỄN PHÍ, dùng ngay (không chờ duyệt) — gói miễn phí tối đa 3 học sinh.
-- Muốn thêm học sinh: liên hệ quản trị; quản trị nâng giới hạn cho từng giáo viên (tối đa 40 / lớp như cũ).
-- CHỈ THÊM MỚI / THAY HÀM, chạy lại an toàn.
--  * request_teacher_role: cấp vai trò giáo viên NGAY (tạo trường riêng theo tên khai báo), ghi đơn ở trạng thái đã duyệt.
--  * Đơn đang chờ duyệt từ trước: duyệt luôn khi chạy migration này.
--  * Giới hạn tính trên TỔNG học sinh đang học trong mọi lớp của giáo viên (lưu trữ lớp rồi mở lớp mới không tăng thêm chỗ).
--  * Giáo viên hiện đang có hơn 3 học sinh: giữ nguyên quyền cũ (giới hạn 40) để không ảnh hưởng lớp đang dùng.

create table if not exists public.teacher_plans (
  teacher_id uuid primary key references public.profiles(id) on delete cascade,
  student_limit smallint not null default 3 check (student_limit between 1 and 200),
  note text check (note is null or char_length(note) <= 300),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.teacher_plans enable row level security;
revoke all on table public.teacher_plans from anon, authenticated;
grant select, insert, update, delete on table public.teacher_plans to service_role;

-- Giáo viên đang có hơn 3 học sinh: giữ quyền như trước (40)
insert into public.teacher_plans (teacher_id, student_limit, note)
select ct.teacher_id, 40, 'Giữ quyền cũ khi chuyển sang gói miễn phí 3 học sinh'
from public.class_teachers ct
join public.class_memberships cm on cm.class_id = ct.class_id and cm.status = 'active'
group by ct.teacher_id
having count(distinct cm.student_id) > 3
on conflict (teacher_id) do nothing;

create or replace function public.teacher_student_limit(p_teacher uuid)
returns integer
language sql stable security definer set search_path = ''
as $$ select coalesce((select student_limit from public.teacher_plans where teacher_id = p_teacher), 3)::integer; $$;
revoke all on function public.teacher_student_limit(uuid) from public, anon, authenticated;

create or replace function public.teacher_students_used(p_teacher uuid)
returns integer
language sql stable security definer set search_path = ''
as $$
  select count(distinct cm.student_id)::integer
  from public.class_teachers ct join public.class_memberships cm on cm.class_id = ct.class_id and cm.status = 'active'
  where ct.teacher_id = p_teacher;
$$;
revoke all on function public.teacher_students_used(uuid) from public, anon, authenticated;

-- Thêm / kích hoạt lại học sinh: tối đa 40 / lớp (như 0016) VÀ trong giới hạn gói của giáo viên lớp đó
create or replace function public.enforce_class_size()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from 'active') then
    if (select count(*) from public.class_memberships cm
        where cm.class_id = new.class_id and cm.status = 'active' and cm.student_id <> new.student_id) >= 40 then
      raise exception 'class_full' using errcode = '54000';
    end if;
    -- lớp có giáo viên phụ trách: cần ít nhất một giáo viên còn chỗ trong gói
    if exists (select 1 from public.class_teachers ct where ct.class_id = new.class_id)
       and not exists (
         select 1 from public.class_teachers ct
         where ct.class_id = new.class_id
           and (select count(distinct cm.student_id) from public.class_teachers ct2
                  join public.class_memberships cm on cm.class_id = ct2.class_id and cm.status = 'active'
                 where ct2.teacher_id = ct.teacher_id and cm.student_id <> new.student_id)
               < public.teacher_student_limit(ct.teacher_id)) then
      raise exception 'plan_limit' using errcode = '54000';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_class_size() from public, anon, authenticated;
drop trigger if exists class_memberships_size on public.class_memberships;
create trigger class_memberships_size before insert or update of status on public.class_memberships
for each row execute function public.enforce_class_size();

-- Đăng ký làm giáo viên: cấp quyền NGAY (gói miễn phí). Học sinh không tự nâng quyền được.
create or replace function public.request_teacher_role(p_school_name text, p_note text default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := trim(coalesce(p_school_name, ''));
  v_id uuid;
  v_school uuid;
begin
  if v_uid is null or public.has_role('student', null)
     or exists (select 1 from public.students s where s.user_id = v_uid) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if exists (select 1 from public.user_roles where user_id = v_uid and role = 'teacher') then
    raise exception 'already_teacher' using errcode = '22023';
  end if;
  if char_length(v_name) not between 2 and 180 then
    raise exception 'invalid_school_name' using errcode = '22023';
  end if;
  insert into public.schools (name) values (v_name) returning id into v_school;
  insert into public.user_roles (user_id, role, school_id, granted_by) values (v_uid, 'teacher', v_school, null) on conflict do nothing;
  update public.teacher_applications
     set school_name = v_name, note = nullif(left(trim(coalesce(p_note, '')), 500), ''),
         status = 'approved', school_id = v_school, reviewed_at = now()
   where user_id = v_uid and status = 'pending'
  returning id into v_id;
  if v_id is null then
    insert into public.teacher_applications (user_id, school_name, note, status, school_id, reviewed_at)
    values (v_uid, v_name, nullif(left(trim(coalesce(p_note, '')), 500), ''), 'approved', v_school, now())
    returning id into v_id;
  end if;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'teacher_self_signup', 'teacher_application', v_id::text, 'gói miễn phí');
  return v_id;
end;
$$;
revoke all on function public.request_teacher_role(text, text) from public, anon;
grant execute on function public.request_teacher_role(text, text) to authenticated;

-- Đơn đang chờ từ trước: duyệt luôn (mỗi giáo viên một trường theo tên khai báo)
do $$
declare a record; v_school uuid;
begin
  for a in select * from public.teacher_applications where status = 'pending' loop
    if exists (select 1 from public.user_roles where user_id = a.user_id and role = 'teacher') then
      update public.teacher_applications set status = 'approved', reviewed_at = now() where id = a.id;
      continue;
    end if;
    if exists (select 1 from public.user_roles where user_id = a.user_id and role = 'student') then continue; end if;
    insert into public.schools (name) values (a.school_name) returning id into v_school;
    insert into public.user_roles (user_id, role, school_id) values (a.user_id, 'teacher', v_school) on conflict do nothing;
    update public.teacher_applications set status = 'approved', school_id = v_school, reviewed_at = now() where id = a.id;
  end loop;
end $$;

-- Giáo viên xem gói của mình
create or replace function public.teacher_my_plan()
returns table (student_limit integer, students_used integer)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'teacher') then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query select public.teacher_student_limit(auth.uid()), public.teacher_students_used(auth.uid());
end;
$$;

-- Quản trị: danh sách giáo viên + số học sinh đang dùng + giới hạn
create or replace function public.admin_list_teacher_plans(p_search text)
returns table (teacher_id uuid, display_name text, email text, school_name text, classes integer, students_used integer,
               student_limit integer, note text, joined_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare v_q text := nullif(trim(coalesce(p_search, '')), '');
begin
  if auth.uid() is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query
  select r.user_id, p.display_name, u.email::text, sc.name,
         (select count(*)::integer from public.class_teachers ct where ct.teacher_id = r.user_id),
         public.teacher_students_used(r.user_id), public.teacher_student_limit(r.user_id),
         tp.note, r.created_at
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

create or replace function public.admin_set_teacher_limit(p_teacher uuid, p_limit integer, p_note text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_limit is null or p_limit not between 1 and 200 then raise exception 'invalid_limit' using errcode = '22023'; end if;
  if not exists (select 1 from public.user_roles where user_id = p_teacher and role = 'teacher') then
    raise exception 'not_teacher' using errcode = '22023';
  end if;
  insert into public.teacher_plans (teacher_id, student_limit, note, updated_by)
  values (p_teacher, p_limit, nullif(trim(coalesce(p_note, '')), ''), v_uid)
  on conflict (teacher_id) do update set student_limit = excluded.student_limit, note = excluded.note, updated_by = v_uid, updated_at = now();
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'admin_set_teacher_limit', 'profile', p_teacher::text, p_limit::text || ' học sinh');
end;
$$;

do $$
declare f text;
begin
  foreach f in array array['public.teacher_my_plan()', 'public.admin_list_teacher_plans(text)', 'public.admin_set_teacher_limit(uuid, integer, text)'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
