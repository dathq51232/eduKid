-- EduChain Kids 0015: lưu MA TRẬN + ĐỀ KIỂM TRA giáo viên đã tạo (để mở lại, in lại, sửa tiếp).
-- CHỈ THÊM MỚI, chạy lại an toàn. Chỉ giáo viên dạy lớp đọc/ghi qua hàm; học sinh và người khác không xem được.
-- Nội dung đề được lưu nguyên văn (bản chụp) nên in lại vẫn đúng như lúc tạo, kể cả khi ngân hàng câu hỏi thay đổi.

create table if not exists public.exam_papers (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 200),
  subject text not null check (subject in ('toan', 'tieng-viet', 'tieng-anh')),
  exam_code text not null check (exam_code ~ '^(gk1|ck1|gk2|ck2|khac)-[0-9]{4}$'),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 400000),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists exam_papers_class_idx on public.exam_papers (class_id, updated_at desc);
alter table public.exam_papers enable row level security;
revoke all on table public.exam_papers from anon, authenticated;
grant select, insert, update, delete on table public.exam_papers to service_role;

create or replace function public.teacher_list_exams(p_class uuid)
returns table (id uuid, title text, subject text, exam_code text, updated_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query select e.id, e.title, e.subject, e.exam_code, e.updated_at
  from public.exam_papers e where e.class_id = p_class order by e.updated_at desc limit 100;
end;
$$;
revoke all on function public.teacher_list_exams(uuid) from public, anon;
grant execute on function public.teacher_list_exams(uuid) to authenticated;

create or replace function public.teacher_get_exam(p_exam uuid)
returns table (id uuid, class_id uuid, title text, subject text, exam_code text, data jsonb, updated_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare v_class uuid;
begin
  select e.class_id into v_class from public.exam_papers e where e.id = p_exam;
  if auth.uid() is null or v_class is null or not public.teaches_class(v_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query select e.id, e.class_id, e.title, e.subject, e.exam_code, e.data, e.updated_at from public.exam_papers e where e.id = p_exam;
end;
$$;
revoke all on function public.teacher_get_exam(uuid) from public, anon;
grant execute on function public.teacher_get_exam(uuid) to authenticated;

-- Tạo mới (p_exam = null) hoặc cập nhật đề đã có của lớp
create or replace function public.teacher_save_exam(p_class uuid, p_exam uuid, p_title text, p_subject text, p_exam_code text, p_data jsonb)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if (select count(*) from public.exam_papers where class_id = p_class) >= 200 and p_exam is null then
    raise exception 'too_many_exams' using errcode = '54000';
  end if;
  if p_exam is null then
    insert into public.exam_papers (class_id, title, subject, exam_code, data, created_by)
    values (p_class, trim(p_title), p_subject, p_exam_code, p_data, v_uid) returning id into v_id;
  else
    update public.exam_papers set title = trim(p_title), subject = p_subject, exam_code = p_exam_code, data = p_data, updated_at = now()
    where id = p_exam and class_id = p_class returning id into v_id;
    if v_id is null then raise exception 'not_found' using errcode = '22023'; end if;
  end if;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'teacher_save_exam', 'exam', v_id::text, p_class::text);
  return v_id;
end;
$$;
revoke all on function public.teacher_save_exam(uuid, uuid, text, text, text, jsonb) from public, anon;
grant execute on function public.teacher_save_exam(uuid, uuid, text, text, text, jsonb) to authenticated;

create or replace function public.teacher_delete_exam(p_exam uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_class uuid;
begin
  select e.class_id into v_class from public.exam_papers e where e.id = p_exam;
  if v_uid is null or v_class is null or not public.teaches_class(v_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  delete from public.exam_papers where id = p_exam;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'teacher_delete_exam', 'exam', p_exam::text, v_class::text);
end;
$$;
revoke all on function public.teacher_delete_exam(uuid) from public, anon;
grant execute on function public.teacher_delete_exam(uuid) to authenticated;
