# Plan: LEAD-081 Event Check-In Operator Flow Redesign

## Summary

Redesign the editor check-in workflow for fast door operation on phone/tablet/desktop while preserving the LEAD-020 service behavior. The scanner should make QR scan, manual lookup, attendee confirmation, success feedback, duplicate feedback, invalid-registration explanations, and live registered/attended counts obvious without adding new check-in rules.

## User Story

As a chapter editor operating event check-in,
I want fast scan/manual lookup paths and clear attendee status feedback,
So that I can admit registered attendees quickly and recover from invalid QR or registration states.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #81 |
| Parent | #29 LEAD-028 Professional UI/UX Redesign Scope |
| Type | Enhancement / UI |
| Complexity | Medium |
| Phase | Active PIV Loop |
| Systems Affected | Chapter check-in hub, event check-in route, check-in scanner, loading/error states |
| Behavior Scope | Preserve existing service/action/auth behavior |

## Foundation Contract

Follow `docs/handbook/UI_UX.md`:

- Check-in is a mobile/tablet-critical workflow.
- Primary action must be easy to reach and obvious.
- Status feedback must not rely on color alone.
- QR/status areas must be usable on common phone widths.
- Do not hide error recovery behind hover-only interactions.
- Keep event-scoped authorization in existing server actions/services.

## Codebase Patterns To Follow

### Check-In Routes

Sources:

- `app/[locale]/chapter/checkin/page.tsx` - chapter check-in hub, loads `getChapterEvents()`, selects event via `eventId`, gets counter, renders `CheckinScanner`.
- `app/[locale]/chapter/events/[id]/checkin/page.tsx` - event-specific check-in route, calls `assertCanManageEvent(id)`, gets counter, renders `CheckinScanner`.
- `app/[locale]/chapter/events/[id]/page.tsx` and `app/[locale]/chapter/events/page.tsx` - recent page-header/action patterns for chapter event workflows.

Pattern:

- Keep server-side access and data fetches.
- Preserve `getChapterEvents()`, `assertCanManageEvent()`, and `getCheckInCounter()`.
- Align route wrappers with the redesigned chapter event workflow.
- Keep selected event context explicit.

### Scanner Client

Sources:

- `app/[locale]/chapter/events/_components/checkin-scanner.tsx` - owns camera scanning, manual QR token lookup, attendee search, pending confirmation, status feedback, counter polling, wake lock.
- `lib/actions/events/checkin.ts` - thin action layer for `resolveCheckInCandidate`, `searchAttendeesForCheckIn`, `checkInAttendee`, and `getCheckInCounter`.
- `lib/services/event.service.ts` - check-in business rules and returned messages.

Pattern:

- Preserve camera scan, manual token lookup, attendee search, pending confirmation, counter polling, and wake lock.
- Improve layout and state language only.
- Keep invalid/duplicate/pending/rejected/cancelled explanations sourced from existing action/service returns.
- Avoid introducing a new QR library or browser API dependency.

### Service And Tests

Sources:

- `lib/services/event.service.ts` - `resolveCheckInCandidate()` returns ready, already checked in, or error.
- `lib/services/event.service.ts` - `checkInAttendee()` only checks in `registered` registrations.
- `lib/services/event.service.ts` - `getCheckInCounter()` counts `registered` + `attended` as total, `attended` as checked in.
- `lib/services/__tests__/event.service.test.ts` - covers pending-review rejection, already checked-in, registered success, rejected/cancelled blocking.

Pattern:

- Do not change accepted registration statuses in #81.
- If service error copy is adjusted, keep tests aligned and focused.
- Prefer UI explanation for invalid states unless service behavior is objectively wrong.

## Observed Issues

- The chapter check-in hub has a narrow card wrapper and does not feel optimized for event-door operation.
- Event-specific check-in wrapper is inconsistent with recent chapter event pages.
- Scanner path hierarchy is soft: search, camera scan, and pasted QR token are all separate cards without a clear operating mode.
- Success copy includes corrupted characters in the current checked-in message.
- Invalid state feedback is technically present but not framed for operator recovery.
- Counts are visible but could be more glanceable for door staff.
- Loading and error states are minimal and not aligned with recent redesigned pages.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `app/[locale]/chapter/checkin/page.tsx` | UPDATE | Redesign chapter check-in hub, selected event context, event selector, and stats framing. |
| `app/[locale]/chapter/events/[id]/checkin/page.tsx` | UPDATE | Align event-specific check-in shell and missing/access state. |
| `app/[locale]/chapter/events/_components/checkin-scanner.tsx` | UPDATE | Redesign operator scanner UI, status feedback, confirmation, search, camera, and manual token areas. |
| `app/[locale]/chapter/checkin/loading.tsx` | UPDATE | Match redesigned check-in hub skeleton. |
| `app/[locale]/chapter/checkin/error.tsx` | UPDATE | Provide retry and safe route back to chapter events. |
| `app/[locale]/chapter/events/[id]/checkin/loading.tsx` | UPDATE | Match redesigned event check-in skeleton. |
| `app/[locale]/chapter/events/[id]/checkin/error.tsx` | UPDATE | Provide retry and safe route back to chapter events. |
| `.github/plans/lead-081-event-check-in-operator-flow-redesign.plan.md` | UPDATE | Track task completion and validation evidence. |

