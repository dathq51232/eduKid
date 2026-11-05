-- EduChain Kids 0047: PHỤ HUYNH ĐĂNG KÝ CHO CON (học đơn lẻ, không qua trường).
-- CHỈ THÊM MỚI / THAY HÀM, chạy lại an toàn. Cần đã chạy 0008 (tài khoản học sinh), 0018 (học phí), 0045.
--  * Mỗi phụ huynh có một "lớp gia đình" (classes.kind = 'family') thuộc trường ảo "Học tại nhà".
--    Con đăng nhập y như học sinh ở trường: mã gia đình (dạng mã lớp ABC-123) + chọn tên + PIN 6 số.
--  * Phụ huynh thêm tối đa 6 con; mỗi con có khối riêng (lớp gia đình không ép chung khối).
--  * Lớp gia đình không có giáo viên → không bị giới hạn gói giáo viên; học phí tính theo từng em (0018, có học thử).
--  * Phụ huynh chỉ đổi khối / cấp lại PIN cho con do chính mình tạo.

alter table public.classes add column if not exists kind text not null default 'school';
do $$ begin
  alter table public.classes add constraint classes_kind_check check (kind in ('school', 'family'));
exception when duplicate_object then null; end $$;
create unique index if not exists classes_family_owner_unique on public.classes (created_by) where kind = 'family';

-- Trường ảo chứa mọi lớp gia đình (id cố định)
insert into public.schools (id, name)
values ('f0000000-0000-4000-8000-000000000001', 'Học tại nhà (gia đình)')
on conflict (id) do nothing;

