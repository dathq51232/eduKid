-- EduChain Kids 0029: LINK NHÓM ZALO CỦA LỚP — giáo viên lưu link nhóm (https://zalo.me/g/...) để bấm "Chép & mở nhóm Zalo"
-- trong Sổ lớp và in mã QR mời phụ huynh vào nhóm. CHỈ THÊM MỚI, chạy lại an toàn (cần 0028).
-- Lưu trong class_tool_state với tool = 'zalo', data = {"url": "..."}; chỉ giáo viên của lớp đọc/ghi.

alter table public.class_tool_state drop constraint if exists class_tool_state_tool_check;
alter table public.class_tool_state add constraint class_tool_state_tool_check check (tool in ('groups', 'seating', 'teams', 'zalo'));

create or replace function public.teacher_tool_save(p_class uuid, p_tool text, p_data jsonb)
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare v_now timestamptz := now();
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_tool not in ('groups', 'seating', 'teams', 'zalo') then raise exception 'invalid_tool' using errcode = '22023'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 65536 then
    raise exception 'invalid_data' using errcode = '22023';
  end if;
  -- chỉ nhận link nhóm Zalo thật (zalo.me/g/...), để trống = xóa link
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
