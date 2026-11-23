-- EduChain Kids 0080: CỘNG ĐỒNG — TIN NHẮN GIỮA THẦY CÔ + ĐĂNG TÀI LIỆU (file). CHỈ THÊM MỚI, chạy lại an toàn. Chạy SAU 0079.
--  • Tin nhắn kiểu Zalo giữa giáo viên CÙNG TRƯỜNG: trò chuyện riêng (1-1) và nhóm (vd. tổ chuyên môn khối 1).
--    chat_threads (cuộc trò chuyện) · chat_members (thành viên, mốc đã đọc) · chat_messages (tin: chữ và/hoặc 1 file).
--    Tin mới đến ngay qua Supabase Realtime (bảng chat_messages, chỉ thành viên đọc được nhờ RLS) + tải lại định kỳ dự phòng.
--  • Kho file riêng tư "community-files" (≤ 20 MB/file: Word, Excel, PowerPoint, PDF, ảnh, văn bản):
--      chat/<mã cuộc trò chuyện>/<tên>   — chỉ thành viên cuộc trò chuyện tải lên / mở được;
--      tai-lieu/<mã người đăng>/<tên>   — tài liệu đăng lên Kho chia sẻ: ai thấy tài nguyên thì mở được file.
--  • community_resources thêm loại 'tai_lieu' (tài liệu dạng file: snapshot = {file:{path,name,size,mime}, body}).
-- Ghi dữ liệu chỉ qua các hàm chat_* / community_publish (security definer); có giới hạn tần suất chống spam.

-- ---------------------------------------------------------------- kho file
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-files', 'community-files', false, 20971520, array[
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'text/plain'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------- bảng tin nhắn
create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('rieng', 'nhom')),
  title text not null default '' check (char_length(title) <= 80),
  school_id uuid not null references public.schools(id) on delete cascade,
  direct_key text unique, -- trò chuyện riêng: "<id nhỏ>:<id lớn>" để hai người chỉ có một cuộc
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  last_preview text not null default '' check (char_length(last_preview) <= 140),
  last_sender uuid
);
create index if not exists chat_threads_school_idx on public.chat_threads (school_id, last_at desc);
alter table public.chat_threads enable row level security;
revoke all on public.chat_threads from anon, authenticated;

create table if not exists public.chat_members (
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'thanh_vien' check (role in ('quan_tri', 'thanh_vien')),
  last_read_at timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);
create index if not exists chat_members_user_idx on public.chat_members (user_id);
alter table public.chat_members enable row level security;
revoke all on public.chat_members from anon, authenticated;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender uuid not null references auth.users(id) on delete cascade,
  body text not null default '' check (char_length(body) <= 4000),
  file jsonb check (file is null or (jsonb_typeof(file) = 'object' and pg_column_size(file) < 2000)),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists chat_messages_thread_idx on public.chat_messages (thread_id, created_at desc);
alter table public.chat_messages enable row level security;
revoke all on public.chat_messages from anon, authenticated;

create or replace function public.chat_is_member(p_thread uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (select 1 from public.chat_members m where m.thread_id = p_thread and m.user_id = auth.uid());
$$;
revoke all on function public.chat_is_member(uuid) from public, anon;
grant execute on function public.chat_is_member(uuid) to authenticated;

-- Như trên nhưng nhận mã dạng chữ (tên thư mục trong kho file) — không ép kiểu uuid để đường dẫn lạ không gây lỗi
create or replace function public.chat_is_member_key(p_key text) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (select 1 from public.chat_members m where m.thread_id::text = p_key and m.user_id = auth.uid());
$$;
revoke all on function public.chat_is_member_key(text) from public, anon;
grant execute on function public.chat_is_member_key(text) to authenticated;

-- Realtime cần quyền SELECT theo RLS: thành viên đọc tin của cuộc trò chuyện mình (ghi vẫn chỉ qua hàm)
grant select on public.chat_messages to authenticated;
drop policy if exists chat_messages_member_read on public.chat_messages;
create policy chat_messages_member_read on public.chat_messages for select to authenticated using (public.chat_is_member(thread_id));
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages') then
    execute 'alter publication supabase_realtime add table public.chat_messages';
  end if;
end $$;

-- File tài liệu thuộc một tài nguyên người đang xem được thấy (bảng community_resources đóng với trình duyệt nên kiểm trong hàm)
create or replace function public.community_file_visible(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.community_resources r where r.kind = 'tai_lieu' and r.snapshot #>> '{file,path}' = p_name
                 and public.community_can_see(r.owner, r.school_id, r.visibility, r.status));
$$;
revoke all on function public.community_file_visible(text) from public, anon;
grant execute on function public.community_file_visible(text) to authenticated;

-- ---------------------------------------------------------------- quyền file trong kho community-files
drop policy if exists community_files_read on storage.objects;
create policy community_files_read on storage.objects for select to authenticated using (
  bucket_id = 'community-files' and (
    ((storage.foldername(name))[1] = 'chat' and public.chat_is_member_key((storage.foldername(name))[2]))
    or ((storage.foldername(name))[1] = 'tai-lieu' and (
      (storage.foldername(name))[2] = auth.uid()::text
      or public.community_file_visible(name)))
  ));
drop policy if exists community_files_insert on storage.objects;
create policy community_files_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'community-files' and public.is_teacher_user() and (
    ((storage.foldername(name))[1] = 'chat' and public.chat_is_member_key((storage.foldername(name))[2]))
    or ((storage.foldername(name))[1] = 'tai-lieu' and (storage.foldername(name))[2] = auth.uid()::text)
  ));
