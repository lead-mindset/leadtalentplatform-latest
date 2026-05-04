# Plan: LEAD-020 Stabilize Event Check-In Flow On New Model

## Summary

Stabilize QR and manual event check-in against the new account model. The current implementation already has service methods, server actions, check-in pages, scanner UI, and service tests. This plan focuses on proving the end-to-end contract: attendees are identified by `event_registration.user_id` and `user`, editors are authorized by approved chapter membership plus host/collaborator event access, and check-in updates remain idempotent and auditable.

## User Story

As a chapter editor,
I want QR and manual check-in to work with the new account model,
So that event attendance is tracked reliably.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #21 |
| Type | Feature stabilization |
| Complexity | Medium |
| Systems Affected | Event check-in service, event check-in actions, scanner UI, chapter check-in pages, tests |
| Dependencies | LEAD-014, LEAD-016 |
| Blocks | None |

## Problem

Check-in must no longer assume attendee chapter membership or legacy `student_profile`. Participants may be public attendees with only `person_profile`, while editors still need approved chapter membership and event manager access through host/collaborator scope. QR and manual check-in should both update the event registration row with `status = attended`, `checked_in_at`, and `checked_in_by_id`, and attendance reporting must stay linked to the canonical `user` and `event_registration` records.

## Codebase Findings

### Service Layer

Source: `lib/services/event.service.ts`

The check-in service surface already exists:

- `getCheckInCounter()` counts `registered` + `attended` registrations and checked-in `attended` rows.
- `resolveCheckInCandidate()` resolves a QR token to a registration, fetches attendee identity from `user`, returns ready/already-checked-in/error states, and rejects non-`registered` statuses.
- `searchAttendeesForCheckIn()` searches `user` by name/email, then intersects results with eligible event registrations.
- `checkInAttendee()` loads registration by `registrationId` + `eventId`, fetches attendee identity from `user`, rejects non-registered rows, updates `event_registration.status`, `checked_in_at`, and `checked_in_by_id`, and returns updated counter state.

Gap: tests should explicitly assert no attendee chapter membership/profile table is required and that update payload contains the audit fields.

### Action Boundary

Source: `lib/actions/events/checkin.ts`

Server actions are already thin:

- Parse `FormData`.
- Call `assertCanManageEvent(eventId)`.
- Delegate to `EventService`.
- Revalidate event/check-in paths after successful check-in.

Access is inherited from LEAD-016 / LEAD-019 through `canUserManageEvent()`, so host and collaborator editors are allowed while unrelated editors are denied.

Gap: add action/helper tests if practical, or at minimum add focused tests around the shared access helper and service-level behavior. Avoid duplicating service logic in actions.

### UI

Source: `app/[locale]/chapter/events/[id]/checkin/page.tsx`

Event-specific check-in page uses `assertCanManageEvent()` and renders `CheckinScanner` only when access succeeds.

Source: `app/[locale]/chapter/checkin/page.tsx`

Chapter-wide check-in page loads `getChapterEvents()`, which now includes collaborated events from LEAD-019, then renders `CheckinScanner` for the selected/upcoming event.

Source: `app/[locale]/chapter/events/_components/checkin-scanner.tsx`

Scanner supports:

- Browser QR scanning through `BarcodeDetector`.
- Manual token entry via `qrToken`.
- Manual attendee search via `searchAttendeesForCheckIn()`.
- Confirmation before check-in.
- Counter refresh and idempotent already-checked-in messaging.

Gap: UI can remain mostly unchanged unless tests/build expose drift. There is an existing lint warning for an unused `react-hooks/exhaustive-deps` disable in this file; fix it if touching the file.

### Tests

Source: `lib/services/__tests__/event.service.test.ts`

Existing service tests cover:

- Counter counts.
- QR candidate ready/already checked in/missing.
- Manual search.
- Check-in success/already checked in/missing/not registered/update failure.

Gap: LEAD-020 should add explicit assertions for the new model:

- attendee identity comes from `user`, not `student_profile` or `chapter_membership`.
- manual search only returns `registered`/`attended` registrations.
- check-in update writes `status: attended`, `checked_in_at`, and `checked_in_by_id`.
- pending-review/rejected/cancelled registrations are not eligible.

## Design

### Scope

Keep this as a stabilization issue:

