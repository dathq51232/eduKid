-- EduChain Kids 0031: GÓC PHỤ HUYNH TỰ PHỤC VỤ — phụ huynh dùng chung mã PIN của con (0028, 0026).
-- CHỈ THÊM MỚI, chạy lại an toàn.
--
-- * parent_contacts thêm cột zalo (số Zalo, có thể khác số điện thoại).
-- * parent_diary_recent(p_days): phụ huynh đọc Sổ lớp của con — thông báo cả lớp + dòng của chính em
--   (vắng/nhãn khen nhắc/ghi chú của cô) trong p_days ngày gần nhất.
-- * parent_my_contacts / parent_contact_save / parent_contact_delete: phụ huynh tự cập nhật
--   số điện thoại, Zalo, người đón con… của Gia ĐÌNH mình (tối đa 3, như giao diện giáo viên).
--   Giáo viên vẫn thấy cập nhật này trong Danh bạ phụ huynh (teacher_contacts, có kèm zalo).
-- Phiên đăng nhập = phiên của học sinh (PIN dùng chung) nên mọi hàm tự giới hạn theo students.user_id.

-- 1) Cột zalo trong danh bạ (rỗng = dùng số điện thoại làm Zalo)
alter table public.parent_contacts
  add column if not exists zalo text check (zalo is null or zalo ~ '^\+?[0-9]{8,13}$');

-- 2) Danh bạ của giáo viên: trả thêm zalo
create or replace function public.teacher_contacts(p_class uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v jsonb;
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'student_id', c.student_id, 'name', c.name, 'relation', c.relation,
                                               'phone', c.phone, 'zalo', c.zalo, 'note', c.note, 'updated_at', c.updated_at) order by c.student_id, c.updated_at), '[]'::jsonb)
    into v
    from public.parent_contacts c
    join public.class_memberships m on m.student_id = c.student_id and m.class_id = p_class and m.status = 'active';
  insert into public.parent_contact_log (class_id, actor, action) values (p_class, auth.uid(), 'view');
  return v;
end;
$$;

-- 3) my_student_id() đã có từ 0008 (RLS của classes/students/lesson_results dùng nó) — KHÔNG định nghĩa lại,
--    KHÔNG thu hồi quyền: thiếu quyền execute thì giáo viên và học sinh không đọc được lớp nào.
grant execute on function public.my_student_id() to authenticated;

-- 4) Sổ lớp của con: p_days ngày gần nhất có nội dung (thông báo lớp hoặc dòng của em), mới nhất trước
create or replace function public.parent_diary_recent(p_days int default 14)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_student uuid := public.my_student_id();
  v_class uuid;
  v_from date;
begin
  if v_student is null then return '[]'::jsonb; end if;
  select m.class_id into v_class
  from public.class_memberships m join public.classes c on c.id = m.class_id
  where m.student_id = v_student and m.status = 'active' and c.status = 'active'
  order by m.joined_at desc limit 1;
  if v_class is null then return '[]'::jsonb; end if;
  if p_days is null or p_days < 1 or p_days > 90 then p_days := 14; end if;
  v_from := greatest((now() at time zone 'Asia/Ho_Chi_Minh')::date - p_days, date '2020-01-01');

  return coalesce((
    select jsonb_agg(t order by t.day desc)
    from (
      select d.day,
             d.announcement,
             coalesce(e.status, 'present') as status,
             coalesce(e.tags, '{}'::text[]) as tags,
             e.note
      from public.class_diary_days d
      left join public.class_diary_entries e
        on e.class_id = d.class_id and e.day = d.day and e.student_id = v_student
      where d.class_id = v_class and d.day >= v_from
        and (d.announcement is not null or e.student_id is not null)
      order by d.day desc
    ) t
  ), '[]'::jsonb);
end;
$$;

-- 5) Danh bạ của gia đình (phiên con)
create or replace function public.parent_my_contacts()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare v_student uuid := public.my_student_id();
begin
  if v_student is null then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'relation', c.relation, 'phone', c.phone,
                                        'zalo', c.zalo, 'note', c.note, 'updated_at', c.updated_at,
                                        'mine', c.updated_by = auth.uid())
                     order by c.updated_at)
    from public.parent_contacts c where c.student_id = v_student
  ), '[]'::jsonb);
end;
$$;