## Tasks

### Task 1: Redesign Check-In Route Shells - Complete

- **Files**:
  - `app/[locale]/chapter/checkin/page.tsx`
  - `app/[locale]/chapter/events/[id]/checkin/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Preserve existing route data and access calls.
  - Add compact operational headers with selected event title and back links.
  - Make registered/attended counts visible near event context.
  - Keep chapter hub event selector practical and dense.
  - Handle no selected/upcoming event with clear empty state.
- **Mirror**:
  - `app/[locale]/chapter/events/[id]/page.tsx` and `app/[locale]/chapter/events/page.tsx` page anatomy.
- **Validate**: `pnpm build`

### Task 2: Redesign Scanner Operating Flow - Complete

- **Files**:
  - `app/[locale]/chapter/events/_components/checkin-scanner.tsx`
- **Action**: UPDATE
- **Implement**:
  - Preserve all client state and action calls.
  - Make primary operating paths explicit: scan camera, manual search, paste token fallback.
  - Make the counter/card glanceable with attended/registered and percentage.
  - Improve success/duplicate/error/neutral messages, removing corrupted characters.
  - Make pending confirmation prominent and mobile-friendly.
  - Keep search results dense with status labels and clear check-in/view action.
- **Mirror**:
  - Existing scanner state machine.
  - `components/events/application-review-card.tsx` dense record/status feedback pattern.
- **Validate**: `pnpm build`

### Task 3: Align Loading And Error States - Complete

- **Files**:
  - `app/[locale]/chapter/checkin/loading.tsx`
  - `app/[locale]/chapter/checkin/error.tsx`
  - `app/[locale]/chapter/events/[id]/checkin/loading.tsx`
  - `app/[locale]/chapter/events/[id]/checkin/error.tsx`
- **Action**: UPDATE
- **Implement**:
  - Loading skeletons should match check-in page anatomy: header, stats, scanner panel, event selector where applicable.
  - Error states should include retry and safe chapter events route.
  - Keep copy short and operator-focused.
- **Mirror**:
  - Recent `chapter/events` and `applications` loading/error states.
- **Validate**: `pnpm build`

### Task 4: Validate And Close GitHub Issue - Complete

- **Files**:
  - `.github/plans/lead-081-event-check-in-operator-flow-redesign.plan.md`
  - GitHub issue #81
- **Action**: UPDATE
- **Implement**:
  - Run validation and record results in this plan.
  - Comment on #81 with changed files and validation evidence.
  - Add/keep `has-plan`.
  - Close #81 if acceptance criteria are met.
- **Validate**:
  - `gh issue view 81 --repo abigailbrionesa/leadtalentplatform-latest --json state,labels`

## Validation

Primary validation:

```bash
pnpm build
pnpm lint
pnpm vitest run lib/services/__tests__/event.service.test.ts
```

Results:

- `pnpm vitest run lib/services/__tests__/event.service.test.ts` - passed, 1 file / 63 tests.
- `pnpm lint` - passed with existing warnings only.
- `pnpm build` - passed after preserving the typed `assertCanManageEvent()` event contract.

Route checks:

```bash
http://127.0.0.1:3000/en/chapter/checkin
http://127.0.0.1:3000/en/chapter/events/{id}/checkin
```

Expected behavior:

- Anonymous users remain blocked by chapter/event management auth flow.
- Valid registered QR/manual lookup can be confirmed.
- Already attended registrations show duplicate/neutral feedback.
- Pending-review, rejected, cancelled, invalid, or wrong-event tokens do not check in.

Visual QA expectation:

- Mobile/tablet: primary scanner/search actions remain reachable.
- Desktop: counts and event selector are visible without clutter.
- Long attendee names/emails/event titles wrap or truncate intentionally.
- Status messages include icon/text and do not rely on color alone.
- Camera fallback is clear when BarcodeDetector is unavailable.

## Acceptance Criteria Mapping

- [x] Scanning and manual lookup paths are obvious when an event is active.
- [x] Valid QR/manual check-in success feedback is immediate and clear.
- [x] Invalid, duplicate, rejected, cancelled, and pending-review states explain the problem.
- [x] Registered/attended counts are visible without clutter.
- [x] Mobile/tablet operator flow remains usable at common widths.

## Implementation Notes

- Redesigned the chapter check-in hub around selected event context, attended/registered/progress stats, scanner panel, and a compact event selector.
- Redesigned the event-specific check-in route with the same operator shell, access-denied recovery, and side notes for blocked states.
- Reworked `CheckinScanner` UI while preserving the existing camera, token lookup, attendee search, confirmation, counter polling, wake lock, and service/action behavior.
- Added explicit copy for invalid, duplicate, pending, rejected, cancelled, and wrong-event recovery without changing check-in status rules.
- Aligned loading and error states with the redesigned check-in anatomy.

## Out Of Scope

- Changing event registration status rules.
- Adding a new QR scanning dependency.
- Adding offline mode.
- Adding attendee export or analytics.
- Redesigning student QR pass.

## Recommended Next Step

Implement #81, validate the check-in flow, then continue with the next UI/UX issue in the LEAD-028 sequence.
