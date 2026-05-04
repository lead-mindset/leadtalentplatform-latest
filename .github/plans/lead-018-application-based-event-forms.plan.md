# Plan: LEAD-018 Application-Based Event Forms

## Summary

Implement the user-facing application-event flow on top of the existing event application foundation. The database tables, service helpers, event actions, and registration answer persistence already exist, so this plan focuses on hardening the editor question builder, participant apply modal, registration validation, and editor review surface as one vertical slice.

## User Story

As an event organizer,
I want application-based events to collect custom answers,
So that editors can evaluate attendees before approval.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #19 |
| Type | Feature |
| Complexity | Medium |
| Systems Affected | Event form UI, event application modal, event registration service/action, application review UI, service tests |
| Dependencies | LEAD-009, LEAD-014, LEAD-016 |
| Blocks | None |

## Problem

Application-based events need native V1 questions and answers, not only external form links. Editors must be able to create and edit ordered questions, participants must be blocked when required answers are missing, valid applications must create a pending-review event registration and persist answers by registration, and chapter editors must see answers while reviewing applications.

## Codebase Findings

### Existing Application Foundation

Source: `lib/services/event-application.service.ts`

`EventApplicationService` already normalizes question order, validates V1 question types, saves answers against `event_application_answer.registration_id`, validates required/select/checkbox/URL answers, and fetches answers ordered by question `sort_order`.

Source: `lib/services/event.service.ts`

`EventService.applyForEvent()` already loads native questions, validates submitted answers, inserts `event_registration.status = 'pending_review'`, saves answers, rolls back the registration if answer persistence fails, and preserves newsletter subscription behavior.

Note: Issue #19 says `status = pending`; the current canonical registration status is `pending_review`. LEAD-018 should treat `pending_review` as the implemented pending-application state unless the enum is intentionally migrated in a separate database change.

### Current Editor Event Form

Source: `app/[locale]/chapter/events/_components/event-form.tsx`

The event form already contains an application question builder with V1 question types, required toggles, options text areas, add/remove controls, and up/down ordering controls. Create/update actions already receive `applicationQuestions` and call `EventApplicationService.upsertQuestionsForEvent()` for application events.

Gap: the implementation needs an end-to-end verification pass for edit-mode hydration, order persistence after reordering, client validation parity with service validation, and safe behavior when questions with submitted answers are removed.

### Current Participant Apply Flow

Source: `components/events/apply-modal.tsx`

`ApplyModal` already renders native short text, long text, single select, checkbox, and URL questions and submits answer payloads.

Gap: required-answer validation is currently service-enforced but not client-visible before submit. Add lightweight client validation so missing required answers are blocked in the modal before calling the action, while keeping service validation authoritative.

Source: `app/[locale]/events/[id]/_components/EventContent.tsx`

The event detail component already routes guests to login, routes authenticated users without `person_profile` to onboarding, opens the application modal for application events, and passes modal answers to `applyForEvent()`.

### Current Review Flow

Source: `components/events/application-review-card.tsx`

The review card already accepts `applicationAnswers` and renders each answer with its question text. Checkbox answers are rendered from `answer_json`; other answers are rendered from `answer_text`.

Source: `lib/services/event.service.ts`

`getEventRegistrations()` attaches `application_answers` from `EventApplicationService.getAnswersForRegistrations()` to registration rows for review views.

Gap: verify that the applications page consistently maps `application_answers` into the card props and preserves answer order.

### Test Coverage To Extend

Source: `lib/services/__tests__/event-application.service.test.ts`

Existing tests cover question order normalization, required options, missing required answers, select/URL validation, answer persistence by registration, and checkbox JSON storage.

Source: `lib/services/__tests__/event.service.test.ts`

Existing tests cover event registration behavior and include application registration cases. LEAD-018 should extend these tests around answer validation failures, rollback on answer save failure, and pending-review success with answers.

## Design

### Editor Question Builder

Preserve the existing builder and make only targeted changes:

- Keep V1 question types: `short_text`, `long_text`, `single_select`, `checkbox`, `url`.
- Keep order as the array index submitted to `EventApplicationService.normalizeQuestions()`.
- Keep external form URL support as fallback/parallel mode.
- Do not delete questions that already have submitted answers; surface the existing service error.
- Avoid database enum/status changes in this issue.

