-- EduChain Kids 0077: HỌP PHỤ HUYNH, SỔ CHỦ NHIỆM, LÊN LỚP CUỐI NĂM. Cần 0028, 0029. Chạy lại an toàn.
-- A. class_tool_state nhận thêm 2 công cụ (chỉ giáo viên của lớp đọc/ghi, như 0028):
--    'hop-ph'    = các buổi họp phụ huynh: thư mời, phụ huynh tham dự, biên bản
--    'chu-nhiem' = sổ chủ nhiệm: kế hoạch năm theo tháng + theo dõi em cần quan tâm
-- B. teacher_promote_class: tạo lớp năm học mới (khối +1, mã lớp mới), chuyển các em đang học sang,
--    GIỮ tài khoản + PIN + liên kết phụ huynh (gắn theo em, không theo lớp), lưu trữ lớp cũ.

alter table public.class_tool_state drop constraint if exists class_tool_state_tool_check;
alter table public.class_tool_state add constraint class_tool_state_tool_check
  check (tool in ('groups', 'seating', 'teams', 'zalo', 'hop-ph', 'chu-nhiem'));

create or replace function public.teacher_tool_save(p_class uuid, p_tool text, p_data jsonb)
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare v_now timestamptz := now();
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_tool not in ('groups', 'seating', 'teams', 'zalo', 'hop-ph', 'chu-nhiem') then raise exception 'invalid_tool' using errcode = '22023'; end if;
  -- sổ chủ nhiệm / biên bản họp ghi chữ dài cả năm → cho 256 KB; công cụ khác giữ 64 KB
  if p_data is null or jsonb_typeof(p_data) <> 'object'
     or octet_length(p_data::text) > (case when p_tool in ('hop-ph', 'chu-nhiem') then 262144 else 65536 end) then
    raise exception 'invalid_data' using errcode = '22023';
  end if;
  if p_tool = 'zalo' and coalesce(p_data->>'url', '') <> '' and (p_data->>'url') !~ '^https://zalo\.me/g/[A-Za-z0-9_-]{4,64}$' then
    raise exception 'invalid_zalo_link' using errcode = '22023';
  end if;
  insert into public.class_tool_state (class_id, tool, data, updated_by, updated_at)
  values (p_class, p_tool, p_data, auth.uid(), v_now)
  on conflict (class_id, tool) do update set data = excluded.data, updated_by = excluded.updated_by, updated_at = v_now;
  return v_now;
end;
$$;
revoke all on function public.teacher_tool_save(uuid, text, jsonb) from public, anon;
grant execute on function public.teacher_tool_save(uuid, text, jsonb) to authenticated;

create or replace function public.teacher_promote_class(p_class uuid, p_name text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_old public.classes%rowtype;
  v_name text := trim(coalesce(p_name, ''));
  v_new uuid;
  v_n int;
begin
  if v_uid is null or not exists (select 1 from public.class_teachers where class_id = p_class and teacher_id = v_uid) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  select * into v_old from public.classes where id = p_class for update;
  if v_old.status <> 'active' then raise exception 'class_not_active' using errcode = '22023'; end if;
  if v_old.grade >= 5 then raise exception 'last_grade' using errcode = '22023'; end if; -- lớp 5: ra trường, không lên lớp
  if char_length(v_name) not between 1 and 80 then raise exception 'invalid_name' using errcode = '22023'; end if;
  if exists (select 1 from public.classes where school_id = v_old.school_id and name = v_name) then
    raise exception 'name_taken' using errcode = '23505';
  end if;
  if (select count(*) from public.class_teachers where teacher_id = v_uid) >= 20 then
    raise exception 'too_many_classes' using errcode = '54000';
  end if;

  insert into public.classes (school_id, name, grade, created_by, join_code, kind, fee_plan)
  values (v_old.school_id, v_name, v_old.grade + 1, v_uid, public.new_join_code(), v_old.kind, v_old.fee_plan)
  returning id into v_new;
  insert into public.class_teachers (class_id, teacher_id, assigned_by) values (v_new, v_uid, v_uid);

  insert into public.class_memberships (class_id, student_id, status)
  select v_new, m.student_id, 'active' from public.class_memberships m
  where m.class_id = p_class and m.status = 'active';
  get diagnostics v_n = row_count;

  update public.students s set grade = v_old.grade + 1
  where s.id in (select student_id from public.class_memberships where class_id = v_new) and s.grade <= v_old.grade;

  -- lớp cũ: lưu trữ; các em không còn "đang học" lớp cũ (mỗi em chỉ một lớp đang học)
  update public.class_memberships set status = 'inactive' where class_id = p_class and status = 'active';
  update public.classes set status = 'inactive' where id = p_class;

  -- mang sang sơ đồ chỗ ngồi, tổ thi đua, nhóm Zalo, sổ chủ nhiệm (theo em, vẫn đúng ở lớp mới)
  insert into public.class_tool_state (class_id, tool, data, updated_by, updated_at)
  select v_new, tool, data, v_uid, now() from public.class_tool_state
  where class_id = p_class and tool in ('seating', 'teams', 'zalo');

  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'teacher_promote_class', 'class', v_new::text, format('từ lớp %s, %s em', p_class, v_n));
  return v_new;
end;
$$;
revoke all on function public.teacher_promote_class(uuid, text) from public, anon;
grant execute on function public.teacher_promote_class(uuid, text) to authenticated;
