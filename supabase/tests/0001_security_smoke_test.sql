-- Manual smoke-test checklist for Supabase SQL Editor after applying migration.
-- Do NOT run the example inserts against production. Create two test users and two schools.
-- Expected outcomes are documented here; automate with pgTAP in a later test-focused migration.

-- 1) Confirm RLS is enabled for every foundation table:
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles','schools','user_roles','classes','class_teachers','students',
    'class_memberships','parent_student_links','subjects','lessons','questions',
    'consent_records','certificates','audit_logs'
  )
order by tablename;
-- EXPECT: rowsecurity = true for all listed tables.

-- 2) Confirm policies exist:
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
-- EXPECT: each table above has only explicitly intended policies.

-- 3) Negative authorization tests to perform using two separately authenticated test accounts:
-- A. Parent A must not SELECT student B unless an active verified parent_student_links row exists.
-- B. Teacher A must not SELECT class membership or student data for a class not assigned to them.
-- C. School Admin A must not INSERT/UPDATE classes for School B.
-- D. Normal authenticated users must not SELECT another user's profile.
-- E. Student-facing clients must not SELECT public.questions directly because answer_key is in that row.
-- F. Anonymous users must not SELECT private student or certificate rows.
-- G. Parent cannot set parent_student_links.status='active' or verified_at by direct INSERT.
-- H. Non-admin users cannot grant themselves system_admin role.

-- IMPORTANT: a successful SQL policy listing is not proof that RLS is correct.
-- Run end-to-end tests with real JWT contexts before using real child data.
