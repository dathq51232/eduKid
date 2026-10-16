-- EduChain Kids 0008: lớp học do giáo viên quản lý, tài khoản học sinh (mã lớp + PIN), duyệt giáo viên,
-- mã mời phụ huynh, kết quả học tập do máy chủ ghi.
-- Chạy SAU 0007. Chỉ THÊM bảng/cột/hàm và thay policy; không xóa dữ liệu. Chạy lặp lại an toàn.
--
-- Nguyên tắc:
--   * Vai trò chỉ được cấp bởi system_admin (admin_set_role, review_teacher_application). Không ai tự nâng quyền.
--   * Giáo viên chỉ thấy lớp mình được phân công (bỏ quyền "cùng trường thì thấy hết").
--   * Học sinh chỉ thấy dữ liệu của chính mình. Phụ huynh chỉ thấy con đã liên kết hợp lệ.
--   * Kết quả học tập chỉ được ghi bằng service_role (máy chủ đã chấm lại), không ghi trực tiếp từ trình duyệt.

-- ---------------------------------------------------------------------------
-- A. Học sinh có tài khoản đăng nhập
-- ---------------------------------------------------------------------------
alter table public.students add column if not exists user_id uuid references auth.users(id) on delete set null;
create unique index if not exists students_user_id_unique on public.students (user_id) where user_id is not null;

alter table public.user_roles drop constraint if exists user_roles_school_scope;
alter table public.user_roles add constraint user_roles_school_scope check (
  (role in ('parent', 'system_admin', 'student') and school_id is null)
  or (role in ('teacher', 'school_admin') and school_id is not null)
);

-- Tài khoản học sinh được máy chủ tạo với app_metadata.account_type = 'student' (chỉ service_role đặt được
-- app_metadata) -> nhận vai trò student, KHÔNG nhận vai trò phụ huynh như người lớn tự đăng ký.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_student boolean := coalesce(new.raw_app_meta_data ->> 'account_type', '') = 'student';
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 100), ''), case when v_is_student then 'Học sinh' else 'Người dùng' end)
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, case when v_is_student then 'student'::public.app_role else 'parent'::public.app_role end)
  on conflict do nothing;

  return new;
end;
$$;

-- Hồ sơ học sinh gắn với tài khoản đang đăng nhập (null nếu không phải học sinh)
create or replace function public.my_student_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.id from public.students s where s.user_id = (select auth.uid()) and s.status = 'active' limit 1;
$$;
revoke all on function public.my_student_id() from public, anon;
grant execute on function public.my_student_id() to authenticated;

