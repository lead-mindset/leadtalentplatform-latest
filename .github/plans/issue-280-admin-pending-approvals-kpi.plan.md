# Issue 280: Admin Pending Chapter Approvals KPI

## GitHub Issue
- #280: Fix admin pending chapter approvals dashboard KPI

## Goal
Make the admin dashboard "Pending approvals" tile accurately reflect pending chapter membership applications without reintroducing the broad dashboard queries that caused LCP pressure.

## Current Findings
- The admin dashboard tile currently reads `systemStats.pending_approvals`.
- `AdminService.getSystemStats()` now returns `pending_approvals: 0` as part of the performance stabilization work.
- The metric is a dashboard KPI, not a general system inventory stat.
- `getChapterActivityList()` also computes pending approvals, but it is too broad for a single KPI because it fetches chapter activity data and events.

## Decision
Add a precise `pending_chapter_approvals` KPI to `getAdminDashboardStats()` using a direct `chapter_membership.status = 'pending'` count query, then update the admin dashboard tile to read from that field.

## Implementation Plan
- [x] Extend `AdminDashboardStats` with `pending_chapter_approvals`.
- [x] Add a cheap head/count query in `AdminService.getAdminDashboardStats()`.
- [x] Use `dashboardStats.pending_chapter_approvals` for the admin dashboard tile value and tone.
- [x] Update admin service tests for the new count query and result field.
- [ ] Run type, lint, targeted tests, and admin performance validation.

## Validation
- [x] `pnpm exec tsc --noEmit`
- [x] `pnpm run lint -- --quiet`
- [x] `pnpm exec vitest run lib/services/__tests__/admin.service.test.ts`
- [x] `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3102 PERF_QA_SCOPE=admin pnpm exec playwright test tests/e2e/production-readiness-performance.spec.ts --project=desktop-chromium --reporter=list`

## Results
- Admin dashboard: LCP 2772ms, CLS 0, no console errors, no failed responses.
- Admin users: LCP 2404ms, CLS 0.0035, no console errors, no failed responses.
- Admin companies: LCP 1536ms, CLS 0, no console errors, no failed responses.
- Admin chapters: LCP 2080ms, CLS 0, no console errors, no failed responses.
- Admin events: LCP 3140ms, CLS 0, no console errors, no failed responses.

## Rollback
Revert this plan and the KPI changes if the dashboard tile becomes inaccurate, the admin service tests fail, or admin performance regresses.
