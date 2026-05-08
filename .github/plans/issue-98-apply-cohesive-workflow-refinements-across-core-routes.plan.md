# Plan: Issue #98 Apply Cohesive Workflow Refinements Across Core Routes

## Summary

Apply the cohesive LEAD visual language to the route-level workflows that still feel uneven after the #96 primitive normalization and #97 shell unification work. This is the workflow polish phase: public events, onboarding/student status, chapter editor operations, admin management, and company representative flows should all read as one product while preserving their different jobs.

This issue should not change schema, auth rules, service-layer behavior, or route access. It should refine layout, hierarchy, status presentation, empty/loading/error states, mobile fit, and table/list scanability using the visual product builder loop from `docs/handbook/UI_UX.md`.

## User Story

As a LEAD user,
I want the core workflows to feel coherent, scannable, and easy to act on,
So that participants, members, editors, admins, and company representatives can complete their jobs without visual confusion.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #98 |
| Type | ENHANCEMENT / WORKFLOW UI |
| Complexity | Large |
| Systems Affected | Public events, onboarding, student dashboard/events, chapter tools, admin tools, company portal, visual QA artifacts |
| Depends On | #96 Normalize global UI tokens and Shadcn primitives; #97 Unify public and authenticated app shells |
| Source Docs | `docs/handbook/UI_UX.md`, `.github/PRDs/lead-cohesive-ui-ux-system-visual-audit.prd.md`, `tmp/visual-audit/issue-94/audit-report.md` |
| Commit Rule | Do not commit unless product owner explicitly approves |

---

## Current State

### Foundation Status

- #96 normalized global CSS tokens and shared primitives such as `Button`, `Badge`, `Card`, `Input`, `Table`, and sidebar primitives.
- #97 unified public and authenticated shells, including public navbar behavior and sidebar mobile context.
- The current working tree may still contain uncommitted #96/#97 changes. Keep #98 implementation and commit boundaries explicit.

### Public Events

- `app/[locale]/events/page.tsx` renders public event discovery with date blocks, event badges, availability, and primary detail links.
- `app/[locale]/events/[id]/_components/EventContent.tsx` has duplicated display logic for timing, availability, event type, and registration action states.
- Route-level polish should make event type, date, chapter, location, availability, and primary action scannable on desktop and mobile.

### Onboarding And Student

- `app/[locale]/onboarding/page.tsx` delegates to `components/onboarding.tsx`.
- `components/onboarding.tsx` already supports basic profile, chapter intent, newsletter preferences, recruiter visibility, and terms.
- `app/[locale]/student/page.tsx` shows activation dashboard cards for participant/pending/official/alumni status.
- `app/[locale]/student/events/page.tsx` shows registrations, status messaging, QR/check-in state, and history tabs.
- Route-level polish should separate profile status, event status, and chapter status clearly without changing onboarding data rules.

### Chapter Editor Operations

- `app/[locale]/chapter/page.tsx` shows operational stats, pending inbox, recent approvals, and activity.
- `app/[locale]/chapter/events/page.tsx` shows event stats and `EventsTable`.
- `app/[locale]/chapter/members/page.tsx` shows roster summaries and member lists.
- `app/[locale]/chapter/checkin/page.tsx` and event check-in routes support check-in operator workflows.
- `app/[locale]/chapter/events/[id]/applications/page.tsx` delegates to `EventApplicationsClient`.
- Route-level polish should prioritize scanability: queues, applications, rosters, event status, and check-in progress.

### Admin Management

- `app/[locale]/admin/page.tsx` already has operational stats, priority queue, chapter activity, and management links.
- `app/[locale]/admin/users/page.tsx` and `users-management-client.tsx` provide filtering, bulk actions, role/profile status badges, tables, and destructive confirmations.
- `app/[locale]/admin/companies/page.tsx`, `events/page.tsx`, `chapters/page.tsx`, `invites/page.tsx`, and `activity/page.tsx` are management surfaces that should remain calm and dense.
- Route-level polish should improve table/filter/status consistency and mobile alternatives where current tables become cramped.

