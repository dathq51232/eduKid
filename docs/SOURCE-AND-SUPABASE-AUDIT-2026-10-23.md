# EduChain Kids — Source & Supabase/RLS Audit (static review)

**Review date:** 2026-10-23  
**Repository reviewed:** https://github.com/dathq51232/eduKid  
**Reference branch:** `main`  
**Review type:** Read-only source review through GitHub; no production code or database was changed.  
**Important limitation:** This is not a full security audit, not a live Supabase inspection, and not an end-to-end test of the deployed website.

## 1. Executive summary

The repository has a meaningful security foundation: Supabase SSR clients, a server-only service-role client, role checks sourced from the database, SQL migrations with RLS, separate answer-key storage, server-side grading paths, student PIN attempt locking, and local SQL test scenarios.

The largest unresolved risks are **verification gaps**, not proof that the live system is vulnerable:
1. The actual Supabase project schema, migration state, RLS policies, grants, environment variables, and Auth settings have not been inspected.
2. The repository's general learner data layer still uses demo lessons/questions, and the server grading module imports demo question data. This must be reconciled with the intended production learning-content source before treating student scores as production-grade.
3. Some privileged API routes rely on service-role access and therefore need a route-by-route authorization review plus real JWT-based negative tests.
4. The PIN design intentionally stores a six-digit PIN in `public.student_pins` so authorized teachers can view it. This is a high-impact privacy design decision to revisit before using real children, even though direct browser table access is revoked and teacher reads are audited.
5. The security smoke-test SQL is a manual checklist; the repository also has a substantial local PostgreSQL test suite, but local shim tests do not prove behavior on the actual Supabase project.

No exploit was demonstrated during this review. No production system was accessed or changed.

## 2. What was verified from source

| Status | Finding | Evidence |
|---|---|---|
| Verified in inspected code | Next.js App Router + TypeScript + Supabase SSR is used. | `package.json`, `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts` |
| Verified in inspected code | Admin client is marked `server-only`; uses `SUPABASE_SERVICE_ROLE_KEY` without a `NEXT_PUBLIC_` prefix. | `src/lib/supabase/admin.ts` |
| Verified in inspected code | `getViewer()` calls `supabase.auth.getUser()` and reads role records from the database rather than trusting a role sent by the browser. | `src/lib/auth/viewer.ts` |
| Verified in inspected code | Session middleware refreshes Supabase cookies when a session cookie is present and gates configured learning routes. | `src/middleware.ts`, `src/lib/supabase/middleware.ts` |
| Verified in inspected code | The generic learner data layer currently reads `DEMO_LESSONS` / `DEMO_QUESTIONS`. | `src/lib/data.ts` |
| Verified in inspected code | Server-side lesson grading also imports `DEMO_QUESTIONS` and reconstructs answer grading from that data. | `src/lib/progress-server/grade.ts` |
| Verified in inspected code | Student PIN login checks class code + membership, uses a server-side HMAC-derived password, and calls a database attempt counter when migration 0027 is available. | `src/app/api/hoc-sinh/dang-nhap/route.ts`, `src/lib/auth/student-credentials.ts`, migration `0027_pin_attempt_atomic.sql` |
| Verified in inspected code | The code has an explicit rate limiter implemented in process memory. | `src/lib/rate-limit.ts` |
| Verified in inspected SQL | Foundation tables have RLS enabled; policies/functions exist for profiles, roles, classes, students, lessons, questions, attempts, and related records. | `supabase/migrations/0001_platform_foundation.sql`, `0002_quiz_security_and_onboarding.sql`, later migrations |
| Verified in inspected SQL | Question answer keys are separated into `question_keys` and access is intended for lesson editors/admins. | `supabase/migrations/0002_quiz_security_and_onboarding.sql` |
| Verified in inspected SQL | `student_pins` has RLS enabled and table grants revoked from `anon` and `authenticated`; teachers can call a security-definer function that returns PINs for their authorized class and logs the access. | `supabase/migrations/0009_teacher_view_pin.sql` |
| Verified in repository | There are 29 SQL migration files (0001–0029) and local SQL scenarios for happy paths, negative authorization, classroom RBAC, and PIN attempt locking. | `supabase/migrations/`, `supabase/tests/local/` |
| Verified in repository | `supabase/tests/0001_security_smoke_test.sql` explicitly describes itself as a manual checklist and says to run negative tests with separately authenticated test accounts. | `supabase/tests/0001_security_smoke_test.sql` |
| Not verified | The current production Supabase project has all 29 migrations applied in the documented order. | No access to live schema/migration history during this review. |
| Not verified | Actual live RLS policies, table grants, storage policies, Auth redirect settings, rate limits, backups, and secret values are correct. | No live Supabase dashboard/configuration inspection. |
| Not verified | Deployed routes have been tested against anonymous, parent, student, teacher, school-admin, and system-admin JWTs. | No end-to-end tests were run. |
| Not verified | `npm run typecheck`, `npm run lint`, `npm run build`, or the SQL tests pass on the current checkout. | No local checkout/test execution in this review. |
| Not verified | A GitHub Actions CI workflow exists on `main`. | The expected `.github/workflows` directory was not found at the inspected URL; confirm in repository settings/tree before concluding CI is absent. |

