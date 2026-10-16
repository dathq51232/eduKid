-- EduChain Kids foundation schema.
-- Apply only to a new Supabase project or after reviewing against existing schema.
-- No child names, scores, or other personal data should be written to a public blockchain.

create extension if not exists pgcrypto;

create type public.app_role as enum ('parent', 'teacher', 'school_admin', 'system_admin');
create type public.record_status as enum ('active', 'inactive', 'pending', 'revoked');
create type public.lesson_status as enum ('draft', 'review', 'published', 'archived');
create type public.consent_status as enum ('pending', 'granted', 'withdrawn', 'denied');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create a minimal profile for each newly registered Auth user.
-- The display name is treated as untrusted input and constrained by the table check.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 100), ''), 'Người dùng')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 180),
  status public.record_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  school_id uuid references public.schools(id) on delete cascade,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint user_roles_school_scope check (
    (role in ('parent', 'system_admin') and school_id is null)
    or (role in ('teacher', 'school_admin') and school_id is not null)
  ),
  constraint user_roles_unique unique (user_id, role, school_id)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  grade smallint not null check (grade between 1 and 5),
  status public.record_status not null default 'active',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint classes_school_name_unique unique (school_id, name)
);

create table public.class_teachers (
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (class_id, teacher_id)
);

-- Child records do not have independent login credentials in the initial release.
create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 100),
  grade smallint not null check (grade between 1 and 5),
  status public.record_status not null default 'active',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.class_memberships (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status public.record_status not null default 'active',
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

create table public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status public.record_status not null default 'pending',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint parent_student_links_unique unique (parent_id, student_id)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  grade smallint not null check (grade between 1 and 5),
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 180),
  content jsonb not null default '{}'::jsonb,
  status public.lesson_status not null default 'draft',
  created_by uuid not null references public.profiles(id) on delete restrict,
  reviewed_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Question answer keys are isolated from the student-facing read policy.
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  question_type text not null check (question_type in ('single_choice', 'multiple_choice', 'true_false')),
  prompt jsonb not null,
  options jsonb not null default '[]'::jsonb,
  answer_key jsonb not null,
  explanation jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  status public.lesson_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  subject_student_id uuid not null references public.students(id) on delete cascade,
  guardian_id uuid not null references public.profiles(id) on delete restrict,
  purpose text not null check (char_length(purpose) between 2 and 120),
  policy_version text not null,
  status public.consent_status not null default 'pending',
  recorded_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique default encode(gen_random_bytes(18), 'hex'),
  student_id uuid not null references public.students(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 180),
  achievement_code text not null,
  status public.record_status not null default 'active',
  content_hash text,
  issued_by uuid not null references public.profiles(id) on delete restrict,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  revocation_reason text
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) between 1 and 100),
  target_type text not null check (char_length(target_type) between 1 and 100),
  target_id text,
  reason text,
  created_at timestamptz not null default now()
);

create index user_roles_user_id_idx on public.user_roles(user_id);
create index user_roles_school_id_idx on public.user_roles(school_id);
create index classes_school_id_idx on public.classes(school_id);
create index class_teachers_teacher_id_idx on public.class_teachers(teacher_id);
create index students_school_id_idx on public.students(school_id);
create index parent_student_links_parent_idx on public.parent_student_links(parent_id, status);
create index parent_student_links_student_idx on public.parent_student_links(student_id, status);
create index lessons_subject_status_idx on public.lessons(subject_id, status);
create index questions_lesson_status_idx on public.questions(lesson_id, status);
create index certificates_student_id_idx on public.certificates(student_id);
create index certificates_public_code_idx on public.certificates(public_code);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);

-- Helper functions use a fixed search_path and do not expose privileged table access to clients.
create or replace function public.has_role(required_role public.app_role, target_school uuid default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = required_role
      and (target_school is null or ur.school_id = target_school)
  );
$$;

create or replace function public.is_school_member(target_school uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.school_id = target_school
      and ur.role in ('teacher', 'school_admin')
  ) or public.has_role('system_admin', null);
$$;

create or replace function public.is_parent_of(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.parent_student_links psl
    where psl.parent_id = (select auth.uid())
      and psl.student_id = target_student
      and psl.status = 'active'
      and psl.verified_at is not null
  );
$$;

create or replace function public.teaches_class(target_class uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.class_teachers ct
    where ct.class_id = target_class and ct.teacher_id = (select auth.uid())
  ) or exists (
    select 1 from public.classes c
    where c.id = target_class and public.has_role('school_admin', c.school_id)
  ) or public.has_role('system_admin', null);
$$;

revoke all on function public.has_role(public.app_role, uuid) from public;
revoke all on function public.is_school_member(uuid) from public;
revoke all on function public.is_parent_of(uuid) from public;
revoke all on function public.teaches_class(uuid) from public;
grant execute on function public.has_role(public.app_role, uuid) to authenticated;
grant execute on function public.is_school_member(uuid) to authenticated;
grant execute on function public.is_parent_of(uuid) to authenticated;
grant execute on function public.teaches_class(uuid) to authenticated;