### Company Representative Flows

- `app/[locale]/company/(protected)/dashboard/page.tsx` still uses older card/header rhythm.
- `app/[locale]/company/(protected)/browse/page.tsx` and `_components/students-table.tsx` show visible talent in a desktop table.
- `app/[locale]/company/(protected)/saved/page.tsx`, `profile/page.tsx`, and `students/[id]/page.tsx` need consistent company-language surfaces.
- User-facing copy should use "company" and "representative" language. Internal code may continue to use recruiter naming until a separate refactor is scoped.

---

## Design Principles

| Area | Rule |
|------|------|
| Shared system | Use existing `components/ui` primitives and global tokens. Do not create one-off visual styles that bypass the system. |
| Page hierarchy | Each workflow page needs a concrete title, short context, one obvious primary action, and grouped secondary actions. |
| Public/student feel | Warmer and more guided, but still structured. The user should immediately understand what to do next. |
| Editor/admin/company feel | Denser, calmer, and optimized for repeated scanning and decision-making. |
| Cards | Use cards for individual repeated items, modals, and framed tools. Avoid cards nested inside cards. |
| Tables | Desktop management screens can use dense tables. Mobile needs record/list alternatives or deliberate horizontal overflow only when acceptable. |
| Statuses | Event, registration, chapter, identity, and company statuses must use consistent badge semantics and plain labels. |
| Mobile | No horizontal overflow, clipped buttons, overlapping text, or hidden primary action. |
| Behavior | Preserve service/action/auth behavior. UI polish should not rewrite business rules. |

---

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `.github/plans/issue-98-apply-cohesive-workflow-refinements-across-core-routes.plan.md` | CREATE | This implementation plan |
| `app/[locale]/events/page.tsx` | UPDATE | Make public event cards/sections more scannable and mobile-stable |
| `app/[locale]/events/[id]/_components/EventContent.tsx` | UPDATE | Refine event detail hierarchy, metadata, registration CTA, and status presentation |
| `components/events/*` or `lib/events/*` | CREATE / UPDATE AS NEEDED | Extract repeated event display/status helpers if duplication becomes risky |
| `components/onboarding.tsx` | UPDATE | Refine onboarding step hierarchy, chapter intent clarity, preferences, and mobile fit |
| `app/[locale]/student/page.tsx` | UPDATE | Clarify participant activation, profile readiness, chapter status, and next action |
| `app/[locale]/student/events/page.tsx` | UPDATE | Clarify current ticket, QR/check-in state, application/registration statuses, and history |
| `app/[locale]/chapter/page.tsx` | UPDATE | Improve operational dashboard hierarchy and queue scanability |
| `app/[locale]/chapter/events/page.tsx` | UPDATE | Improve event management header, stats, empty state, and table surrounding context |
| `app/[locale]/chapter/events/_components/events-table.tsx` | UPDATE AS NEEDED | Improve desktop density and mobile record/list behavior |
| `app/[locale]/chapter/members/page.tsx` | UPDATE | Improve roster summary, filters/tabs, member status clarity |
| `app/[locale]/chapter/checkin/page.tsx` | UPDATE | Improve check-in operator flow, event selection, summary, and empty states |
| `app/[locale]/chapter/events/[id]/applications/_components/event-applications-client.tsx` | UPDATE | Improve application review scanability and status/action hierarchy |
| `app/[locale]/admin/page.tsx` | UPDATE AS NEEDED | Align overview sections with final route-level patterns |
| `app/[locale]/admin/users/page.tsx` | UPDATE | Improve admin page header/filter context and remove avoidable typing drift |
| `app/[locale]/admin/users/users-management-client.tsx` | UPDATE | Improve table, filters, bulk actions, badges, and destructive action hierarchy |
| `app/[locale]/admin/companies/page.tsx` | UPDATE | Align company management surface |
| `app/[locale]/admin/events/page.tsx` | UPDATE | Align event management surface |
| `app/[locale]/admin/chapters/page.tsx` | UPDATE | Align chapter management surface |
| `app/[locale]/admin/invites/page.tsx` | UPDATE | Align invite/access review surface |
| `app/[locale]/admin/activity/page.tsx` | UPDATE | Align activity log scanability |
| `app/[locale]/company/(protected)/dashboard/page.tsx` | UPDATE | Modernize company portal overview and quick actions |
| `app/[locale]/company/(protected)/browse/page.tsx` | UPDATE | Improve browse/search hierarchy and help/empty states |
| `app/[locale]/company/(protected)/_components/students-table.tsx` | UPDATE | Add or improve mobile record presentation for talent rows |
| `app/[locale]/company/(protected)/saved/page.tsx` | UPDATE | Align saved talent workflow |
| `app/[locale]/company/(protected)/profile/page.tsx` | UPDATE | Align profile/access information layout |
| `app/[locale]/company/(protected)/students/[id]/page.tsx` | UPDATE AS NEEDED | Align talent profile detail surface |
| `tmp/visual-audit/issue-98/*` | CREATE LOCAL | Screenshots, click-through notes, and responsive evidence; do not commit unless requested |

