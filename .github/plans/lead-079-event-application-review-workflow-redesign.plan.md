# Plan: LEAD-079 Event Application Review Workflow Redesign

## Summary

Redesign the chapter editor event application review workflow so editors can review candidates inside the event context with clear queues, readable profile/answer context, guarded bulk actions, and predictable success/error feedback. Preserve the existing service/action/auth behavior from `getEventRegistrations()`, `assertCanManageEvent()`, `bulkApproveApplications()`, and `bulkRejectApplications()`.

## User Story

As a chapter editor,
I want to compare applicant context, application answers, and decision state in one focused workflow,
So that I can review event applications quickly without losing event context.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #79 |
| Parent | #29 LEAD-028 Professional UI/UX Redesign Scope |
| Type | Enhancement / UI |
| Complexity | Medium |
| Phase | Active PIV Loop |
| Systems Affected | Event application review page, application review cards, loading/error states |
| Behavior Scope | Preserve existing service/action/auth behavior |

## Foundation Contract

Follow `docs/handbook/UI_UX.md`:

- Application review is a desktop-density workflow.
- Use tabs/filters close to the queue they affect.
- Use tables or dense lists for repeated operational records; use cards for mobile and rich candidate detail.
- Use stable status badges: pending review as `warning`, approved/registered as `success` or stable accepted state, rejected as `destructive`.
- Keep object-level actions in the event/application review context.
- Bulk actions must make selected counts and irreversible implications obvious.
- Keep mobile actions usable without relying on hover-only disclosure.

## Codebase Patterns To Follow

### Review Route And Authorization

Sources:

- `app/[locale]/chapter/events/[id]/applications/page.tsx` - calls `assertCanManageEvent(id)` before fetching registrations.
- `lib/actions/events/access.ts` - enforces editor/admin/collaborator event management access.
- `lib/actions/events/get-data.ts` - exposes `getEventRegistrations(id)` for the page.

Pattern:

- Keep the server page thin.
- Keep `assertCanManageEvent()` as the route gate.
- Keep `getEventRegistrations()` as the data source.
- Do not move business logic into the client component.

### Application Review Client

Sources:

- `app/[locale]/chapter/events/[id]/applications/_components/event-applications-client.tsx` - owns tabs, selection, bulk approve/reject, capacity warning, and refresh.
- `components/events/application-review-card.tsx` - renders candidate profile, answers, per-candidate approve/reject, and reject dialog.
- `components/events/capacity-advisory.tsx` - shows capacity warning after approval.

Pattern:

- Preserve tab state and `selectedApplications`.
- Preserve single and bulk approve/reject action calls.
- Add visible success/error feedback around those actions.
- Keep capacity warning behavior.
- Improve density and hierarchy rather than rewriting the action model.

### Service And Test Contract

Sources:

- `lib/services/event.service.ts` - `getEventRegistrations()` joins user and `person_profile`, then attaches `application_answers`.
- `lib/services/event.service.ts` - `bulkRejectApplications()` updates pending registrations to rejected.
- `lib/actions/events/bulk-approve.ts` - approval uses Supabase RPC and sends emails.
- `lib/services/__tests__/event.service.test.ts` - covers event registration/application service behavior.
- `lib/services/__tests__/event-application.service.test.ts` - covers question/answer persistence.

Pattern:

- Preserve existing registration statuses: `pending_review`, `registered`, `rejected`.
- Preserve application answers referencing `event_registration.id`.
- Focus tests on existing service contracts if any implementation changes touch action/service behavior.
- For UI-only changes, validate with build/lint/focused service tests.

## Observed Issues

- The review page header is sparse and not aligned with the redesigned chapter event workflow.
- Pending, approved, and rejected queues exist, but queue summaries and review state are visually soft.
- Bulk action bar does not strongly communicate selected count or the consequence of approving/rejecting multiple applications.
- Single action failures can throw or refresh without clear inline feedback.
- Application cards are readable but can become long; profile context and answers need better scanning hierarchy.
- Loading and error states are minimal and inconsistent with recent redesign work.
- There is one lint warning in `components/events/application-review-card.tsx` from unescaped apostrophe copy; this touched workflow can clean it up.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `app/[locale]/chapter/events/[id]/applications/page.tsx` | UPDATE | Align server wrapper metadata/context if needed while preserving auth/data flow. |
| `app/[locale]/chapter/events/[id]/applications/_components/event-applications-client.tsx` | UPDATE | Redesign queue header, summaries, tabs, bulk actions, success/error feedback, and responsive layout. |
| `components/events/application-review-card.tsx` | UPDATE | Improve candidate profile/answer scanning, status badges, action placement, and rejection dialog copy. |
| `app/[locale]/chapter/events/[id]/applications/loading.tsx` | UPDATE | Match redesigned review page skeleton. |
| `app/[locale]/chapter/events/[id]/applications/error.tsx` | UPDATE | Provide retry and safe route back to chapter events. |
| `.github/plans/lead-079-event-application-review-workflow-redesign.plan.md` | UPDATE | Track task completion and validation evidence. |

## Tasks

### Task 1: Align Review Page Shell

- **Files**:
  - `app/[locale]/chapter/events/[id]/applications/page.tsx`
  - `app/[locale]/chapter/events/[id]/applications/_components/event-applications-client.tsx`
- **Action**: UPDATE
- **Implement**:
  - Keep `assertCanManageEvent(id)` and `getEventRegistrations(id)`.
  - Add event-context page anatomy inside the client: back to event, event title, application/open registration badge, capacity/approved count.
  - Add compact queue summaries: pending, approved, rejected, capacity.
  - Keep the event ID and access model typed explicitly.
