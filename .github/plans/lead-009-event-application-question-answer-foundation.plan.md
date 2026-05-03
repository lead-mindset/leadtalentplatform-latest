# Plan: LEAD-009 Event Application Question and Answer Foundation

## Summary

Build the first-party event application question and answer flow on top of the existing `event_application_question` and `event_application_answer` tables. The implementation should move application-based events away from relying only on an external `application_form_url`, keep validation in services, store answers against `event_registration.id`, and surface submitted answers in the editor review workflow.

## User Story

As an event organizer, I want custom application questions, so that application-based events can collect event-specific evaluation information.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #10 |
| Type | Feature |
| Complexity | Medium |
| Phase | Active PIV Loop |
| Systems Affected | Supabase schema, event services, event actions, event creation/edit UI, participant apply modal, application review UI, service tests |

## Parsed Scope

### Problem

Application-gated events currently support only an external application URL. The database already has question and answer tables, but the service layer, actions, participant submission UI, and editor review UI do not use them yet.

### Acceptance Criteria

- [ ] Editors can define ordered custom questions for application-based events.
- [ ] Participant answers are submitted with an application and tied to `event_registration.id`.
- [ ] V1 supports `short_text`, `long_text`, `single_select`, `checkbox`, and `url`.
- [ ] File upload and branching logic remain out of scope.

## Codebase Findings

| Category | Source | Finding |
|----------|--------|---------|
| Existing schema | `supabase/migrations/20260502062201_add_event_application_tables.sql:13` | `question_type` enum already includes all V1 types. |
| Existing schema | `supabase/migrations/20260502062201_add_event_application_tables.sql:30` | `event_application_question` already stores `event_id`, `question_text`, `question_type`, `options`, `is_required`, and `sort_order`. |
| Existing schema | `supabase/migrations/20260502062201_add_event_application_tables.sql:61` | `event_application_answer` already references `registration_id` and `question_id`, with one answer per registration/question. |
| RLS | `supabase/migrations/20260503000000_define_rls_new_account_model.sql:157` | LEAD-003 already defines editor/admin/user policies for event questions. |
| RLS | `supabase/migrations/20260503000000_define_rls_new_account_model.sql:187` | LEAD-003 already defines editor/admin/user policies for event answers. |
| Existing event service | `lib/services/event.service.ts:232` | `applyForEvent` inserts `event_registration` with `pending_review`, but does not save answers. |
| Existing action | `lib/actions/events/register.ts:27` | `applyForEvent` action currently accepts only `eventId` and newsletter opt-in. |
| Existing participant UI | `components/events/apply-modal.tsx:16` | Apply modal is hardwired to open an external URL and then confirm manually. |
| Existing event detail UI | `app/[locale]/events/[id]/_components/EventContent.tsx:316` | Application events render `ApplyModal` with `application_form_url`, no question data. |
| Existing editor UI | `app/[locale]/chapter/events/_components/event-form.tsx:91` | Event form tracks `accessModel` and `applicationFormUrl`, no question builder. |
| Existing review UI | `components/events/application-review-card.tsx:18` | Application review card uses legacy `StudentProfile` fields and does not display application answers. |
| Test pattern | `lib/services/__tests__/newsletter-subscription.service.test.ts:21` | Recent service tests use small table-routed Supabase mocks. |

## Design Decisions

1. Keep question and answer business logic in a new `EventApplicationService`, not in React components or server actions.
2. Store answer values consistently:
   - `short_text`, `long_text`, `url`, `single_select`: use `answer_text`.
   - `checkbox`: use `answer_json` as an array of selected option strings.
