-- 0039 · Phòng triển lãm của lớp: thư khen, tranh mỹ thuật, bài luyện chữ của học sinh, treo trong phòng 3D cho phụ huynh xem.
-- • Ảnh / tiếng nằm trong bucket riêng tư "class-gallery", thư mục <class_id>/…; học sinh tự nộp vào <class_id>/s-<student_id>/….
-- • Ai được xem: giáo viên dạy lớp, học sinh của lớp (phụ huynh dùng tài khoản của con) và tài khoản phụ huynh đã liên kết với
--   một em trong lớp. Người ngoài lớp không đọc được bảng lẫn file.
-- • Giáo viên treo tác phẩm (hiện ngay); học sinh tự nộp thì chờ cô duyệt. Phụ huynh thả tim / sticker, không có bình luận tự do.
-- Bảng không mở trực tiếp cho trình duyệt: mọi thao tác qua các hàm bên dưới. CHỈ THÊM MỚI, chạy lại an toàn.

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  kind text not null check (kind in ('praise', 'art', 'writing')),
  title text not null default '' check (char_length(title) <= 120),
  note text not null default '' check (char_length(note) <= 300),
  path text not null check (char_length(path) between 10 and 200),
  w integer not null default 1000 check (w between 16 and 6000),
  h integer not null default 1000 check (h between 16 and 6000),
  audio_path text check (audio_path is null or char_length(audio_path) between 10 and 200),
  status text not null default 'shown' check (status in ('shown', 'pending', 'hidden')),
  taken_on date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists gallery_items_class_idx on public.gallery_items (class_id, created_at desc);
create index if not exists gallery_items_student_idx on public.gallery_items (student_id, taken_on);

create table if not exists public.gallery_hearts (
  item_id uuid not null references public.gallery_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null default 'heart' check (emoji in ('heart', 'star', 'clap', 'wow')),
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);

create table if not exists public.gallery_settings (
  class_id uuid primary key references public.classes(id) on delete cascade,
  name_mode text not null default 'given' check (name_mode in ('full', 'given')),
  theme text not null default 'nang' check (theme in ('nang', 'bien', 'rung', 'nha-giao', 'tet', 'cuoi-ky')),
  updated_at timestamptz not null default now()
);

alter table public.gallery_items enable row level security;
alter table public.gallery_hearts enable row level security;
alter table public.gallery_settings enable row level security;
revoke all on table public.gallery_items, public.gallery_hearts, public.gallery_settings from anon, authenticated;
grant select, insert, update, delete on table public.gallery_items, public.gallery_hearts, public.gallery_settings to service_role;

-- Học sinh trong lớp mà người đang đăng nhập "là gia đình": chính em (phiên của con) hoặc con đã liên kết (tài khoản phụ huynh)
create or replace function public.gallery_family_students(p_class uuid)
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select cm.student_id from public.class_memberships cm
  where cm.class_id = p_class and cm.status = 'active'
    and (cm.student_id = public.my_student_id() or public.is_parent_of(cm.student_id));
$$;
revoke all on function public.gallery_family_students(uuid) from public, anon;

