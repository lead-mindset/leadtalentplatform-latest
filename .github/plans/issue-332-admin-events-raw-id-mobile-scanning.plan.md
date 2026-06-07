# Issue #332 - Admin Events Raw ID Mobile Scanning

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/332

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Problem

Admin events mobile cards show raw event IDs too prominently. IDs are useful for support, but they should not compete with title, status, date, chapter, registration count, or actions during mobile scanning.

## Scope

In scope:

- De-emphasize raw event IDs in the mobile admin events card.
- Keep full event IDs accessible for support/debugging.
- Capture mobile screenshot evidence.
- Run focused browser validation plus standard checks.

Out of scope:

- Redesigning desktop tables.
- Changing event data or routes.

## Tasks

### Task 1 - De-emphasize Mobile Event IDs

- **Files**: `app/[locale]/admin/events/events-management-client.tsx`
- **Action**: Move the raw ID into a secondary disclosure element below operational metadata.
- **Status**: Complete.

### Task 2 - Visual Validation

- **Files**: `outputs/issue-332-admin-events-raw-id-mobile/*`
- **Action**: Screenshot `/es/admin/events` at mobile width and verify the card scan prioritizes event title/status/date/chapter/actions.
- **Status**: Complete.

### Task 3 - Validate

- **Action**: Run focused Playwright, typecheck, lint, and tests.
- **Status**: Complete.

## Validation

- `PLAYWRIGHT_BASE_URL=http://localhost:3104 pnpm exec playwright test tests/e2e/admin-events-mobile-id-hierarchy.spec.ts --project=desktop-chromium --reporter=line`
- `pnpm exec tsc --noEmit --pretty false`
- `pnpm run lint`
- `pnpm test`

## Definition Of Done

- [x] Mobile cards prioritize title/status/date/chapter/actions.
- [x] Raw event IDs remain accessible but secondary.
- [x] Screenshot and validation evidence are captured.