3. Preserve `application_form_url` as optional legacy/external-form metadata, but do not require it for application-gated events once custom questions exist.
4. Use service validation for question rules because some invariants depend on question type and payload shape.
5. Do not add file uploads, branching logic, scoring, reviewer notes, or campaign UI in this issue.

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/{timestamp}_event_application_foundation.sql` | Create | Relax legacy URL-required constraint and add small DB invariants if needed. |
| `lib/database.generated.ts` | Update | Regenerate from Docker Supabase after migration. |
| `lib/types.ts` | Update | Export question/answer row and insert/update aliases. |
| `lib/services/event-application.service.ts` | Create | Add question CRUD, answer validation, and answer persistence service methods. |
| `lib/services/__tests__/event-application.service.test.ts` | Create | Cover question validation, ordering, required answers, choice validation, URL validation, and answer insert shape. |
| `lib/services/event.service.ts` | Update | Delegate application answer persistence during `applyForEvent`, or call the new service from the action after registration creation. |
| `lib/actions/events/create-event.ts` | Update | Accept and validate application questions when creating application-based events. |
| `lib/actions/events/update-event.ts` | Update | Accept and upsert application questions when editing events. |
| `lib/actions/events/register.ts` | Update | Accept answer payloads and pass them through service validation/persistence. |
| `app/[locale]/chapter/events/_components/event-form.tsx` | Update | Add ordered question builder for application events. |
| `app/[locale]/chapter/events/[id]/page.tsx` | Update | Load existing application questions for edit mode. |
| `app/[locale]/events/[id]/page.tsx` | Update | Load public application questions for event detail/apply flow. |
| `app/[locale]/events/[id]/_components/EventContent.tsx` | Update | Pass questions and answers into `ApplyModal`. |
| `components/events/apply-modal.tsx` | Update | Render native application question form and submit answers directly. |
| `app/[locale]/chapter/events/[id]/applications/_components/event-applications-client.tsx` | Update | Include answers in the client-side application list model. |
| `components/events/application-review-card.tsx` | Update | Display submitted application answers in event order. |
| `docs/handbook/TESTING.md` | Update | Document service tests and manual flows for custom application questions. |

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Add Schema Compatibility Migration - Completed

- **Files**:
  - `supabase/migrations/{timestamp}_event_application_foundation.sql`
  - `lib/database.generated.ts`
- **Implement**:
  - Drop or relax the legacy `event_application_url_required` check from the base schema so `access_model = 'application'` can use native questions without an external URL.
  - Add `sort_order >= 0` check if absent.
  - Add a unique index/constraint for `(event_id, sort_order)` only if the UI/service will maintain dense order safely.
  - Confirm `event_application_answer.answer_json` exists in generated types. If Docker Supabase does not include it, add a migration for it before service work.
  - Regenerate types from Docker Supabase.
- **Mirror**: `supabase/migrations/20260503010000_add_newsletter_subscription_foundation.sql` for forward-only migration style.
- **Validate**:
  - `pnpm supabase db reset`
  - `pnpm supabase db diff --local`

### Task 2: Add Event Application Service Tests First - Completed

- **File**: `lib/services/__tests__/event-application.service.test.ts`
- **Implement**:
  - Build table-routed Supabase mocks.
  - Test question normalization preserves event order via `sort_order`.
  - Test `single_select` and `checkbox` require non-empty options.
  - Test required answers reject missing/empty values.
  - Test URL answers reject invalid URLs.
  - Test answer inserts reference `registration_id`, never just `user_id`.
  - Test checkbox answers use `answer_json`.
- **Mirror**: `lib/services/__tests__/newsletter-subscription.service.test.ts:21`.
- **Validate**: `pnpm vitest run lib/services/__tests__/event-application.service.test.ts`

### Task 3: Implement EventApplicationService - Completed

- **File**: `lib/services/event-application.service.ts`
- **Implement**:
  - `getQuestionsForEvent(supabase, eventId)`.
  - `upsertQuestionsForEvent(supabase, { eventId, questions })`.
  - `validateAnswers(questions, answers)`.
  - `saveAnswersForRegistration(supabase, { registrationId, questions, answers })`.
  - `getAnswersForRegistrations(supabase, registrationIds)` or equivalent review helper.
  - Return typed success/error results where the existing services already do so; throw only for unexpected service failures.
- **Mirror**:
  - `lib/services/newsletter-subscription.service.ts` for focused service shape.
  - `lib/services/event.service.ts:232` for registration/application result style.
- **Validate**: `pnpm vitest run lib/services/__tests__/event-application.service.test.ts`

### Task 4: Wire Event Create/Edit Actions - Completed

- **Files**:
  - `lib/actions/events/create-event.ts`
  - `lib/actions/events/update-event.ts`
  - `lib/services/event.service.ts`
- **Implement**:
  - Extend Zod schemas with `applicationQuestions`.
  - For `accessModel = 'application'`, require at least one native question or a legacy `applicationFormUrl`.
  - After event create/update succeeds, call `EventApplicationService.upsertQuestionsForEvent`.
  - On `accessModel = 'open'`, clear application questions or leave untouched only if intentionally preserving drafts; choose one behavior and document it in code comments/tests.
- **Mirror**: Existing event mutation paths in `lib/actions/events/create-event.ts:71` and `lib/actions/events/update-event.ts:42`.
- **Validate**:
  - `pnpm vitest run lib/services/__tests__/event-application.service.test.ts lib/services/__tests__/event.service.test.ts`
  - `pnpm lint`

### Task 5: Add Editor Question Builder UI - Completed

- **Files**:
  - `app/[locale]/chapter/events/_components/event-form.tsx`
  - `app/[locale]/chapter/events/[id]/page.tsx`
- **Implement**:
  - Load existing questions for edit mode.
  - Add question builder to the Access step for application events.
  - Support add/remove/reorder, required toggle, question type selector, and options editor for select/checkbox.
  - Preserve the existing external URL field as optional fallback.
  - Keep UI compact and work-focused; no marketing/help copy.
- **Mirror**: Current multi-step event form state and payload construction in `app/[locale]/chapter/events/_components/event-form.tsx:55`.
- **Validate**: `pnpm lint`

### Task 6: Wire Participant Answer Submission - Completed

- **Files**:
  - `app/[locale]/events/[id]/page.tsx`
  - `app/[locale]/events/[id]/_components/EventContent.tsx`
  - `components/events/apply-modal.tsx`
  - `lib/actions/events/register.ts`
  - `lib/services/event.service.ts`
- **Implement**:
  - Load ordered public questions for application events.
  - Render a native question form in `ApplyModal`.
  - Submit answer payloads to `applyForEvent`.
  - Create `event_registration` with `pending_review`, then save answers against that registration id.
  - Keep newsletter opt-in behavior from LEAD-008.
  - Keep external URL fallback only when an application event has no native questions.
- **Mirror**:
  - `app/[locale]/events/[id]/_components/EventContent.tsx:104` for current apply submit flow.
  - `lib/actions/events/register.ts:27` for server action shape.
- **Validate**:
  - `pnpm vitest run lib/services/__tests__/event-application.service.test.ts lib/services/__tests__/event.service.test.ts`
  - `pnpm lint`

### Task 7: Show Answers in Application Review - Completed

- **Files**:
  - `app/[locale]/chapter/events/[id]/applications/page.tsx`
  - `app/[locale]/chapter/events/[id]/applications/_components/event-applications-client.tsx`
  - `components/events/application-review-card.tsx`
  - `lib/types.ts`
- **Implement**:
  - Fetch submitted answers with question text/type/order for each registration.
  - Display answers in event order inside the review card.
  - Keep approve/reject behavior unchanged.
  - Use `person_profile` fields when touching old `StudentProfile` assumptions; do not broaden this into a full legacy profile refactor.
- **Mirror**: Existing application review structure in `components/events/application-review-card.tsx:18`.
- **Validate**: `pnpm lint`

### Task 8: Update Documentation and Manual QA Notes - Completed

- **File**: `docs/handbook/TESTING.md`
- **Implement**:
  - Add LEAD-009 notes for service-layer validation.
  - Document manual flow:
    - Editor creates application event with each V1 question type.
    - Participant submits answers.
    - Editor sees answers in review.
  - Note that file upload and branching logic are not included.
- **Mirror**: Existing Multi-Role Testing Strategy section in `docs/handbook/TESTING.md`.
- **Validate**: `pnpm lint`

### Task 9: Final Validation and GitHub Updates - Completed

- **Files**:
  - `.github/plans/lead-009-event-application-question-answer-foundation.plan.md`
- **Implement**:
  - Mark tasks complete in this plan after implementation.
  - Comment on Issue #10 with implementation summary.
  - Close sub-issues when their slices are complete.
- **Validate**:
  - `pnpm supabase db reset`
  - `pnpm supabase db diff --local`
  - `pnpm vitest run lib/services/__tests__/event-application.service.test.ts`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm build`

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Existing DB check requires `application_form_url` for application events. | Add a migration to relax the legacy URL requirement and enforce native-question requirements in service/action validation. |
| Existing `event_registration.application_answers` appears in old seed data. | Do not use it for LEAD-009; answers must use `event_application_answer.registration_id`. Add tests for this. |
| Question upsert can orphan old answers if questions are deleted after applications exist. | For V1, prevent deleting questions with existing answers or soft-disable by preserving old questions. Choose explicitly in service tests. |
| Reordering questions can conflict with a unique `(event_id, sort_order)` constraint. | Normalize order in memory and, if adding uniqueness, use delete/reinsert or a two-phase update. |
| Build currently has unrelated schema drift in admin chapter pages. | Track separately; do not block the LEAD-009 plan on unrelated legacy `student_profile` cleanup unless implementation touches it. |
| RLS can become recursive if policies join back through membership tables. | Reuse LEAD-003 helper functions and avoid adding policy joins directly in this feature. |

