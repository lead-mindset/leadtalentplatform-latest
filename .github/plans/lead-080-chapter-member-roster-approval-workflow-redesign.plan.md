# Plan: LEAD-080 Chapter Member Roster And Approval Workflow Redesign

## Summary

Redesign the chapter member roster and approval workflow around the canonical `chapter_membership` model. The implementation should make pending, approved, rejected, and alumni states easy to distinguish; keep approved member identity/position/profile context scannable; and make bulk approval feedback explicit while preserving existing same-chapter authorization and service behavior.

## User Story

As a chapter editor,
I want a dense, clear member roster and approval workflow,
So that I can review applicants and manage chapter membership without visual clutter or unsafe cross-chapter actions.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #80 |
| Parent | #29 LEAD-028 Professional UI/UX Redesign Scope |
| Type | Enhancement / UI |
| Complexity | Medium |
| Phase | Active PIV Loop |
| Systems Affected | Chapter members page, member tabs/list/card/actions, chapter membership workflow feedback |
| Behavior Scope | Preserve existing service/action/auth behavior |

## Foundation Contract

Follow `docs/handbook/UI_UX.md`:

- Chapter roster and application review are desktop-density workflows.
- Dense operational records should prefer tables or dense lists over card-heavy layouts.
- Status badges should use stable semantics:
  - `pending` -> warning / pending review.
  - `approved` -> success / accepted access.
  - `rejected` -> destructive.
  - `alumni` -> neutral or secondary depending on context.
- Bulk actions must show selected count and skipped/failure outcomes.
- Destructive or status-reversing actions must communicate consequences.
- UI must not bypass or duplicate same-chapter authorization logic in services/actions.

## Codebase Patterns To Follow

### Page And Data Source

Sources:

- `app/[locale]/chapter/members/page.tsx` - server-rendered page that calls `requireChapterMember()`, loads the chapter record, fetches members, computes stats, applies URL status filters, and renders `MembersList`.
- `lib/actions/chapter/get-data.ts` - `getChapterMembers(chapter_id)` delegates to `ChapterService.getChapterMembers()`.
- `lib/services/chapter.service.ts` - `getChapterMembers()` delegates roster read to `ChapterMembershipService.getChapterRoster()`.

Pattern:

- Keep the page server-rendered.
- Keep `requireChapterMember()` gating and current chapter lookup.
- Keep `getChapterMembers(chapter_id)` and `getMemberStats(allMembers)` as data sources.
- Keep filtering presentational; same-chapter access remains in auth/services.

### Member List And Actions

Sources:

- `app/[locale]/chapter/members/components/members-list.tsx` - client component owns selected pending members and calls `approveMembersBulk()`.
- `app/[locale]/chapter/members/components/member-card.tsx` - renders profile/member context and action buttons.
- `app/[locale]/chapter/members/components/member-actions.tsx` - owns single approve/reject/revoke/pending transitions and toast feedback.
- `app/[locale]/chapter/members/components/member-tabs.tsx` - controls URL status tab.

Pattern:

- Preserve `approveMembersBulk()`, `approveMember()`, `rejectMember()`, and `revokeApproval()` calls.
- Preserve toasts and `router.refresh()`, but improve visible selected/skipped/failure feedback where useful.
- Replace card-heavy repeated records with a dense list/table-like row presentation while preserving mobile usability.
- Keep actions clearly tied to each member row.

### Service And Tests

Sources:

- `lib/actions/chapter/check-students.ts` - thin controller layer: auth, Zod validation, service calls, revalidation, approval email.
- `lib/services/chapter-membership.service.ts` - same-chapter editor/admin authorization, approve/reject, pending-only checks, approved-as-member rule.
- `lib/services/chapter.service.ts` - bulk approval eligibility, skipped/error counts, member stats.
- `lib/services/__tests__/chapter-membership.service.test.ts` - same-chapter authorization and pending/approved/rejected behavior.
- `lib/services/__tests__/chapter.service.test.ts` - single/bulk approval behavior.

Pattern:

- Do not move service rules into UI.
- Do not let editors promote positions through this UI.
- Preserve V1 one-approved-membership behavior.
- If UI needs alumni visibility, expose it as a filter over existing `chapter_membership.status === 'alumni'`.

## Observed Issues

- Current page only exposes `pending`, `active`, and `rejected`; issue #80 requires alumni state to be distinguishable.
- The roster is card-heavy, which does not match the desktop-density expectation for chapter operations.
- Stats are generic and visually separated from the tabs they affect.
- Bulk approval bar shows count but does not strongly explain skipped/failure states before or after action.
- Approved member records include member ID and position, but they are buried in card content.
- Rejection/revoke controls are functional but status-changing consequences can be clearer.
- Empty/no-chapter states are usable but not aligned with the newer chapter event/application state patterns.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `app/[locale]/chapter/members/page.tsx` | UPDATE | Align page shell, stats, filters, alumni support, empty/no-chapter state. |
| `app/[locale]/chapter/members/components/member-tabs.tsx` | UPDATE | Add alumni tab and status counts if passed from page/list. |
| `app/[locale]/chapter/members/components/members-list.tsx` | UPDATE | Redesign selected bulk bar, visible result feedback, dense list container. |
| `app/[locale]/chapter/members/components/member-card.tsx` | UPDATE | Convert card-heavy presentation into dense row/card hybrid with member ID, position, chapter/profile summary, and status badges. |
| `app/[locale]/chapter/members/components/member-actions.tsx` | UPDATE | Lightly improve action labels/dialog copy and keep existing action calls. |
| `.github/plans/lead-080-chapter-member-roster-approval-workflow-redesign.plan.md` | UPDATE | Track task completion and validation evidence. |

## Tasks

### Task 1: Align Member Page Shell And Filters

- **Files**:
  - `app/[locale]/chapter/members/page.tsx`
  - `app/[locale]/chapter/members/components/member-tabs.tsx`
- **Action**: UPDATE
- **Implement**:
  - Keep `requireChapterMember()`, chapter lookup, `getChapterMembers()`, and `getMemberStats()`.
  - Add `alumni` to `MemberFilterStatus`, valid statuses, and filtering.
  - Use a compact operational header: `Chapter Members`, chapter name/university, and practical summary copy.
  - Place status counts close to the tabs/filters.
  - Align empty/no-chapter state with recent chapter event/application patterns.
- **Mirror**:
  - `app/[locale]/chapter/events/page.tsx` page header/stat pattern.
  - `docs/handbook/UI_UX.md` filters/tabs and desktop-density rules.
- **Validate**: `pnpm build`

### Task 2: Redesign Bulk Approval Workflow Feedback

- **Files**:
  - `app/[locale]/chapter/members/components/members-list.tsx`
- **Action**: UPDATE
- **Implement**:
  - Preserve `approveMembersBulk(selectedUserIds)`.
  - Keep selection only for eligible pending members with completed `person_profile`.
  - Make selected count prominent.
  - Show inline success/error feedback in addition to toast, including approved/skipped counts.
  - Keep select-all behavior predictable.
  - Keep skipped/failure language visible when service returns `skipped` or `errors`.
- **Mirror**:
  - `app/[locale]/chapter/events/[id]/applications/_components/event-applications-client.tsx` selected bulk bar and inline feedback pattern.
- **Validate**: `pnpm build`

### Task 3: Convert Member Records To Dense Rows

- **Files**:
  - `app/[locale]/chapter/members/components/member-card.tsx`
- **Action**: UPDATE
- **Implement**:
  - Preserve props so `MembersList` and chapter overview usage remain compatible.
  - Keep mobile-friendly layout, but use a dense row/table-like layout on desktop.
  - Make member name/email, status, profile summary, chapter position, member ID, and recruiter visibility scannable.
  - Display approved member ID and position near the top-level row, not buried deep.
  - Include alumni status if present.
  - Keep action buttons scoped to the row.
- **Mirror**:
  - `components/events/application-review-card.tsx` dense record layout.
  - `docs/handbook/UI_UX.md` cards/lists/table guidance.
- **Validate**: `pnpm lint`