-- Enable RLS on every table in this migration.
alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.user_roles enable row level security;
alter table public.classes enable row level security;
alter table public.class_teachers enable row level security;
alter table public.students enable row level security;
alter table public.class_memberships enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.subjects enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.consent_records enable row level security;
alter table public.certificates enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: own profile only; system admin can support accounts when authorized.
create policy profiles_select_self_or_admin on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.has_role('system_admin', null));
create policy profiles_update_self on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_insert_self on public.profiles for insert to authenticated
with check (id = (select auth.uid()));

-- Schools: members can read their school; system admins can read all.
create policy schools_select_member on public.schools for select to authenticated
using (public.is_school_member(id) or public.has_role('system_admin', null));
create policy schools_insert_admin on public.schools for insert to authenticated
with check (public.has_role('system_admin', null));
create policy schools_update_admin on public.schools for update to authenticated
using (public.has_role('system_admin', null)) with check (public.has_role('system_admin', null));

-- Roles: users can see their own roles; only system admins can grant/revoke roles.
create policy user_roles_select_self_or_admin on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or public.has_role('system_admin', null));
create policy user_roles_admin_insert on public.user_roles for insert to authenticated
with check (public.has_role('system_admin', null));
create policy user_roles_admin_update on public.user_roles for update to authenticated
using (public.has_role('system_admin', null)) with check (public.has_role('system_admin', null));
create policy user_roles_admin_delete on public.user_roles for delete to authenticated
using (public.has_role('system_admin', null));

-- Classes: only school members in scope; teachers need explicit class assignment for mutations.
create policy classes_select_scope on public.classes for select to authenticated
using (public.is_school_member(school_id) or public.has_role('system_admin', null));
create policy classes_insert_school_admin on public.classes for insert to authenticated
with check (public.has_role('school_admin', school_id) or public.has_role('system_admin', null));
create policy classes_update_school_admin on public.classes for update to authenticated
using (public.has_role('school_admin', school_id) or public.has_role('system_admin', null))
with check (public.has_role('school_admin', school_id) or public.has_role('system_admin', null));
create policy classes_delete_school_admin on public.classes for delete to authenticated
using (public.has_role('school_admin', school_id) or public.has_role('system_admin', null));

create policy class_teachers_select_scope on public.class_teachers for select to authenticated
using (public.teaches_class(class_id));
create policy class_teachers_admin_insert on public.class_teachers for insert to authenticated
with check (exists (select 1 from public.classes c where c.id = class_id and (public.has_role('school_admin', c.school_id) or public.has_role('system_admin', null))));
create policy class_teachers_admin_delete on public.class_teachers for delete to authenticated
using (exists (select 1 from public.classes c where c.id = class_id and (public.has_role('school_admin', c.school_id) or public.has_role('system_admin', null))));

-- Students: parent sees linked child; teacher sees students enrolled in classes they teach; school admin sees school scope.
create policy students_select_parent_or_school on public.students for select to authenticated
using (
  public.is_parent_of(id)
  or exists (select 1 from public.class_memberships cm where cm.student_id = id and public.teaches_class(cm.class_id))
  or (school_id is not null and public.is_school_member(school_id))
  or public.has_role('system_admin', null)
);
create policy students_insert_guardian_or_school_admin on public.students for insert to authenticated
with check (
  created_by = (select auth.uid()) and (
    public.has_role('parent', null)
    or (school_id is not null and public.has_role('school_admin', school_id))
    or public.has_role('system_admin', null)
  )
);
create policy students_update_parent_or_school_admin on public.students for update to authenticated
using (
  public.is_parent_of(id)
  or (school_id is not null and public.has_role('school_admin', school_id))
  or public.has_role('system_admin', null)
)
with check (
  public.is_parent_of(id)
  or (school_id is not null and public.has_role('school_admin', school_id))
  or public.has_role('system_admin', null)
);

create policy class_memberships_select_scope on public.class_memberships for select to authenticated
using (public.teaches_class(class_id) or public.is_parent_of(student_id) or public.has_role('system_admin', null));
create policy class_memberships_admin_insert on public.class_memberships for insert to authenticated
with check (public.teaches_class(class_id) and exists (select 1 from public.classes c where c.id = class_id and (public.has_role('school_admin', c.school_id) or public.has_role('system_admin', null))));
create policy class_memberships_admin_delete on public.class_memberships for delete to authenticated
using (exists (select 1 from public.classes c where c.id = class_id and (public.has_role('school_admin', c.school_id) or public.has_role('system_admin', null))));

