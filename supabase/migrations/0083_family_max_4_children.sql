-- 0083: Gói gia đình tối đa 4 con (11/2026)
-- Trước (0047): parent_add_child chặn khi phụ huynh có >= 6 liên kết con đang hoạt động — đếm cả con học ở lớp trường
-- liên kết bằng mã mời. Nay: gói gia đình (con do chính phụ huynh tạo để học tại nhà) tối đa 4 con; con ở lớp trường
-- liên kết bằng mã mời KHÔNG tính vào. Giữ trần chung 6 liên kết như cũ để chống lạm dụng.
-- Chỉ thay hàm parent_add_child (security definer, cùng chữ ký, cùng quyền). Không đổi bảng, không xoá dữ liệu;
-- gia đình đã có hơn 4 con từ trước vẫn giữ nguyên, chỉ không thêm được nữa.

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
  -- Gói gia đình: tối đa 4 con do chính phụ huynh tạo (đang hoạt động)
  if (select count(*) from public.parent_student_links l
        join public.students s on s.id = l.student_id and s.status = 'active'
      where l.parent_id = v_uid and l.status = 'active' and s.created_by = v_uid) >= 4 then
    raise exception 'family_limit' using errcode = '54000';
  end if;
  -- Trần chung mọi liên kết (kể cả con ở lớp trường): giữ như 0047
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
