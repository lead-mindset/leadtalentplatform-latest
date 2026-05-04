# Plan: LEAD-082 Admin Shell And Overview Redesign

## Summary

Redesign the admin shell and overview into a calm operational back-office surface. Keep the existing admin service/action contracts, sidebar navigation, and management pages intact, while improving the overview density, queue clarity, loading/error recovery, and shell consistency.

## User Story

As an admin,
I want a coherent operational overview,
So that I can understand pending work, system coverage, and management entry points without decorative dashboard noise.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #82 |
| Parent | #29 LEAD-028 Professional UI/UX Redesign Scope |
| Type | Enhancement / UI |
| Complexity | Medium |
| Systems Affected | Admin shell, admin overview, admin loading/error states |
| Behavior Scope | Preserve existing admin auth, service/action, and management behavior |

## Foundation Contract

Follow `docs/handbook/UI_UX.md`:

- Admin surfaces are authenticated sidebar-first operational pages.
- Admin navigation prioritizes Overview, Events, Chapters, Users, Companies, Invites, and Activity.
- Admin pages should be dense enough for scanning and avoid decorative dashboard noise.
- Use tables/lists for operational records, cards only for bounded summaries and queues.
- Loading/error states must offer clear recovery.

## Codebase Patterns To Follow

### Admin Shell

Sources:

- `app/[locale]/admin/layout.tsx` - requires admin, loads sidebar stats, renders `SidebarLayout`, `BaseSidebar`, and `AdminNavigation`.
- `components/ui/sidebars/sidebar-layout.tsx` - shared authenticated shell.
- `components/ui/sidebars/admin-sidebar.tsx` - canonical admin navigation from `lib/nav-config.ts`.

Pattern:

- Keep `requireAdmin()` and `getSidebarStatsForAdmin()`.
- Keep shared sidebar primitives and canonical admin nav.
- Only tune shell spacing/background/header behavior that benefits all admin pages.

### Admin Overview

Sources:

- `app/[locale]/admin/page.tsx` - loads `getAdminDashboardStats()`, `getChapterActivityList()`, `getRecentJoins()`, and `getPendingRecruiterRequests()`.
- `lib/actions/admin/get-data.ts` - thin actions over `AdminService`.
- `lib/services/admin.service.ts` - dashboard stats and queue data.

Pattern:

- Preserve all data calls and avoid adding new service requirements.
- Build a denser overview with operational stats, priority queue, chapter activity, recent joins, and quick management links.
- Fix existing corrupted separator copy in chapter activity while redesigning.

### Error And Loading

Sources:

- `app/[locale]/admin/error.tsx` - current full-screen error fallback.
- Recent chapter event pages and check-in routes - compact page anatomy and action recovery.

Pattern:

- Keep retry and return-to-admin recovery.
- Add an overview-level `loading.tsx` matching the dashboard anatomy.
- Avoid hiding admin failures behind generic empty cards.

## Observed Issues

- Overview stat cards are useful but not ordered around admin work queues.
- Pending invites, approvals, users, chapters, companies, and events are not all understandable at a glance.
- Chapter activity copy contains corrupted separator characters.
- Admin error state is visually disconnected from the authenticated shell.
- There is no route-level admin loading skeleton.
- Existing management pages should stay out of scope for this issue except for inheriting shell changes.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `app/[locale]/admin/page.tsx` | UPDATE | Redesign admin overview around operational stats, queues, and navigation. |
| `app/[locale]/admin/layout.tsx` | UPDATE | Add light shell polish while preserving admin auth/sidebar behavior. |
| `app/[locale]/admin/error.tsx` | UPDATE | Align error state with admin operational recovery. |
| `app/[locale]/admin/loading.tsx` | CREATE | Add route-level loading skeleton matching overview anatomy. |
| `.github/plans/lead-082-admin-shell-overview-redesign.plan.md` | UPDATE | Track implementation and validation evidence. |

## Tasks

### Task 1: Redesign Admin Overview - Complete

- **File**: `app/[locale]/admin/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Preserve existing admin data calls.
  - Add a consistent page header with operational context and primary links.
  - Reframe stats as admin coverage/readiness indicators.
  - Add a priority queue for pending company access and chapter approvals.
  - Keep chapter activity and recent joins as compact lists.
  - Add quick management links for users, chapters, companies, events, invites, and activity.
- **Mirror**: `app/[locale]/chapter/events/page.tsx` compact operational page anatomy.
- **Validate**: `pnpm build`

### Task 2: Polish Admin Shell - Complete

- **File**: `app/[locale]/admin/layout.tsx`
- **Action**: UPDATE
- **Implement**:
  - Preserve `requireAdmin()` and sidebar stat loading.
  - Add a compact mobile header affordance if useful through `SidebarLayout.headerRight`.
  - Avoid page-specific navigation or separate visual language.
- **Mirror**: shared sidebar primitives in `components/ui/sidebars/*`.
- **Validate**: `pnpm build`

### Task 3: Align Loading And Error States - Complete

- **Files**:
  - `app/[locale]/admin/loading.tsx`
  - `app/[locale]/admin/error.tsx`
- **Action**: CREATE / UPDATE
- **Implement**:
  - Add overview skeleton for header, stats, queues, and list sections.
  - Replace generic full-screen error with a contained admin recovery state.
  - Keep retry and safe navigation back to `/admin`.
- **Mirror**: recent check-in loading/error state patterns.
- **Validate**: `pnpm build`

### Task 4: Validate And Close GitHub Issue - Complete

- **Files**:
  - `.github/plans/lead-082-admin-shell-overview-redesign.plan.md`
  - GitHub issue #82
- **Action**: UPDATE
- **Implement**:
  - Run validation and record results.
  - Comment on #82 with plan path, changed files, and validation evidence.
  - Add/keep `has-plan`.
  - Close #82 if acceptance criteria are met.
- **Validate**:
  - `gh issue view 82 --repo abigailbrionesa/leadtalentplatform-latest --json state,labels`

## Validation

Primary validation:

```bash
pnpm lint
pnpm build
```

Results:

- `pnpm lint` - passed with existing warnings only.
- `pnpm build` - passed.

Optional focused check:

```bash
pnpm vitest run lib/services/__tests__/admin.service.test.ts
```

Route checks:

```bash
http://127.0.0.1:3000/en/admin
http://127.0.0.1:3000/en/admin/users
http://127.0.0.1:3000/en/admin/chapters
```

## Acceptance Criteria Mapping

- [x] Pending invites, pending approvals, users, chapters, companies, and events are understandable at a glance.
- [x] Admin navigation shell and page headers remain consistent between management sections.
- [x] Operational stats avoid decorative dashboard noise.
- [x] Loading/error states provide clear recovery.
- [x] Desktop overview density supports scanning without card clutter.

## Implementation Notes

- Redesigned the admin overview around operational stats, pending queues, chapter activity, recent joins, and management links.
- Preserved existing admin service/action calls and authorization.
- Added a compact mobile admin badge through the shared sidebar layout header affordance.
- Added `app/[locale]/admin/loading.tsx` and replaced the admin error fallback with a contained recovery state.
- Fixed the visible corrupted separator in chapter activity copy during the overview redesign.

## Out Of Scope

- Redesigning every admin management table.
- Changing admin service queries or authorization.
- Adding new admin metrics not already available.
- Changing company/recruiter access domain naming beyond user-facing overview copy.

## Recommended Next Step

Implement #82, validate the admin overview and shell, then continue the LEAD-028 admin/operations redesign sequence.