### Participant Apply Modal

Add modal-local validation helpers:

- Required strings must trim to non-empty.
- Required checkbox answers must include at least one selected option.
- Optional URL answers may be blank, but non-empty URL answers should pass basic browser/service-compatible validation where practical.
- Show field-level errors and prevent submit until the modal has a valid payload.

The server action and service validation remain the source of truth.

### Registration Behavior

Keep current registration semantics:

- Application submission creates `event_registration.status = 'pending_review'`.
- Answers reference `event_registration.id`, not `user_id`.
- Newsletter checkbox remains checked by default and subscribes host/collaborator chapters after successful application.
- Missing profile continues routing to onboarding from LEAD-014.

### Editor Review

Ensure application review cards show answers in the saved question order. Keep review actions chapter-scoped through LEAD-016 service/action rules.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `components/events/apply-modal.tsx` | Update | Add client-side required answer validation and field-level errors for native application questions. |
| `app/[locale]/chapter/events/_components/event-form.tsx` | Update if needed | Tighten question-builder validation/error surfacing after edit/reorder/delete checks. |
| `app/[locale]/events/[id]/_components/EventContent.tsx` | Update if needed | Surface application submission errors from the action to the modal/user flow. |
| `components/events/application-review-card.tsx` | Update if needed | Ensure answer rendering handles text, checkbox JSON, empty optional answers, and stable order. |
| `lib/services/event-application.service.ts` | Update if needed | Fill any validation gaps found by UI/tests without duplicating action/UI logic. |
| `lib/services/event.service.ts` | Update if needed | Preserve pending-review application creation and answer rollback semantics. |
| `lib/services/__tests__/event-application.service.test.ts` | Update | Add coverage for checkbox required behavior and answer ordering if missing. |
| `lib/services/__tests__/event.service.test.ts` | Update | Add/confirm application registration tests for validation failure, answer persistence, rollback, and `pending_review` status. |
| `docs/handbook/TESTING.md` | Update if needed | Add manual validation for application-based events if not already covered. |

## Tasks

- [x] Verify editor create/edit event form loads existing application questions in saved order and submits reordered questions with deterministic `sort_order`.
- [x] Harden editor form validation for V1 question types and option-backed question types.
- [x] Add client-side validation to `ApplyModal` for required native questions before calling `applyForEvent()`.
- [x] Preserve service-side validation as authoritative for missing required answers, invalid select/checkbox answers, and invalid URLs.
- [x] Confirm valid native application submissions create `pending_review` registrations and persist answers by `registration_id`.
- [x] Confirm application registration rolls back if answer persistence fails.
- [x] Confirm application review surfaces submitted answers in question order for pending, approved, and rejected application cards.
- [x] Expand focused service tests for application answer validation, pending-review creation, answer persistence, and rollback.
- [x] Run targeted tests: `pnpm vitest run lib/services/__tests__/event-application.service.test.ts lib/services/__tests__/event.service.test.ts`.
- [x] Run architecture guard: `pnpm vitest run tests/architecture.test.ts`.
- [x] Run full validation: `pnpm test`, `pnpm lint`, and `pnpm build`.
- [x] Comment on Issue #19 with implementation summary and validation results after implementation.

## Validation

```bash
pnpm vitest run lib/services/__tests__/event-application.service.test.ts lib/services/__tests__/event.service.test.ts
pnpm vitest run tests/architecture.test.ts
pnpm test
pnpm lint
pnpm build
```

Latest validation:

- `pnpm vitest run lib/services/__tests__/event-application.service.test.ts lib/services/__tests__/event.service.test.ts` passed: 2 files, 64 tests.
- `pnpm vitest run tests/architecture.test.ts` passed: 1 file, 5 tests.
- `pnpm test` passed: 15 files, 210 tests.
- `pnpm lint` passed with 99 warnings, 0 errors.
- `pnpm build` passed.

## GitHub Follow-Up

- Add/keep `has-plan` on Issue #19.
- Comment with this plan path: `.github/plans/lead-018-application-based-event-forms.plan.md`.
- Do not create sub-issues unless implementation reveals separate UI redesign work or a database status migration is needed.
