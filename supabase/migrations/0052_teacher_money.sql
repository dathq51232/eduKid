-- EduChain Kids 0052: TIỆN ÍCH GIÁO VIÊN — sổ thu chi cá nhân và quỹ lớp.
-- CHỈ THÊM MỚI, chạy lại an toàn (cần 0001 teaches_class, 0028 student_in_class).
--
-- * teacher_money: thu chi CÁ NHÂN của giáo viên — chỉ chính người đó đọc/ghi (RLS theo auth.uid()).
-- * class_fund_entries: sổ quỹ lớp (thu khác / chi), giáo viên của lớp đọc/ghi.
-- * class_fund_collections + class_fund_payments: các khoản thu theo đầu em (vd "Quỹ lớp HK1 · 50.000đ/em")
--   và em nào đã nộp bao nhiêu, ngày nào.

create table if not exists public.teacher_money (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null default current_date,
  kind text not null check (kind in ('thu', 'chi')),
  amount bigint not null check (amount > 0 and amount <= 10000000000),
  category text not null default '' check (char_length(category) <= 40),
  note text not null default '' check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists teacher_money_owner_day on public.teacher_money (owner, day desc);
alter table public.teacher_money enable row level security;
drop policy if exists teacher_money_own on public.teacher_money;
create policy teacher_money_own on public.teacher_money for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.teacher_money from anon;
grant select, insert, update, delete on public.teacher_money to authenticated;

create table if not exists public.class_fund_entries (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  day date not null default current_date,
  kind text not null check (kind in ('thu', 'chi')),
  amount bigint not null check (amount > 0 and amount <= 10000000000),
  content text not null check (char_length(content) between 1 and 120),
  note text not null default '' check (char_length(note) <= 200),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists class_fund_entries_class_day on public.class_fund_entries (class_id, day desc);
alter table public.class_fund_entries enable row level security;
drop policy if exists class_fund_entries_teacher on public.class_fund_entries;
create policy class_fund_entries_teacher on public.class_fund_entries for all to authenticated
  using (public.teaches_class(class_id)) with check (public.teaches_class(class_id));
revoke all on public.class_fund_entries from anon;
grant select, insert, update, delete on public.class_fund_entries to authenticated;

create table if not exists public.class_fund_collections (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  amount_per bigint not null check (amount_per > 0 and amount_per <= 100000000),
  due_on date,
  created_at timestamptz not null default now()
);
create index if not exists class_fund_collections_class on public.class_fund_collections (class_id, created_at desc);
alter table public.class_fund_collections enable row level security;
drop policy if exists class_fund_collections_teacher on public.class_fund_collections;
create policy class_fund_collections_teacher on public.class_fund_collections for all to authenticated
  using (public.teaches_class(class_id)) with check (public.teaches_class(class_id));
revoke all on public.class_fund_collections from anon;
grant select, insert, update, delete on public.class_fund_collections to authenticated;

create table if not exists public.class_fund_payments (
  collection_id uuid not null references public.class_fund_collections(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  amount bigint not null check (amount >= 0 and amount <= 100000000),
  paid_on date not null default current_date,
  updated_at timestamptz not null default now(),
  primary key (collection_id, student_id)
);
alter table public.class_fund_payments enable row level security;
drop policy if exists class_fund_payments_teacher on public.class_fund_payments;
create policy class_fund_payments_teacher on public.class_fund_payments for all to authenticated
  using (exists (select 1 from public.class_fund_collections c where c.id = collection_id and public.teaches_class(c.class_id)))
  with check (exists (select 1 from public.class_fund_collections c where c.id = collection_id and public.teaches_class(c.class_id)));
revoke all on public.class_fund_payments from anon;
grant select, insert, update, delete on public.class_fund_payments to authenticated;