-- Lớp gia đình của phụ huynh đang đăng nhập (tạo nếu chưa có). Trả id, mã đăng nhập, tên.
create or replace function public.parent_family_class()
returns table (class_id uuid, join_code text, name text)
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_cls uuid; v_name text;
begin
  if v_uid is null or not public.has_role('parent', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  select c.id into v_cls from public.classes c where c.created_by = v_uid and c.kind = 'family';
  if v_cls is null then
    select left(coalesce(nullif(trim(p.display_name), ''), 'Phụ huynh'), 50) into v_name from public.profiles p where p.id = v_uid;
    insert into public.classes (school_id, name, grade, created_by, join_code, kind)
    values ('f0000000-0000-4000-8000-000000000001', 'Gia đình ' || coalesce(v_name, 'Phụ huynh') || ' · ' || upper(left(replace(v_uid::text, '-', ''), 4)),
            1, v_uid, public.new_join_code(), 'family')
    returning id into v_cls;
  end if;
  update public.classes c set status = 'active', join_code = coalesce(c.join_code, public.new_join_code()) where c.id = v_cls and (c.status <> 'active' or c.join_code is null);
  return query select c.id, c.join_code, c.name from public.classes c where c.id = v_cls;
end;
$$;
revoke all on function public.parent_family_class() from public, anon;
grant execute on function public.parent_family_class() to authenticated;

-- Phụ huynh thêm con: hồ sơ học sinh + liên kết phụ huynh + đồng ý + vào lớp gia đình. Máy chủ cấp PIN sau đó.
create or replace function public.parent_add_child(p_name text, p_grade smallint, p_policy_version text, p_consent boolean)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_name text := trim(coalesce(p_name, '')); v_student uuid; v_cls uuid;
begin
  if v_uid is null or not public.has_role('parent', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_consent is not true then raise exception 'consent_required' using errcode = '22023'; end if;
  if char_length(v_name) not between 1 and 60 then raise exception 'invalid_name' using errcode = '22023'; end if;
  if p_grade is null or p_grade not between 1 and 5 then raise exception 'invalid_grade' using errcode = '22023'; end if;
  if (select count(*) from public.parent_student_links where parent_id = v_uid and status = 'active') >= 6 then
    raise exception 'too_many_children' using errcode = '54000';
  end if;
  select f.class_id into v_cls from public.parent_family_class() f;
  if exists (select 1 from public.class_memberships cm join public.students s on s.id = cm.student_id
             where cm.class_id = v_cls and cm.status = 'active' and s.status = 'active' and lower(s.display_name) = lower(v_name)) then
    raise exception 'duplicate_name' using errcode = '23505';
  end if;

  insert into public.students (school_id, display_name, grade, created_by)
  values ('f0000000-0000-4000-8000-000000000001', v_name, p_grade, v_uid) returning id into v_student;
  insert into public.parent_student_links (parent_id, student_id, status, verified_at) values (v_uid, v_student, 'active', now())
  on conflict (parent_id, student_id) do update set status = 'active', verified_at = now();
  insert into public.consent_records (subject_student_id, guardian_id, purpose, policy_version, status)
  values (v_student, v_uid, 'learning_progress', coalesce(nullif(trim(p_policy_version), ''), 'gia-dinh-2026-11'), 'granted');
  insert into public.class_memberships (class_id, student_id) values (v_cls, v_student) on conflict do nothing;
  insert into public.audit_logs (actor_id, action, target_type, target_id) values (v_uid, 'parent_add_child', 'student', v_student::text);
  return v_student;
end;
$$;
revoke all on function public.parent_add_child(text, smallint, text, boolean) from public, anon;
grant execute on function public.parent_add_child(text, smallint, text, boolean) to authenticated;

-- Con do chính phụ huynh này tạo (được đổi khối, đổi tên, cấp lại PIN)
create or replace function public.parent_owns_child(p_student uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.students s join public.parent_student_links l on l.student_id = s.id
    where s.id = p_student and s.created_by = auth.uid() and l.parent_id = auth.uid() and l.status = 'active'
  );
$$;
revoke all on function public.parent_owns_child(uuid) from public, anon;
grant execute on function public.parent_owns_child(uuid) to authenticated;

create or replace function public.parent_update_child(p_student uuid, p_name text, p_grade smallint)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_name text := trim(coalesce(p_name, ''));
begin
  if not public.parent_owns_child(p_student) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if char_length(v_name) not between 1 and 60 then raise exception 'invalid_name' using errcode = '22023'; end if;
  if p_grade is null or p_grade not between 1 and 5 then raise exception 'invalid_grade' using errcode = '22023'; end if;
  update public.students set display_name = v_name, grade = p_grade where id = p_student;
  insert into public.audit_logs (actor_id, action, target_type, target_id) values (auth.uid(), 'parent_update_child', 'student', p_student::text);
end;
$$;
revoke all on function public.parent_update_child(uuid, text, smallint) from public, anon;
grant execute on function public.parent_update_child(uuid, text, smallint) to authenticated;

-- Danh sách con của phụ huynh + PIN hiện tại (chỉ con do mình tạo mới thấy PIN) + học phí còn hạn
create or replace function public.parent_children()
returns table (student_id uuid, display_name text, grade smallint, own boolean, pin text, has_login boolean, access_reason text, access_until timestamptz)
language sql stable security definer set search_path = ''
as $$
  select s.id, s.display_name, s.grade, s.created_by = auth.uid(),
         case when s.created_by = auth.uid() then sp.pin end, s.user_id is not null, a.reason, a.until
  from public.parent_student_links l
  join public.students s on s.id = l.student_id and s.status = 'active'
  left join public.student_pins sp on sp.student_id = s.id
  left join lateral public.billing_access(s.id) a on true
  where l.parent_id = auth.uid() and l.status = 'active'
  order by s.created_at;
$$;
revoke all on function public.parent_children() from public, anon;
grant execute on function public.parent_children() to authenticated;

-- Khối học: lớp gia đình không ép khối → lấy khối của chính em; lớp ở trường vẫn theo khối của lớp
create or replace function public.my_learning_gate()
returns table (is_student boolean, grade smallint, active boolean, reason text, until timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id(); v_grade smallint; a record;
begin
  if v_sid is null then return query select false, null::smallint, true, 'not_student'::text, null::timestamptz; return; end if;
  select c.grade into v_grade from public.class_memberships cm join public.classes c on c.id = cm.class_id
   where cm.student_id = v_sid and cm.status = 'active' and c.status = 'active' and c.kind <> 'family' order by c.created_at desc limit 1;
  if v_grade is null then select s.grade into v_grade from public.students s where s.id = v_sid; end if;
  if public.student_plan_locked(v_sid) then
    return query select true, v_grade, false, 'plan_locked'::text, null::timestamptz; return;
  end if;
  select * into a from public.billing_access(v_sid);
  return query select true, v_grade, a.active, a.reason, a.until;
end;
$$;
