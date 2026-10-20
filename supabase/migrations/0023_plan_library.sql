-- EduChain Kids 0023: KHO GIÁO ÁN CỦA TRƯỜNG.
-- CHỈ THÊM MỚI, chạy lại an toàn. Giáo viên tải thư mục giáo án Word (.docx) lên: trình duyệt tách từng bài/tiết,
-- chỉ gửi phần chữ (không gửi file, không gửi hình). Kho thuộc về TRƯỜNG: mọi giáo viên / quản lí của trường đọc,
-- nạp thêm, thay hoặc xoá giáo án theo file nguồn; trường khác không thấy.
-- Khi tải lịch báo giảng, app tìm giáo án trong kho đúng môn – khối – bài – tiết để soạn sẵn cho từng tiết.
-- Bảng không mở trực tiếp cho trình duyệt; mọi thao tác qua các hàm library_* bên dưới.

create table if not exists public.plan_library (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  source text not null check (char_length(source) between 1 and 300),
  subject text not null check (subject ~ '^[a-z][a-z-]{1,19}$'),
  extra boolean not null default false,
  grade smallint not null check (grade between 1 and 5),
  week smallint check (week between 1 and 60),
  lesson_no smallint check (lesson_no between 0 and 999),
  periods smallint[] not null default '{}',
  ppct smallint check (ppct between 0 and 999),
  title text not null check (char_length(title) between 1 and 300),
  topic text not null default '' check (char_length(topic) <= 300),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 200000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists plan_library_school_idx on public.plan_library (school_id, grade, subject);
create index if not exists plan_library_source_idx on public.plan_library (school_id, source);
alter table public.plan_library enable row level security;
revoke all on table public.plan_library from anon, authenticated;
grant select, insert, update, delete on table public.plan_library to service_role;

-- Trường của người gọi (giáo viên / quản lí trường); null nếu không thuộc trường nào
create or replace function public.library_school()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select ur.school_id from public.user_roles ur
  where ur.user_id = (select auth.uid()) and ur.role in ('teacher', 'school_admin') and ur.school_id is not null
  order by ur.role = 'teacher' desc
  limit 1;
$$;
revoke all on function public.library_school() from public, anon;
grant execute on function public.library_school() to authenticated;

-- Nạp (hoặc thay) các giáo án tách từ một file nguồn. Trả về số giáo án đã lưu.
-- p_items: mảng [{subject, extra, grade, week, lessonNo, periods, ppct, title, topic, plan}]
create or replace function public.library_import(p_source text, p_items jsonb)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_school uuid := public.library_school(); v_n integer;
begin
  if auth.uid() is null or v_school is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 300 then raise exception 'invalid_items' using errcode = '22023'; end if;
  if (select count(*) from public.plan_library where school_id = v_school and source <> p_source) + jsonb_array_length(p_items) > 20000 then
    raise exception 'library_full' using errcode = '54000';
  end if;
  delete from public.plan_library where school_id = v_school and source = trim(p_source);
  insert into public.plan_library (school_id, source, subject, extra, grade, week, lesson_no, periods, ppct, title, topic, data, created_by)
  select v_school, trim(p_source), i->>'subject', coalesce((i->>'extra')::boolean, false), (i->>'grade')::smallint,
         nullif(i->>'week', '')::smallint, nullif(i->>'lessonNo', '')::smallint,
         coalesce(array(select jsonb_array_elements_text(coalesce(i->'periods', '[]'::jsonb))::smallint), '{}'),
         nullif(i->>'ppct', '')::smallint, left(i->>'title', 300), left(coalesce(i->>'topic', ''), 300), i->'plan', auth.uid()
  from jsonb_array_elements(p_items) i;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke all on function public.library_import(text, jsonb) from public, anon;
grant execute on function public.library_import(text, jsonb) to authenticated;

-- Danh mục kho (không kèm nội dung) — p_grade null = mọi khối
create or replace function public.library_list(p_grade smallint default null)
returns table (id uuid, source text, subject text, extra boolean, grade smallint, week smallint, lesson_no smallint, periods smallint[], ppct smallint, title text, topic text, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare v_school uuid := public.library_school();
begin
  if auth.uid() is null or v_school is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query select l.id, l.source, l.subject, l.extra, l.grade, l.week, l.lesson_no, l.periods, l.ppct, l.title, l.topic, l.created_at
    from public.plan_library l where l.school_id = v_school and (p_grade is null or l.grade = p_grade)
    order by l.grade, l.subject, l.extra, l.week nulls last, l.lesson_no nulls last, l.source;
end;
$$;
revoke all on function public.library_list(smallint) from public, anon;
grant execute on function public.library_list(smallint) to authenticated;

-- Nội dung các giáo án (tối đa 200 một lần)
create or replace function public.library_get(p_ids uuid[])
returns table (id uuid, data jsonb)
language plpgsql stable security definer set search_path = ''
as $$
declare v_school uuid := public.library_school();
begin
  if auth.uid() is null or v_school is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  if coalesce(array_length(p_ids, 1), 0) > 200 then raise exception 'too_many' using errcode = '22023'; end if;
  return query select l.id, l.data from public.plan_library l where l.school_id = v_school and l.id = any(p_ids);
end;
$$;
revoke all on function public.library_get(uuid[]) from public, anon;
grant execute on function public.library_get(uuid[]) to authenticated;

-- Xoá các giáo án của một file nguồn (p_source null = xoá cả kho của trường). Trả về số giáo án đã xoá.
create or replace function public.library_delete(p_source text)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_school uuid := public.library_school(); v_n integer;
begin
  if auth.uid() is null or v_school is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  delete from public.plan_library where school_id = v_school and (p_source is null or source = p_source);
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke all on function public.library_delete(text) from public, anon;
grant execute on function public.library_delete(text) to authenticated;
