# Issue #328 Report - Localize Company Resume Access Copy

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/328

## Summary

Company resume access copy now has a single exported Spanish source of truth in `ResumeAccessButton`.

The audited English strings:

- `Open Resume`
- `Resume opened in a new tab`

are not present in the active company resume access component or company service/action code.

## Implementation

- Added `RESUME_ACCESS_COPY` in `app/[locale]/company/(protected)/_components/resume-access-button.tsx`.
- The button uses `RESUME_ACCESS_COPY.open` = `Abrir CV`.
- The success toast uses `RESUME_ACCESS_COPY.success` = `CV abierto en una nueva pestaña`.
- Added `app/[locale]/company/(protected)/_components/resume-access-button.test.ts` to guard against the English strings returning.

## Browser Note

Docker and local Supabase were started successfully. A protected browser check was attempted after inserting temporary local-only resume metadata for the seeded visible member. The company student profile route returned 404 even though SQL visibility rows for `member@test.com` showed `is_recruiter_visible = true` and approved chapter membership.

That profile-route behavior is outside this copy-only issue and should be handled with the remaining company visibility/route QA issues. The temporary local resume row was only for QA and is not a source change.

## Validation

- `pnpm exec vitest run "app/[locale]/company/(protected)/_components/resume-access-button.test.ts"`
  - Passed, 1/1 test.
- `rg "Open Resume|Resume opened in a new tab" -n "app/[locale]/company" lib/actions/company lib/services/company.service.ts`
  - Passed; no active UI/service matches.
- `pnpm exec tsc --noEmit --pretty false`
  - Passed after clearing corrupted generated `.next/dev/types` cache.
- `pnpm run lint`
  - Passed with existing warnings only, 0 errors.
- `pnpm test`
  - Passed, 60 files / 534 tests.
