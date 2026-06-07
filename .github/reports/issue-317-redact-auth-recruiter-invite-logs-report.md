# Issue #317 Validation Report - Redact Auth And Recruiter Invite Logs

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/317

Plan: `.github/plans/issue-317-redact-auth-recruiter-invite-logs.plan.md`

## Summary

Auth confirmation no longer logs a partial `token_hash`. Recruiter invite audit logging now uses `lib/logger` and records only non-sensitive action metadata, such as whether an admin was authenticated and whether an email/company/invite value was present.

Raw admin IDs, recruiter emails, invite IDs, company IDs, and invite tokens are not written into the invite audit logger payload.

## Files Changed

- `app/[locale]/auth/confirm/route.ts`
- `lib/actions/admin/invite-recruiter.ts`
- `lib/actions/admin/invite-recruiter.test.ts`

## Redaction Evidence

Auth confirmation logging:

- Logs `hasTokenHash`, `hasType`, `type`, and `locale`.
- Does not log `token_hash`, partial token hashes, or token values.
- Logs verification failure metadata without the raw error message.

Recruiter invite logging:

- Uses `logger.info`.
- Logs redacted booleans:
  - `adminAuthenticated`
  - `recruiterEmailPresent`
  - `companyIdPresent`
  - `inviteIdPresent`
- Unit test asserts the logger payload does not contain:
  - `admin-1`
  - `rep@acme.com`
  - `company-1`
  - `invite-1`
  - `token-123`

Grep note:

- A broad grep still finds `recruiterEmail`, `companyId`, and `inviteId` where the action must pass inputs into the service or return the created invite ID to the caller.
- The removed log patterns are gone from the scoped files.

## Validation

- `pnpm exec vitest run lib/actions/admin/invite-recruiter.test.ts` - passed, 1 file and 2 tests.
- `pnpm exec tsc --noEmit --pretty false` - passed.
- `pnpm run lint` - passed with 0 errors and existing repo warnings.
- `pnpm test` - passed, 59 files and 526 tests.

## Notes

- This fix does not add a durable audit table. The issue acceptance allowed redaction or durable audit migration; this patch handles the immediate production-log exposure.
- User-facing invite behavior and auth redirect behavior were not changed.
