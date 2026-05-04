# Plan: LEAD-078 Chapter Editor Dashboard And Event Management Redesign

## Summary

Redesign chapter editor dashboard and event management surfaces against `docs/handbook/UI_UX.md`. The implementation should make `/chapter` and `/chapter/events` feel like a focused operational console for approved chapter editors: pending member approvals, upcoming events, application-review needs, check-in readiness, drafts, and collaborator-scoped events should be visible and scannable. Preserve editor scoping, collaboration permissions, event service/action behavior, application review behavior, and check-in behavior.

## User Story

As a chapter editor,
I want my dashboard and event tools to prioritize pending work and event operations,
So that I can manage my chapter without global access or visual clutter.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #78 |
| Type | Enhancement / UI |
| Complexity | Medium |
| Phase | Active PIV Loop |
| Systems Affected | Chapter overview, chapter events list, event create/edit pages, editor event form presentation |
| Behavior Scope | Preserve existing service/action/auth behavior |

## Foundation Contract

Follow `docs/handbook/UI_UX.md`:

- Authenticated chapter editor surfaces use the shared sidebar-first product shell.
- Chapter event management is desktop-density-first, with mobile-critical actions still usable.
- Dense repeated operational records should prefer tables or dense lists over decorative cards.
- Filters, tabs, and status badges should stay close to the event records they affect.
- Page headers should be literal and action-oriented; one primary action per page.
- Editor permissions are scoped by approved chapter membership and collaborator access.
- Do not turn this issue into event application review (#79) or check-in scanner/operator redesign (#81).

## Codebase Patterns To Follow

### Chapter Overview

Sources:

- `app/[locale]/chapter/page.tsx` - current chapter overview fetches member stats, pending members, recent approvals, and chapter events.
- `app/[locale]/chapter/page.tsx` - `ChapterContent()` uses `requireChapterMember()` and reads the editor's chapter record.
- `app/[locale]/chapter/page.tsx` - `EventOpsList()` previews upcoming chapter events and links to check-in.

Pattern:

- Keep the server-rendered overview.
- Preserve `requireChapterMember()` gating.
- Keep pending member approvals and upcoming event operations as first-class overview content.
- Improve hierarchy, density, and action placement without moving business logic into the UI.

### Chapter Events List

Sources:

- `app/[locale]/chapter/events/page.tsx` - fetches `getChapterEvents()` and renders `EventsTable`.
- `app/[locale]/chapter/events/_components/events-table.tsx` - client component handles publish/unpublish and delete actions.
- `lib/actions/events/get-data.ts` - `getChapterEvents()` requires chapter editor and delegates to `EventService.getChapterEvents()`.
- `lib/services/event.service.ts` - `getChapterEvents()` returns owned and collaborative events with `is_owned_by_chapter`.
- `lib/services/__tests__/event.service.test.ts` - covers `getChapterEvents()` owned vs collaborative behavior.

Pattern:

- Preserve `getChapterEvents()` as the data source.
- Preserve `is_owned_by_chapter` ownership/collaboration semantics.
- Keep publish/unpublish and delete delegated to existing server actions.
- Make the list more scannable on desktop and resilient on mobile.

### Event Create/Edit Form

Sources:

- `app/[locale]/chapter/events/new/page.tsx` - requires editor chapter and renders `EventForm` in create mode.
- `app/[locale]/chapter/events/[id]/page.tsx` - fetches event and application questions, then renders `EventForm` in edit mode.
- `app/[locale]/chapter/events/_components/event-form.tsx` - owns multi-step event form state, validation, autosave, collaborator manager, and application questions.
- `lib/actions/events/create-event.ts` and `lib/actions/events/update-event.ts` - service-backed mutation paths.

Pattern:

- Keep existing form state, validation, autosave, collaborator submission, and action behavior.
- Improve page wrappers and form feedback/presentation only where safe.
- Avoid deep event form refactor unless required by build/accessibility.

### Adjacent Work To Preserve

Sources:

- `app/[locale]/chapter/events/[id]/applications/page.tsx` and client - application review is #79.
- `app/[locale]/chapter/checkin/page.tsx` and `app/[locale]/chapter/events/[id]/checkin/page.tsx` - check-in operator flow is #81.
- `app/[locale]/chapter/members/page.tsx` - member roster and approval workflow is #80.

Pattern:

- This issue may link to those workflows and show counts/needs.
- Do not redesign those detail workflows in #78.

## Observed Issues

- `/chapter` overview is useful but visual hierarchy is soft; pending approvals and event operation needs should be more explicitly prioritized.
- `/chapter/events` uses card-like rows for dense event management; desktop scanability can improve with a table/list hybrid and clearer status badges.
- Event ownership vs collaboration exists but is icon-only and may be unclear.
- Event list actions are many and can become horizontal clutter.
- Create/edit page wrappers are narrow and inconsistent with the chapter events overview.
- Event form has field-level errors, but no persistent error summary or page-level framing for "what happens after save/publish."
- Existing form styling still has one-off "frontier" copy and visual flourishes in places; #78 should reduce that only where touched.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `app/[locale]/chapter/page.tsx` | UPDATE | Rework chapter overview around pending work, upcoming events, application/check-in needs, and scoped editor actions. |
| `app/[locale]/chapter/events/page.tsx` | UPDATE | Redesign event management page header, stats, empty state, and list container around desktop-density operations. |
| `app/[locale]/chapter/events/_components/events-table.tsx` | UPDATE | Improve event list scanability, ownership/collaboration labels, status badges, capacity/application/check-in signals, and actions. |
| `app/[locale]/chapter/events/loading.tsx` | UPDATE | Align skeleton with redesigned event-management page anatomy. |
| `app/[locale]/chapter/events/error.tsx` | UPDATE | Align error state with handbook standard error pattern. |
| `app/[locale]/chapter/events/new/page.tsx` | UPDATE | Align create page wrapper/header with the redesigned chapter event workflow. |
| `app/[locale]/chapter/events/[id]/page.tsx` | UPDATE | Align edit page wrapper/header, ownership actions, and empty/not-found messaging. |
| `app/[locale]/chapter/events/_components/event-form.tsx` | UPDATE | Light presentation/copy/error-summary polish only; preserve behavior. |
| `.github/plans/lead-078-chapter-editor-dashboard-event-management-redesign.plan.md` | UPDATE | Track task completion and validation evidence. |

## Tasks

### Task 1: Redesign Chapter Overview Around Pending Work

- **Files**:
  - `app/[locale]/chapter/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Keep `requireChapterMember()`, `getChapterMembers()`, `getRecentChapterActivity()`, and `getChapterEvents()`.
  - Use a compact page header: `Chapter Overview`, chapter name/university, and primary action to create an event.
  - Prioritize pending member approvals and upcoming event operations above passive metrics.
  - Surface upcoming events with registrations, capacity, application needs, and check-in links.
  - Keep quick links practical and scoped: members, events, check-in.
  - Avoid decorative metric/card filler.
- **Mirror**:
  - `docs/handbook/UI_UX.md` page header, action placement, desktop-density workflow rules.
- **Validate**: `pnpm build`

### Task 2: Redesign Chapter Events Management Page

- **Files**:
  - `app/[locale]/chapter/events/page.tsx`
  - `app/[locale]/chapter/events/_components/events-table.tsx`
- **Action**: UPDATE
- **Implement**:
  - Keep `getChapterEvents()` and existing action wiring.
  - Use a stable page header with `Create event` as the primary action.
  - Replace decorative stat blocks with compact operational summaries that answer real questions: active events, drafts, pending applications, upcoming check-in.
  - Add tabs or local filters for active/upcoming, drafts, past, and collaborative events if feasible without client-side overreach.
  - Make event records scannable on desktop: title, date, owned/collaborating, published/draft/past, registrations/capacity, pending applications, primary actions.
  - Preserve publish/unpublish, edit, application review, check-in, and delete actions.
  - Keep destructive delete visually guarded; if a confirmation is not added in this issue, call out follow-up risk in the plan validation notes.
- **Mirror**:
  - Existing `EventsTable` action pattern.
  - `docs/handbook/UI_UX.md` table/list and status semantics.
- **Validate**: `pnpm build`

### Task 3: Align Event Create/Edit Page Wrappers

- **Files**:
  - `app/[locale]/chapter/events/new/page.tsx`
  - `app/[locale]/chapter/events/[id]/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Keep `requireChapterEditor()`, direct bootstrap reads, and `EventForm` usage.
  - Align create/edit page headers with the event management page.
  - Use clear secondary actions: back to events, check-in when editing an existing event.
  - Handle missing event state clearly in edit page if `event` is null.
  - Avoid nested card-heavy wrappers around `EventForm` if the form already provides sections.
- **Mirror**:
  - Current create/edit route bootstrap logic.
  - `docs/handbook/UI_UX.md` page anatomy and standard error/empty states.
- **Validate**: `pnpm build`

### Task 4: Lightly Polish Event Form Feedback

- **Files**:
  - `app/[locale]/chapter/events/_components/event-form.tsx`
- **Action**: UPDATE
- **Implement**:
  - Preserve all state, autosave, validation, collaborator, application question, and submit behavior.
  - Add or improve a short validation/error summary when `fieldErrors` or `error` exist.
  - Remove confusing one-off copy if encountered in touched sections, especially references that feel disconnected from LEAD operations.
  - Ensure sticky action area is usable on mobile and does not hide validation feedback.
  - Do not rewrite the form into a new form library in this issue.
- **Mirror**:
  - Existing `validateFields()` and field-level error patterns.
  - `docs/handbook/UI_UX.md` forms and validation guidance.
- **Validate**: `pnpm build`

### Task 5: Align Loading, Error, And GitHub Closure

- **Files**:
  - `app/[locale]/chapter/events/loading.tsx`
  - `app/[locale]/chapter/events/error.tsx`
  - GitHub issue #78
- **Action**: UPDATE
- **Implement**:
  - Loading skeleton should match the redesigned event-management page.
  - Error state should offer retry and a safe route back to chapter overview.
  - Run validation.
  - Comment on #78 with changed files and validation.
  - Add/keep `has-plan`.
  - Close #78 if acceptance criteria are met.
- **Validate**:
  - `gh issue view 78 --repo abigailbrionesa/leadtalentplatform-latest --json state,labels`

## Validation

Primary validation:

```bash
pnpm build
pnpm lint
pnpm vitest run lib/services/__tests__/event.service.test.ts
```

Route checks:

```bash
http://127.0.0.1:3000/en/chapter
http://127.0.0.1:3000/en/chapter/events
http://127.0.0.1:3000/en/chapter/events/new
```

If anonymous route checks redirect to login, record that as expected for authenticated editor routes.

Visual QA expectation:

- Desktop: `/chapter`, `/chapter/events`, `/chapter/events/new`, `/chapter/events/[id]`.
- Mobile: same routes, focusing on action usability rather than dense desktop optimization.
- Confirm owned vs collaborative event labels are understandable.
- Confirm publish/unpublish, edit, applications, check-in, and delete actions remain available.
- Confirm long event titles, chapter names, and locations wrap or truncate intentionally.
- Confirm form validation errors remain near fields and summary copy is visible.

## Implementation Notes

- Chapter overview now gives editors faster paths to event creation and event operations, while preserving the existing chapter member, activity, and event data sources.
- Chapter events now use compact operational summaries and a desktop table/mobile list with explicit owned/collaborating labels, publish state, registrations, pending application count, check-in, application review, publish/unpublish, edit, and guarded delete actions.
- Create/edit event wrappers now use the same chapter event page anatomy, avoid nested card wrappers around `EventForm`, and show a clear not-found state for inaccessible or missing events.
- Event form behavior is preserved; the touched presentation adds a field/error summary, removes disconnected "frontier" copy, cleans corrupted sidebar tip labels, and reduces one-off gradient-heavy controls.
- Anonymous route checks against the already-running local dev server timed out during this pass, so route-level browser verification should be done interactively from the signed-in editor session if needed. Build confirmed the routes compile.

## Validation Results

```bash
pnpm vitest run lib/services/__tests__/event.service.test.ts
# 1 file passed, 63 tests passed

pnpm lint
# Passed with existing warnings only; no errors

pnpm build
# Passed
```

## Acceptance Criteria Mapping

- [x] Pending approvals, upcoming events, applications, and check-in needs are prioritized.
- [x] Editor-scoped permissions and collaboration behavior are preserved.
- [x] Dense event-management data is scannable on desktop.
- [x] Event form validation errors are clear at field and summary levels.
- [x] Critical editor actions remain usable on mobile.

## Out Of Scope

- Full application review workflow redesign (#79).
- Chapter member roster/approval workflow redesign (#80).
- Check-in operator scanner redesign (#81).
- Admin event management redesign (#84).
- Service/action/RLS behavior changes.
- Replacing the event form architecture.

## Recommended Next Step

Implement #78, validate chapter editor event operations, then continue to #79 event application review workflow.
