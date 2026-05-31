# Issue 271: Student Dashboard LCP Performance

## Issue

- GitHub: https://github.com/lead-mindset/leadtalentplatform-latest/issues/271
- Scope: `/en/student` plus related student routes for regression coverage
- Current branch: `codex/perf-student-dashboard`

## Current Evidence

Issue baseline reported:

- `/en/student`: LCP 4788ms over 3500ms budget.
- `/en/student/profile`: passing.
- `/en/student/resume`: passing.
- `/en/student/events`: passing.

## Plan

- [x] Run fresh `PERF_QA_SCOPE=student` baseline on latest `master`.
- [x] Identify the `/en/student` LCP element and whether first paint is blocked by layout data, dashboard data, or client resources.
- [x] Remove non-critical student layout data dependencies from first render where possible.
- [x] Stream dashboard secondary sections behind server `Suspense` boundaries while preserving the immediate welcome/header/actions experience.
- [x] Run targeted service tests for touched student/dashboard services if service logic changes.
- [x] Run TypeScript and lint.
- [x] Run browser validation: `PERF_QA_SCOPE=student` Playwright performance spec.
- [ ] Update issue #271 with validation evidence.
- [ ] Commit, push, and open a PR for #271.

## Validation Evidence

- `pnpm exec vitest run lib/services/__tests__/student-dashboard.service.test.ts --maxWorkers=2`: passed, 9 tests.
- `pnpm exec tsc --noEmit`: passed.
- `pnpm run lint -- --quiet`: passed.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3102 PERF_QA_SCOPE=student pnpm exec playwright test tests/e2e/production-readiness-performance.spec.ts --project=desktop-chromium --reporter=list`: passed.

Final student performance report:

- `/en/student`: LCP 972ms, budget 3500ms, no console errors, no failed responses.
- `/en/student/profile`: LCP 1116ms, budget 3500ms, no console errors, no failed responses.
- `/en/student/resume`: LCP 1160ms, budget 3500ms, no console errors, no failed responses.
- `/en/student/events`: LCP 940ms, budget 3500ms, no console errors, no failed responses.

## Risks

- The student dashboard includes Pathway recommendations and Growth Reflection state; these must remain accurate even if rendered later.
- Member, participant, pending, and alumni states must keep their primary CTAs intact.
- Local dev performance can fluctuate, so validation should emphasize route budget pass, console errors, failed responses, and CLS.
