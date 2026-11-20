-- EduChain Kids 0070: KIẾN THỨC CẦN NHỚ + CẤP CƠ BẢN / NÂNG CAO cho bài soạn ở trang Quản trị.
-- CHỈ THÊM MỚI, chạy lại an toàn. Quy tắc: docs/QUY-TAC-CAP-NHAT-KIEN-THUC.md
--  * lessons.level: 'co_ban' (theo sách, mức L1–L3) hoặc 'nang_cao' (chuyên đề, L4–L5).
--  * lessons.prerequisite_lesson_id: bài nâng cao ghi bài cơ bản cần học trước.
--  * lesson_knowledge: "Kiến thức cần nhớ" của bài (2–4 ý ngắn + ví dụ + ghi chú), cùng dạng với src/lib/content/knowledge.ts.
--    checked_at: thời điểm máy kiểm tra đạt (src/lib/content/rules.ts) — bài chưa đạt không chuyển sang Chờ duyệt.
--  Học sinh đọc kiến thức khi bài đã xuất bản; người soạn bài / admin đọc và sửa (can_edit_lesson, migration 0002).

alter table public.lessons add column if not exists level text not null default 'co_ban';
do $$ begin
  alter table public.lessons add constraint lessons_level_check check (level in ('co_ban', 'nang_cao'));
exception when duplicate_object then null; end $$;
alter table public.lessons add column if not exists prerequisite_lesson_id uuid references public.lessons(id) on delete set null;
do $$ begin
  alter table public.lessons add constraint lessons_prereq_not_self check (prerequisite_lesson_id is null or prerequisite_lesson_id <> id);
exception when duplicate_object then null; end $$;

create table if not exists public.lesson_knowledge (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  points text[] not null check (cardinality(points) between 1 and 6),
  example text not null default '' check (char_length(example) <= 600),
  note text not null default '' check (char_length(note) <= 600),
  checked_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now()
);
alter table public.lesson_knowledge enable row level security;

drop policy if exists lesson_knowledge_select on public.lesson_knowledge;
create policy lesson_knowledge_select on public.lesson_knowledge for select to authenticated using (
  exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
  or public.can_edit_lesson(lesson_id)
);
drop policy if exists lesson_knowledge_write on public.lesson_knowledge;
create policy lesson_knowledge_write on public.lesson_knowledge for all to authenticated
  using (public.can_edit_lesson(lesson_id)) with check (public.can_edit_lesson(lesson_id));
revoke all on public.lesson_knowledge from anon;
grant select, insert, update, delete on public.lesson_knowledge to authenticated;