## Out of Scope

- File upload application answers.
- Branching/conditional question logic.
- Application scoring or reviewer rubrics.
- Campaign/newsletter UI.
- Full legacy `student_profile` route cleanup outside touched review surfaces.
- Production Google OAuth test accounts.

## GitHub Follow-up Issues

Create these sub-issues and link them to #10:

1. Task: Add event application schema compatibility migration.
2. Task: Implement event application question/answer service and tests.
3. Task: Wire editor question builder and participant answer submission.
4. Task: Display application answers in editor review flow.

## Validation Summary

Before marking LEAD-009 complete:

```bash
pnpm supabase db reset
pnpm supabase db diff --local
pnpm vitest run lib/services/__tests__/event-application.service.test.ts
pnpm test
pnpm lint
pnpm build
```

If `pnpm build` still fails on unrelated admin chapter schema drift, capture the exact file and keep it in the existing schema-alignment backlog rather than hiding it inside LEAD-009.

## Implementation Notes

- Completed LEAD-009 schema compatibility migration with `answer_json`, relaxed native application flow from the legacy external URL constraint, and regenerated Docker Supabase types.
- Added `EventApplicationService` with validation for question definitions, required answers, select/checkbox options, URL answers, answer persistence by `registration_id`, and review answer lookup.
- Wired create/edit actions, chapter event form question builder, participant apply modal answer submission, and editor application review answer display.
- Updated `docs/handbook/TESTING.md` with LEAD-009 testing and manual QA guidance.

## Validation Results

- `pnpm supabase db reset` passed.
- `pnpm supabase db diff --local` passed with no schema changes found.
- `pnpm vitest run lib/services/__tests__/event-application.service.test.ts lib/services/__tests__/event.service.test.ts` passed.
- `pnpm test` passed: 10 files, 172 tests.
- `pnpm lint` passed with existing warnings.
- Filtered `pnpm exec tsc --noEmit --pretty false` output for LEAD-009 touched files is clean.
- `pnpm build` compiled successfully, then failed on unrelated schema drift in `app/[locale]/admin/chapters/[id]/page.tsx`, where the page still reads `member.student_profile` from `MemberWithProfile`.
