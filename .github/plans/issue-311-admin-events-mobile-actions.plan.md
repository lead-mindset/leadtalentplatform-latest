# Issue #311 - Admin Events Mobile Usability

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/311

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Problem

The admin events page currently renders a dense desktop table on mobile. On a 390px viewport, event names, lifecycle state, registration counts, chapter metadata, and actions compete for horizontal space. The table can scroll, but it is not operationally usable for admins or staff who need to scan events and act quickly.

## Scope

In scope:

- Add a mobile-only event record list for `/es/admin/events`.
- Preserve the desktop table for medium and larger screens.
- Reuse the same manage and public-view actions.
- Keep filters, sorting, pagination, and page-size behavior unchanged.
- Clean visible Spanish mojibake on the affected page.
- Capture mobile screenshot evidence as `admin@test.com`.

Out of scope:

- Changing event service queries or authorization.
- Redesigning event creation/edit flows.
- Changing chapter event management surfaces.

## Tasks

### Task 1 - Extract Reusable Event Actions

- **Files**: `app/[locale]/admin/events/events-management-client.tsx`
- **Action**: Create one action renderer for `Gestionar` and public-view links, reused by desktop and mobile.
- **Status**: Completed.

### Task 2 - Add Mobile Event Cards

- **Files**: `app/[locale]/admin/events/events-management-client.tsx`
- **Action**: Add a `md:hidden` record list with title, status, start date, chapters, registration count, and actions.
- **Status**: Completed.

### Task 3 - Keep Desktop Table Desktop-Only

- **Files**: `app/[locale]/admin/events/events-management-client.tsx`
- **Action**: Wrap the existing table in a `hidden md:block` container so mobile uses the card pattern while desktop keeps table density.
- **Status**: Completed.

### Task 4 - Validate And Capture Evidence

- **Action**:
  - Run typecheck, lint, and tests.
  - Capture `/es/admin/events` mobile screenshot at 390px.
  - Record width metrics and action visibility.
- **Status**: Completed.

## Validation

- `pnpm exec tsc --noEmit --pretty false` - passed.
- `pnpm run lint` - passed with 0 errors and existing warnings.
- `pnpm test` - passed, 59 files and 526 tests.
- Playwright screenshot at `390 x 844` for `/es/admin/events`:
  `outputs/issue-311-admin-events-mobile/admin-es-admin-events-390-after.png`.

## Definition Of Done

- [x] Admin events mobile shows event status, chapter, registration count, and actions without horizontal table scanning.
- [x] Desktop table remains available on `md` and wider screens.
- [x] Filters, sorting, pagination, manage links, and public-view links still render.
- [x] Mobile screenshot evidence is captured and linked in the issue/report.