## 3. Critical paths to understand

### Authentication and role resolution
- `src/middleware.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/client.ts`
- `src/lib/auth/viewer.ts`
- `src/lib/auth/gate.ts`
- `src/lib/auth/student-credentials.ts`
- `src/lib/supabase/admin.ts`

### Student login and learning results
- `src/app/api/hoc-sinh/lop/route.ts` — class-code lookup and student-name list
- `src/app/api/hoc-sinh/dang-nhap/route.ts` — PIN login
- `src/app/api/tien-do/route.ts` — server-side grading and saving lesson results
- `src/app/api/tien-do/game/route.ts` — game-result validation and saving
- `src/app/api/hoc-sinh/bai-giao/[id]/route.ts` — assignment submission and server-side exam grading
- `src/app/api/thanh-tich/route.ts` — achievement and leaderboard access

### Database authorization and migration history
- `supabase/migrations/0001_platform_foundation.sql`
- `supabase/migrations/0002_quiz_security_and_onboarding.sql`
- `supabase/migrations/0007_student_role.sql`
- `supabase/migrations/0008_classroom_accounts.sql`
- `supabase/migrations/0009_teacher_view_pin.sql`
- `supabase/migrations/0010_class_code_required.sql`
- `supabase/migrations/0011_fix_student_role.sql`
- `supabase/migrations/0017_assignments.sql`
- `supabase/migrations/0018_billing.sql`
- `supabase/migrations/0021_lesson_plans.sql`
- `supabase/migrations/0023_plan_library.sql`
- `supabase/migrations/0027_pin_attempt_atomic.sql`
- `supabase/tests/0001_security_smoke_test.sql`
- `supabase/tests/local/README.md`
- `supabase/tests/local/20_e2e_must_fail.sql`
- `supabase/tests/local/50_classroom_rbac.sql`
- `supabase/tests/local/109_pin_attempt.sql`

## 4. Prioritized task backlog

Priority definitions:
- **P0 — before any real child/student data or public pilot**
- **P1 — before relying on live learning outcomes or expanding access**
- **P2 — reliability and automation improvements**
- **P3 — later enhancement**

### P0 — verify the real security boundary

#### AUD-001 — Reconcile live migration state
- **Goal:** Confirm the actual Supabase project has the intended migration/schema version.
- **Steps:** In a trusted admin session, inspect migration history (if tracked), list tables/functions, compare the 0001–0029 migration sequence, check for manual SQL changes, and record differences. Do not blindly replay migrations.
- **Acceptance:** A versioned report states applied/missing/out-of-order migrations and drift; no production mutation is made during inspection.
- **Risk if skipped:** Application code and actual database policies can disagree.

#### AUD-002 — Run a real JWT-based RLS matrix
- **Actors:** anonymous, parent A, parent B, student A, student B, teacher A, teacher B, school admin A, system admin.
- **Negative cases:** cross-parent student read; teacher reads another teacher's class; student reads another student's results; parent changes consent/link verification; non-admin self-promotes; anonymous reads student data/certificates; student client reads answer keys; cross-school plan-library reads.
- **Acceptance:** Test results prove both allowed and denied cases against the development Supabase project using real JWT sessions; save sanitized output. Do not use real student data.
- **Note:** A middleware redirect or a zero-row response alone is not proof that the database policy is correct.

#### AUD-003 — Review all service-role API routes
- **Goal:** Make sure every API route using `createAdminClient()` performs user authentication, role/ownership/class-membership checks, input validation, and appropriate rate limiting before privileged reads/writes.
- **Initial routes:** `/api/hoc-sinh/lop`, `/api/hoc-sinh/dang-nhap`, `/api/tien-do`, `/api/tien-do/game`, `/api/hoc-sinh/bai-giao/[id]`, plus teacher/student account-management routes found by repository-wide search.
- **Acceptance:** Each route has a documented trust boundary and negative test; no service-role result is returned before authorization.
- **Caution:** Public class lookup may intentionally expose a class roster to users who know the class code; confirm that product/privacy decision and threat model.

#### AUD-004 — Decide and harden student PIN handling
- **Source observation:** `student_pins.pin` stores a six-digit PIN; a security-definer function allows authorized class teachers/admins to retrieve it and logs the access.
- **Decision needed:** Is long-term PIN viewing necessary? Prefer showing a generated PIN only once, allowing authorized reset, and avoiding recoverable PIN storage if the product can support it.
- **Acceptance:** Threat model documents who can view/reset PINs, audit retention, account recovery, and what happens after teacher account compromise. Any change must include a migration plan and classroom UX plan.
- **Do not change the schema before approval.**

