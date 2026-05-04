# Plan: LEAD-074 App Shell, Page Anatomy, And Responsive State Patterns

## Summary

Define the canonical LEAD UI/UX system contract before page-level redesign work begins. This issue should not introduce runtime UI changes yet. It should document one unified Shadcn-style product system for public, student, chapter editor, admin, and company representative surfaces, so follow-up redesign issues can remove inconsistency through shared primitives, consistent page anatomy, and predictable state/status patterns.

## User Story

As the product team,
I want shared app shell, page anatomy, responsive, and state rules,
So that future redesign work produces one coherent LEAD product instead of disconnected page styles.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #74 |
| Type | Technical / Design Foundation |
| Complexity | Medium |
| Phase | Active PIV Loop |
| Systems Affected | Public, student, chapter editor, admin, company representative, shared UI primitives |
| Implementation Scope | Documentation and GitHub issue update only |

## Decisions From Product Review

- #74 is documentation/system-contract work, not page redesign implementation.
- Do not add new shared runtime components in #74 unless implementation later proves they are needed.
- The redesign target is one unified LEAD product style across all roles.
- Role differences are information architecture, density, and workflow priority differences, not separate visual directions.
- Public surfaces use top navigation.
- Authenticated app surfaces use sidebar-first layout, with mobile sidebar trigger/header behavior.
- The final system should be Shadcn-style and centralized through `components/ui`.
- Page-level ad hoc Tailwind styling should be reduced over time; shared primitives should own component styling and variants.
- Existing special pages should be pulled back into the unified product system. Public pages may be more spacious or visual, but not disconnected.
- No nested-card/card-heavy operational layouts. Admin, editor, and company workflows should prefer dense tables/lists when users scan repeated records.
- Validation for #74 is documentation presence plus issue comment; no `pnpm build` is required unless runtime code changes.

## Codebase Patterns To Follow

### Navigation Configuration

Source: `lib/nav-config.ts`

- Current role navigation already centralizes student, chapter, admin, and company nav item definitions.
- The standard should reference this as the canonical nav map and avoid page-level custom nav duplication.

### Authenticated Sidebar Shell

Sources:

- `components/ui/sidebars/sidebar-layout.tsx`
- `components/ui/sidebars/base-sidebar.tsx`
- `components/ui/sidebars/student-sidebar.tsx`
- `components/ui/sidebars/admin-sidebar.tsx`
- `components/ui/sidebars/company-sidebar.tsx`

Observed pattern:

- Authenticated sections already use sidebar primitives and role-specific nav groups.
- Mobile authenticated shell already has a compact header and sidebar trigger.
- The UI/UX standard should formalize this as the app contract.

### Shared UI Primitives

Sources:

- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/badge.tsx`
- `components/ui/table.tsx`
- `components/ui/form.tsx`
- `components/ui/sidebar.tsx`

Observed pattern:

- The app has Shadcn-like primitives, but pages still mix one-off Tailwind treatments.
- The standard should make `components/ui` the source of truth for primitive variants.

### Status Badges

Sources:

- `components/ui/badge.tsx`
- `components/events/registration-status-badge.tsx`

Observed pattern:

- Badge variants exist for success, warning, info, destructive, neutral, live, student, editor, and count.
- Event registration has a domain-specific status badge component.
- The standard should define semantic use so future pages do not invent conflicting status colors.

### Page Drift Examples To Correct In Follow-Ups

Sources:

- `app/[locale]/events/page.tsx`
- `app/[locale]/admin/page.tsx`
- `app/[locale]/chapter/page.tsx`
- `app/[locale]/company/(protected)/dashboard/page.tsx`

Observed pattern:

- Public events currently has a more custom visual language than the authenticated app.
- Admin/chapter/company pages rely heavily on cards for summaries and lists.
- Follow-up redesign issues should bring these into the same product system without changing services/actions by default.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `docs/handbook/UI_UX.md` | CREATE | Canonical LEAD UI/UX system contract for #74 and follow-up redesign issues. |
| `.github/plans/lead-074-app-shell-page-anatomy-responsive-state-patterns.plan.md` | CREATE | Implementation plan and product decisions for #74. |

## Tasks

### Task 1: Create The Canonical UI/UX Handbook

- **File**: `docs/handbook/UI_UX.md`
- **Action**: CREATE
- **Status**: Completed
- **Implement**:
  - Define the unified LEAD product style.
  - Define Shadcn-style `components/ui` as the source of truth.
  - Define public top-nav vs authenticated sidebar shell rules.
  - Define page anatomy: page header, primary action, filters/search, content body, state region.
  - Define cards/tables/lists/forms rules.
  - Define status badge semantics across event, registration, membership, identity, newsletter, and company access states.
  - Define responsive expectations.
  - Define loading, empty, error, unauthorized, success, destructive confirmation, and mobile overflow states.
  - Include a short checklist for future redesign issues.
- **Mirror**: `.github/plans/lead-028-professional-ui-ux-redesign-scope.plan.md` for scope language and constraints.
- **Validate**: Read the document and confirm it maps to all #74 acceptance criteria.

### Task 2: Update GitHub Issue #74

- **File**: GitHub issue #74
- **Action**: UPDATE
- **Status**: Completed
- **Implement**:
  - Comment with the plan path and handbook path.
  - Add the `has-plan` label.
  - Leave the issue open until implementation creates the handbook.
- **Validate**: `gh issue view 74 --repo abigailbrionesa/leadtalentplatform-latest --json labels,comments`

## Validation

Because #74 is documentation/system-contract work only, validation is:

```bash
Test-Path .github/plans/lead-074-app-shell-page-anatomy-responsive-state-patterns.plan.md
Test-Path docs/handbook/UI_UX.md
```

No `pnpm build`, `pnpm lint`, or `pnpm test` is required unless runtime code changes.

## Acceptance Criteria Mapping

- [x] Navigation/header/sidebar behavior is defined for student, editor, admin, and company contexts.
- [x] Page-level redesign stories can reference a common page header/action pattern.
- [x] Status badge semantics are documented.
- [x] Form/table/card usage rules prevent nested-card and card-heavy operational layouts.
- [x] Mobile-first vs desktop-density expectations are documented.

## Out Of Scope

- Runtime UI component changes.
- Page redesign implementation.
- Route changes.
- Backend, service, action, auth, validation, database, or RLS changes.
- Creating a full token redesign or visual brand refresh in this issue.

## Recommended Next Step

Implement this plan by creating `docs/handbook/UI_UX.md`, then update #74 with the evidence. After #74 closes, start #75 using the handbook as the redesign contract.