### Task 4: Clarify Single-Member Action Consequences

- **Files**:
  - `app/[locale]/chapter/members/components/member-actions.tsx`
- **Action**: UPDATE
- **Implement**:
  - Preserve `approveMember`, `rejectMember`, and `revokeApproval`.
  - Keep rejection note behavior internal-only.
  - Clarify copy for rejection and revoke/pending transitions.
  - Avoid overbuilding modal infrastructure unless needed; current inline reject expansion can remain if copy/status is clear.
- **Mirror**:
  - Existing `MemberActionButtons` action pattern.
  - `docs/handbook/UI_UX.md` destructive/status feedback rules.
- **Validate**: `pnpm build`

### Task 5: Validate And Close GitHub Issue

- **Files**:
  - `.github/plans/lead-080-chapter-member-roster-approval-workflow-redesign.plan.md`
  - GitHub issue #80
- **Action**: UPDATE
- **Implement**:
  - Run validation and record results in this plan.
  - Comment on #80 with changed files and validation evidence.
  - Add/keep `has-plan`.
  - Close #80 if acceptance criteria are met.
- **Validate**:
  - `gh issue view 80 --repo abigailbrionesa/leadtalentplatform-latest --json state,labels`

## Validation

Primary validation:

```bash
pnpm build
pnpm lint
pnpm vitest run lib/services/__tests__/chapter-membership.service.test.ts lib/services/__tests__/chapter.service.test.ts
```

Route checks:

```bash
http://127.0.0.1:3000/en/chapter/members
http://127.0.0.1:3000/en/chapter/members?status=pending
http://127.0.0.1:3000/en/chapter/members?status=active
http://127.0.0.1:3000/en/chapter/members?status=rejected
http://127.0.0.1:3000/en/chapter/members?status=alumni
```

Expected behavior:

- Anonymous users remain blocked by chapter auth.
- Editors can only manage same-chapter members through existing service/action authorization.
- Bulk approval preserves skipped/error behavior from `ChapterService.approveMembersBulk()`.

Visual QA expectation:

- Desktop roster is dense and scannable, not a stack of decorative cards.
- Mobile member rows remain readable and actions remain reachable.
- Pending, approved, rejected, and alumni states are visually distinct without relying on color alone.
- Long names, emails, majors, LinkedIn URLs, skills, member IDs, and position labels wrap/truncate intentionally.
- Bulk selected count and skipped/failure outcomes are visible.

## Implementation Notes

- Chapter members now use the same page-shell rhythm as the redesigned chapter event workflows, including compact summaries and status tabs close to the records.
- Alumni is now exposed as a first-class roster filter over `chapter_membership.status === 'alumni'`.
- Member records now render as dense row/card hybrids with status, chapter, position, member ID, profile summary, skills, LinkedIn, and company visibility surfaced for scanning.
- Bulk approval still calls `approveMembersBulk(selectedUserIds)` and now shows selected count plus inline approved/skipped/error feedback.
- Single-member actions still call `approveMember`, `rejectMember`, and `revokeApproval`; copy now clarifies pending/rejection transitions without changing behavior.

## Validation Results

```bash
pnpm vitest run lib/services/__tests__/chapter-membership.service.test.ts lib/services/__tests__/chapter.service.test.ts
# 2 files passed, 36 tests passed

pnpm lint
# Passed with existing warnings only; no errors

pnpm build
# Passed
```

## Acceptance Criteria Mapping

- [x] Pending, approved, rejected, and alumni states are easy to distinguish.
- [x] Approved rows clearly show chapter, position, member ID, and profile summary.
- [x] Approval/rejection actions preserve same-chapter authorization behavior.
- [x] Bulk approval selected counts and skipped/failure states are visible.
- [x] Desktop roster is table/list dense, not card-heavy.

## Out Of Scope

- Changing chapter membership service authorization.
- Adding editor promotion or position management.
- Adding searchable roster filters beyond status tabs.
- Adding member notes/history/audit log UI.
- Redesigning admin user management.

## Recommended Next Step

Implement #80, validate the chapter roster workflow, then continue with #81 check-in operator flow.