-- Parent-child links: parents can read their own links; creating/verifying links must use a trusted server-side flow.
create policy parent_links_select_own on public.parent_student_links for select to authenticated
using (parent_id = (select auth.uid()) or public.has_role('system_admin', null));
create policy parent_links_insert_own_pending on public.parent_student_links for insert to authenticated
with check (parent_id = (select auth.uid()) and status = 'pending' and verified_at is null and public.has_role('parent', null));
create policy parent_links_update_admin_only on public.parent_student_links for update to authenticated
using (public.has_role('system_admin', null)) with check (public.has_role('system_admin', null));
create policy parent_links_delete_own_pending on public.parent_student_links for delete to authenticated
using (parent_id = (select auth.uid()) and status = 'pending' and verified_at is null);

-- Subjects: signed-in users can read catalog entries.
create policy subjects_select_authenticated on public.subjects for select to authenticated using (true);
create policy subjects_admin_manage on public.subjects for all to authenticated
using (public.has_role('system_admin', null)) with check (public.has_role('system_admin', null));

-- Lessons: published lessons are readable by authenticated users; drafts are limited to author/reviewer/admin.
create policy lessons_select_published_or_editor on public.lessons for select to authenticated
using (
  status = 'published'
  or created_by = (select auth.uid())
  or reviewed_by = (select auth.uid())
  or public.has_role('system_admin', null)
);
create policy lessons_insert_teacher_or_admin on public.lessons for insert to authenticated
with check (created_by = (select auth.uid()) and (public.has_role('teacher', null) or public.has_role('system_admin', null)));
create policy lessons_update_author_or_admin on public.lessons for update to authenticated
using (created_by = (select auth.uid()) or public.has_role('system_admin', null))
with check (created_by = (select auth.uid()) or public.has_role('system_admin', null));

-- Questions: only published question prompts/options are readable by normal authenticated users.
-- NOTE: answer_key is in the same row; do not expose this table to the student client directly.
-- A later migration must split public question content and private answer keys before student quiz UI is built.
create policy questions_select_editor_only on public.questions for select to authenticated
using (
  exists (select 1 from public.lessons l where l.id = lesson_id and (
    l.created_by = (select auth.uid()) or l.reviewed_by = (select auth.uid())
    or public.has_role('system_admin', null)
  ))
);
create policy questions_insert_editor on public.questions for insert to authenticated
with check (exists (select 1 from public.lessons l where l.id = lesson_id and (l.created_by = (select auth.uid()) or public.has_role('system_admin', null))));
create policy questions_update_editor on public.questions for update to authenticated
using (exists (select 1 from public.lessons l where l.id = lesson_id and (l.created_by = (select auth.uid()) or public.has_role('system_admin', null))))
with check (exists (select 1 from public.lessons l where l.id = lesson_id and (l.created_by = (select auth.uid()) or public.has_role('system_admin', null))));

-- Consent records: guardian sees own records; system admin can process requests.
create policy consent_select_guardian_or_admin on public.consent_records for select to authenticated
using (guardian_id = (select auth.uid()) or public.has_role('system_admin', null));
create policy consent_insert_guardian_pending on public.consent_records for insert to authenticated
with check (guardian_id = (select auth.uid()) and status = 'pending' and public.has_role('parent', null));
create policy consent_update_admin on public.consent_records for update to authenticated
using (public.has_role('system_admin', null)) with check (public.has_role('system_admin', null));

-- Certificates: guardian and authorized teachers can view scoped certificates; public verification uses a server route later.
create policy certificates_select_scoped on public.certificates for select to authenticated
using (
  public.is_parent_of(student_id)
  or exists (select 1 from public.class_memberships cm where cm.student_id = certificates.student_id and public.teaches_class(cm.class_id))
  or exists (select 1 from public.students s where s.id = certificates.student_id and public.has_role('school_admin', s.school_id))
  or public.has_role('system_admin', null)
);
create policy certificates_insert_authorized on public.certificates for insert to authenticated
with check (
  issued_by = (select auth.uid()) and (
    public.has_role('system_admin', null)
    or exists (
      select 1
      from public.students s
      where s.id = student_id
        and (
          public.has_role('school_admin', s.school_id)
          or exists (
            select 1
            from public.class_memberships cm
            join public.classes c on c.id = cm.class_id
            join public.class_teachers ct on ct.class_id = c.id
            where cm.student_id = s.id and ct.teacher_id = (select auth.uid())
          )
        )
    )
  )
);
create policy certificates_update_admin on public.certificates for update to authenticated
using (public.has_role('system_admin', null))
with check (public.has_role('system_admin', null));

-- Audit logs are append-only from normal application roles; system admins can read.
create policy audit_logs_select_admin on public.audit_logs for select to authenticated
using (public.has_role('system_admin', null));
create policy audit_logs_insert_authenticated_actor on public.audit_logs for insert to authenticated
with check (actor_id = (select auth.uid()));

-- Updated-at helper.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger lessons_set_updated_at before update on public.lessons
for each row execute function public.set_updated_at();
