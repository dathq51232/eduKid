-- EduChain Kids 0062: PHÒNG THI LỚP (chặng “Ra hoa” – Mùa Mắt Xích, docs/BAN-SAC-EDUCHAINKIDS.md mục 8.1).
-- CHỈ THÊM MỚI, chạy lại an toàn. Không bảng nào cho đọc/ghi thẳng: mọi thao tác qua hàm có kiểm tra quyền.
--  * Cô tạo phòng: chọn chủ đề → trình duyệt của cô sinh ĐỀ RIÊNG cho từng em (cùng ma trận) và gửi lên cùng lúc.
--  * Em vào bằng MÃ PHÒNG 6 ký tự trong giờ mở – đóng; làm MỘT lần; máy chủ (service_role) chấm theo đề của em.
--  * Em gặp sự cố → cô “Cho làm lại”: kết quả cũ chuyển vào nhật ký, em nhận đề mới.
--  * Kết quả: thang 10, số sao (mức 1/2/3 = 1/2/3 sao), cờ bất thường (làm quá nhanh, rời trang nhiều lần) để CÔ xem lại.
--  * Em chỉ thấy kết quả của mình; đáp án + lời giải chỉ hiện sau khi phòng đóng.

create table if not exists public.exam_rooms (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  title text not null check (char_length(title) between 2 and 200),
  subject text not null check (subject in ('toan', 'tieng-viet', 'tieng-anh')),
  n_questions smallint not null check (n_questions between 3 and 40),
  minutes smallint not null check (minutes between 5 and 90),
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  -- ma trận đã dùng (để sinh đề mới khi cho làm lại) — nội dung do trình duyệt của cô lưu, không chứa đáp án
  matrix jsonb not null default '{}'::jsonb check (jsonb_typeof(matrix) = 'object' and pg_column_size(matrix) < 50000),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint exam_rooms_window check (closes_at > opens_at and closes_at <= opens_at + interval '30 days')
);
create index if not exists exam_rooms_class_idx on public.exam_rooms (class_id, created_at desc);

-- Đề riêng của từng em (có đáp án — chỉ máy chủ đọc nguyên bản)
create table if not exists public.exam_room_papers (
  room_id uuid not null references public.exam_rooms(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) between 1 and 40 and pg_column_size(questions) < 300000),
  started_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (room_id, student_id)
);

