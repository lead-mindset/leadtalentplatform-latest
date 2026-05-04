# Plan: LEAD-084 Admin Management Tables Redesign

## Summary

Redesign admin chapter, company, and event management tables with consistent page headers, filters, sorting controls, badge semantics, empty states, pagination, and row action language. Preserve existing admin service/action behavior and keep the scope to table/list presentation and safe action clarity.

## User Story

As an admin,
I want consistent management tables,
So that chapters, companies, and events can be scanned, filtered, and managed without visual drift or ambiguous destructive states.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #84 |
| Parent | #29 LEAD-028 Professional UI/UX Redesign Scope |
| Type | Enhancement / UI |
| Complexity | Medium |
| Systems Affected | Admin chapters, companies, events management pages |
| Behavior Scope | Preserve existing filters, sorting, create/edit/delete/manage actions |

## Foundation Contract

Follow `docs/handbook/UI_UX.md`:

- Admin pages use dense operational tables, not decorative card grids.
- Filters/search belong above the table they affect.
- Status badges use shared variant semantics.
- Destructive or blocked row actions need clear language.
- Empty states should offer clear create or filter-reset paths.

## Codebase Patterns To Follow

Sources:

- `app/[locale]/admin/chapters/page.tsx`
- `app/[locale]/admin/chapters/chapters-management-client.tsx`
- `app/[locale]/admin/companies/page.tsx`
- `app/[locale]/admin/companies/companies-management-client.tsx`
- `app/[locale]/admin/events/page.tsx`
- `app/[locale]/admin/events/events-management-client.tsx`
- `app/[locale]/admin/page.tsx` for current admin shell tone and density.

Pattern:

- Keep server pages responsible for parsing URL filters and loading list data.
- Keep clients responsible for URL param updates, dialogs, row actions, and pagination.
- Use `Table`, `Badge`, `Button`, `Card`, `Input`, dropdowns, and dialogs consistently.

## Observed Issues

- Chapters uses a raw HTML table while companies/events use `Table`.
- Page headers use older oversized `text-4xl` style and do not match the redesigned admin overview.
- Search controls update URL on every keystroke with no clear reset path.
- Empty states do not distinguish "no records yet" from "filters matched nothing".
- Delete buttons are disabled when unsafe, but the reason is not visible enough.
- Badge semantics for event status and counts are inconsistent.
- Pagination layout differs subtly and can crowd on desktop.
- Some copy contains corrupted separator characters.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `app/[locale]/admin/chapters/page.tsx` | UPDATE | Align page header copy and stats context. |
| `app/[locale]/admin/chapters/chapters-management-client.tsx` | UPDATE | Convert to shared table pattern, improve filters, badges, empty state, safe delete clarity. |
| `app/[locale]/admin/companies/page.tsx` | UPDATE | Align page header copy and sort defaults if needed. |
| `app/[locale]/admin/companies/companies-management-client.tsx` | UPDATE | Improve filters, badges, empty state, safe delete clarity, pagination. |
| `app/[locale]/admin/events/page.tsx` | UPDATE | Align page header copy. |
| `app/[locale]/admin/events/events-management-client.tsx` | UPDATE | Improve filters, status badges, empty state, row actions, pagination. |
| `.github/plans/lead-084-admin-management-tables-redesign.plan.md` | UPDATE | Track implementation and validation evidence. |

## Tasks

### Task 1: Align Admin Management Page Headers - Complete

- **Files**:
  - `app/[locale]/admin/chapters/page.tsx`
  - `app/[locale]/admin/companies/page.tsx`
  - `app/[locale]/admin/events/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Use consistent `text-3xl` admin page headers.
  - Keep descriptions operational and concise.
  - Preserve existing data loading and URL parsing.
- **Validate**: `pnpm build`

### Task 2: Redesign Chapters Table - Complete

- **File**: `app/[locale]/admin/chapters/chapters-management-client.tsx`
- **Action**: UPDATE
- **Implement**:
  - Use shared `Table` primitives.
  - Add consistent filter/search card with reset and create action.
  - Use badges for member/event/editor counts.
  - Explain disabled delete states.
  - Add filter-aware empty state.
  - Align pagination layout.
- **Validate**: `pnpm build`

### Task 3: Redesign Companies Table - Complete

- **File**: `app/[locale]/admin/companies/companies-management-client.tsx`
- **Action**: UPDATE
- **Implement**:
  - Align filter/search card, reset, create action, pagination.
  - Use badges for active representatives and pending invites.
  - Explain disabled delete states.
  - Add filter-aware empty state.
- **Validate**: `pnpm build`

### Task 4: Redesign Events Table - Complete

- **File**: `app/[locale]/admin/events/events-management-client.tsx`
- **Action**: UPDATE
- **Implement**:
  - Align filter/search card, dropdown filters, reset, create action, pagination.
  - Use consistent status badge variants.
  - Improve chapter/collaborator badges.
  - Add filter-aware empty state.
  - Keep manage/public row actions clear.
- **Validate**: `pnpm build`

### Task 5: Validate And Close GitHub Issue - Complete

- **Files**:
  - `.github/plans/lead-084-admin-management-tables-redesign.plan.md`
  - GitHub issue #84
- **Action**: UPDATE
- **Implement**:
  - Run validation and record results.
  - Comment on #84 with plan path, changed files, and validation evidence.
  - Add/keep `has-plan`.
  - Close #84 if acceptance criteria are met.
- **Validate**:
  - `gh issue view 84 --repo abigailbrionesa/leadtalentplatform-latest --json state,labels`

## Validation

Primary validation:

```bash
pnpm lint
pnpm build
```

Results:

- `pnpm lint` - passed with existing warnings only.
- `pnpm build` - passed.

Route checks:

```bash
http://127.0.0.1:3000/en/admin/chapters
http://127.0.0.1:3000/en/admin/companies
http://127.0.0.1:3000/en/admin/events
```

## Acceptance Criteria Mapping

- [x] Filters/search/sort controls follow a consistent layout.
- [x] Row actions show disabled and destructive states clearly.
- [x] Chapter/company/event statuses use consistent badge language and colors.
- [x] Empty states make create or clear-filter paths obvious.
- [x] Desktop table columns remain readable without horizontal chaos.

## Implementation Notes

- Aligned admin chapter, company, and event page headers with the redesigned admin shell.
- Rebuilt the chapters table on shared `Table` primitives.
- Standardized filter cards, reset actions, pagination, badge treatment, and filter-aware empty states across chapters, companies, and events.
- Added visible helper copy for blocked chapter/company deletion states while preserving existing deletion rules.
- Improved event status, chapter, collaborator, and registration badges for scanability.

## Out Of Scope

- Rewriting admin services.
- Adding new bulk actions.
- Redesigning detail pages.
- Changing deletion rules.
- Adding mobile card alternatives for every table.

## Recommended Next Step

Implement #84, validate the three admin management tables, then continue the LEAD-028 admin redesign sequence.
