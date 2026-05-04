# Plan: LEAD-077 Student Event Registration Status And QR Flow

## Summary

Redesign the authenticated student event-status journey against `docs/handbook/UI_UX.md`. The implementation should turn `/student/events` into a clear mobile-first status and check-in pass surface: current registration state first, QR code easy to present, application review states short and understandable, and cancelled/past activity still available without overwhelming the primary workflow. Preserve the existing event registration, QR token, cancel-registration, and check-in service/action behavior.

## User Story

As a registered student,
I want to see my event status and QR code quickly,
So that I know what happens next and can check in smoothly on my phone.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #77 |
| Type | Enhancement / UI |
| Complexity | Medium |
| Phase | Active PIV Loop |
| Systems Affected | Student events, registration status, QR display, cancellation dialog, loading/error states |
| Behavior Scope | Preserve existing service/action/check-in behavior |

## Foundation Contract

Follow `docs/handbook/UI_UX.md`:

- Authenticated app surfaces use the shared sidebar-first product shell.
- Student event registration/status and QR display are mobile-first workflows.
- Page headers should be stable and literal; avoid public-page hero scale in operational pages.
- Registration status labels must be consistent: registered, pending review, rejected, cancelled, attended, checked in.
- QR content must not overlap or overflow on common phone widths.
- Cards are allowed for repeated student event records and bounded ticket/QR tools.
- Loading, empty, error, status, and mobile overflow states must be explicit.

## Codebase Patterns To Follow

### Student Events Route

Sources:

- `app/[locale]/student/events/page.tsx:50` - current local `EventRegistrationCard`.
- `app/[locale]/student/events/page.tsx:126` - server page fetches `getMyRegistrations()`.
- `app/[locale]/student/events/page.tsx:140` - QR data URLs are generated from existing `qr_token`.
- `app/[locale]/student/events/page.tsx:151` - registrations are grouped into upcoming/pending/past/cancelled.
- `app/[locale]/student/events/page.tsx:305` - current tabs organize registration groups.

Pattern:

- Keep `/student/events` as a server-rendered authenticated page.
- Keep QR generation server-side with `qrcode`.
- Keep `ScrollToHighlightedEvent` support for post-registration redirects.
- Do not introduce client fetching for the registration list.

### Registration Data And Actions

Sources:

- `lib/actions/events/get-data.ts:24` - `getMyRegistrations()` is a thin action requiring auth.
- `lib/services/event.service.ts:1066` - `EventService.getMyRegistrations()` reads `event_registration_with_event`.
- `lib/services/event.service.ts:1137` - service returns `qr_token`.
- `lib/actions/events/cancel-registration.ts:7` - cancel action requires auth and delegates to service.
- `lib/services/event.service.ts:765` - `EventService.cancelRegistration()` owns cancellation rules.

Pattern:

- Preserve service/action boundaries.
- Do not change registration status transitions, QR token issuance, or cancellation rules.
- UI can improve how statuses are grouped and displayed.

### Status Badge Semantics

Sources:

- `components/events/registration-status-badge.tsx:14` - shared status label/variant map.
- `docs/handbook/UI_UX.md` - registration status badge semantics.

Observed issue:

- `pending_review` currently uses `secondary`; handbook semantics prefer `warning` for pending review.
- There is no explicit UI-level "checked in" label; database uses `status = attended` and/or `checked_in_at`.

Pattern:

- Update badge semantics carefully without changing `RegistrationStatus`.
- Derive "Checked in" display state from `checked_in_at` or `status === 'attended'` in presentation code only.

### Existing UI To Refactor

Sources:

- `app/[locale]/student/events/page.tsx:190` - current page uses oversized hero typography.
- `app/[locale]/student/events/page.tsx:216` - current discover-events card competes with status workflow.
- `app/[locale]/student/events/page.tsx:231` - current next-event card uses decorative gradients/rotation.
- `app/[locale]/student/events/page.tsx:470` - recent activity is visually heavy for a secondary context panel.
- `app/[locale]/student/events/loading.tsx` - loading skeleton no longer matches expected app-page anatomy.
- `app/[locale]/student/events/error.tsx` - error state is minimal and not page-shell aligned.

Observed issues:

- The page feels like a marketing dashboard instead of a student ticket/status wallet.
- QR is present, but the page does not consistently explain when QR is unavailable for pending/rejected/cancelled states.
- "Upcoming" count excludes the next highlighted event inside the tabs, which can read as inconsistent.
- Secondary resources such as campus map are placeholder-like and should not distract from the flow.
- Status and next action need clearer mobile priority.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `app/[locale]/student/events/page.tsx` | UPDATE | Redesign student event status/QR pass, grouping, empty states, and mobile-first action layout. |
| `components/events/registration-status-badge.tsx` | UPDATE | Align registration badge variants/labels with handbook semantics; support derived checked-in display if needed. |
| `components/events/cancel-registration-dialog.tsx` | UPDATE | Lightly align destructive confirmation copy/actions if needed; preserve action behavior. |
| `app/[locale]/student/events/loading.tsx` | UPDATE | Align skeleton with redesigned page anatomy. |
| `app/[locale]/student/events/error.tsx` | UPDATE | Align error state with handbook standard error pattern. |
| `.github/plans/lead-077-student-event-registration-status-qr-flow.plan.md` | UPDATE | Track task completion and validation evidence. |

## Tasks

### Task 1: Redesign Page Header And Primary Status Pass - Completed

