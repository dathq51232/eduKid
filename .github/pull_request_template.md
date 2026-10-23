## Why is this change needed?
<!-- Describe the user problem and expected outcome. -->

## Scope
- [ ] Existing app preserved; no unapproved rewrite
- [ ] Only the intended feature/files changed
- [ ] Out-of-scope changes are not included

## Evidence and verification
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Relevant content/game/exam/security checks
- [ ] Manual browser checks (describe below)

**Commands actually run and results:**
<!-- Paste real output or link to CI. Do not check boxes for commands not run. -->

## Security, privacy and data
- [ ] No secrets or real student data added
- [ ] Auth/RLS/role checks reviewed if data access changed
- [ ] Migration and environment variable changes documented
- [ ] No new paid API/service without owner approval

## UI / UX (if applicable)
- [ ] Mobile and desktop considered
- [ ] Loading, empty and error states considered
- [ ] Screenshots attached if useful

## Release safety
- [ ] Rollback path documented
- [ ] Required manual migration/deployment steps documented
- [ ] Known limitations and unverified behavior stated
- [ ] CEO/project owner approval requested before merge/deploy
