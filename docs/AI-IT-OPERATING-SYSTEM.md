# EduChain Kids — AI IT Operating System

> Owner: CEO / project owner  
> Technical coordinator: ChatGPT (CTO role)  
> Repository: https://github.com/dathq51232/eduKid  
> Default branch: `main`  
> Strategy: preserve the existing application; free-first; verify before claiming.

## 1. Non-negotiable rules

1. Do not rebuild the project from scratch. Extend the existing Next.js + TypeScript + Tailwind + Supabase codebase.
2. Do not push directly to `main`, merge automatically, or deploy to production without the owner's approval.
3. Every code change must be on a focused branch and submitted as a pull request (PR).
4. Before editing, inspect the relevant files, existing patterns, database migrations, and tests.
5. Do not silently change UI, routes, database schemas, RLS policies, auth, or student data flows outside the task scope.
6. Never place secrets in source code, prompts, screenshots, issues, commits, or `NEXT_PUBLIC_*` variables. Never expose Supabase service-role credentials.
7. Use fake/test accounts and synthetic student data for development. Do not send children's personal data to third-party AI services.
8. AI-generated curriculum and teacher materials must be drafts until reviewed and approved by an authorized teacher/admin.
9. Distinguish **verified**, **observed in source**, **assumed**, and **not tested** in all audit reports.
10. If a task needs paid API access, production credentials, destructive migration, or an irreversible action, stop and ask the owner first.

## 2. Roles

| Role | Assigned tool/person | Responsibility | Must not do |
|---|---|---|---|
| CEO / Product Owner | Project owner | Set priorities, accept work, approve releases and spending | Delegate final release approval to an AI |
| CTO / Coordinator | ChatGPT | Clarify requirements, inspect source, write specs, split tasks, review evidence | Claim code was run unless it was actually run |
| UI/UX | Gemini or another available free design assistant | Propose flows, responsive states, design tokens and accessibility details | Replace existing UI without an approved scope |
| Implementation | Claude Code or another local coding agent | Read repository, implement one scoped task, run available checks, prepare PR | Commit secrets, bypass checks, deploy without approval |
| Independent reviewer | A separate AI or human reviewer | Review diff for correctness, security, regressions and maintainability | Approve based only on the implementation summary |
| QA | Existing scripts; GitHub Actions; Playwright when installed | Run deterministic checks and user-flow tests | Treat a successful build as proof of all flows |
| Education reviewer | Teacher / curriculum expert | Check grade-level fit, answer correctness, learning objectives and appropriateness | Publish unchecked AI-generated content |

A role is a workflow responsibility, not necessarily a paid or separate AI product. Start with tools already available. Do not buy subscriptions or API credits without explicit approval.

## 3. Standard feature workflow

1. **Request:** CEO states user problem, target role, desired result and constraints.
2. **Discovery:** CTO inspects existing routes, components, data functions, migrations and tests. Record file paths and evidence.
3. **Specification:** define in-scope/out-of-scope work, acceptance criteria, affected files, data/security impact and rollback plan.
4. **Design (when UI changes):** provide desktop/mobile states, empty/loading/error states, keyboard/accessibility notes and reuse existing components.
5. **Implementation:** coding agent creates a focused branch; edits only the approved scope; no broad refactors.
6. **Checks:** run applicable scripts from `package.json`; report exact commands and pass/fail output. Never invent test results.
7. **Independent review:** review the actual diff, not only the summary. Check authorization, validation, error handling, logging, secrets and regressions.
8. **PR:** describe change, reason, files, checks, risks, screenshots if relevant, and migration/deployment steps.
9. **Acceptance:** CEO or delegated human tests critical flows and approves the PR.
10. **Release:** merge/deploy only after explicit approval; monitor and keep a rollback path.

## 4. Task brief template

Copy into a GitHub Issue:

