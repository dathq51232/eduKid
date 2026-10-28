-- 0040 · Phòng triển lãm: giáo viên sắp xếp tường (thứ tự, cỡ từng khung, cỡ khung cả bức tường để treo được nhiều em),
-- sửa thông tin tác phẩm (tên, lời nhận xét, gắn em khác, chuyển sang tường khác). Cần chạy sau 0039. CHỈ THÊM MỚI, chạy lại an toàn.

alter table public.gallery_items add column if not exists pos integer;
alter table public.gallery_items add column if not exists scale real not null default 1;
alter table public.gallery_items drop constraint if exists gallery_items_scale_check;
alter table public.gallery_items add constraint gallery_items_scale_check check (scale between 0.4 and 1.6);
alter table public.gallery_settings add column if not exists sizes jsonb not null default '{}'::jsonb;
alter table public.gallery_settings drop constraint if exists gallery_settings_sizes_check;
alter table public.gallery_settings add constraint gallery_settings_sizes_check check (jsonb_typeof(sizes) = 'object' and pg_column_size(sizes) < 400);

-- Danh sách tác phẩm (như 0039) + thứ tự, cỡ khung, cỡ khung từng tường
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
    'settings', coalesce((select jsonb_build_object('name_mode', gs.name_mode, 'theme', gs.theme, 'sizes', gs.sizes) from public.gallery_settings gs where gs.class_id = p_class),
                         jsonb_build_object('name_mode', 'given', 'theme', 'nang', 'sizes', '{}'::jsonb)),
    'items', coalesce((select jsonb_agg(to_jsonb(x) order by x.kind, x.pos nulls last, x.taken_on desc, x.created_at desc) from (
      select g.id, g.student_id, g.kind, g.title, g.note, g.path, g.w, g.h, g.audio_path, g.status, g.taken_on, g.created_at, g.pos, g.scale,
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

-- Lưu bố cục: p_sizes = {"praise":0.7,"art":1,"writing":0.85} (0.4–1.4); p_items = [{"id":…, "pos":0, "scale":1}, …]
create or replace function public.gallery_arrange(p_class uuid, p_sizes jsonb, p_items jsonb)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_n integer := 0; v_sizes jsonb := '{}'::jsonb; k text;
begin
  if not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_sizes is not null then
    if jsonb_typeof(p_sizes) <> 'object' then raise exception 'invalid_sizes' using errcode = '22023'; end if;
    for k in select jsonb_object_keys(p_sizes) loop
      if k not in ('praise', 'art', 'writing') or jsonb_typeof(p_sizes->k) <> 'number' then raise exception 'invalid_sizes' using errcode = '22023'; end if;
      v_sizes := v_sizes || jsonb_build_object(k, round(greatest(0.4, least(1.4, (p_sizes->>k)::numeric)), 2));
    end loop;
    insert into public.gallery_settings (class_id, sizes, updated_at) values (p_class, v_sizes, now())
    on conflict (class_id) do update set sizes = excluded.sizes, updated_at = now();
  end if;
  if p_items is not null then
    if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 600 then raise exception 'invalid_items' using errcode = '22023'; end if;
    update public.gallery_items g set
      pos = least(greatest(coalesce((i->>'pos')::integer, g.pos), 0), 100000),
      scale = greatest(0.4, least(1.6, coalesce((i->>'scale')::real, g.scale)))
    from jsonb_array_elements(p_items) i
    where g.id = (i->>'id')::uuid and g.class_id = p_class;
    get diagnostics v_n = row_count;
  end if;
  return v_n;
end;
$$;
revoke all on function public.gallery_arrange(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.gallery_arrange(uuid, jsonb, jsonb) to authenticated;

-- Giáo viên sửa thông tin: tên, lời nhận xét, gắn em khác / cả lớp, chuyển sang tường khác
create or replace function public.gallery_edit(p_id uuid, p_title text, p_note text, p_student uuid, p_class_wide boolean, p_kind text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_class uuid;
begin
  select g.class_id into v_class from public.gallery_items g where g.id = p_id;
  if v_class is null or not public.teaches_class(v_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_kind is not null and p_kind not in ('praise', 'art', 'writing') then raise exception 'invalid_kind' using errcode = '22023'; end if;
  if p_student is not null and not exists (select 1 from public.class_memberships cm where cm.class_id = v_class and cm.student_id = p_student) then
    raise exception 'not_in_class' using errcode = '22023';
  end if;
  update public.gallery_items g set
    title = coalesce(left(trim(p_title), 120), g.title),
    note = coalesce(left(trim(p_note), 300), g.note),
    student_id = case when coalesce(p_class_wide, false) then null else coalesce(p_student, g.student_id) end,
    kind = coalesce(p_kind, g.kind),
    pos = case when p_kind is not null and p_kind <> g.kind then null else g.pos end
  where g.id = p_id;
end;
$$;
revoke all on function public.gallery_edit(uuid, text, text, uuid, boolean, text) from public, anon;
grant execute on function public.gallery_edit(uuid, text, text, uuid, boolean, text) to authenticated;