drop policy if exists community_files_delete on storage.objects;
create policy community_files_delete on storage.objects for delete to authenticated using (
  bucket_id = 'community-files' and (storage.foldername(name))[1] = 'tai-lieu' and (storage.foldername(name))[2] = auth.uid()::text);

-- ---------------------------------------------------------------- hàm tin nhắn
-- Giáo viên cùng trường (để bắt đầu trò chuyện / thêm vào nhóm)
create or replace function public.chat_teachers()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_school uuid := public.library_school();
begin
  if auth.uid() is null or not public.is_teacher_user() then raise exception 'not_allowed' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.display_name) order by p.display_name)
    from public.profiles p
    where p.id <> auth.uid() and v_school is not null
      and exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role = 'teacher' and ur.school_id = v_school)
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.chat_teachers() from public, anon;
grant execute on function public.chat_teachers() to authenticated;

-- Mở (hoặc tạo) trò chuyện riêng với một giáo viên cùng trường
create or replace function public.chat_open_direct(p_user uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_school uuid := public.library_school(); v_key text; v_id uuid;
begin
  if auth.uid() is null or not public.is_teacher_user() or v_school is null or p_user = auth.uid()
     or not exists (select 1 from public.user_roles ur where ur.user_id = p_user and ur.role = 'teacher' and ur.school_id = v_school) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  v_key := least(auth.uid()::text, p_user::text) || ':' || greatest(auth.uid()::text, p_user::text);
  select id into v_id from public.chat_threads where direct_key = v_key;
  if v_id is null then
    insert into public.chat_threads (kind, school_id, direct_key, created_by) values ('rieng', v_school, v_key, auth.uid()) returning id into v_id;
    insert into public.chat_members (thread_id, user_id) values (v_id, auth.uid()), (v_id, p_user);
  end if;
  return v_id;
end;
$$;
revoke all on function public.chat_open_direct(uuid) from public, anon;
grant execute on function public.chat_open_direct(uuid) to authenticated;

-- Thêm thành viên (chỉ giáo viên cùng trường; bỏ qua người đã ở trong nhóm)
create or replace function public.chat_add_members(p_thread uuid, p_members uuid[])
returns int language plpgsql security definer set search_path = '' as $$
declare v_school uuid; v_n int;
begin
  select t.school_id into v_school from public.chat_threads t
  where t.id = p_thread and t.kind = 'nhom'
    and exists (select 1 from public.chat_members m where m.thread_id = t.id and m.user_id = auth.uid() and m.role = 'quan_tri');
  if v_school is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  insert into public.chat_members (thread_id, user_id)
  select p_thread, u from unnest(coalesce(p_members, '{}')) u
  where exists (select 1 from public.user_roles ur where ur.user_id = u and ur.role = 'teacher' and ur.school_id = v_school)
  on conflict do nothing;
  get diagnostics v_n = row_count;
  if (select count(*) from public.chat_members where thread_id = p_thread) > 200 then raise exception 'too_many_members'; end if;
  return v_n;
end;
$$;
revoke all on function public.chat_add_members(uuid, uuid[]) from public, anon;
grant execute on function public.chat_add_members(uuid, uuid[]) to authenticated;

-- Tạo nhóm: người tạo là quản trị nhóm
create or replace function public.chat_create_group(p_title text, p_members uuid[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_school uuid := public.library_school(); v_id uuid;
begin
  if auth.uid() is null or not public.is_teacher_user() or v_school is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  if char_length(trim(coalesce(p_title, ''))) < 2 then raise exception 'title_required'; end if;
  if not public.rate_hit('chat_group:' || auth.uid()::text, 20, 3600) then raise exception 'rate_limited' using errcode = '54000'; end if;
  insert into public.chat_threads (kind, title, school_id, created_by) values ('nhom', left(trim(p_title), 80), v_school, auth.uid()) returning id into v_id;
  insert into public.chat_members (thread_id, user_id, role) values (v_id, auth.uid(), 'quan_tri');
  perform public.chat_add_members(v_id, p_members);
  return v_id;
end;
$$;
revoke all on function public.chat_create_group(text, uuid[]) from public, anon;
grant execute on function public.chat_create_group(text, uuid[]) to authenticated;

-- Rời nhóm (nhóm còn người mà không còn quản trị thì người vào sớm nhất làm quản trị)
create or replace function public.chat_leave(p_thread uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.chat_threads t join public.chat_members m on m.thread_id = t.id
                 where t.id = p_thread and t.kind = 'nhom' and m.user_id = auth.uid()) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  delete from public.chat_members where thread_id = p_thread and user_id = auth.uid();
  if not exists (select 1 from public.chat_members where thread_id = p_thread and role = 'quan_tri') then
    update public.chat_members set role = 'quan_tri'
    where (thread_id, user_id) = (select thread_id, user_id from public.chat_members where thread_id = p_thread order by joined_at limit 1);
  end if;
end;
$$;
revoke all on function public.chat_leave(uuid) from public, anon;
grant execute on function public.chat_leave(uuid) to authenticated;

-- Danh sách cuộc trò chuyện của tôi: tên (nhóm: tên nhóm; riêng: tên người kia), tin cuối, số tin chưa đọc
create or replace function public.chat_threads_list()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(x.j order by x.last_at desc) from (
      select t.last_at, jsonb_build_object(
        'id', t.id, 'kind', t.kind, 'lastAt', t.last_at, 'lastPreview', t.last_preview, 'lastMine', t.last_sender = auth.uid(),
        'isAdmin', me.role = 'quan_tri',
        'members', (select count(*) from public.chat_members m where m.thread_id = t.id),
        'other', case when t.kind = 'rieng' then (select m.user_id from public.chat_members m where m.thread_id = t.id and m.user_id <> auth.uid() limit 1) end,
        'title', case when t.kind = 'nhom' then t.title else coalesce((
          select p.display_name from public.chat_members m join public.profiles p on p.id = m.user_id
          where m.thread_id = t.id and m.user_id <> auth.uid() limit 1), 'Giáo viên') end,
        'unread', (select count(*) from public.chat_messages c where c.thread_id = t.id and c.sender <> auth.uid()
                   and c.created_at > me.last_read_at and c.deleted_at is null)
      ) as j
      from public.chat_threads t join public.chat_members me on me.thread_id = t.id and me.user_id = auth.uid()
    ) x
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.chat_threads_list() from public, anon;
grant execute on function public.chat_threads_list() to authenticated;

-- Tổng số tin chưa đọc (chấm đỏ trên mục Cộng đồng)
create or replace function public.chat_unread_total()
returns int language sql stable security definer set search_path = '' as $$
  select coalesce((select count(*)::int from public.chat_members me
    join public.chat_messages c on c.thread_id = me.thread_id and c.sender <> me.user_id and c.created_at > me.last_read_at and c.deleted_at is null
    where me.user_id = auth.uid()), 0);
$$;
revoke all on function public.chat_unread_total() from public, anon;
grant execute on function public.chat_unread_total() to authenticated;

-- Tin nhắn của một cuộc trò chuyện (mới nhất p_limit tin trước mốc p_before), trả theo thứ tự thời gian tăng dần
create or replace function public.chat_messages_list(p_thread uuid, p_before timestamptz default null, p_limit int default 50)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.chat_is_member(p_thread) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'sender', c.sender, 'senderName', coalesce(p.display_name, 'Giáo viên'), 'mine', c.sender = auth.uid(),
      'body', case when c.deleted_at is null then c.body else '' end,
      'file', case when c.deleted_at is null then c.file end,
      'deleted', c.deleted_at is not null, 'createdAt', c.created_at
    ) order by c.created_at)
    from (select * from public.chat_messages m where m.thread_id = p_thread and (p_before is null or m.created_at < p_before)
          order by m.created_at desc limit least(greatest(p_limit, 1), 100)) c
    left join public.profiles p on p.id = c.sender
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.chat_messages_list(uuid, timestamptz, int) from public, anon;
grant execute on function public.chat_messages_list(uuid, timestamptz, int) to authenticated;

-- Gửi tin: chữ và/hoặc một file đã tải lên chat/<mã cuộc trò chuyện>/…; tối đa 40 tin / phút / người
create or replace function public.chat_send(p_thread uuid, p_body text, p_file jsonb default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_body text := trim(coalesce(p_body, ''));
begin
  if not public.chat_is_member(p_thread) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if v_body = '' and p_file is null then raise exception 'empty_message'; end if;
  if p_file is not null and (coalesce(p_file->>'path', '') not like 'chat/' || p_thread::text || '/%' or coalesce(p_file->>'name', '') = '') then
    raise exception 'bad_file';
  end if;
  if not public.rate_hit('chat_send:' || auth.uid()::text, 40, 60) then raise exception 'rate_limited' using errcode = '54000'; end if;
  insert into public.chat_messages (thread_id, sender, body, file)
  values (p_thread, auth.uid(), left(v_body, 4000),
          case when p_file is null then null else jsonb_build_object('path', p_file->>'path', 'name', left(p_file->>'name', 160),
            'size', coalesce((p_file->>'size')::bigint, 0), 'mime', left(coalesce(p_file->>'mime', ''), 120)) end)
  returning id into v_id;
  update public.chat_threads set last_at = now(), last_sender = auth.uid(),
    last_preview = left(case when v_body <> '' then v_body else '📎 ' || (p_file->>'name') end, 140)
  where id = p_thread;
  update public.chat_members set last_read_at = now() where thread_id = p_thread and user_id = auth.uid();
  return v_id;
end;
$$;
revoke all on function public.chat_send(uuid, text, jsonb) from public, anon;
grant execute on function public.chat_send(uuid, text, jsonb) to authenticated;

create or replace function public.chat_mark_read(p_thread uuid)
returns void language sql security definer set search_path = '' as $$
  update public.chat_members set last_read_at = now() where thread_id = p_thread and user_id = auth.uid();
$$;
revoke all on function public.chat_mark_read(uuid) from public, anon;
grant execute on function public.chat_mark_read(uuid) to authenticated;

-- Thu hồi tin của chính mình
create or replace function public.chat_delete_message(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.chat_messages set deleted_at = now() where id = p_id and sender = auth.uid() and deleted_at is null;
  if not found then raise exception 'not_allowed' using errcode = '42501'; end if;
end;
$$;
revoke all on function public.chat_delete_message(uuid) from public, anon;
grant execute on function public.chat_delete_message(uuid) to authenticated;

-- ---------------------------------------------------------------- đăng TÀI LIỆU (file) lên Kho chia sẻ
alter table public.community_resources drop constraint if exists community_resources_kind_check;
alter table public.community_resources add constraint community_resources_kind_check
  check (kind in ('bai_giang', 'giao_an', 'de_kiem_tra', 'phieu', 'cau_hoi', 'tai_lieu'));

-- Tài liệu dạng file: file phải nằm trong thư mục tai-lieu/<mã người đăng>/ — dùng lại community_publish
create or replace function public.community_publish_file(
  p_title text, p_summary text, p_subject text, p_grade int, p_lesson_ref text, p_license text, p_visibility text, p_file jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(p_file->>'path', '') not like 'tai-lieu/' || auth.uid()::text || '/%' or coalesce(p_file->>'name', '') = '' then
    raise exception 'bad_file';
  end if;
  return public.community_publish('tai_lieu', p_title, p_summary, p_subject, p_grade, '', p_lesson_ref, p_license, p_visibility,
    jsonb_build_object('file', jsonb_build_object('path', p_file->>'path', 'name', left(p_file->>'name', 160),
      'size', coalesce((p_file->>'size')::bigint, 0), 'mime', left(coalesce(p_file->>'mime', ''), 120))));
end;
$$;
revoke all on function public.community_publish_file(text, text, text, int, text, text, text, jsonb) from public, anon;
grant execute on function public.community_publish_file(text, text, text, int, text, text, text, jsonb) to authenticated;

-- Thẻ tài nguyên thêm thông tin file (tên, cỡ) cho loại 'tai_lieu' — không lộ snapshot các loại khác
create or replace function public.community_card(r public.community_resources)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', r.id, 'kind', r.kind, 'title', r.title, 'summary', r.summary, 'subject', r.subject, 'grade', r.grade,
    'book', r.book, 'lessonRef', r.lesson_ref, 'license', r.license, 'visibility', r.visibility, 'status', r.status,
    'saves', r.saves, 'copies', r.copies, 'createdAt', r.created_at, 'remixedFrom', r.remixed_from,
    'mine', r.owner = auth.uid(),
    'saved', exists (select 1 from public.community_saves s where s.resource_id = r.id and s.user_id = auth.uid()),
    'file', case when r.kind = 'tai_lieu' then r.snapshot->'file' end,
    'author', jsonb_build_object(
      'id', r.owner,
      'name', coalesce((select p.display_name from public.profiles p where p.id = r.owner), 'Giáo viên'),
      'school', case when coalesce((select cp.show_school from public.community_profiles cp where cp.user_id = r.owner), true)
                     then (select s.name from public.schools s where s.id = r.school_id) end
    )
  );
$$;
revoke all on function public.community_card(public.community_resources) from public, anon;
