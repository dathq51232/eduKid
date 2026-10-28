-- 0041 · Giáo viên xoá tin nhắn phụ huynh đã xử lý xong khỏi hộp thư của lớp.
-- Chỉ ẩn ở phía giáo viên (cột teacher_deleted_at): gia đình vẫn xem lại được tin mình đã gửi và lời trả lời của cô.
-- Cần chạy sau 0037. CHỈ THÊM MỚI, chạy lại an toàn.

alter table public.parent_messages add column if not exists teacher_deleted_at timestamptz;
create index if not exists parent_messages_class_live_idx on public.parent_messages (class_id, created_at desc) where teacher_deleted_at is null;

-- Hộp thư của lớp (như 0037) — bỏ các tin cô đã xoá
create or replace function public.teacher_messages(p_class uuid, p_limit integer default 50)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return jsonb_build_object(
    'unread', (select count(*) from public.parent_messages m where m.class_id = p_class and m.status = 'new' and m.teacher_deleted_at is null),
    'pending_leave', (select count(*) from public.parent_messages m where m.class_id = p_class and m.kind = 'leave' and m.status in ('new', 'read') and m.teacher_deleted_at is null),
    'items', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select m.id, m.student_id, s.display_name as student_name, m.sender_name, m.sender_relation, m.kind, m.leave_from, m.leave_to,
             m.body, m.status, m.reply, m.replied_at, m.created_at
      from public.parent_messages m join public.students s on s.id = m.student_id
      where m.class_id = p_class and m.teacher_deleted_at is null
      order by (m.status = 'new') desc, m.created_at desc
      limit least(greatest(coalesce(p_limit, 50), 1), 200)
    ) x), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.teacher_messages(uuid, integer) from public, anon;
grant execute on function public.teacher_messages(uuid, integer) to authenticated;

-- Xoá (ẩn) các tin của lớp mình dạy; trả về số tin đã xoá. Tin của lớp khác bị bỏ qua.
create or replace function public.teacher_message_delete(p_class uuid, p_ids uuid[])
returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_n integer;
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_ids is null or cardinality(p_ids) = 0 then return 0; end if;
  if cardinality(p_ids) > 500 then raise exception 'too_many' using errcode = '22023'; end if;
  update public.parent_messages m set teacher_deleted_at = now()
  where m.class_id = p_class and m.id = any(p_ids) and m.teacher_deleted_at is null;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke all on function public.teacher_message_delete(uuid, uuid[]) from public, anon;
grant execute on function public.teacher_message_delete(uuid, uuid[]) to authenticated;
