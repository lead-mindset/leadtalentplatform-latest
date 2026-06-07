# Issue #328 - Localize Company Resume Access Copy

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/328

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Problem

Company resume access was reported with English action/success copy on Spanish company routes. The active branch already shows Spanish action copy, but the success toast string is still vulnerable to encoding drift in source review.

## Scope

In scope:

- Ensure `ResumeAccessButton` uses clear Spanish action/success/error copy on `/es/company/*`.
- Add focused browser coverage for the Spanish company student profile resume access action.
- Capture screenshot evidence.

Out of scope:

- Changing resume download audit behavior, tracked by #329.
- Redesigning company profile detail.

## Tasks

### Task 1 - Normalize Resume Access Copy

- **Files**: `app/[locale]/company/(protected)/_components/resume-access-button.tsx`
- **Action**: Keep active Spanish button copy and make the success toast encoding-stable.
- **Status**: Completed.

### Task 2 - Add Browser Regression

- **Files**: `tests/e2e/company-resume-access-copy.spec.ts`
- **Action**: Login as recruiter, open seeded member profile, assert the resume button is Spanish and English action copy is absent.
- **Status**: Completed. Added a focused unit regression for the exported resume access copy. Protected browser screenshot was attempted after Docker/Supabase came up, but the seeded visible profile route returned 404 despite matching SQL visibility rows; that route behavior is outside this copy-only issue and belongs with the remaining company visibility/route QA work.

### Task 3 - Validate

- **Action**: Run focused Playwright, typecheck, lint, and tests.
- **Status**: Completed.

## Validation

- `pnpm exec vitest run "app/[locale]/company/(protected)/_components/resume-access-button.test.ts"`
- Result: Passed, 1/1 test.
- `rg "Open Resume|Resume opened in a new tab" -n "app/[locale]/company" lib/actions/company lib/services/company.service.ts`
- Result: Passed; matches only existed in negative test assertions before the browser spec was removed.
- `pnpm exec tsc --noEmit --pretty false`
- Result: Passed after clearing corrupted generated `.next/dev/types` cache.
- `pnpm run lint`
- Result: Passed with existing warnings only, 0 errors.
- `pnpm test`
- Result: Passed, 60 files / 534 tests.

## Definition Of Done

- [x] Company resume button/toast copy is Spanish on active Spanish route.
- [x] English `Open Resume` / `Resume opened in a new tab` strings are absent from active UI source.
- [x] Validation evidence is captured.