- **Mirror**:
  - `app/[locale]/chapter/events/page.tsx` header/stat pattern.
  - `docs/handbook/UI_UX.md` page header and desktop-density workflow rules.
- **Validate**: `pnpm build`

### Task 2: Redesign Queue Tabs And Bulk Actions

- **Files**:
  - `app/[locale]/chapter/events/[id]/applications/_components/event-applications-client.tsx`
- **Action**: UPDATE
- **Implement**:
  - Keep pending/approved/rejected tab separation.
  - Make tab counts visually consistent with current badge semantics.
  - Make selected count prominent in the pending queue.
  - Guard bulk reject with a confirmation dialog or clearly destructive confirmation state.
  - Keep bulk approve available only when pending applications are selected.
  - Add inline success/error feedback for single and bulk actions without changing action contracts.
- **Mirror**:
  - Existing `selectedApplications` and action transition pattern.
  - `app/[locale]/chapter/events/_components/events-table.tsx` guarded destructive action pattern.
- **Validate**: `pnpm build`

### Task 3: Improve Candidate Review Record

- **Files**:
  - `components/events/application-review-card.tsx`
- **Action**: UPDATE
- **Implement**:
  - Preserve props and action callbacks.
  - Improve the candidate header: name, email, status, application date.
  - Keep profile context close to the answers: major/interest, graduation year, LinkedIn.
  - Render answers as readable question/answer sections with long text wrapping.
  - Keep approve/reject actions clearly scoped to pending applications.
  - Keep rejected/approved cards visually lower-emphasis but still readable.
  - Clean unescaped apostrophe lint warning in rejection dialog copy.
- **Mirror**:
  - `components/events/application-review-card.tsx` existing prop contract.
  - `docs/handbook/UI_UX.md` record/card usage and status semantics.
- **Validate**: `pnpm lint`

### Task 4: Align Loading And Error States

- **Files**:
  - `app/[locale]/chapter/events/[id]/applications/loading.tsx`
  - `app/[locale]/chapter/events/[id]/applications/error.tsx`
- **Action**: UPDATE
- **Implement**:
  - Loading skeleton should match the redesigned review page anatomy: header, summary blocks, tabs, review rows.
  - Error state should include retry and a safe link back to chapter events.
  - Keep copy short and operational.
- **Mirror**:
  - `app/[locale]/chapter/events/loading.tsx`
  - `app/[locale]/chapter/events/error.tsx`
- **Validate**: `pnpm build`

### Task 5: Validate And Close GitHub Issue

- **Files**:
  - `.github/plans/lead-079-event-application-review-workflow-redesign.plan.md`
  - GitHub issue #79
- **Action**: UPDATE
- **Implement**:
  - Run validation and record results in this plan.
  - Comment on #79 with changed files and validation evidence.
  - Add/keep `has-plan`.
  - Close #79 if acceptance criteria are met.
- **Validate**:
  - `gh issue view 79 --repo abigailbrionesa/leadtalentplatform-latest --json state,labels`

## Validation

Primary validation:

```bash
pnpm build
pnpm lint
pnpm vitest run lib/services/__tests__/event.service.test.ts lib/services/__tests__/event-application.service.test.ts
```

Route checks:

```bash
http://127.0.0.1:3000/en/chapter/events/{id}/applications
```

Expected behavior:

- Anonymous users remain blocked by the chapter/event management auth flow.
- Editors can see queues for application-based events they can manage.
- Collaborator-scoped access remains unchanged.

Visual QA expectation:

- Desktop: queue summaries, tabs, selected bulk bar, and candidate records are scannable.
- Mobile: queue tabs and per-candidate approve/reject remain usable.
- Long names, emails, majors, LinkedIn URLs, and long answers wrap or truncate intentionally.
- Pending, approved, rejected, and capacity warning states do not rely on color alone.
- Bulk reject communicates destructive implications before action.

## Implementation Notes

- Application review now has an event-context shell with back navigation, event title, access-model badge, capacity state, and compact queue summaries.
- Pending, approved, and rejected queues remain tab-separated, with visible status counts close to the queue controls.
- Pending bulk actions now show selected count prominently, keep approve disabled until selection exists, and guard bulk rejection with a confirmation dialog.
- Single and bulk approve/reject actions preserve the existing server action contracts and now show inline success/error feedback.
- Candidate records keep the existing `ApplicationReviewCard` prop contract while improving profile context, answer readability, status semantics, action placement, and long-text wrapping.
- Loading and error states now match the redesigned review page anatomy.

## Validation Results

```bash
pnpm vitest run lib/services/__tests__/event.service.test.ts lib/services/__tests__/event-application.service.test.ts
# 2 files passed, 70 tests passed

pnpm lint
# Passed with existing warnings only; no errors

pnpm build
# Passed
```

## Acceptance Criteria Mapping

- [x] Pending, approved, and rejected queues are clearly separated.
- [x] Profile context and answers are readable without excessive scrolling.
- [x] Approve/reject success and error feedback is clear while preserving existing services.
- [x] Bulk action selected counts and destructive implications are obvious.
- [x] Desktop review remains scannable.

## Out Of Scope

- Changing application approval/rejection service semantics.
- Changing Supabase RPC behavior for bulk approval.
- Redesigning participant application submission.
- Redesigning event check-in (#81).
- Redesigning chapter member roster/approval (#80).
- Adding scoring/rubrics, comments history, or assignment workflows.

## Recommended Next Step

Implement #79, validate application review behavior, then continue with #80 chapter member roster and approval workflow.
