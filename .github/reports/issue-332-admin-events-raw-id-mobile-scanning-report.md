# Issue #332 - Admin Events Raw ID Mobile Scanning Report

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/332

## Outcome

Admin event mobile cards now keep the operational scan path first: title, status/date/chapter metadata, registration count, and actions. The raw event UUID is still available for support, but it is collapsed behind a secondary `ID tecnico` disclosure so it no longer competes with the primary mobile task.

## Files Changed

- `app/[locale]/admin/events/events-management-client.tsx`
- `tests/e2e/admin-events-mobile-id-hierarchy.spec.ts`
- `.github/plans/issue-332-admin-events-raw-id-mobile-scanning.plan.md`

## Screenshot Evidence

- `outputs/issue-332-admin-events-raw-id-mobile/admin-events-mobile-id-desktop-chromium.png`

## Validation

- `PLAYWRIGHT_BASE_URL=http://localhost:3104 pnpm exec playwright test tests/e2e/admin-events-mobile-id-hierarchy.spec.ts --project=desktop-chromium --reporter=line` passed: 1 test.
- `pnpm exec tsc --noEmit --pretty false` passed.
- `pnpm run lint` passed with existing warnings only.
- `pnpm test` passed: 60 files, 534 tests.
