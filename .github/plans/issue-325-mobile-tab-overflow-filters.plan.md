# Issue #325 - Mobile Tab Overflow Filters

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/325

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Problem

Mobile surfaces with many tab states can hide critical states behind horizontal scrolling or cramped controls. Student events and chapter members have already moved away from horizontal overflow in this branch; the live admin users page uses dropdown filters, but its mobile filter triggers rendered as content-width buttons instead of an intentional full-width filter stack.

## Scope

In scope:

- Make the live admin users filter triggers full-width and clearly scannable on mobile.
- Keep the existing dropdown filter behavior and query parameters.
- Add focused browser validation and screenshot evidence at 390px.

Out of scope:

- Redesigning all filtering primitives.
- Changing the admin users data model or role queries.
- Reworking already-fixed student events or chapter members filters.

## Tasks

### Task 1 - Mobile Admin User Role Filter

- **Files**: `app/[locale]/admin/users/users-management-client.tsx`
- **Action**: Render role, chapter, and profile filter triggers as full-width controls in the mobile grid.
- **Status**: Complete.

### Task 2 - Browser Evidence

- **Files**: `tests/e2e/admin-users-mobile-filter-hierarchy.spec.ts`, `outputs/issue-325-mobile-tab-overflow-filters/*`
- **Action**: Validate `/es/admin/users` at 390px has no hidden role labels and capture a screenshot.
- **Status**: Complete.

### Task 3 - Validate

- **Action**: Run focused Playwright, typecheck, lint, and full tests.
- **Status**: Complete.

## Validation

- `PLAYWRIGHT_BASE_URL=http://localhost:3104 pnpm exec playwright test tests/e2e/admin-users-mobile-filter-hierarchy.spec.ts --project=desktop-chromium --reporter=line`
- `pnpm exec tsc --noEmit --pretty false`
- `pnpm run lint`
- `pnpm test`

## Definition Of Done

- [x] Admin users mobile filters show explicit labels at 390px.
- [x] No horizontal tab overflow is required for role filtering.
- [x] Existing dropdown filter workflow remains available.
- [x] Screenshot and validation evidence are captured.
