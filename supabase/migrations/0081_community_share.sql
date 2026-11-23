-- EduChain Kids 0081: CỘNG ĐỒNG — CHIA SẺ TỪ TRÌNH SOẠN, LIÊN KẾT, SAO CHÉP VỀ SỬA, "ĐỒNG NGHIỆP ĐÃ SOẠN". CHỈ THÊM MỚI, chạy lại an toàn.
-- Chạy SAU 0079, 0080.
--  • Loại tài nguyên 'lien_ket': file lớn (> 20 MB) để trên Drive / OneDrive / YouTube / Canva của thầy cô, app chỉ giữ liên kết
--    (chỉ nhận https thuộc các tên miền này). snapshot = {link:{url, host}}.
--  • Bài giảng chia sẻ từ trình soạn: ảnh / âm thanh riêng của cô được chép sang community-files/tai-lieu/<mã cô>/…,
--    danh sách đường dẫn ghi ở snapshot.assets → ai thấy tài nguyên thì mở được các file đó.
--  • community_take_copy: lấy bản chụp để "Sao chép về sửa" (chỉ giấy phép 'sua', loại bài giảng / giáo án), đếm lượt sao chép.
--  • community_peer_counts: số bài đồng nghiệp đã đăng cho từng tiết (theo tên bài + khối) — dòng "Đồng nghiệp đã soạn" ở trang Hôm nay.

update storage.buckets set allowed_mime_types = array[
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'text/plain',
  'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/wav', 'audio/x-wav']
where id = 'community-files';

alter table public.community_resources drop constraint if exists community_resources_kind_check;
alter table public.community_resources add constraint community_resources_kind_check
  check (kind in ('bai_giang', 'giao_an', 'de_kiem_tra', 'phieu', 'cau_hoi', 'tai_lieu', 'lien_ket'));