#### AUD-005 — Confirm consent and child-data governance
- **Goal:** Verify consent is recorded meaningfully and that student account creation, reports, comments, grades, and retention match the intended deployment and applicable Vietnamese requirements.
- **Acceptance:** A teacher/owner-approved policy defines guardian consent, access/deletion requests, retention, backups, and who may export student data. Use synthetic data until approved.

### P1 — correctness and safe learning flows

#### AUD-006 — Separate demo learning content from production content
- **Evidence:** `src/lib/data.ts` and `src/lib/progress-server/grade.ts` use demo lesson/question imports.
- **Goal:** Map each student route to its actual data source. Do not mix database-published lessons with demo answer keys or save a production result for content that was only generated locally.
- **Acceptance:** Tests prove a published database lesson can be loaded and graded from authoritative content; unpublished lessons and answer keys remain inaccessible to students.
- **No large refactor:** replace data-source functions incrementally behind existing interfaces.

#### AUD-007 — Verify PIN-lock behavior when migration 0027 is absent
- **Evidence:** `/api/hoc-sinh/dang-nhap/route.ts` contains a fallback to the older read-check-write counter if the atomic RPC returns an error.
- **Goal:** Decide whether fallback is needed for development compatibility. A missing migration or unexpected RPC failure should not silently downgrade the security guarantee in production.
- **Acceptance:** Production configuration requires the atomic database function; missing/failed function returns a safe service error and raises a monitored alert, or an explicitly reviewed alternative is tested.

#### AUD-008 — Validate scoring and assignment integrity
- **Goal:** Test question IDs, seed reconstruction, grade boundaries, answer formats, duration caps, duplicate submissions, closed assignments, and result ownership.
- **Acceptance:** Automated positive and negative tests cover `gradeLessonSubmission`, `gradeExam`, `assignment_targets`, and database uniqueness constraints.

### P2 — quality gates and reliability

#### AUD-009 — Add pull-request CI
- Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`, and relevant content checks on a PR branch.
- Confirm repository Actions permissions and free-tier limits first.
- CI should use no production secrets and should not run destructive database migrations.

#### AUD-010 — Make security smoke tests executable
- Convert the manual checklist into repeatable SQL assertions or a dedicated integration suite; keep the manual checklist as an operator guide.
- Run against a local PostgreSQL/Supabase test setup and a separate development Supabase project.
- Fail the job if any expected denial is allowed or any expected allowed action is denied.

#### AUD-011 — Replace in-memory rate limiting where global enforcement matters
- **Evidence:** `src/lib/rate-limit.ts` stores counters in a process-local `Map`.
- **Goal:** Document that this limiter is per-process and can reset/restart across instances; retain the database atomic PIN lock. Add a shared limiter only where measured risk justifies the complexity/cost.
- **Acceptance:** Rate-limit behavior is tested across concurrent requests and deployment instances, or the limitations are explicitly accepted for the pilot.

#### AUD-012 — Map route-level access and privacy behavior
- Build a table of API route → authentication → role/ownership check → database RPC/RLS → data returned → rate limit → tests.
- Cover teacher tools, class diary, lesson plans, plan library, comments, exam papers, billing, leaderboard, and student progress.
- Acceptance: every route has an owner and an automated or documented manual test.

## 5. Safe execution plan

1. **Do not change production database or secrets.**
2. Use a dedicated development Supabase project and synthetic users/records.
3. Complete AUD-001 and AUD-002 before changing policies.
4. Complete AUD-003 and AUD-004 before a real-student pilot.
5. Complete AUD-006 and AUD-007 before treating saved learning results as authoritative.
6. Add CI and automated security tests in a separate PR.
7. Every code or migration change must be a small PR with evidence, rollback notes, and explicit owner approval.

## 6. Commands to run in a local checkout

Run from the repository root, with a supported Node.js LTS version and dependencies installed:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
npm run check:content
npm run check:practice
npm run check:games
npm run check:sets
npm run check:exams
npm run check:spelling
```

Run only relevant extra checks for changed areas (for example schedule, diary, call-on, class tools). Record the actual output and environment. These commands were **not run during this source review**.

For SQL tests, follow `supabase/tests/local/README.md` against a disposable local PostgreSQL database. Local tests are useful but do not replace JWT/RLS tests on a real development Supabase project.

## 7. Audit boundary

This review did not:
- log into the deployed website or Supabase dashboard;
- inspect live policies, production secrets, logs, backups, or storage buckets;
- execute SQL, migrations, or application tests;
- prove that the deployed Vercel build matches the inspected GitHub `main` commit;
- make code, database, or deployment changes.

Treat the items above as a prioritized investigation plan, not a certification that the app is secure or insecure.
