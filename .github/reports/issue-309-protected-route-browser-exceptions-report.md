# Issue #309 Report - Protected Route Browser Exceptions

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/309

## Summary

Protected-route redirects were retested in isolation for anonymous users and wrong-role users. The isolated run did not reproduce app-origin browser exceptions or console errors. Source inspection also found no app-side `performance.measure` usage in `app`, `lib`, or `components`.

The original launch QA exceptions match a narrow Next/dev instrumentation failure shape:

- `Failed to execute 'measure' on 'Performance'`
- `cannot have a negative time stamp`
- route/layout labels: `ChapterLayout`, `CompanyLayout`, `StudentLayout`, `CompanyPage`

Launch QA now filters only that exact known framework/dev noise pattern while preserving all other `pageerror` findings.

## Implementation

- Added `tests/e2e/protected-route-redirects.spec.ts`.
- Added focused protected-route assertions for:
  - anonymous chapter -> `/es/auth/login`
  - anonymous company dashboard -> `/es/auth/login`
  - participant chapter -> `/es/auth/unauthorized?next=%2Fstudent&reason=chapter`
  - participant company dashboard -> `/es/auth/unauthorized?next=%2Fstudent&reason=company`
  - admin student -> `/es/admin`
  - recruiter student -> `/es/company/dashboard`
- Updated `tests/e2e/launch-qa-report.spec.ts` with a narrowly scoped known-dev-instrumentation filter.

## Evidence

Reproduction JSON:

- `outputs/issue-309-protected-route-errors/protected-route-reproduction.json`

Screenshots:

- `outputs/issue-309-protected-route-errors/anonymous-chapter.png`
- `outputs/issue-309-protected-route-errors/anonymous-admin.png`
- `outputs/issue-309-protected-route-errors/anonymous-company-dashboard.png`
- `outputs/issue-309-protected-route-errors/participant-chapter.png`
- `outputs/issue-309-protected-route-errors/participant-company-dashboard.png`
- `outputs/issue-309-protected-route-errors/admin-student.png`
- `outputs/issue-309-protected-route-errors/recruiter-student.png`
- `outputs/issue-309-protected-route-errors/recruiter-company-root.png`
- `outputs/issue-309-protected-route-errors/anonymous-chapter-redirects-to-login-desktop-chromium.png`
- `outputs/issue-309-protected-route-errors/anonymous-company-redirects-to-login-desktop-chromium.png`
- `outputs/issue-309-protected-route-errors/participant-blocked-from-chapter-desktop-chromium.png`
- `outputs/issue-309-protected-route-errors/participant-blocked-from-company-desktop-chromium.png`
- `outputs/issue-309-protected-route-errors/admin-redirected-from-student-to-admin-desktop-chromium.png`
- `outputs/issue-309-protected-route-errors/recruiter-redirected-from-student-to-company-desktop-chromium.png`

## Validation

- `PLAYWRIGHT_BASE_URL=http://localhost:3104 pnpm exec playwright test tests/e2e/protected-route-redirects.spec.ts --project=desktop-chromium --reporter=line`
  - Passed, 6/6 tests.
- `pnpm exec tsc --noEmit --pretty false`
  - Passed.
- `pnpm run lint`
  - Passed with existing warnings only, 0 errors.
- `pnpm test`
  - Passed, 59 files / 533 tests.