-- 6) Phụ huynh tự lưu một số liên lạc (tối đa 3/em như giao diện giáo viên)
create or replace function public.parent_contact_save(
  p_id uuid, p_name text, p_relation text, p_phone text, p_zalo text default null, p_note text default null
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_student uuid := public.my_student_id();
  v_class uuid;
  v_phone text;
  v_zalo text;
begin
  if v_uid is null or v_student is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  v_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v_zalo := nullif(regexp_replace(coalesce(p_zalo, ''), '[^0-9+]', '', 'g'), '');
  if v_phone !~ '^\+?[0-9]{8,13}$' then raise exception 'invalid_phone' using errcode = '22023'; end if;
  if v_zalo is not null and v_zalo !~ '^\+?[0-9]{8,13}$' then raise exception 'invalid_zalo' using errcode = '22023'; end if;
  if p_id is not null and not exists (select 1 from public.parent_contacts c where c.id = p_id and c.student_id = v_student) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_id is null and (select count(*) from public.parent_contacts c where c.student_id = v_student) >= 3 then
    raise exception 'too_many_contacts' using errcode = 'P0003';
  end if;

  insert into public.parent_contacts (id, student_id, name, relation, phone, zalo, note, updated_by)
  values (coalesce(p_id, gen_random_uuid()), v_student,
          left(trim(coalesce(p_name, '')), 80), left(trim(coalesce(p_relation, '')), 30), v_phone, v_zalo,
          nullif(left(trim(coalesce(p_note, '')), 200), ''), v_uid)
  on conflict (id) do update
    set name = left(trim(coalesce(p_name, '')), 80),
        relation = left(trim(coalesce(p_relation, '')), 30),
        phone = v_phone,
        zalo = v_zalo,
        note = nullif(left(trim(coalesce(p_note, '')), 200), ''),
        -- giữ nguyên người nhập: số do cô nhập vẫn là của cô (phụ huynh sửa được nhưng không xoá được); nhật ký ghi người sửa
        updated_at = now()
  returning id into p_id;

  select m.class_id into v_class from public.class_memberships m
  where m.student_id = v_student and m.status = 'active' order by m.joined_at desc limit 1;
  insert into public.parent_contact_log (class_id, student_id, actor, action) values (v_class, v_student, v_uid, 'save');
  return p_id;
end;
$$;

-- 7) Phụ huynh tự xoá số do CHÍNH MÌNH nhập (số do cô nhập thì chỉ cô xoá được)
create or replace function public.parent_contact_delete(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_student uuid := public.my_student_id();
  v_class uuid;
begin
  if v_uid is null or v_student is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  delete from public.parent_contacts c where c.id = p_id and c.student_id = v_student and c.updated_by = v_uid;
  if not found then raise exception 'not_allowed' using errcode = '42501'; end if;
  select m.class_id into v_class from public.class_memberships m
  where m.student_id = v_student and m.status = 'active' order by m.joined_at desc limit 1;
  insert into public.parent_contact_log (class_id, student_id, actor, action) values (v_class, v_student, v_uid, 'delete');
end;
$$;

-- 8) Giáo viên lưu số kèm Zalo: thay bản 7 tham số của 0028 bằng bản có p_zalo (để mặc định null → giao diện cũ vẫn chạy)
drop function if exists public.teacher_contact_save(uuid, uuid, uuid, text, text, text, text);
create or replace function public.teacher_contact_save(p_class uuid, p_student uuid, p_id uuid, p_name text, p_relation text, p_phone text,
                                                       p_note text default null, p_zalo text default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v_zalo text := nullif(regexp_replace(coalesce(p_zalo, ''), '[^0-9+]', '', 'g'), '');
  v_id uuid;
begin
  if auth.uid() is null or not public.teaches_class(p_class) or not public.student_in_class(p_class, p_student) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if v_phone !~ '^\+?[0-9]{8,13}$' then raise exception 'invalid_phone' using errcode = '22023'; end if;
  if v_zalo is not null and v_zalo !~ '^\+?[0-9]{8,13}$' then raise exception 'invalid_zalo' using errcode = '22023'; end if;
  if p_id is null then
    if (select count(*) from public.parent_contacts where student_id = p_student) >= 3 then raise exception 'too_many_contacts' using errcode = '22023'; end if;
    insert into public.parent_contacts (student_id, name, relation, phone, zalo, note, updated_by)
    values (p_student, left(trim(coalesce(p_name, '')), 80), left(trim(coalesce(p_relation, '')), 30), v_phone, v_zalo,
            nullif(left(trim(coalesce(p_note, '')), 200), ''), auth.uid())
    returning id into v_id;
  else
    update public.parent_contacts
       set name = left(trim(coalesce(p_name, '')), 80), relation = left(trim(coalesce(p_relation, '')), 30), phone = v_phone, zalo = v_zalo,
           note = nullif(left(trim(coalesce(p_note, '')), 200), ''), updated_by = auth.uid(), updated_at = now()
     where id = p_id and student_id = p_student
    returning id into v_id;
    if v_id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  end if;
  insert into public.parent_contact_log (class_id, student_id, actor, action) values (p_class, p_student, auth.uid(), 'save');
  return v_id;
end;
$$;

-- Cấp quyền như 0028: chỉ người đã đăng nhập (authenticated) chạy được; hàm tự kiểm tra quyền bên trong
do $$
declare f text;
begin
  foreach f in array array[
    'public.teacher_contacts(uuid)',
    'public.teacher_contact_save(uuid, uuid, uuid, text, text, text, text, text)',
    'public.parent_diary_recent(int)',
    'public.parent_my_contacts()',
    'public.parent_contact_save(uuid, text, text, text, text, text)',
    'public.parent_contact_delete(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