-- ---------------------------------------------------------------------------
-- B. Bộ đếm nhập sai PIN — chỉ máy chủ (service_role) và hàm của giáo viên đọc/ghi
-- ---------------------------------------------------------------------------
create table if not exists public.student_login_guards (
  student_id uuid primary key references public.students(id) on delete cascade,
  failed_count smallint not null default 0 check (failed_count >= 0),
  locked_until timestamptz,
  last_failed_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.student_login_guards enable row level security;
revoke all on public.student_login_guards from anon, authenticated;

-- ---------------------------------------------------------------------------
-- C. Mã lớp (học sinh nhập để đăng nhập)
-- ---------------------------------------------------------------------------
alter table public.classes add column if not exists join_code text;
create unique index if not exists classes_join_code_unique on public.classes (join_code) where join_code is not null;
do $$ begin
  alter table public.classes add constraint classes_join_code_format check (join_code is null or join_code ~ '^[A-HJ-NP-Z]{3}-[0-9]{3}$');
exception when duplicate_object then null; end $$;

create or replace function public.new_join_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_letters constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ'; -- bỏ I, O cho khỏi nhầm với 1, 0
  v_code text;
begin
  loop
    v_code := substr(v_letters, 1 + floor(random() * 24)::int, 1)
           || substr(v_letters, 1 + floor(random() * 24)::int, 1)
           || substr(v_letters, 1 + floor(random() * 24)::int, 1)
           || '-' || lpad(floor(random() * 1000)::int::text, 3, '0');
    exit when not exists (select 1 from public.classes where join_code = v_code);
  end loop;
  return v_code;
end;
$$;
revoke all on function public.new_join_code() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- D. Đăng ký giáo viên có bước duyệt
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.application_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.teacher_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  school_name text not null check (char_length(school_name) between 2 and 180),
  note text check (note is null or char_length(note) <= 500),
  status public.application_status not null default 'pending',
  school_id uuid references public.schools(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists teacher_applications_one_pending on public.teacher_applications (user_id) where status = 'pending';
alter table public.teacher_applications enable row level security;
revoke all on public.teacher_applications from anon;
revoke insert, update, delete on public.teacher_applications from authenticated;
drop policy if exists teacher_applications_select on public.teacher_applications;
create policy teacher_applications_select on public.teacher_applications for select to authenticated
using (user_id = (select auth.uid()) or public.has_role('system_admin', null));

-- Người dùng gửi (hoặc cập nhật) yêu cầu làm giáo viên. Không cấp quyền gì ở bước này.
create or replace function public.request_teacher_role(p_school_name text, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := trim(coalesce(p_school_name, ''));
  v_id uuid;
begin
  if v_uid is null or public.has_role('student', null) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if exists (select 1 from public.user_roles where user_id = v_uid and role = 'teacher') then
    raise exception 'already_teacher' using errcode = '22023';
  end if;
  if char_length(v_name) not between 2 and 180 then
    raise exception 'invalid_school_name' using errcode = '22023';
  end if;

  update public.teacher_applications
     set school_name = v_name, note = nullif(left(trim(coalesce(p_note, '')), 500), '')
   where user_id = v_uid and status = 'pending'
  returning id into v_id;
  if v_id is null then
    insert into public.teacher_applications (user_id, school_name, note)
    values (v_uid, v_name, nullif(left(trim(coalesce(p_note, '')), 500), ''))
    returning id into v_id;
  end if;

  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (v_uid, 'request_teacher_role', 'teacher_application', v_id::text);
  return v_id;
end;
$$;

-- Quản trị hệ thống duyệt / từ chối. Duyệt = cấp vai trò teacher trong trường (tạo trường mới nếu chưa chọn).
create or replace function public.review_teacher_application(p_application uuid, p_approve boolean, p_school uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_app public.teacher_applications%rowtype;
  v_school uuid := p_school;
begin
  if v_uid is null or not public.has_role('system_admin', null) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  select * into v_app from public.teacher_applications where id = p_application for update;
  if not found or v_app.status <> 'pending' then
    raise exception 'application_not_pending' using errcode = '22023';
  end if;

  if p_approve then
    if v_school is null then
      insert into public.schools (name) values (v_app.school_name) returning id into v_school;
    elsif not exists (select 1 from public.schools where id = v_school) then
      raise exception 'school_not_found' using errcode = '22023';
    end if;
    insert into public.user_roles (user_id, role, school_id, granted_by)
    values (v_app.user_id, 'teacher', v_school, v_uid)
    on conflict do nothing;
  end if;

  update public.teacher_applications
     set status = case when p_approve then 'approved'::public.application_status else 'rejected'::public.application_status end,
         school_id = v_school, reviewed_by = v_uid, reviewed_at = now()
   where id = p_application;

  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (v_uid, case when p_approve then 'approve_teacher' else 'reject_teacher' end, 'profile', v_app.user_id::text);
  return v_school;
end;
$$;

create or replace function public.admin_list_teacher_applications(p_status public.application_status default 'pending')
returns table (id uuid, user_id uuid, display_name text, email text, school_name text, note text, status public.application_status, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.has_role('system_admin', null) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query
  select a.id, a.user_id, p.display_name, u.email::text, a.school_name, a.note, a.status, a.created_at
  from public.teacher_applications a
  join public.profiles p on p.id = a.user_id
  left join auth.users u on u.id = a.user_id
  where a.status = p_status
  order by a.created_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- E. Phạm vi xem: giáo viên chỉ thấy lớp được phân công; học sinh thấy chính mình
-- ---------------------------------------------------------------------------
drop policy if exists classes_select_scope on public.classes;
create policy classes_select_scope on public.classes for select to authenticated
using (public.teaches_class(id) or public.has_role('school_admin', school_id) or public.has_role('system_admin', null));

drop policy if exists classes_select_student on public.classes;
create policy classes_select_student on public.classes for select to authenticated
using (exists (
  select 1 from public.class_memberships cm
  where cm.class_id = classes.id and cm.status = 'active' and cm.student_id = public.my_student_id()
));

drop policy if exists students_select_parent_or_school on public.students;
create policy students_select_parent_or_school on public.students for select to authenticated
using (
  public.is_parent_of(id)
  or user_id = (select auth.uid())
  or exists (select 1 from public.class_memberships cm where cm.student_id = id and public.teaches_class(cm.class_id))
  or (school_id is not null and public.has_role('school_admin', school_id))
  or public.has_role('system_admin', null)
);

drop policy if exists class_memberships_select_scope on public.class_memberships;
create policy class_memberships_select_scope on public.class_memberships for select to authenticated
using (
  public.teaches_class(class_id)
  or public.is_parent_of(student_id)
  or student_id = public.my_student_id()
  or public.has_role('system_admin', null)
);

drop policy if exists attempts_select_scope on public.quiz_attempts;
create policy attempts_select_scope on public.quiz_attempts for select to authenticated
using (
  public.is_parent_of(student_id)
  or student_id = public.my_student_id()
  or exists (select 1 from public.class_memberships cm where cm.student_id = quiz_attempts.student_id and public.teaches_class(cm.class_id))
  or public.has_role('system_admin', null)
);

-- Người dùng không được đổi cột liên kết tài khoản / trạng thái của học sinh (chỉ tên và khối như trước)
revoke update on public.students from anon, authenticated;
grant update (display_name, grade) on public.students to authenticated;

-- Giáo viên có quyền với một học sinh khi học sinh đang học lớp giáo viên được phân công
create or replace function public.teaches_student(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.class_memberships cm
    where cm.student_id = target_student and cm.status = 'active' and public.teaches_class(cm.class_id)
  );
$$;
revoke all on function public.teaches_student(uuid) from public, anon;
grant execute on function public.teaches_student(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- F. Nghiệp vụ lớp học của giáo viên
-- ---------------------------------------------------------------------------
create or replace function public.teacher_create_class(p_name text, p_grade smallint)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_school uuid;
  v_name text := trim(coalesce(p_name, ''));
  v_class uuid;
begin
  select ur.school_id into v_school from public.user_roles ur
  where ur.user_id = v_uid and ur.role = 'teacher' order by ur.created_at limit 1;
  if v_uid is null or v_school is null then
    raise exception 'not_allowed' using errcode = '42501'; -- chưa được duyệt làm giáo viên
  end if;
  if char_length(v_name) not between 1 and 80 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  if p_grade is null or p_grade not between 1 and 5 then
    raise exception 'invalid_grade' using errcode = '22023';
  end if;
  if (select count(*) from public.class_teachers where teacher_id = v_uid) >= 20 then
    raise exception 'too_many_classes' using errcode = '54000';
  end if;

  insert into public.classes (school_id, name, grade, created_by, join_code)
  values (v_school, v_name, p_grade, v_uid, public.new_join_code())
  returning id into v_class;
  insert into public.class_teachers (class_id, teacher_id, assigned_by) values (v_class, v_uid, v_uid);

  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (v_uid, 'teacher_create_class', 'class', v_class::text);
  return v_class;
end;
$$;

create or replace function public.teacher_set_class_status(p_class uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (select 1 from public.class_teachers where class_id = p_class and teacher_id = v_uid) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  update public.classes set status = case when p_active then 'active'::public.record_status else 'inactive'::public.record_status end
  where id = p_class;
  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (v_uid, case when p_active then 'class_activate' else 'class_archive' end, 'class', p_class::text);
end;
$$;

-- Thêm học sinh vào lớp (chỉ tên gọi). Giáo viên xác nhận nhà trường đã có sự đồng ý của phụ huynh.
-- Tài khoản đăng nhập do máy chủ tạo ngay sau đó (service_role) — xem src/app/api/giao-vien.
create or replace function public.teacher_add_students(p_class uuid, p_names text[], p_policy_version text, p_consent boolean)
returns table (student_id uuid, display_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_class public.classes%rowtype;
  v_name text;
  v_student uuid;
  v_count integer;
begin
  if v_uid is null or not exists (select 1 from public.class_teachers ct where ct.class_id = p_class and ct.teacher_id = v_uid) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  select * into v_class from public.classes where id = p_class;
  if v_class.status <> 'active' then
    raise exception 'class_inactive' using errcode = '22023';
  end if;
  if p_consent is not true then
    raise exception 'consent_required' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_policy_version, ''))) = 0 then
    raise exception 'policy_version_required' using errcode = '22023';
  end if;
  if p_names is null or cardinality(p_names) = 0 or cardinality(p_names) > 50 then
    raise exception 'invalid_names' using errcode = '22023';
  end if;
  select count(*) into v_count from public.class_memberships cm where cm.class_id = p_class and cm.status = 'active';
  if v_count + cardinality(p_names) > 60 then
    raise exception 'class_full' using errcode = '54000';
  end if;

  foreach v_name in array p_names loop
    v_name := regexp_replace(trim(coalesce(v_name, '')), '\s+', ' ', 'g');
    if char_length(v_name) not between 1 and 60 then
      raise exception 'invalid_name' using errcode = '22023';
    end if;
    insert into public.students (school_id, display_name, grade, created_by)
    values (v_class.school_id, v_name, v_class.grade, v_uid)
    returning id into v_student;
    insert into public.class_memberships (class_id, student_id) values (p_class, v_student);
    insert into public.consent_records (subject_student_id, guardian_id, purpose, policy_version, status, metadata)
    values (v_student, v_uid, 'learning_progress', trim(p_policy_version), 'granted',
            jsonb_build_object('basis', 'school_collected', 'recorded_by_role', 'teacher', 'class_id', p_class));
    insert into public.student_login_guards (student_id) values (v_student) on conflict do nothing;
    student_id := v_student; display_name := v_name;
    return next;
  end loop;

  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'teacher_add_students', 'class', p_class::text, cardinality(p_names)::text || ' học sinh');
end;
$$;

-- Danh sách lớp cho giáo viên (kèm trạng thái khóa do nhập sai PIN)
create or replace function public.teacher_class_roster(p_class uuid)
returns table (student_id uuid, display_name text, student_status public.record_status, membership_status public.record_status,
               has_account boolean, failed_count smallint, locked_until timestamptz, parents integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query
  select s.id, s.display_name, s.status, cm.status, s.user_id is not null,
         coalesce(g.failed_count, 0::smallint), g.locked_until,
         (select count(*)::integer from public.parent_student_links l where l.student_id = s.id and l.status = 'active')
  from public.class_memberships cm
  join public.students s on s.id = cm.student_id
  left join public.student_login_guards g on g.student_id = s.id
  where cm.class_id = p_class
  order by cm.status, s.display_name;
end;
$$;

-- Khóa / mở tài khoản học sinh; mở khóa do nhập sai PIN; cho rời lớp
create or replace function public.teacher_manage_student(p_class uuid, p_student uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.teaches_class(p_class)
     or not exists (select 1 from public.class_memberships where class_id = p_class and student_id = p_student) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_action = 'lock' then
    update public.students set status = 'inactive' where id = p_student;
  elsif p_action = 'unlock' then
    update public.students set status = 'active' where id = p_student;
    insert into public.student_login_guards (student_id) values (p_student)
    on conflict (student_id) do update set failed_count = 0, locked_until = null, updated_at = now();
  elsif p_action = 'reset_attempts' then
    insert into public.student_login_guards (student_id) values (p_student)
    on conflict (student_id) do update set failed_count = 0, locked_until = null, updated_at = now();
  elsif p_action = 'remove' then
    update public.class_memberships set status = 'inactive' where class_id = p_class and student_id = p_student;
  elsif p_action = 'restore' then
    update public.class_memberships set status = 'active' where class_id = p_class and student_id = p_student;
  elsif p_action = 'rename' then
    raise exception 'use_rename_function' using errcode = '22023';
  else
    raise exception 'invalid_action' using errcode = '22023';
  end if;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'teacher_' || p_action || '_student', 'student', p_student::text, p_class::text);
end;
$$;

create or replace function public.teacher_rename_student(p_class uuid, p_student uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_name text := regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g');
begin
  if v_uid is null or not public.teaches_class(p_class)
     or not exists (select 1 from public.class_memberships where class_id = p_class and student_id = p_student) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if char_length(v_name) not between 1 and 60 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  update public.students set display_name = v_name where id = p_student;
end;
$$;

-- Máy chủ gọi trước khi đặt/đổi PIN: xác nhận người gọi là giáo viên của học sinh trong lớp này
create or replace function public.teacher_can_manage_student(p_class uuid, p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
     and public.teaches_class(p_class)
     and exists (select 1 from public.class_memberships where class_id = p_class and student_id = p_student);
$$;

-- ---------------------------------------------------------------------------
-- G. Mã mời phụ huynh (dùng lại class_invites, loại 'parent', gắn với một học sinh)
-- ---------------------------------------------------------------------------
alter table public.class_invites add column if not exists kind text not null default 'class';
alter table public.class_invites add column if not exists student_id uuid references public.students(id) on delete cascade;
do $$ begin
  alter table public.class_invites add constraint class_invites_kind check (
    (kind = 'class' and student_id is null) or (kind = 'parent' and student_id is not null));
exception when duplicate_object then null; end $$;

create or replace function public.create_parent_invite(p_class uuid, p_student uuid, p_days integer default 30)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
begin
  if v_uid is null or not public.teaches_class(p_class)
     or not exists (select 1 from public.class_memberships where class_id = p_class and student_id = p_student and status = 'active') then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_days is null or p_days not between 1 and 90 then
    raise exception 'invalid_days' using errcode = '22023';
  end if;
  -- mỗi lần tạo mới thì mã cũ của học sinh này hết hiệu lực
  update public.class_invites set status = 'revoked' where kind = 'parent' and student_id = p_student and status = 'active';
  v_code := 'PH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.class_invites (class_id, code, created_by, expires_at, max_uses, kind, student_id)
  values (p_class, v_code, v_uid, now() + make_interval(days => p_days), 2, 'parent', p_student);
  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (v_uid, 'create_parent_invite', 'student', p_student::text);
  return v_code;
end;
$$;

-- Phụ huynh nhập mã -> được liên kết (đã xác minh) với đúng một học sinh. Nhập sai bị giới hạn số lần.
create or replace function public.redeem_parent_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.class_invites%rowtype;
begin
  if v_uid is null or public.has_role('student', null) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if (select count(*) from public.audit_logs
      where actor_id = v_uid and action = 'parent_invite_failed' and created_at > now() - interval '10 minutes') >= 10 then
    raise exception 'too_many_attempts' using errcode = '54000';
  end if;

  select * into v_inv from public.class_invites
  where code = upper(trim(coalesce(p_code, ''))) and kind = 'parent'
    and status = 'active' and expires_at > now() and used_count < max_uses
  for update;
  if not found then
    insert into public.audit_logs (actor_id, action, target_type) values (v_uid, 'parent_invite_failed', 'class_invite');
    return null;
  end if;

  insert into public.user_roles (user_id, role) values (v_uid, 'parent') on conflict do nothing;
  insert into public.parent_student_links (parent_id, student_id, status, verified_at)
  values (v_uid, v_inv.student_id, 'active', now())
  on conflict (parent_id, student_id) do update set status = 'active', verified_at = coalesce(public.parent_student_links.verified_at, now());
  update public.class_invites set used_count = used_count + 1 where id = v_inv.id;

  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values (v_uid, 'redeem_parent_invite', 'student', v_inv.student_id::text);
  return v_inv.student_id;
end;
$$;

-- Mã mời vào lớp (loại 'class') không dùng được làm mã phụ huynh và ngược lại
create or replace function public.redeem_class_invite(p_code text, p_student uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.class_invites%rowtype;
  v_class_grade smallint;
  v_student_grade smallint;
  v_rows integer;
begin
  if v_uid is null or not public.is_parent_of(p_student) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if (select count(*) from public.audit_logs
      where actor_id = v_uid and action = 'class_invite_failed'
        and created_at > now() - interval '10 minutes') >= 10 then
    raise exception 'too_many_attempts' using errcode = '54000';
  end if;

  select * into v_inv from public.class_invites
  where code = upper(trim(coalesce(p_code, ''))) and kind = 'class'
    and status = 'active' and expires_at > now() and used_count < max_uses
  for update;

  if not found then
    insert into public.audit_logs (actor_id, action, target_type)
    values (v_uid, 'class_invite_failed', 'class_invite');
    return null;
  end if;

  select grade into v_class_grade from public.classes where id = v_inv.class_id;
  select grade into v_student_grade from public.students where id = p_student;
  if v_class_grade is distinct from v_student_grade then
    raise exception 'grade_mismatch' using errcode = '22023';
  end if;

  insert into public.class_memberships (class_id, student_id)
  values (v_inv.class_id, p_student)
  on conflict do nothing;
  get diagnostics v_rows = row_count;

  if v_rows > 0 then
    update public.class_invites set used_count = used_count + 1 where id = v_inv.id;
    insert into public.audit_logs (actor_id, action, target_type, target_id)
    values (v_uid, 'redeem_class_invite', 'student', p_student::text);
  end if;

  return v_inv.class_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- H. Kết quả học tập và kết quả game (máy chủ chấm lại rồi ghi bằng service_role)
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  lesson_code text not null check (char_length(lesson_code) between 1 and 120),
  lesson_title text check (lesson_title is null or char_length(lesson_title) <= 200),
  subject_code text check (subject_code is null or subject_code in ('toan', 'tieng-viet', 'tieng-anh')),
  grade smallint check (grade is null or grade between 1 and 5),
  seed bigint,
  muc smallint check (muc is null or muc between 1 and 3),
  score smallint not null,
  total smallint not null check (total between 1 and 30),
  points integer not null check (points >= 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint lesson_results_score check (score between 0 and total)
);
create index if not exists lesson_results_student_idx on public.lesson_results (student_id, created_at desc);
create index if not exists lesson_results_lesson_idx on public.lesson_results (lesson_code);

create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  game_id text not null check (game_id in ('pattern', 'memory', 'maze')),
  level smallint not null check (level between 1 and 5),
  score integer not null check (score >= 0),
  max_score integer not null check (max_score > 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint game_results_score check (score <= max_score)
);
create index if not exists game_results_student_idx on public.game_results (student_id, created_at desc);

alter table public.lesson_results enable row level security;
alter table public.game_results enable row level security;
revoke all on public.lesson_results, public.game_results from anon;
revoke insert, update, delete on public.lesson_results, public.game_results from authenticated;

drop policy if exists lesson_results_select on public.lesson_results;
create policy lesson_results_select on public.lesson_results for select to authenticated
using (student_id = public.my_student_id() or public.can_view_student(student_id));
drop policy if exists game_results_select on public.game_results;
create policy game_results_select on public.game_results for select to authenticated
using (student_id = public.my_student_id() or public.can_view_student(student_id));

-- Tổng hợp tiến độ cả lớp cho giáo viên được phân công
create or replace function public.class_results_summary(p_class uuid)
returns table (student_id uuid, display_name text, lessons_done integer, avg_percent integer, total_points integer,
               games_played integer, last_activity timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query
  select s.id, s.display_name,
         (select count(distinct r.lesson_code)::integer from public.lesson_results r where r.student_id = s.id),
         (select coalesce(round(avg(r.score * 100.0 / r.total)), 0)::integer from public.lesson_results r where r.student_id = s.id),
         (select coalesce(sum(b.best), 0)::integer from (
            select max(r.points) as best from public.lesson_results r where r.student_id = s.id group by r.lesson_code) b),
         (select count(*)::integer from public.game_results g where g.student_id = s.id),
         greatest((select max(r.created_at) from public.lesson_results r where r.student_id = s.id),
                  (select max(g.created_at) from public.game_results g where g.student_id = s.id))
  from public.class_memberships cm
  join public.students s on s.id = cm.student_id
  where cm.class_id = p_class and cm.status = 'active'
  order by s.display_name;
end;
$$;

-- ---------------------------------------------------------------------------
-- I. Quyền thực thi
-- ---------------------------------------------------------------------------
do $$
declare f text;
begin
  foreach f in array array[
    'public.request_teacher_role(text, text)',
    'public.review_teacher_application(uuid, boolean, uuid)',
    'public.admin_list_teacher_applications(public.application_status)',
    'public.teacher_create_class(text, smallint)',
    'public.teacher_set_class_status(uuid, boolean)',
    'public.teacher_add_students(uuid, text[], text, boolean)',
    'public.teacher_class_roster(uuid)',
    'public.teacher_manage_student(uuid, uuid, text)',
    'public.teacher_rename_student(uuid, uuid, text)',
    'public.teacher_can_manage_student(uuid, uuid)',
    'public.create_parent_invite(uuid, uuid, integer)',
    'public.redeem_parent_invite(text)',
    'public.redeem_class_invite(text, uuid)',
    'public.class_results_summary(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
