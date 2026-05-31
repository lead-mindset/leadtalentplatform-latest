# Issue 270: Admin Route LCP Performance

## Issue

- GitHub: https://github.com/lead-mindset/leadtalentplatform-latest/issues/270
- Scope: `/en/admin`, `/en/admin/users`, `/en/admin/companies`
- Current branch: `codex/perf-admin-routes`

## Current Evidence

Fresh admin-scope Playwright run on `codex/perf-admin-routes` shows:

- `/en/admin`: failing, LCP 3944ms over 3500ms budget, plus 4 console errors from `getSystemStats`.
- `/en/admin/users`: passing, LCP 1728ms.
- `/en/admin/companies`: passing, LCP 992ms.
- `/en/admin/chapters`: passing, LCP 1256ms.
- `/en/admin/events`: passing, LCP 1320ms.

The first implementation target is the admin overview route. The other admin routes stay in validation scope to avoid regressions.

## Plan

- [x] Measure `/en/admin` locally enough to identify whether the dominant issue is server data time, client rendering, or expected query errors.
- [x] Fix `AdminService.getSystemStats` so optional or unsupported count queries do not emit console errors during normal admin dashboard rendering.
- [x] Reduce first-render work on `app/[locale]/admin/page.tsx` by keeping critical stats above the fold and deferring secondary activity panels when they are not needed for first interaction.
- [x] Add or update focused service tests for the admin stats behavior.
- [x] Run targeted validation: admin service tests, TypeScript, lint.
- [x] Run browser validation: `PERF_QA_SCOPE=admin` Playwright performance spec.
- [ ] Update issue #270 with validation evidence and remaining risk.
- [ ] Commit with a clear Conventional Commit message and open a PR for #270.

## Validation Evidence

- `pnpm exec vitest run lib/services/__tests__/admin.service.test.ts --maxWorkers=2`: passed, 43 tests.
- `pnpm exec tsc --noEmit`: passed.
- `pnpm run lint -- --quiet`: passed.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3102 PERF_QA_SCOPE=admin pnpm exec playwright test tests/e2e/production-readiness-performance.spec.ts --project=desktop-chromium --reporter=list`: passed.

Final admin performance report:

- `/en/admin`: LCP 1632ms, budget 3500ms, no console errors, no failed responses.
- `/en/admin/users`: LCP 1636ms, budget 3500ms, no console errors, no failed responses.
- `/en/admin/companies`: LCP 904ms, budget 3500ms, no console errors, no failed responses.

## Risks

- Admin overview data is operationally important, so performance work must not hide urgent queues or break navigation to admin workflows.
- Local dev LCP can fluctuate. Treat route pass/fail and console errors as primary validation, and record exact measurements.
- If `/admin/users` or `/admin/companies` regress, stop and address them in this branch before opening the PR.