- **Problem / user:** 
- **Expected outcome:** 
- **Current behavior (evidence):** 
- **Acceptance criteria:** 
  - [ ] 
  - [ ] 
- **Out of scope:** 
- **Likely files/routes:** 
- **Database/RLS/auth impact:** none / describe
- **Privacy/security impact:** none / describe
- **Tests required:** 
- **Rollback plan:** 
- **Cost impact:** free / disclose estimate and request approval

## 5. Definition of Done

A task is not done until all applicable items are satisfied:

- [ ] Acceptance criteria met and evidenced.
- [ ] Existing routes and user flows in scope still work.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes where the environment permits; otherwise the blocker is documented.
- [ ] Relevant content/game/exam checks from `package.json` pass when affected.
- [ ] Security/RLS and role boundaries are reviewed for data-access changes.
- [ ] No secrets, real student data, or unnecessary dependencies were added.
- [ ] Diff reviewed; no unrelated formatting or refactor noise.
- [ ] PR documents migrations, environment variables, manual checks, limitations and rollback.
- [ ] Human owner approves before merge/deploy.

Passing lint/typecheck/build alone does not prove authentication, RLS, curriculum accuracy, or real-user workflows.

## 6. Free-first toolchain

### Start now — no new service required

- GitHub Issues for requests and bug reports.
- Branches and pull requests for all code changes.
- Existing npm scripts as the first quality gate.
- ChatGPT for planning/specification; Gemini for design exploration; Claude Code for implementation if available in the user's current plan.
- A separate review pass (another model if already available, otherwise a human checklist).
- Manual browser smoke tests on the current deployment using non-sensitive test accounts.

### Add only when useful

- **GitHub Actions:** automate typecheck, lint and build on PRs. Verify runner usage/limits for the account and repository before relying on it.
- **Playwright:** add end-to-end tests after selecting a few stable critical user journeys. Keep the first set small.
- **Ollama + a local model / Open WebUI:** optional local experimentation if the computer has enough RAM/CPU/GPU. No model API bill, but hardware, speed and output quality are trade-offs.
- **LiteLLM / Dify / Flowise:** orchestration tools, not a source of free model inference. They still need a model endpoint and may add hosting/usage costs.

Never assume that a free chat subscription includes free API calls. Keep all model credentials in the provider's secret store or server-side environment.

## 7. First quality-gate commands

Run locally in the repository root:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

Run task-specific checks only when relevant; discover available commands from `package.json`. For example, the repository currently defines scripts such as `check:content`, `check:practice`, `check:games`, `check:sets`, `check:exams`, `check:spelling`, `check:count-shapes`, `check:diary`, and `check:tools`. Confirm names in the current package file before using them.

Do not run database migrations against production as part of a routine code check. Use a separate development/test Supabase project or local database and synthetic data.

## 8. Current known risks / evidence register

These are source-level observations from the repository documentation and inspected files, not a completed runtime audit:

- `src/lib/data.ts` imports `DEMO_LESSONS` and `DEMO_QUESTIONS` and reads lessons/questions from demo data. Map exactly which learner routes still use this layer before changing it.
- `src/lib/supabase/admin.ts` creates a privileged server-side client. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and verify authorization on every route that uses it.
- README describes remaining Supabase JWT/RLS validation and other production-readiness work. Validate against current migrations, tests and deployed configuration; README may lag the code.
- No claim is made here that the current deployment, all database policies, or every learner/teacher route has been tested end-to-end.

Track each finding with: severity, evidence/path, reproduction steps, affected role, risk, recommended fix, test, owner, status.

## 9. Decision and release policy

- AI agents can suggest and implement; the project owner makes product, privacy, spending and release decisions.
- Any new recurring cost requires approval before activation.
- Any change to authentication, RLS, student identity, data retention, public certificates, or production database requires a security review and explicit owner approval.
- If a reviewer cannot verify a claim, label it **not verified** and list the exact next test.
- Keep changes small enough to review and revert independently.