Potential shared helpers should stay small. Good candidates are page header, metric strip, event display helpers, or mobile record patterns only if they remove real duplication across route groups.

---

## Tasks

### Task 1: Freeze Baseline And Confirm Dependencies - Completed

- **Action**: REVIEW
- **Implement**:
  - Run `git status --short --branch`.
  - Confirm #96 and #97 changes are present or committed before implementation.
  - Confirm no #98 route work starts from stale CSS or shell assumptions.
  - Keep `.agents/`, `.codex/`, `.qa-backups/`, `test-results/`, and `tmp/` unstaged unless intentionally requested.
- **Validate**:
  - No implementation files changed.

### Task 2: Inventory Workflow Surfaces And Reusable Patterns - Completed

- **Action**: REVIEW
- **Implement**:
  - Inspect active public, student, chapter, admin, and company routes listed in this plan.
  - Identify repeated display logic worth extracting, especially event status/date/availability helpers and mobile table record patterns.
  - Do not create abstractions for a single page.
- **Validate**:
  - Record findings in the implementation summary.

### Task 3: Refine Public Event Discovery And Detail - Completed

- **Files**:
  - `app/[locale]/events/page.tsx`
  - `app/[locale]/events/[id]/_components/EventContent.tsx`
  - optional `components/events/*` or `lib/events/*`
- **Action**: UPDATE
- **Implement**:
  - Make event type, timing, chapter, location, availability, and action visible without reading the whole card.
  - Keep upcoming and past sections visually distinct.
  - Make mobile cards stable with no clipped badges or crowded action rows.
  - Remove duplicated status/date helper drift if a small shared helper is clearly useful.
  - Preserve registration routing and capacity behavior.
- **Validate**:
  - `pnpm exec eslint app/[locale]/events/page.tsx app/[locale]/events/[id]/_components/EventContent.tsx`

### Task 4: Refine Onboarding And Student Activation - Completed

