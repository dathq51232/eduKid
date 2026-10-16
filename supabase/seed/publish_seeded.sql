-- XUẤT BẢN HÀNG LOẠT các bài đã nạp bằng file seed (content_gradeN_hkK.sql) của MỘT lớp.
-- Dùng khi không muốn bấm "Xuất bản" từng bài ở /quan-tri/bai-hoc. Chạy trong SQL Editor của Supabase.
-- Đổi số lớp ở dòng "v_grade" rồi chạy. Chạy lại nhiều lần không sao (bài đã xuất bản được bỏ qua).
-- Kiểm tra giống hàm publish_lesson: bài phải có câu hỏi, mọi câu phải có đáp án đúng định dạng — bài nào không đạt thì để nguyên.
do $$
declare
  v_grade smallint := 2;   -- ← đổi thành 2, 3, 4 hoặc 5
  v_admin uuid;
  v_ids uuid[];
begin
  select user_id into v_admin from public.user_roles where role = 'system_admin' order by created_at limit 1;
  if v_admin is null then raise exception 'Cần có ít nhất 1 tài khoản system_admin'; end if;

  select array_agg(l.id) into v_ids
  from public.lessons l
  join public.subjects s on s.id = l.subject_id
  where s.grade = v_grade
    and l.content ? 'seed_id'
    and l.status in ('draft', 'review')
    and exists (select 1 from public.questions q where q.lesson_id = l.id and q.status <> 'archived')
    and not exists (
      select 1 from public.questions q
      left join public.question_keys k on k.question_id = q.id
      where q.lesson_id = l.id and q.status <> 'archived'
        and (k.question_id is null or not public.answer_key_is_valid(q.question_type, k.answer_key))
    );

  if v_ids is null then raise notice 'Không có bài nào cần xuất bản cho lớp %', v_grade; return; end if;

  update public.lessons set status = 'published', reviewed_by = v_admin, published_at = now() where id = any (v_ids);
  update public.questions set status = 'published' where lesson_id = any (v_ids) and status <> 'archived';
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  select v_admin, 'publish_lesson', 'lesson', id::text, 'publish_seeded lớp ' || v_grade from unnest(v_ids) as id;
  raise notice 'Đã xuất bản % bài của lớp %', array_length(v_ids, 1), v_grade;
end $$;

-- Xem kết quả theo môn – lớp
select s.code as mon, l.status as trang_thai, count(*) as so_bai
from public.lessons l join public.subjects s on s.id = l.subject_id
where l.content ? 'seed_id'
group by 1, 2 order by 1, 2;