create table if not exists public.exam_room_results (
  room_id uuid not null references public.exam_rooms(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  score numeric(4,1) not null check (score between 0 and 10),
  correct smallint not null check (correct >= 0),
  total smallint not null check (total between 1 and 40),
  stars smallint not null check (stars >= 0),
  max_stars smallint not null check (max_stars > 0),
  answers jsonb not null default '[]'::jsonb check (jsonb_typeof(answers) = 'array' and pg_column_size(answers) < 100000),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  leaves smallint not null default 0 check (leaves >= 0),
  flags text[] not null default '{}',
  created_at timestamptz not null default now(),
  primary key (room_id, student_id),
  constraint exam_room_results_ok check (correct <= total and stars <= max_stars)
);

-- Nhật ký “cho làm lại” (giữ kết quả cũ để cô xem)
create table if not exists public.exam_room_retakes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.exam_rooms(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  old_result jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.exam_rooms enable row level security;
alter table public.exam_room_papers enable row level security;
alter table public.exam_room_results enable row level security;
alter table public.exam_room_retakes enable row level security;
revoke all on table public.exam_rooms, public.exam_room_papers, public.exam_room_results, public.exam_room_retakes from anon, authenticated;
grant select, insert, update, delete on table public.exam_rooms, public.exam_room_papers, public.exam_room_results, public.exam_room_retakes to service_role;

-- ---------------------------------------------------------------------------------------------- Giáo viên
-- Tạo phòng + đề của từng em. p_papers: [{ "student": uuid, "questions": [...] }, ...]
create or replace function public.teacher_create_room(
  p_class uuid, p_title text, p_subject text, p_n smallint, p_minutes smallint,
  p_opens timestamptz, p_closes timestamptz, p_matrix jsonb, p_papers jsonb)
returns table (id uuid, code text)
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid(); v_id uuid; v_code text; v_try int := 0;
  v_abc constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  p jsonb;
begin
  if v_uid is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.classes c where c.id = p_class and c.status = 'active') then
    raise exception 'class_inactive' using errcode = '22023';
  end if;
  if p_opens is null or p_closes is null or p_closes <= p_opens or p_closes < now()
     or p_opens > now() + interval '60 days' or p_closes > p_opens + interval '30 days' then
    raise exception 'invalid_window' using errcode = '22023';
  end if;
  if jsonb_typeof(p_papers) <> 'array' or jsonb_array_length(p_papers) = 0 or jsonb_array_length(p_papers) > 60 then
    raise exception 'invalid_papers' using errcode = '22023';
  end if;
  if (select count(*) from public.exam_rooms r where r.class_id = p_class and r.status = 'open' and r.closes_at > now()) >= 20 then
    raise exception 'too_many_rooms' using errcode = '54000';
  end if;
  -- mọi em phải đang học lớp này
  if exists (select 1 from jsonb_array_elements(p_papers) x where not exists (
      select 1 from public.class_memberships cm where cm.class_id = p_class and cm.status = 'active'
        and cm.student_id = (x->>'student')::uuid)) then
    raise exception 'student_not_in_class' using errcode = '22023';
  end if;

  loop
    v_try := v_try + 1;
    v_code := '';
    for i in 1..6 loop v_code := v_code || substr(v_abc, 1 + floor(random() * 32)::int, 1); end loop;
    exit when not exists (select 1 from public.exam_rooms r where r.code = v_code);
    if v_try > 20 then raise exception 'code_exhausted' using errcode = '54000'; end if;
  end loop;

  insert into public.exam_rooms (class_id, code, title, subject, n_questions, minutes, opens_at, closes_at, matrix, created_by)
  values (p_class, v_code, trim(p_title), p_subject, p_n, p_minutes, p_opens, p_closes, coalesce(p_matrix, '{}'::jsonb), v_uid)
  returning exam_rooms.id into v_id;

  for p in select * from jsonb_array_elements(p_papers) loop
    insert into public.exam_room_papers (room_id, student_id, questions)
    values (v_id, (p->>'student')::uuid, p->'questions')
    on conflict (room_id, student_id) do update set questions = excluded.questions;
  end loop;

  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'teacher_create_room', 'exam_room', v_id::text, p_class::text);
  return query select v_id, v_code;
end;
$$;

create or replace function public.teacher_list_rooms(p_class uuid)
returns table (id uuid, code text, title text, subject text, n_questions smallint, minutes smallint,
               opens_at timestamptz, closes_at timestamptz, status text, created_at timestamptz,
               matrix jsonb, assigned integer, started integer, done integer, flagged integer)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query
  select r.id, r.code, r.title, r.subject, r.n_questions, r.minutes, r.opens_at, r.closes_at, r.status, r.created_at, r.matrix,
         (select count(*)::integer from public.exam_room_papers p where p.room_id = r.id),
         (select count(*)::integer from public.exam_room_papers p where p.room_id = r.id and p.started_at is not null),
         (select count(*)::integer from public.exam_room_results x where x.room_id = r.id),
         (select count(*)::integer from public.exam_room_results x where x.room_id = r.id and cardinality(x.flags) > 0)
  from public.exam_rooms r
  where r.class_id = p_class
  order by r.created_at desc
  limit 100;
end;
$$;

-- Tình hình từng em trong phòng (kèm câu trả lời để thống kê kỹ năng)
create or replace function public.teacher_room_detail(p_room uuid)
returns table (student_id uuid, display_name text, has_paper boolean, started_at timestamptz, done boolean,
               score numeric, correct integer, total integer, stars integer, max_stars integer,
               duration_ms integer, leaves integer, flags text[], answers jsonb, finished_at timestamptz, retakes integer)
