-- EduChain Kids 0068: TẠO LỊCH BÁO GIẢNG CHO CẢ KHỐI (tổ trưởng chuyên môn).
-- CHỈ THÊM MỚI, chạy lại an toàn.
-- Dữ liệu chung của một khối trong trường: phân phối chương trình (PPCT), lịch tuần (Thứ Hai tuần 1, tuần nghỉ)
-- và thời khoá biểu từng lớp — một dòng / trường / khối, dạng jsonb (cấu trúc: src/lib/plans/lbg.ts, KhoiData).
-- Mọi giáo viên / quản lí của trường đọc và cập nhật được (tổ trưởng nạp PPCT, giáo viên sửa TKB lớp mình);
-- trường khác không thấy. App tự sinh lịch báo giảng tuần n trên trình duyệt từ dữ liệu này.
-- Bảng không mở trực tiếp cho trình duyệt; mọi thao tác qua lbg_get / lbg_save. Trường của người gọi: library_school() (0023).

create table if not exists public.lbg_khoi (
  school_id uuid not null references public.schools(id) on delete cascade,
  grade smallint not null check (grade between 1 and 5),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 1500000),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (school_id, grade)
);
alter table public.lbg_khoi enable row level security;
revoke all on table public.lbg_khoi from anon, authenticated;
grant select, insert, update, delete on table public.lbg_khoi to service_role;

-- Dữ liệu của khối p_grade trong trường (không có dòng nào nếu chưa ai nạp)
create or replace function public.lbg_get(p_grade smallint)
returns table (data jsonb, updated_at timestamptz, updated_by_name text)
language plpgsql stable security definer set search_path = ''
as $$
declare v_school uuid := public.library_school();
begin
  if auth.uid() is null or v_school is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query
    select k.data, k.updated_at, p.display_name::text
    from public.lbg_khoi k left join public.profiles p on p.id = k.updated_by
    where k.school_id = v_school and k.grade = p_grade;
end;
$$;
revoke all on function public.lbg_get(smallint) from public, anon;
grant execute on function public.lbg_get(smallint) to authenticated;

-- Lưu (thay toàn bộ) dữ liệu khối. p_expected = updated_at đã đọc: nếu người khác vừa lưu sau đó thì báo 'conflict'
-- (trình duyệt tải lại rồi lưu lại), tránh ghi đè mất TKB của lớp khác. p_expected null = lưu lần đầu / ghi đè.
create or replace function public.lbg_save(p_grade smallint, p_data jsonb, p_expected timestamptz default null)
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare v_school uuid := public.library_school(); v_cur timestamptz; v_now timestamptz := now();
begin
  if auth.uid() is null or v_school is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_grade not between 1 and 5 or jsonb_typeof(p_data) <> 'object' then raise exception 'invalid' using errcode = '22023'; end if;
  if pg_column_size(p_data) >= 1500000 then raise exception 'too_large' using errcode = '54000'; end if;
  select k.updated_at into v_cur from public.lbg_khoi k where k.school_id = v_school and k.grade = p_grade for update;
  if v_cur is not null and p_expected is not null and v_cur > p_expected then raise exception 'conflict' using errcode = '40001'; end if;
  insert into public.lbg_khoi (school_id, grade, data, updated_by, updated_at)
  values (v_school, p_grade, p_data, auth.uid(), v_now)
  on conflict (school_id, grade) do update set data = excluded.data, updated_by = excluded.updated_by, updated_at = excluded.updated_at;
  return v_now;
end;
$$;
revoke all on function public.lbg_save(smallint, jsonb, timestamptz) from public, anon;
grant execute on function public.lbg_save(smallint, jsonb, timestamptz) to authenticated;