- **Files**:
  - `app/[locale]/student/events/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Replace hero-scale copy with a compact authenticated page header: title `My Events`, short status context, primary action to browse events.
  - Make the primary content a "next event / current ticket" surface when a registered upcoming event exists.
  - QR should be prominent, stable, high-contrast, and sized with responsive constraints.
  - Show event title, date/time, location/meeting context, current status, and next action in one predictable object header.
  - Preserve `ScrollToHighlightedEvent`.
- **Mirror**:
  - `docs/handbook/UI_UX.md` page header, action placement, registration status, and QR mobile rules.
  - Current QR generation in `app/[locale]/student/events/page.tsx:140`.
- **Validate**: `pnpm build`

### Task 2: Clarify Registration Status Groups And Cards - Completed

- **Files**:
  - `app/[locale]/student/events/page.tsx`
  - `components/events/registration-status-badge.tsx`
- **Action**: UPDATE
- **Implement**:
  - Keep status groups for upcoming/active, pending review, past, and cancelled, but make counts consistent with visible content.
  - For `registered`, show "QR ready" when `qr_token` exists and "Registration confirmed" when QR is missing.
  - For `pending_review`, use short copy: "Application submitted. Editors will email you after review."
  - For `rejected`, use short copy: "Not selected for this event."
  - For `cancelled`, make the state clearly inactive and remove QR display.
  - For `attended` or `checked_in_at`, display "Checked in" or "Attended" consistently without changing database status.
  - Ensure card text wraps cleanly for long titles, locations, and chapter/event names.
- **Mirror**:
  - `components/events/registration-status-badge.tsx:14`.
  - `docs/handbook/UI_UX.md` badge variant semantics.
- **Validate**: `pnpm build`

### Task 3: Simplify Secondary Panels And Empty States - Completed

- **Files**:
  - `app/[locale]/student/events/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Remove placeholder-like resources that are not real workflow actions.
  - Keep a small help/context panel only if it directly supports registration, QR presentation, cancellation, or profile readiness.
  - Add a strong empty state for no registrations with a browse-events action.
  - Keep recent activity lightweight or remove it if the tabbed groups already answer the workflow.
  - Avoid cards inside cards and avoid decorative dashboard filler.
- **Mirror**:
  - `docs/handbook/UI_UX.md` cards/lists, empty states, and mobile-first workflows.
- **Validate**: `pnpm build`

### Task 4: Align Loading, Error, And Destructive Confirmation States - Completed

- **Files**:
  - `app/[locale]/student/events/loading.tsx`
  - `app/[locale]/student/events/error.tsx`
  - `components/events/cancel-registration-dialog.tsx`
- **Action**: UPDATE
- **Implement**:
  - Loading skeleton should match the compact page header, primary ticket, and grouped list layout.
  - Error state should use a centered bounded card with clear retry and browse-events fallback when useful.
  - Cancel dialog copy should say exactly what changes and keep the destructive action visually clear.
  - Do not change `cancelRegistration()` behavior.
- **Mirror**:
  - Existing dialog/action behavior in `components/events/cancel-registration-dialog.tsx`.
  - Handbook standard states and destructive confirmation rules.
- **Validate**: `pnpm build`

### Task 5: Validate And Update GitHub - Completed

- **File**: GitHub issue #77
- **Action**: UPDATE
- **Implement**:
  - Run `pnpm build`.
  - Run `pnpm lint`.
  - Run event-related focused tests if available:
    - `pnpm vitest run lib/actions/events/__tests__/register.helpers.test.ts lib/services/__tests__/event.service.test.ts`
  - Light route checks:
    - `http://127.0.0.1:3000/en/student/events`
    - If auth redirects or blocks local route output, record the observed behavior.
  - Add a GitHub comment with changed files and validation.
  - Add/keep `has-plan`.
  - Close #77 if acceptance criteria are met.
- **Validate**:
  - `gh issue view 77 --repo abigailbrionesa/leadtalentplatform-latest --json state,labels`

## Validation

Primary validation:

```bash
pnpm build
pnpm lint
pnpm vitest run lib/actions/events/__tests__/register.helpers.test.ts lib/services/__tests__/event.service.test.ts
```

Results:

- `pnpm build` - passed, including `/[locale]/student/events`.
- `pnpm lint` - passed with existing warnings only.
- `pnpm vitest run lib/actions/events/__tests__/register.helpers.test.ts lib/services/__tests__/event.service.test.ts` - passed, 2 files / 67 tests.
- Local anonymous route check: `http://127.0.0.1:3000/en/student/events` returned `307` to `/en/auth/login`, expected for an authenticated student route.

Visual QA expectation:

- Desktop: `/student/events`.
- Mobile: `/student/events`.
- Confirm registered upcoming event QR is easy to find and scan.
- Confirm pending/rejected/cancelled states are clear and do not show usable QR.
- Confirm attended/checked-in state is distinguishable from active registration.
- Confirm long event titles and locations wrap without overlapping buttons or QR content.
- Confirm destructive cancellation remains behind a dialog.

## Acceptance Criteria Mapping

- [x] Registered, pending review, rejected, cancelled, attended, and checked-in states are clear.
- [x] QR-enabled check-in is easy to find and use on a phone.
- [x] Application pending/rejected messaging is short and understandable.
- [x] Existing event registration/check-in/cancellation services and tests remain unchanged.
- [x] Common phone widths do not overflow status or QR content.

## Out Of Scope

- Editor/operator check-in scanner redesign (#81).
- Event discovery/detail redesign already completed in #75.
- Changing event registration service behavior.
- Changing QR token generation/storage.
- Adding calendar integrations or placeholder resources.
- Full student dashboard redesign outside `/student/events`.

## Recommended Next Step

Implement #77, validate the student status/QR pass, then continue to #78 chapter editor dashboard and event management.
