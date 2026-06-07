# Issue #313 - Student Events Mobile Ticket And Tabs

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/313

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Problem

The mobile student events page clips the active ticket and horizontal tab states at 390px. The QR itself is readable, but the surrounding card and tab row make the page feel wider than the phone.

## Scope

In scope:

- Add mobile-safe width constraints for the current ticket card, QR panel, status message, tab list, and page grid.
- Preserve QR generation, registration data, cancellation logic, calendar actions, and route behavior.
- Capture before/after mobile screenshots for `member@test.com` on `/es/student/events`.

Out of scope:

- Redesigning admin/chapter mobile views.
- Changing event registration/cancellation behavior.
- Changing the QR payload or storage.

## Tasks

### Task 1 - Constrain Ticket And QR Containers

- **Files**: `app/[locale]/student/events/page.tsx`
- **Action**: Add `min-w-0`, `max-w-full`, and mobile-safe QR constraints to prevent the current ticket card from forcing horizontal width.
- **Status**: Completed. Ticket, QR, and parent grid containers now declare mobile-safe width constraints.

### Task 2 - Make Status Message And Actions Wrap Safely

- **Files**: `app/[locale]/student/events/page.tsx`
- **Action**: Let badges/message bodies stack on narrow screens and ensure action buttons cannot exceed the card.
- **Status**: Completed. Status/message rows stack on narrow screens and action rows stay within the card.

### Task 3 - Replace Clipped Mobile Tabs With Wrapping Tabs

- **Files**: `app/[locale]/student/events/page.tsx`
- **Action**: Allow tab triggers to wrap into a stable mobile grid/wrap pattern instead of hiding later states off-canvas.
- **Status**: Completed. Mobile tabs now use an explicit grid so all states remain visible inside the viewport.

### Task 4 - Validate And Capture Evidence

- **Action**:
  - Run typecheck, lint, and tests.
  - Capture `/es/student/events` mobile screenshot as `member@test.com`.
  - Add validation report.
- **Status**: Completed. Validation report created at `.github/reports/issue-313-student-events-mobile-ticket-tabs-report.md`.

## Validation

- `pnpm exec tsc --noEmit --pretty false`
- `pnpm run lint`
- `pnpm test`
- Playwright screenshot at `390 x 844` for `/es/student/events`.

## Definition Of Done

- [x] Active ticket card fits within 390px viewport.
- [x] QR panel fits within the ticket card without clipping.
- [x] Tabs expose `Activos`, `Postulaciones`, and `Historial` without cutting off the last tab.
- [x] No registration behavior changes.
- [x] Screenshot evidence is captured and linked in the issue/report.
