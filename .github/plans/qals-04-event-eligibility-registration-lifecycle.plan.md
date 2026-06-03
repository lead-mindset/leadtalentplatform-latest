# QALS-04 Plan: Event Eligibility and Registration Lifecycle

GitHub issue: #286

## Objective

Move event registration eligibility into enforceable server-side behavior and mirror the same decision in the event-detail UI. Alumni and other non-active members must not be able to register, apply, revive cancelled registrations, or obtain QR/check-in state for events marked for active members.

## Scope

- Event registration and application service gates.
- Event registration server action feedback.
- Public event detail registration UI disabled state.
- Targeted regression tests for active-member-only eligibility and existing registration lifecycle behavior.

## Tasks

- [x] Inspect event registration action, service, preflight helper, event detail page, and checkout component.
- [x] Add service-level eligibility checks before new/revived registration and application rows are created.
- [x] Use existing event Pathway audience metadata as the launch active-member-only signal.
- [x] Pass eligibility state to the event detail checkout UI and show Spanish blocked copy.
- [x] Keep open events available to users with a basic profile and no chapter membership.
- [x] Run targeted action/service tests and type validation.
- [x] Comment validation evidence on GitHub issue #286.

## Validation

- `pnpm exec vitest run lib/services/__tests__/event.service.test.ts lib/actions/events/__tests__/register.test.ts`
- `pnpm exec tsc --noEmit`

## Notes

- Event `access_model` currently only distinguishes `open` and `application`; the launch active-member-only signal comes from `event_pathway_metadata.audience = active_member`.
- A future schema slice can promote audience/eligibility into first-class event fields if leadership wants stricter event types beyond launch.
