# Issue #325 - Mobile Tab Overflow Filters Report

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/325

## Outcome

The live admin users filter surface now reads as a deliberate mobile filter stack. Role, chapter, and profile filters render as full-width controls at 390px, while preserving the existing dropdown behavior and URL query updates. This resolves the active hidden/clipped-state risk without reworking already-fixed student events and chapter members filters.

## Files Changed

- `app/[locale]/admin/users/users-management-client.tsx`
- `tests/e2e/admin-users-mobile-filter-hierarchy.spec.ts`
- `.github/plans/issue-325-mobile-tab-overflow-filters.plan.md`

## Screenshot Evidence

- `outputs/issue-325-mobile-tab-overflow-filters/admin-users-mobile-filter-desktop-chromium.png`

## Validation

- `PLAYWRIGHT_BASE_URL=http://localhost:3104 pnpm exec playwright test tests/e2e/admin-users-mobile-filter-hierarchy.spec.ts --project=desktop-chromium --reporter=line` passed: 1 test.
- `pnpm exec tsc --noEmit --pretty false` passed.
- `pnpm run lint` passed with existing warnings only.
- `pnpm test` passed: 60 files, 534 tests.
