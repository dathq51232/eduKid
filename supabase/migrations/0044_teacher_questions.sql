-- "Ngân hàng của tôi": câu hỏi giáo viên nạp từ tài liệu (Word, Excel, PDF) hoặc sinh bằng AI (API key của chính thầy cô),
-- đã được cô xem lại trước khi lưu. Dùng chung với ngân hàng câu của app khi ra đề theo ma trận / phiếu bài tập.
-- Chỉ chủ sở hữu thấy và sửa câu của mình. Tối đa 3000 câu mỗi giáo viên.

create table if not exists public.teacher_questions (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject text not null check (subject in ('toan', 'tieng-viet', 'tieng-anh')),
  grade smallint not null check (grade between 1 and 5),
  lesson_id text check (char_length(lesson_id) <= 80),
  lesson_title text not null default '' check (char_length(lesson_title) <= 200),
  muc smallint not null default 2 check (muc between 1 and 3),
  type text not null check (type in ('single_choice', 'multiple_choice', 'true_false', 'fill_blank')),
  prompt text not null check (char_length(prompt) between 1 and 2000),
  options text[] not null default '{}' check (cardinality(options) <= 8),
  answer jsonb not null default '{}'::jsonb check (pg_column_size(answer) <= 4000),
  explanation text not null default '' check (char_length(explanation) <= 2000),
  source text not null default '' check (char_length(source) <= 160),
  created_at timestamptz not null default now()
);
create index if not exists teacher_questions_owner_idx on public.teacher_questions (owner, subject, grade, lesson_id);
alter table public.teacher_questions enable row level security;
revoke all on public.teacher_questions from anon;
grant select, insert, update, delete on public.teacher_questions to authenticated;

drop policy if exists teacher_questions_select on public.teacher_questions;
create policy teacher_questions_select on public.teacher_questions for select to authenticated using (owner = auth.uid());
drop policy if exists teacher_questions_insert on public.teacher_questions;
create policy teacher_questions_insert on public.teacher_questions for insert to authenticated
  with check (owner = auth.uid() and exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role in ('teacher', 'system_admin')));
drop policy if exists teacher_questions_update on public.teacher_questions;
create policy teacher_questions_update on public.teacher_questions for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists teacher_questions_delete on public.teacher_questions;
create policy teacher_questions_delete on public.teacher_questions for delete to authenticated using (owner = auth.uid());

create or replace function public.teacher_questions_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.teacher_questions where owner = new.owner) >= 3000 then
    raise exception 'too_many' using errcode = '22023';
  end if;
  return new;
end;
$$;
drop trigger if exists teacher_questions_limit on public.teacher_questions;
create trigger teacher_questions_limit before insert on public.teacher_questions for each row execute function public.teacher_questions_limit();
revoke all on function public.teacher_questions_limit() from public, anon, authenticated;
