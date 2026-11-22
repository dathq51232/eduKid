-- EduChain Kids 0078: TỔNG HỢP TIẾN ĐỘ THEO BÀI TRONG DATABASE. Chạy lại an toàn, chỉ thêm hàm.
-- Trước đây trang lớp tải tới 5.000 dòng lesson_results về máy chủ web rồi mới gom theo bài (và nhúng cả 5.000 dòng
-- vào HTML cho nút CSV). Hàm này trả mỗi bài một dòng — cùng cách tính với lessonsOfClass (src/lib/classroom/progress.ts):
--   students  = số em đã làm; attempts = số lượt; avg_best = trung bình % lần tốt nhất của từng em (làm tròn);
--   low_students = các em có lần tốt nhất < 50%; last = lần làm gần nhất.
-- Chỉ giáo viên của lớp gọi được; chỉ tính các em đang học lớp (membership active).

create or replace function public.teacher_class_lesson_stats(p_class uuid)
returns table (
  lesson_code text, title text, subject text, students int, attempts int,
  avg_best int, low_students uuid[], last timestamptz
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query
  with r as (
    select lr.student_id, lr.lesson_code, lr.lesson_title, lr.subject_code, lr.created_at,
           case when lr.total > 0 then round(lr.score * 100.0 / lr.total)::int else 0 end as pct
    from public.lesson_results lr
    join public.class_memberships m on m.student_id = lr.student_id and m.class_id = p_class and m.status = 'active'
  ),
  best as (
    select r.lesson_code, r.student_id, max(r.pct) as best, count(*)::int as n, max(r.created_at) as last_at
    from r group by r.lesson_code, r.student_id
  ),
  meta as (
    select distinct on (r.lesson_code) r.lesson_code, r.lesson_title, r.subject_code
    from r order by r.lesson_code, (r.lesson_title is null), r.created_at desc
  )
  select b.lesson_code,
         coalesce(mt.lesson_title, b.lesson_code),
         mt.subject_code,
         count(*)::int,
         sum(b.n)::int,
         round(avg(b.best))::int,
         coalesce(array_agg(b.student_id) filter (where b.best < 50), '{}'),
         max(b.last_at)
  from best b join meta mt on mt.lesson_code = b.lesson_code
  group by b.lesson_code, mt.lesson_title, mt.subject_code
  order by max(b.last_at) desc;
end;
$$;
revoke all on function public.teacher_class_lesson_stats(uuid) from public, anon;
grant execute on function public.teacher_class_lesson_stats(uuid) to authenticated;