- No schema migration unless Docker Supabase validation exposes a real constraint mismatch.
- No UI redesign.
- No attendee chapter-membership requirement.
- Keep editor authorization centralized in `assertCanManageEvent()` / `canUserManageEvent()`.

### Service Contract

`EventService.checkInAttendee()` should remain the source of truth for check-in state transitions:

- Input: `registrationId`, `eventId`, `checkedInById`.
- Eligible state: `registered`.
- Output state: `attended`.
- Audit: `checked_in_at` and `checked_in_by_id` set together.
- Idempotency: existing `attended`/checked-in rows return `already_checked_in`.
- Identity: attendee payload read from `user`, with fallback labels only when user read fails.

### Access Contract

Actions should continue to:

- deny guests/non-editors via `requireUser()` + `canUserManageEvent()`.
- allow admins.
- allow editors for owner chapter events.
- allow editors for collaborator chapter events.
- deny unrelated editors.

LEAD-019 already locks most collaborator authorization. LEAD-020 should reference those tests and add check-in-specific validation only where needed.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/services/__tests__/event.service.test.ts` | Update | Add explicit new-model check-in assertions for user-linked attendance, eligible statuses, and audit update payload. |
| `lib/actions/events/checkin.ts` | Update if needed | Keep actions thin and ensure every path delegates access and service logic. |
| `app/[locale]/chapter/events/_components/checkin-scanner.tsx` | Update if needed | Fix small scanner UX/lint issues discovered during validation. |
| `docs/handbook/TESTING.md` | Update if needed | Add manual check-in validation with seeded editor/member/public participant personas. |
| `.github/plans/lead-020-stabilize-event-check-in-flow-on-new-model.plan.md` | Create | Track implementation tasks and validation evidence. |

## Tasks

- [x] Confirm QR candidate resolution reads attendee identity from `user` and does not touch `student_profile` or `chapter_membership`.
- [x] Confirm manual attendee search reads `user` first, then filters by event registrations with `registered`/`attended` statuses.
- [x] Add/strengthen service tests for QR-ready, already-checked-in, pending-review rejection, and missing registration states.
- [x] Add/strengthen service tests for manual search eligibility and user-linked attendance reporting.
- [x] Add/strengthen service tests that check-in writes `status: attended`, `checked_in_at`, and `checked_in_by_id`.
- [x] Confirm check-in actions deny unauthorized editors through `assertCanManageEvent()` and do not duplicate business logic.
- [x] Confirm event-specific and chapter-wide check-in pages use host/collaborator event access from LEAD-019.
- [x] Fix any small check-in scanner lint/UX drift found during validation.
- [x] Run focused validation: `pnpm vitest run lib/services/__tests__/event.service.test.ts lib/auth.test.ts`.
- [x] Run architecture guard: `pnpm vitest run tests/architecture.test.ts`.
- [x] Run full validation: `pnpm test`, `pnpm lint`, and `pnpm build`.
- [x] Comment on Issue #21 with implementation summary and validation results.

## Validation

```bash
pnpm vitest run lib/services/__tests__/event.service.test.ts lib/auth.test.ts
pnpm vitest run tests/architecture.test.ts
pnpm test
pnpm lint
pnpm build
```

Latest validation:

- `pnpm vitest run lib/services/__tests__/event.service.test.ts lib/auth.test.ts` passed: 2 files, 73 tests.
- `pnpm vitest run tests/architecture.test.ts` passed: 1 file, 5 tests.
- `pnpm test` passed: 15 files, 220 tests.
- `pnpm lint` passed with 98 warnings, 0 errors.
- `pnpm build` passed.

Implementation notes:

- Added new-model check-in service tests proving attendee identity is read from `user`, not `student_profile` or `chapter_membership`.
- Added explicit eligibility assertions for manual search status filtering and non-eligible registration states.
- Added audit-field assertions for `status: attended`, `checked_in_at`, and `checked_in_by_id`.
- Removed an unused `react-hooks/exhaustive-deps` suppression from the check-in scanner.

## GitHub Follow-Up

- Add/keep `has-plan` on Issue #21.
- Comment with this plan path: `.github/plans/lead-020-stabilize-event-check-in-flow-on-new-model.plan.md`.
- Close Issue #21 only after focused and full validation pass.