- **Files**:
  - `components/onboarding.tsx`
  - `app/[locale]/student/page.tsx`
  - `app/[locale]/student/events/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Make basic profile, chapter intent, newsletter, and visibility choices feel like one guided flow.
  - Keep the chapter membership prompt simple and low-friction.
  - Make participant, pending, official member, and alumni dashboard states visually distinct.
  - Improve student event status and QR/check-in readability.
  - Preserve the canonical account model and current service/action behavior.
- **Validate**:
  - `pnpm exec eslint components/onboarding.tsx app/[locale]/student/page.tsx app/[locale]/student/events/page.tsx`

### Task 5: Refine Chapter Editor Operations - Completed

- **Files**:
  - `app/[locale]/chapter/page.tsx`
  - `app/[locale]/chapter/events/page.tsx`
  - `app/[locale]/chapter/events/_components/events-table.tsx`
  - `app/[locale]/chapter/members/page.tsx`
  - `app/[locale]/chapter/checkin/page.tsx`
  - `app/[locale]/chapter/events/[id]/applications/_components/event-applications-client.tsx`
- **Action**: UPDATE
- **Implement**:
  - Make queues, pending applications, event operations, member rosters, and check-in metrics easier to scan.
  - Keep editor permissions and chapter scoping untouched.
  - Ensure primary operational actions are obvious but not visually noisy.
  - Add mobile record/list treatment where tables or dense rows currently collapse poorly.
- **Validate**:
  - `pnpm exec eslint app/[locale]/chapter`

### Task 6: Refine Admin Management Screens - Completed

- **Files**:
  - `app/[locale]/admin/page.tsx`
  - `app/[locale]/admin/users/page.tsx`
  - `app/[locale]/admin/users/users-management-client.tsx`
  - `app/[locale]/admin/companies/page.tsx`
  - `app/[locale]/admin/events/page.tsx`
  - `app/[locale]/admin/chapters/page.tsx`
  - `app/[locale]/admin/invites/page.tsx`
  - `app/[locale]/admin/activity/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Align admin page headers, filters, tables, statuses, and destructive confirmations.
  - Keep management screens dense and calm.
  - Fix small typing drift encountered during route polish when it is directly in touched files.
  - Avoid broad admin feature rewrites.
- **Validate**:
  - `pnpm exec eslint app/[locale]/admin`

### Task 7: Refine Company Representative Flows - Completed