-- File thuộc một tài nguyên người đang xem được thấy: file tài liệu hoặc ảnh / âm thanh của bài giảng
create or replace function public.community_file_visible(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.community_resources r
                 where (r.snapshot #>> '{file,path}' = p_name or coalesce(r.snapshot->'assets', '[]'::jsonb) ? p_name)
                   and public.community_can_see(r.owner, r.school_id, r.visibility, r.status));
$$;
revoke all on function public.community_file_visible(text) from public, anon;
grant execute on function public.community_file_visible(text) to authenticated;

-- Đăng: thêm kiểm tra nguồn giáo án (lesson_plans.owner_id) và đường dẫn file đính kèm của bài giảng (snapshot.assets)
create or replace function public.community_publish(
  p_kind text, p_title text, p_summary text, p_subject text, p_grade int, p_book text, p_lesson_ref text,
  p_license text, p_visibility text, p_snapshot jsonb, p_source_table text default null, p_source_id uuid default null,
  p_remixed_from uuid default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_owner_ok boolean := true;
begin
  if auth.uid() is null or not public.is_teacher_user() then raise exception 'not_allowed' using errcode = '42501'; end if;
  if not public.rate_hit('community_publish:' || auth.uid()::text, 30, 3600) then raise exception 'rate_limited' using errcode = '54000'; end if;
  if p_source_table = 'slide_decks' then
    v_owner_ok := exists (select 1 from public.slide_decks d where d.id = p_source_id and d.owner = auth.uid());
  elsif p_source_table = 'lesson_plans' then
    v_owner_ok := exists (select 1 from public.lesson_plans l where l.id = p_source_id and l.owner_id = auth.uid());
  elsif p_source_table is not null then
    v_owner_ok := false;
  end if;
  if not v_owner_ok then raise exception 'not_owner' using errcode = '42501'; end if;
  if exists (select 1 from jsonb_array_elements_text(case when jsonb_typeof(p_snapshot->'assets') = 'array' then p_snapshot->'assets' else '[]'::jsonb end) a
             where a not like 'tai-lieu/' || auth.uid()::text || '/%') then
    raise exception 'bad_file';
  end if;
  insert into public.community_resources (owner, school_id, kind, title, summary, subject, grade, book, lesson_ref, license, visibility,
    snapshot, content_hash, source_table, source_id, remixed_from)
  values (auth.uid(), public.library_school(), p_kind, trim(p_title), coalesce(trim(p_summary), ''), coalesce(p_subject, ''), p_grade,
    coalesce(p_book, ''), coalesce(trim(p_lesson_ref), ''), p_license, p_visibility,
    p_snapshot, encode(sha256(convert_to(p_snapshot::text, 'UTF8')), 'hex'), p_source_table, p_source_id, p_remixed_from)
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.community_publish(text, text, text, text, int, text, text, text, text, jsonb, text, uuid, uuid) from public, anon;
grant execute on function public.community_publish(text, text, text, text, int, text, text, text, text, jsonb, text, uuid, uuid) to authenticated;

-- Đăng liên kết (file lớn để ở kho của thầy cô)
create or replace function public.community_publish_link(
  p_title text, p_summary text, p_subject text, p_grade int, p_lesson_ref text, p_license text, p_visibility text, p_url text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_url text := trim(coalesce(p_url, '')); v_host text;
begin
  v_host := lower(substring(v_url from '^https://([^/?#:]+)'));
  if char_length(v_url) > 1000 or v_host is null
     or v_host !~ '(^|\.)(google\.com|youtube\.com|youtu\.be|1drv\.ms|onedrive\.live\.com|sharepoint\.com|canva\.com|canva\.link)$' then
    raise exception 'bad_link';
  end if;
  return public.community_publish('lien_ket', p_title, p_summary, p_subject, p_grade, '', p_lesson_ref, p_license, p_visibility,
    jsonb_build_object('link', jsonb_build_object('url', v_url, 'host', v_host)));
end;
$$;
revoke all on function public.community_publish_link(text, text, text, int, text, text, text, text) from public, anon;
grant execute on function public.community_publish_link(text, text, text, int, text, text, text, text) to authenticated;

-- Thẻ tài nguyên: thêm file (tài liệu) / liên kết; số trang của bài giảng
create or replace function public.community_card(r public.community_resources)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', r.id, 'kind', r.kind, 'title', r.title, 'summary', r.summary, 'subject', r.subject, 'grade', r.grade,
    'book', r.book, 'lessonRef', r.lesson_ref, 'license', r.license, 'visibility', r.visibility, 'status', r.status,
    'saves', r.saves, 'copies', r.copies, 'createdAt', r.created_at, 'remixedFrom', r.remixed_from,
    'mine', r.owner = auth.uid(),
    'saved', exists (select 1 from public.community_saves s where s.resource_id = r.id and s.user_id = auth.uid()),
    'file', case when r.kind = 'tai_lieu' then r.snapshot->'file' end,
    'link', case when r.kind = 'lien_ket' then r.snapshot->'link' end,
    'slides', case when r.kind = 'bai_giang' and jsonb_typeof(r.snapshot #> '{deck,slides}') = 'array' then jsonb_array_length(r.snapshot #> '{deck,slides}') end,
    'author', jsonb_build_object(
      'id', r.owner,
      'name', coalesce((select p.display_name from public.profiles p where p.id = r.owner), 'Giáo viên'),
      'school', case when coalesce((select cp.show_school from public.community_profiles cp where cp.user_id = r.owner), true)
                     then (select s.name from public.schools s where s.id = r.school_id) end
    )
  );
$$;
revoke all on function public.community_card(public.community_resources) from public, anon;

-- Sao chép về sửa: trả bản chụp (bài giảng / giáo án, giấy phép "Được sao chép về sửa"), cộng lượt sao chép (không tính tác giả)
create or replace function public.community_take_copy(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.community_resources;
begin
  select * into r from public.community_resources where id = p_id;
  if r.id is null or not public.community_can_see(r.owner, r.school_id, r.visibility, r.status) then raise exception 'not_found' using errcode = 'P0002'; end if;
  if r.kind not in ('bai_giang', 'giao_an') or (r.license <> 'sua' and r.owner <> auth.uid()) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if r.owner <> auth.uid() then update public.community_resources set copies = copies + 1 where id = p_id; end if;
  return jsonb_build_object('kind', r.kind, 'title', r.title, 'snapshot', r.snapshot);
end;
$$;
revoke all on function public.community_take_copy(uuid) from public, anon;
grant execute on function public.community_take_copy(uuid) to authenticated;

-- Số bài đồng nghiệp đã đăng (đang hiện, mình thấy được, không tính bài của mình) cho từng tên bài của các tiết hôm nay.
-- Khớp khi tên bài / bài-chủ đề của tài nguyên trùng tên tiết, hoặc chứa nhau (tên ≥ 8 ký tự); cùng khối hoặc tài nguyên không ghi khối.
create or replace function public.community_peer_counts(p_grade int, p_titles text[])
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.is_teacher_user() then return '{}'::jsonb; end if;
  return coalesce((
    select jsonb_object_agg(t.title, t.n) from (
      select x.t as title, (
        select count(*) from public.community_resources r
        where r.status = 'hien' and r.owner <> auth.uid()
          and public.community_can_see(r.owner, r.school_id, r.visibility, r.status)
          and (p_grade is null or r.grade is null or r.grade = p_grade)
          and (lower(r.lesson_ref) = lower(trim(x.t)) or lower(r.title) = lower(trim(x.t))
               or (char_length(trim(x.t)) >= 8 and position(lower(trim(x.t)) in lower(r.lesson_ref || ' ' || r.title)) > 0)
               or (char_length(r.lesson_ref) >= 8 and position(lower(r.lesson_ref) in lower(x.t)) > 0))
      ) as n
      from unnest(p_titles[1:20]) as x(t)
      where char_length(trim(coalesce(x.t, ''))) >= 2
    ) t where t.n > 0
  ), '{}'::jsonb);
end;
$$;
revoke all on function public.community_peer_counts(int, text[]) from public, anon;
grant execute on function public.community_peer_counts(int, text[]) to authenticated;
