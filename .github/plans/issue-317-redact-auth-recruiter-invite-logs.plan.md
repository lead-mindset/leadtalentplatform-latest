# Issue #317 - Redact Auth And Recruiter Invite Logs

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/317

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Problem

Auth confirmation and recruiter invite flows log sensitive metadata too casually. The auth confirmation route logs a partial token hash, and recruiter invite actions log raw admin IDs, recruiter emails, invite IDs, and company IDs through `console.log`.

## Scope

In scope:

- Remove partial token hash logging from auth confirmation.
- Replace raw console audit logs in recruiter invite actions with structured logger calls.
- Redact invite IDs, user IDs, emails, and company IDs from process logs.
- Keep action behavior and returned user-facing messages unchanged.
- Add validation evidence via grep and test runs.

Out of scope:

- Creating a durable audit table.
- Redesigning recruiter invite workflows.
- Changing Supabase auth verification behavior.

## Tasks

### Task 1 - Redact Auth Confirmation Logs

- **Files**: `app/[locale]/auth/confirm/route.ts`
- **Action**: Remove token hash logging and avoid raw verifyOtp error details in logs.
- **Status**: Completed.

### Task 2 - Replace Recruiter Invite Console Audit Logs

- **Files**: `lib/actions/admin/invite-recruiter.ts`
- **Action**: Use `lib/logger` and log only redacted/non-sensitive invite action metadata.
- **Status**: Completed.

### Task 3 - Validate Redaction

- **Action**:
  - Grep for removed raw log patterns.
  - Run typecheck, lint, and tests.
- **Status**: Completed.

## Validation

- `rg "token_hash\\?\\.slice|console\\.log|adminId:|recruiterEmail: invite|inviteId," app/[locale]/auth/confirm/route.ts lib/actions/admin/invite-recruiter.ts` - no log payload hits; remaining broader grep hits are service input/return values, not logs.
- `pnpm exec vitest run lib/actions/admin/invite-recruiter.test.ts` - passed, 1 file and 2 tests.
- `pnpm exec tsc --noEmit --pretty false` - passed.
- `pnpm run lint` - passed with 0 errors and existing warnings.
- `pnpm test` - passed, 59 files and 526 tests.

## Definition Of Done

- [x] No partial token hash is logged.
- [x] Recruiter invite action logs no raw email, invite ID, admin user ID, or company ID.
- [x] Structured logging is used instead of raw console audit logs.
- [x] Validation evidence is captured in the issue/report.
