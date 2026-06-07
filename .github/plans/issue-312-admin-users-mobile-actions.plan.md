# Issue #312 - Admin Users Mobile Actions

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/312

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Problem

The admin users mobile view renders as a squeezed desktop table. On a 390px phone, users can see names and emails, but the role, chapter, profile status, and row actions are hidden or require awkward horizontal scanning. This makes admin review and action-taking risky.

## Scope

In scope:

- Add a mobile-only record list for `/es/admin/users`.
- Preserve the desktop table for medium and larger screens.
- Reuse the same role/deactivate/reactivate actions.
- Keep service, filtering, CSV export, pagination, and bulk action behavior unchanged.
- Capture mobile screenshot evidence as `admin@test.com`.

Out of scope:

- Redesigning admin events mobile (#311).
- Changing admin authorization or Staff scope policy.
- Changing backend admin user actions.

## Tasks

### Task 1 - Extract Reusable Row Actions

- **Files**: `app/[locale]/admin/users/users-management-client.tsx`
- **Action**: Reuse one row-action renderer for desktop table and mobile cards.
- **Status**: Completed.

### Task 2 - Add Mobile Record Cards

- **Files**: `app/[locale]/admin/users/users-management-client.tsx`
- **Action**: Add a `md:hidden` record list with identity, role, chapter, profile status, created date, selection checkbox, profile link, role dropdown, and activate/deactivate action.
- **Status**: Completed.

### Task 3 - Keep Desktop Table Desktop-Only

- **Files**: `app/[locale]/admin/users/users-management-client.tsx`
- **Action**: Wrap existing table in `hidden md:block` so mobile uses the card pattern while desktop retains scan density.
- **Status**: Completed.

### Task 4 - Validate And Capture Evidence

- **Action**:
  - Run typecheck, lint, and tests.
  - Capture `/es/admin/users` mobile screenshot as `admin@test.com`.
  - Record width metrics.
- **Status**: Completed.

## Validation

- `pnpm exec tsc --noEmit --pretty false` - passed.
- `pnpm run lint` - passed with 0 errors and existing warnings.
- `pnpm test` - passed, 59 files and 526 tests.
- Playwright screenshot at `390 x 844` for `/es/admin/users`:
  `outputs/issue-312-admin-users-mobile/admin-es-admin-users-390-after.png`.

## Definition Of Done

- [x] Admin users mobile shows role, chapter, profile status, and row actions without horizontal table scanning.
- [x] Desktop table remains available on `md` and wider screens.
- [x] Selection, role update, deactivate/reactivate, profile link, filters, export, and pagination still render.
- [x] Mobile screenshot evidence is captured and linked in the issue/report.