create or replace function public.gallery_can_view(p_class uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_class is not null and auth.uid() is not null
    and (public.teaches_class(p_class) or exists (select 1 from public.gallery_family_students(p_class)));
$$;
revoke all on function public.gallery_can_view(uuid) from public, anon;
grant execute on function public.gallery_can_view(uuid) to authenticated;

-- Thư mục đầu của đường dẫn file = class_id (đọc an toàn, sai dạng thì null)
create or replace function public.gallery_path_class(p_name text)
returns uuid
language plpgsql immutable set search_path = ''
as $$
declare v text := split_part(coalesce(p_name, ''), '/', 1);
begin
  if v ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then return v::uuid; end if;
  return null;
end;
$$;

-- Học sinh được tải file vào thư mục riêng <class>/s-<student_id>/ của lớp mình
create or replace function public.gallery_student_may_upload(p_name text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.my_student_id() is not null
    and public.gallery_path_class(p_name) = public.my_active_class()
    and split_part(p_name, '/', 2) = 's-' || public.my_student_id()::text;
$$;
revoke all on function public.gallery_student_may_upload(text) from public, anon;
grant execute on function public.gallery_student_may_upload(text) to authenticated;

-- ---------------------------------------------------------------- bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('class-gallery', 'class-gallery', false, 4194304,
        array['image/webp', 'image/jpeg', 'image/png', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "class_gallery_read" on storage.objects;
create policy "class_gallery_read" on storage.objects for select to authenticated
  using (bucket_id = 'class-gallery' and public.gallery_can_view(public.gallery_path_class(name)));
drop policy if exists "class_gallery_insert" on storage.objects;
create policy "class_gallery_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'class-gallery' and (public.teaches_class(public.gallery_path_class(name)) or public.gallery_student_may_upload(name)));
drop policy if exists "class_gallery_delete" on storage.objects;
create policy "class_gallery_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'class-gallery' and public.teaches_class(public.gallery_path_class(name)));

-- ---------------------------------------------------------------- đọc
-- Các lớp có phòng triển lãm mà người đang đăng nhập xem được với tư cách gia đình
create or replace function public.gallery_my_classes()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('class_id', c.id, 'class_name', c.name, 'grade', c.grade,
                                               'student_id', s.id, 'student_name', s.display_name) order by c.name, s.display_name), '[]'::jsonb)
  from public.class_memberships cm
  join public.classes c on c.id = cm.class_id and c.status = 'active'
  join public.students s on s.id = cm.student_id
  where cm.status = 'active' and (cm.student_id = public.my_student_id() or public.is_parent_of(cm.student_id));
$$;
revoke all on function public.gallery_my_classes() from public, anon;
grant execute on function public.gallery_my_classes() to authenticated;

-- Tác phẩm của lớp. Giáo viên thấy cả bài chờ duyệt / đã ẩn; gia đình thấy bài đang treo và bài chờ duyệt của con mình.
create or replace function public.gallery_list(p_class uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_teacher boolean := public.teaches_class(p_class);
  v_mine uuid[];
  v_mode text;
begin
  if not public.gallery_can_view(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  select coalesce(array_agg(x), '{}') into v_mine from public.gallery_family_students(p_class) x;
  select coalesce((select gs.name_mode from public.gallery_settings gs where gs.class_id = p_class), 'given') into v_mode;
  return jsonb_build_object(
    'teacher', v_teacher,
    'mine', to_jsonb(v_mine),
    'class', (select jsonb_build_object('id', c.id, 'name', c.name, 'grade', c.grade) from public.classes c where c.id = p_class),
    'settings', coalesce((select jsonb_build_object('name_mode', gs.name_mode, 'theme', gs.theme) from public.gallery_settings gs where gs.class_id = p_class),
                         jsonb_build_object('name_mode', 'given', 'theme', 'nang')),
    'items', coalesce((select jsonb_agg(to_jsonb(x) order by x.kind, x.taken_on desc, x.created_at desc) from (
      select g.id, g.student_id, g.kind, g.title, g.note, g.path, g.w, g.h, g.audio_path, g.status, g.taken_on, g.created_at,
             case when g.student_id is null then null
                  when v_teacher or v_mode = 'full' or g.student_id = any(v_mine) then s.display_name
                  else coalesce(nullif(regexp_replace(trim(s.display_name), '^.*\s', ''), ''), s.display_name) end as student_name,
             (select count(*) from public.gallery_hearts h where h.item_id = g.id)::integer as hearts,
             (select h.emoji from public.gallery_hearts h where h.item_id = g.id and h.user_id = auth.uid()) as my_heart
      from public.gallery_items g left join public.students s on s.id = g.student_id
      where g.class_id = p_class
        and (v_teacher or g.status = 'shown' or (g.status = 'pending' and g.student_id = any(v_mine)))
      limit 600
    ) x), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.gallery_list(uuid) from public, anon;
grant execute on function public.gallery_list(uuid) to authenticated;

-- ---------------------------------------------------------------- ghi
-- Thêm tác phẩm. Giáo viên: hiện ngay, gắn em bất kỳ trong lớp (hoặc cả lớp). Học sinh: chỉ bài của mình, chờ cô duyệt.
create or replace function public.gallery_add(p_class uuid, p_student uuid, p_kind text, p_title text, p_note text,
                                              p_path text, p_w integer, p_h integer, p_audio text default null, p_taken date default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_teacher boolean := public.teaches_class(p_class);
  v_me uuid := public.my_student_id();
  v_id uuid;
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  if auth.uid() is null or p_class is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_kind not in ('praise', 'art', 'writing') then raise exception 'invalid_kind' using errcode = '22023'; end if;
  if public.gallery_path_class(p_path) is distinct from p_class
     or (p_audio is not null and public.gallery_path_class(p_audio) is distinct from p_class) then
    raise exception 'invalid_path' using errcode = '22023';
  end if;
  if v_teacher then
    if p_student is not null and not exists (select 1 from public.class_memberships cm where cm.class_id = p_class and cm.student_id = p_student) then
      raise exception 'not_in_class' using errcode = '22023';
    end if;
  else
    if v_me is null or public.my_active_class() is distinct from p_class or p_student is distinct from v_me or p_kind = 'praise'
       or split_part(p_path, '/', 2) <> 's-' || v_me::text
       or (p_audio is not null and split_part(p_audio, '/', 2) <> 's-' || v_me::text) then
      raise exception 'not_allowed' using errcode = '42501';
    end if;
    -- chống nộp dồn: tối đa 10 bài một ngày, 300 bài một em
    if (select count(*) from public.gallery_items g where g.student_id = v_me and g.created_at > now() - interval '1 day') >= 10
       or (select count(*) from public.gallery_items g where g.student_id = v_me) >= 300 then
      raise exception 'too_many' using errcode = '22023';
    end if;
  end if;
  if (select count(*) from public.gallery_items g where g.class_id = p_class) >= 3000 then raise exception 'gallery_full' using errcode = '54000'; end if;
  insert into public.gallery_items (class_id, student_id, kind, title, note, path, w, h, audio_path, status, taken_on, created_by)
  values (p_class, p_student, p_kind, left(trim(coalesce(p_title, '')), 120), left(trim(coalesce(p_note, '')), 300), p_path,
          greatest(16, least(coalesce(p_w, 1000), 6000)), greatest(16, least(coalesce(p_h, 1000), 6000)), p_audio,
          case when v_teacher then 'shown' else 'pending' end,
          case when p_taken is null or p_taken > v_today or p_taken < v_today - 800 then v_today else p_taken end, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.gallery_add(uuid, uuid, text, text, text, text, integer, integer, text, date) from public, anon;
grant execute on function public.gallery_add(uuid, uuid, text, text, text, text, integer, integer, text, date) to authenticated;

-- Giáo viên sửa: duyệt / ẩn / hiện, đổi tên, lời nhận xét, gắn tiếng giới thiệu
create or replace function public.gallery_update(p_id uuid, p_status text default null, p_title text default null, p_note text default null,
                                                 p_audio text default null, p_clear_audio boolean default false)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_class uuid;
begin
  select g.class_id into v_class from public.gallery_items g where g.id = p_id;
  if v_class is null or not public.teaches_class(v_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_status is not null and p_status not in ('shown', 'pending', 'hidden') then raise exception 'invalid_status' using errcode = '22023'; end if;
  if p_audio is not null and public.gallery_path_class(p_audio) is distinct from v_class then raise exception 'invalid_path' using errcode = '22023'; end if;
  update public.gallery_items g set
    status = coalesce(p_status, g.status),
    title = coalesce(left(trim(p_title), 120), g.title),
    note = coalesce(left(trim(p_note), 300), g.note),
    audio_path = case when p_clear_audio then null else coalesce(p_audio, g.audio_path) end
  where g.id = p_id;
end;
$$;
revoke all on function public.gallery_update(uuid, text, text, text, text, boolean) from public, anon;
grant execute on function public.gallery_update(uuid, text, text, text, text, boolean) to authenticated;

-- Giáo viên xoá; trả về đường dẫn file để trình duyệt xoá luôn trong Storage
create or replace function public.gallery_delete(p_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_class uuid; v_path text; v_audio text;
begin
  select g.class_id, g.path, g.audio_path into v_class, v_path, v_audio from public.gallery_items g where g.id = p_id;
  if v_class is null or not public.teaches_class(v_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  delete from public.gallery_items where id = p_id;
  return jsonb_build_array(v_path) || case when v_audio is null then '[]'::jsonb else jsonb_build_array(v_audio) end;
end;
$$;
revoke all on function public.gallery_delete(uuid) from public, anon;
grant execute on function public.gallery_delete(uuid) to authenticated;

-- Gia đình thả tim / sticker (bấm lại cùng loại thì bỏ). Trả về số lượt mới.
create or replace function public.gallery_heart(p_id uuid, p_emoji text default 'heart')
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_class uuid; v_status text; v_old text;
begin
  select g.class_id, g.status into v_class, v_status from public.gallery_items g where g.id = p_id;
  if v_class is null or v_status <> 'shown' or not public.gallery_can_view(v_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_emoji not in ('heart', 'star', 'clap', 'wow') then raise exception 'invalid_emoji' using errcode = '22023'; end if;
  select h.emoji into v_old from public.gallery_hearts h where h.item_id = p_id and h.user_id = auth.uid();
  if v_old = p_emoji then
    delete from public.gallery_hearts where item_id = p_id and user_id = auth.uid();
    v_old := null;
  else
    insert into public.gallery_hearts (item_id, user_id, emoji) values (p_id, auth.uid(), p_emoji)
    on conflict (item_id, user_id) do update set emoji = excluded.emoji, created_at = now();
    v_old := p_emoji;
  end if;
  return jsonb_build_object('hearts', (select count(*) from public.gallery_hearts h where h.item_id = p_id), 'my_heart', v_old);
end;
$$;
revoke all on function public.gallery_heart(uuid, text) from public, anon;
grant execute on function public.gallery_heart(uuid, text) to authenticated;

create or replace function public.gallery_set_settings(p_class uuid, p_name_mode text, p_theme text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_name_mode not in ('full', 'given') or p_theme not in ('nang', 'bien', 'rung', 'nha-giao', 'tet', 'cuoi-ky') then
    raise exception 'invalid_settings' using errcode = '22023';
  end if;
  insert into public.gallery_settings (class_id, name_mode, theme, updated_at) values (p_class, p_name_mode, p_theme, now())
  on conflict (class_id) do update set name_mode = excluded.name_mode, theme = excluded.theme, updated_at = now();
end;
$$;
revoke all on function public.gallery_set_settings(uuid, text, text) from public, anon;
grant execute on function public.gallery_set_settings(uuid, text, text) to authenticated;
