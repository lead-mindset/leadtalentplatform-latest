# Issue 274: Chapter Dashboard LCP Performance

## GitHub Issue
- #274: Improve chapter dashboard LCP performance before launch

## Goal
Bring `/en/chapter` under the authenticated route LCP budget while preserving chapter operations, pending approvals, quick links, and event management access.

## Current Findings
- The chapter dashboard wraps the whole page in `Suspense`, but `ChapterContent` waits for both roster and event data before rendering any visible dashboard content.
- Member stats and pending approvals are the primary above-the-fold chapter dashboard content.
- Upcoming event count and event operations are useful but can stream after the first dashboard shell and member stats.
- The failure is small, so a focused first-render split should be enough.

## Implementation Plan
- [x] Keep chapter auth, chapter context, member stats, and pending approval behavior unchanged.
- [x] Remove event fetching from the first dashboard render path.
- [x] Stream upcoming event count and event operations in smaller async server components.
- [x] Add lightweight skeletons for streamed event stats/list so the layout remains stable.
- [ ] Run type, lint, targeted chapter/event service tests, and chapter performance validation.

## Validation
- [x] `pnpm exec tsc --noEmit`
- [x] `pnpm run lint -- --quiet`
- [x] `pnpm exec vitest run lib/services/__tests__/chapter.service.test.ts lib/services/__tests__/event.service.test.ts`
- [x] `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3102 PERF_QA_SCOPE=chapter pnpm exec playwright test tests/e2e/production-readiness-performance.spec.ts --project=desktop-chromium --reporter=list`

## Results
- Chapter dashboard: LCP 2364ms, CLS 0, no console errors, no failed responses.
- Chapter members: LCP 2532ms, CLS 0, no console errors, no failed responses.
- Chapter events: LCP 3052ms, CLS 0, no console errors, no failed responses.
- Chapter new event: LCP 1948ms, CLS 0, no console errors, no failed responses.

## Rollback
Revert the dashboard streaming changes and this plan file if chapter event counts, event operations, or pending approval workflows regress.
