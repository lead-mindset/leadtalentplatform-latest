# Plan: Validate Chapter E-board Invite MVP End to End

## Summary

Run focused validation for the invite MVP across service rules, email sending, type safety, linting, and UI behavior. Record any blocked local checks honestly, especially Docker/Supabase-dependent validation.

## User Story

As Abigail
I want validation evidence for the invite MVP
So that the activation workflow can be trusted before real chapter leaders use it

## Metadata

| Field | Value |
| --- | --- |
| Type | VALIDATION |
| Complexity | MEDIUM |
| Systems Affected | Tests, QA, reports |
| GitHub Issue | #261 |

## Patterns to Follow

Existing implementation reports under `.github/reports/` summarize plan, branch, tasks, validation results, files changed, and deviations.

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `.github/reports/issue-261-validate-chapter-eboard-invite-mvp-report.md` | CREATE | Validation report |
| Relevant tests | UPDATE | Add coverage if gaps remain |

## Tasks

### Task 1: Run targeted tests
- **Action**: RUN
- **Implement**: service invite tests, email tests, and existing preapproval tests.
- **Validate**: record pass/fail output.

### Task 2: Run static validation
- **Action**: RUN
- **Implement**: `pnpm exec tsc --noEmit` and `pnpm run lint`.
- **Validate**: record pass/fail output.

### Task 3: UI smoke
- **Action**: RUN/REVIEW
- **Implement**: if dev server can run, inspect `/chapter/members` desktop/mobile; otherwise record blocker.
- **Validate**: report outcome.

### Task 4: Write validation report
- **File**: `.github/reports/issue-261-validate-chapter-eboard-invite-mvp-report.md`
- **Action**: CREATE
- **Implement**: summarize commands, results, blockers, and residual risk.

## Validation

```bash
pnpm exec vitest run lib/services/__tests__/chapter-eboard-invite.service.test.ts lib/emails/__tests__/send-email.test.ts lib/services/__tests__/chapter-preapproval.service.test.ts
pnpm exec tsc --noEmit
pnpm run lint
```

## Acceptance Criteria

- [x] Invite lifecycle service tests pass.
- [x] Email tests pass.
- [x] Existing preapproval activation tests pass.
- [x] Type check and lint results are recorded.
- [x] Visual/UI validation is completed or an explicit blocker is documented.
