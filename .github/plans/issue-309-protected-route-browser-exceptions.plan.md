# Issue #309 - Protected Route Browser Exceptions

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/309

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Problem

Protected-route redirect QA recorded uncaught browser exceptions from `performance.measure` with negative timestamps on redirected server layouts. The affected labels were `ChapterLayout`, `CompanyLayout`, `StudentLayout`, and `CompanyPage`.

## Scope

In scope:

- Reproduce protected redirects in isolation with pageerror capture.
- Confirm whether the error originates from app code, Next dev instrumentation, or QA collector behavior.
- Add regression coverage that asserts protected redirects complete without app-origin page errors.
- If the exception is framework/dev instrumentation, document and filter only that known benign pattern in the QA collector.
- Attach validation evidence.

Out of scope:

- Rewriting auth role policy.
- Changing protected-route destination behavior unless reproduction shows a real app bug.
- Broad launch QA sharding (#322).

## Tasks

### Task 1 - Reproduce Redirect Errors

- **Files**: `outputs/issue-309-protected-route-errors/*`
- **Action**: Capture anonymous and wrong-role protected-route pageerrors for `/es/chapter`, `/es/company/dashboard`, and `/es/student`.
- **Status**: Completed. Isolated reproduction covered anonymous, participant, admin, and recruiter guard redirects. All captured `pageErrors` and `consoleErrors` were empty.

### Task 2 - Classify Error Source

- **Files**: `tests/e2e/launch-qa-report.spec.ts`
- **Action**: Determine whether the negative `performance.measure` exception is app-origin or dev instrumentation. If framework-origin, filter the exact known pattern with comments and preserve all other pageerrors.
- **Status**: Completed. No app-side `performance.measure` call was found in `app`, `lib`, or `components`; only an unrelated performance observer test uses browser performance APIs. The launch QA collector now ignores only the exact known Next dev negative-timestamp measure pattern for `ChapterLayout`, `CompanyLayout`, `StudentLayout`, and `CompanyPage`.

### Task 3 - Add Regression Coverage

- **Files**: `tests/e2e/protected-route-redirects.spec.ts`
- **Action**: Add a focused protected-route redirect test that captures pageerrors and fails on app-origin errors.
- **Status**: Completed. Added `tests/e2e/protected-route-redirects.spec.ts` to assert protected redirects land on the expected destination and produce no app-origin page or console errors.

### Task 4 - Validate

- **Action**:
  - Run the focused Playwright spec.
  - Run typecheck, lint, and tests.
  - Save screenshot/JSON evidence.
- **Status**: Completed.

## Validation

- `PLAYWRIGHT_BASE_URL=http://localhost:3104 pnpm exec playwright test tests/e2e/protected-route-redirects.spec.ts --project=desktop-chromium --reporter=line`
- Result: Passed, 6/6 tests.
- `pnpm exec tsc --noEmit --pretty false`
- Result: Passed.
- `pnpm run lint`
- Result: Passed with existing warnings only, 0 errors.
- `pnpm test`
- Result: Passed, 59 files / 533 tests.

## Definition Of Done

- [x] One protected redirect is reproduced in isolation or shown clean with evidence.
- [x] Known framework/dev `performance.measure` noise is filtered only if app-origin is ruled out.
- [x] Regression coverage exists for protected redirects.
- [x] Validation evidence is captured in the issue/report.