- **Files**:
  - `app/[locale]/company/(protected)/dashboard/page.tsx`
  - `app/[locale]/company/(protected)/browse/page.tsx`
  - `app/[locale]/company/(protected)/_components/students-table.tsx`
  - `app/[locale]/company/(protected)/saved/page.tsx`
  - `app/[locale]/company/(protected)/profile/page.tsx`
  - `app/[locale]/company/(protected)/students/[id]/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Use professional company representative language.
  - Keep talent browse, saved talent, profile detail, and access/help states visually aligned.
  - Ensure no user-facing copy calls representatives "recruiters" unless the current route intentionally does so and changing it would broaden scope.
  - Add mobile-friendly talent row presentation if the desktop table is too constrained.
- **Validate**:
  - `pnpm exec eslint app/[locale]/company/(protected)`

### Task 8: Standardize State Treatments - Completed

- **Action**: UPDATE AS NEEDED
- **Implement**:
  - Review loading, empty, error, unauthorized, success, and destructive states touched by Tasks 3-7.
  - Use consistent icon, title, body, and action hierarchy.
  - Keep error messages user-friendly and operationally useful.
- **Validate**:
  - Covered by route eslint and visual QA.

### Task 9: Visual Product Builder QA - Completed

- **Action**: LOCAL QA
- **Implement**:
  - Create a Playwright/Codex Desktop visual QA script under `tmp/visual-audit/issue-98/`.
  - Capture desktop and mobile screenshots for:
    - `/en/events`
    - at least one public event detail
    - `/en/onboarding`
    - `/en/student`
    - `/en/student/events`
    - `/en/chapter`
    - `/en/chapter/events`
    - `/en/chapter/members`
    - `/en/chapter/checkin`
    - `/en/admin`
    - `/en/admin/users`
    - `/en/admin/companies`
    - `/en/company/dashboard`
    - `/en/company/browse`
    - `/en/company/saved`
    - `/en/company/profile`
  - Click through primary actions enough to confirm no obvious broken navigation or modal overlap.
  - Inspect screenshots for hierarchy, spacing, contrast, text fit, responsive layout, hover/focus/empty/error/success states.
- **Validate**:
  - Screenshot and notes files exist in `tmp/visual-audit/issue-98/`.

### Task 10: Validation - Completed

- **Action**: VERIFY
- **Implement**:
  - Run targeted eslint during each route group.
  - Run full validation at the end:
    - `pnpm lint`
    - `pnpm test`
    - `pnpm build`
  - If visual QA requires seeded users or QA data, document exact accounts/routes used.
- **Validate**:
  - Commands pass or exact failures are recorded with follow-up issue recommendations.

### Task 11: Update GitHub Issue #98 - Completed

- **Action**: GITHUB
- **Implement**:
  - Add `has-plan`.
  - Comment with this plan path.
  - After implementation, comment with files changed, screenshot/notes path, validation results, and any follow-up issues.
- **Validate**:
  - Issue #98 has a plan link and final implementation evidence.

---

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| #98 becomes too large to review safely | Implement by route group and keep commits split by workflow when requested |
| UI polish accidentally changes business behavior | Treat services/actions/auth as read-only unless a directly observed UI bug proves otherwise |
| New one-off styles undo #96 | Use shared primitives and tokens; extract small helpers only when repeated |
| Admin/editor tools become too spacious | Keep operational screens dense, table/list based, and scan-friendly |
| Public/student screens become too cold | Preserve guided copy and warmer hierarchy while keeping components consistent |
| Company language drifts back to recruiter-facing copy | Use company representative language in UI; leave internal code names for separate cleanup |
| Mobile tables overflow | Add mobile record/list alternatives for high-value tables touched by this issue |
| Visual QA becomes flaky | Keep screenshots local in `tmp/visual-audit/issue-98/` and use deterministic seed users/routes |

---

## Validation Commands

```bash
pnpm exec eslint app/[locale]/events/page.tsx app/[locale]/events/[id]/_components/EventContent.tsx
pnpm exec eslint components/onboarding.tsx app/[locale]/student/page.tsx app/[locale]/student/events/page.tsx
pnpm exec eslint app/[locale]/chapter
pnpm exec eslint app/[locale]/admin
pnpm exec eslint app/[locale]/company/(protected)
pnpm lint
pnpm test
pnpm build
```

Visual validation:

```text
tmp/visual-audit/issue-98/
```

---

## Implementation Results

Tasks completed: 11/11

### Changes Applied

- Added `components/ui/page-header.tsx` for consistent route-level title, context, badge, and action rhythm.
- Aligned student dashboard and student events headers with the shared workflow header pattern.
- Aligned chapter events, members, check-in, and event application review headers with the shared workflow header pattern.
- Aligned admin users, companies, events, chapters, invites, and activity headers with the shared workflow header pattern.
- Added a mobile record layout for admin company representative invites.
- Aligned company dashboard, browse, saved, profile, and visible talent detail surfaces with company representative language.
- Added a mobile record layout for company talent browse/saved tables.
- Tightened public event availability status semantics for low-capacity events and mobile action sizing.

### Validation Results

- `pnpm exec eslint ...` targeted route checks: passed.
- `pnpm lint`: passed with existing warnings only.
- `pnpm exec playwright test tmp/visual-audit/issue-98/workflow-clickthrough.spec.cjs --reporter=line`: passed.
- Visual notes: `tmp/visual-audit/issue-98/workflow-clickthrough-notes.md`.
- `pnpm build`: passed.
- `pnpm test`: passed on rerun, 16 files and 261 tests.

### Notes

- The first `pnpm test` run timed out in `tests/architecture.test.ts` while running concurrently with `pnpm build`; rerunning tests by themselves passed.
- `/en/onboarding` redirects to `/en/events` for seeded users with completed profiles, which matches current onboarding behavior.
- `tmp/visual-audit/issue-98/` is local QA evidence and should remain uncommitted unless explicitly requested.