language plpgsql stable security definer set search_path = ''
as $$
declare v_class uuid;
begin
  select r.class_id into v_class from public.exam_rooms r where r.id = p_room;
  if v_class is null or auth.uid() is null or not public.teaches_class(v_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query
  select cm.student_id, s.display_name, p.student_id is not null, p.started_at, x.student_id is not null,
         x.score, x.correct::integer, x.total::integer, x.stars::integer, x.max_stars::integer,
         x.duration_ms, coalesce(x.leaves, 0)::integer, coalesce(x.flags, '{}'::text[]), coalesce(x.answers, '[]'::jsonb), x.created_at,
         (select count(*)::integer from public.exam_room_retakes t where t.room_id = p_room and t.student_id = cm.student_id)
  from public.class_memberships cm
  join public.students s on s.id = cm.student_id
  left join public.exam_room_papers p on p.room_id = p_room and p.student_id = cm.student_id
  left join public.exam_room_results x on x.room_id = p_room and x.student_id = cm.student_id
  where cm.class_id = v_class and cm.status = 'active'
  order by s.display_name;
end;
$$;

-- Đặt đề mới cho một em: cho làm lại (kết quả cũ vào nhật ký) hoặc em mới vào lớp chưa có đề
create or replace function public.teacher_room_set_paper(p_room uuid, p_student uuid, p_questions jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_class uuid; v_old jsonb;
begin
  select r.class_id into v_class from public.exam_rooms r where r.id = p_room;
  if v_class is null or auth.uid() is null or not public.teaches_class(v_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.class_memberships cm where cm.class_id = v_class and cm.student_id = p_student and cm.status = 'active') then
    raise exception 'student_not_in_class' using errcode = '22023';
  end if;
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) not between 1 and 40 then
    raise exception 'invalid_papers' using errcode = '22023';
  end if;
  select to_jsonb(x) - 'room_id' - 'student_id' into v_old from public.exam_room_results x where x.room_id = p_room and x.student_id = p_student;
  if v_old is not null or exists (select 1 from public.exam_room_papers p where p.room_id = p_room and p.student_id = p_student and p.started_at is not null) then
    insert into public.exam_room_retakes (room_id, student_id, old_result, created_by) values (p_room, p_student, v_old, auth.uid());
  end if;
  delete from public.exam_room_results x where x.room_id = p_room and x.student_id = p_student;
  insert into public.exam_room_papers (room_id, student_id, questions, started_at)
  values (p_room, p_student, p_questions, null)
  on conflict (room_id, student_id) do update set questions = excluded.questions, started_at = null, created_at = now();
end;
$$;

create or replace function public.teacher_room_status(p_room uuid, p_open boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_class uuid;
begin
  select r.class_id into v_class from public.exam_rooms r where r.id = p_room;
  if v_class is null or auth.uid() is null or not public.teaches_class(v_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  update public.exam_rooms set status = case when p_open then 'open' else 'closed' end,
    -- mở lại phòng đã quá giờ: gia hạn thêm 1 giờ
    closes_at = case when p_open and closes_at < now() then now() + interval '1 hour' else closes_at end
  where id = p_room;
end;
$$;

create or replace function public.teacher_room_delete(p_room uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_class uuid;
begin
  select r.class_id into v_class from public.exam_rooms r where r.id = p_room;
  if v_class is null or auth.uid() is null or not public.teaches_class(v_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  delete from public.exam_rooms where id = p_room;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (auth.uid(), 'teacher_room_delete', 'exam_room', p_room::text, v_class::text);
end;
$$;

-- ---------------------------------------------------------------------------------------------- Học sinh
-- Nhập mã phòng → mã phòng hợp lệ của lớp em thì trả về id phòng
create or replace function public.student_join_room(p_code text)
returns uuid
language plpgsql stable security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id(); r record;
begin
  if v_sid is null then raise exception 'not_student' using errcode = '42501'; end if;
  select x.id, x.class_id into r from public.exam_rooms x where x.code = upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  if not found then raise exception 'room_not_found' using errcode = 'P0002'; end if;
  if not exists (select 1 from public.class_memberships cm where cm.class_id = r.class_id and cm.student_id = v_sid and cm.status = 'active') then
    raise exception 'not_in_class' using errcode = '42501';
  end if;
  if not exists (select 1 from public.exam_room_papers p where p.room_id = r.id and p.student_id = v_sid) then
    raise exception 'no_paper' using errcode = 'P0002';
  end if;
  return r.id;
end;
$$;

-- Phòng thi của em (đang mở / sắp mở / đóng trong 30 ngày) để hiện ở trang của em
create or replace function public.student_my_rooms()
returns table (id uuid, code text, title text, subject text, n_questions smallint, minutes smallint,
               opens_at timestamptz, closes_at timestamptz, status text, done boolean, score numeric, stars integer)
language plpgsql stable security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id();
begin
  if v_sid is null then return; end if;
  return query
  select r.id, r.code, r.title, r.subject, r.n_questions, r.minutes, r.opens_at, r.closes_at, r.status,
         x.student_id is not null, x.score, x.stars::integer
  from public.exam_room_papers p
  join public.exam_rooms r on r.id = p.room_id
  join public.class_memberships cm on cm.class_id = r.class_id and cm.student_id = v_sid and cm.status = 'active'
  left join public.exam_room_results x on x.room_id = r.id and x.student_id = v_sid
  where p.student_id = v_sid and r.closes_at > now() - interval '30 days'
  order by (r.status = 'open' and r.closes_at > now()) desc, r.opens_at desc
  limit 20;
end;
$$;

-- Đề của em. Chưa đóng phòng: câu hỏi KHÔNG kèm đáp án / lời giải. Phòng đã đóng và em đã nộp: kèm đáp án + lời giải để xem lại.
create or replace function public.student_get_room(p_room uuid)
returns table (id uuid, title text, subject text, n_questions smallint, minutes smallint, opens_at timestamptz,
               closes_at timestamptz, is_open boolean, server_now timestamptz, started_at timestamptz, questions jsonb,
               done boolean, score numeric, correct integer, total integer, stars integer, max_stars integer, answers jsonb, review boolean)
language plpgsql stable security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id(); v_review boolean;
begin
  if v_sid is null or not exists (
    select 1 from public.exam_room_papers p join public.exam_rooms r on r.id = p.room_id
    join public.class_memberships cm on cm.class_id = r.class_id and cm.student_id = v_sid and cm.status = 'active'
    where p.room_id = p_room and p.student_id = v_sid) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  select (r.status = 'closed' or r.closes_at <= now()) and exists (select 1 from public.exam_room_results x where x.room_id = p_room and x.student_id = v_sid)
    into v_review from public.exam_rooms r where r.id = p_room;
  return query
  select r.id, r.title, r.subject, r.n_questions, r.minutes, r.opens_at, r.closes_at,
         (r.status = 'open' and now() >= r.opens_at and now() < r.closes_at), now(), p.started_at,
         case when v_review then p.questions
              else (select coalesce(jsonb_agg(q - 'answer' - 'explanation' - 'key' order by o), '[]'::jsonb)
                      from jsonb_array_elements(p.questions) with ordinality as e(q, o)) end,
         x.student_id is not null, x.score, x.correct::integer, x.total::integer, x.stars::integer, x.max_stars::integer,
         case when x.student_id is null then '[]'::jsonb
              when v_review then x.answers
              else (select coalesce(jsonb_agg(jsonb_build_object('i', a->'i', 'ok', a->'ok', 'lesson', a->'lesson') order by (a->>'i')::int), '[]'::jsonb)
                      from jsonb_array_elements(x.answers) a) end,
         coalesce(v_review, false)
  from public.exam_rooms r
  join public.exam_room_papers p on p.room_id = r.id and p.student_id = v_sid
  left join public.exam_room_results x on x.room_id = r.id and x.student_id = v_sid
  where r.id = p_room;
end;
$$;

-- Bấm “Bắt đầu”: ghi giờ bắt đầu (một lần) — đồng hồ tính theo giờ máy chủ
create or replace function public.student_start_room(p_room uuid)
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id(); v_at timestamptz;
begin
  if v_sid is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  if not exists (select 1 from public.exam_rooms r
      join public.class_memberships cm on cm.class_id = r.class_id and cm.student_id = v_sid and cm.status = 'active'
      where r.id = p_room and r.status = 'open' and now() >= r.opens_at and now() < r.closes_at) then
    raise exception 'room_closed' using errcode = '22023';
  end if;
  update public.exam_room_papers set started_at = coalesce(started_at, now())
  where room_id = p_room and student_id = v_sid
  returning started_at into v_at;
  if v_at is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  return v_at;
end;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.teacher_create_room(uuid, text, text, smallint, smallint, timestamptz, timestamptz, jsonb, jsonb)',
    'public.teacher_list_rooms(uuid)',
    'public.teacher_room_detail(uuid)',
    'public.teacher_room_set_paper(uuid, uuid, jsonb)',
    'public.teacher_room_status(uuid, boolean)',
    'public.teacher_room_delete(uuid)',
    'public.student_join_room(text)',
    'public.student_my_rooms()',
    'public.student_get_room(uuid)',
    'public.student_start_room(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
