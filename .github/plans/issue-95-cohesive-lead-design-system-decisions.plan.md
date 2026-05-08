# Plan: Issue #95 Cohesive LEAD Design System Decisions

## Summary

Turn the #94 visual audit into explicit LEAD design-system decisions before implementation. This issue is a decision and documentation pass, not a UI refactor. It should clarify the rules that #96 will implement in global tokens and Shadcn-style primitives: surface hierarchy, radius scale, typography usage, button variants, badge semantics, cards/tables/forms, page headers, and authenticated shell behavior.

The core choice: LEAD remains one coherent product, but public/student surfaces can be warmer while admin/chapter/company surfaces become calmer, denser, and more operational. The difference should come from layout density and content hierarchy, not separate visual systems.

## Implementation Status

- [x] Reconcile #94 findings into system-level vs page-specific buckets.
- [x] Update product surface rules.
- [x] Encode primitive decisions for radius, typography, buttons, badges, cards, tables, lists, and forms.
- [x] Encode shell/sidebar decisions.
- [x] Define implementation handoff order for #96.
- [x] Comment #95 with implementation summary.

## User Story

As the LEAD product owner,
I want explicit design-system decisions based on the visual audit,
So that future UI implementation is cohesive, user-first, and not a series of isolated taste-based edits.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #95 |
| Type | PLANNING / DESIGN SYSTEM DECISION |
| Complexity | Medium |
| Systems Affected | `docs/handbook/UI_UX.md`, design-system implementation plan for #96, shared primitives contract |
| Source Audit | `tmp/visual-audit/issue-94/audit-report.md` |
| Source PRD | `.github/PRDs/lead-cohesive-ui-ux-system-visual-audit.prd.md` |
| Depends On | #94 |
| Blocks | #96, #97, #98, #99, #100 |
| Commit Rule | Do not commit unless product owner explicitly approves |

---

## Scope

### In Scope

- Separate system-level findings from page-specific findings.
- Define final decisions for:
  - Product surface hierarchy.
  - Radius scale.
  - Typography usage.
  - Button variants and behavior.
  - Badge/status semantics.
  - Card, table, list, and mobile record density.
  - Input/form rhythm.
  - Page header anatomy.
  - Public shell and authenticated sidebar/mobile shell behavior.
- Update `docs/handbook/UI_UX.md` only where it makes future implementation clearer.
- Comment on #95 with the decision summary and implementation handoff to #96.

### Out Of Scope

- Editing `app/[locale]/globals.css`.
- Editing `components/ui/button.tsx`, `badge.tsx`, `card.tsx`, `table.tsx`, `input.tsx`, or sidebar components.
- Editing route-level pages.
- Fixing admin overflow, company mobile browse, or missing access-help route.
- Creating screenshots unless needed for reference.
- Committing without explicit approval.

---

## Inputs To Use

| Source | Why It Matters |
|--------|----------------|
| `tmp/visual-audit/issue-94/audit-report.md` | Primary evidence for system-level UI drift |
| `docs/handbook/UI_UX.md` | Current canonical UI contract |
| `.github/PRDs/lead-cohesive-ui-ux-system-visual-audit.prd.md` | Product direction and scope |
| `components/ui/button.tsx` | Confirms current mixed button contract |
| `components/ui/badge.tsx` | Confirms current mixed badge/status contract |
| `components/ui/card.tsx` | Confirms current 24px card-heavy default |
| `components/ui/sidebar.tsx` and `components/ui/sidebars/*` | Confirms authenticated shell/mobile behavior |
| `app/[locale]/globals.css` | Confirms current dark-first Material/Shadcn token mixture |

---

## Current Evidence From #94

### System-Level Findings

- Shared primitives are the consistency problem, especially buttons, badges, cards, and sidebar.
- UI is too dark-heavy across public, participant, chapter, admin, and company contexts.
- Buttons feel weird because the default is a full-pill gradient with hover scale and mixed variant families.
- Badges feel weird because role, count, link, live, and semantic statuses all share one primitive without domain mapping.
- Sidebar works structurally, but mobile role/context orientation is weak and role hierarchy varies.
- Cards are overused for operational data.
- Admin chapters/companies have desktop overflow.
- Company browse mobile clips table content.

### Page-Specific Findings To Defer

- `/en/company/access-help` returns 404.
- `/en/events` mobile is very long.
- Admin/chapter/company route-level loading speed and skeleton polish need later passes.
- Company browse mobile needs a card/list alternative.
- Admin overflow should be fixed in #96/#97 after shell/table decisions are settled.

---

## Decisions To Make

### 1. Product Surface Hierarchy

Decision to encode:

- Public pages may stay warmer and more visual.
- Student pages should be encouraging and clear, but not marketing-heavy.
- Chapter, admin, and company pages should be calmer, denser, and optimized for scanning.
- The app should stop using the same deep navy card-heavy treatment for every role.
- One visual language should be preserved through shared typography, spacing, primitives, status semantics, and navigation structure.

### 2. Radius Scale

Decision to encode:

- Default app controls and cards should use restrained Shadcn-style radii.
- Recommended scale:
  - `sm`: `4px` for small controls and internal elements.
  - `md`: `6px` or `8px` for buttons, inputs, badges, table rows.
  - `lg`: `8px` or `12px` for cards and forms.
  - `xl`: `16px` max for major panels or marketing/public surfaces.
  - `full`: icon/avatar only, not default buttons.
- Avoid `24px` as the default app card radius.
- Avoid nested cards and large floating section cards.

### 3. Typography

Decision to encode:

- Keep brand display typography for public heroes and major marketing moments.
- Operational pages should use tighter page headers and smaller headings.
- Avoid global semantic `h1/h2/h3/p` rules that unexpectedly resize text inside compact tools.
- Preserve readable body text and do not scale text with viewport width in compact controls.
- Buttons and badges should not force bold Montserrat everywhere.

### 4. Buttons

Decision to encode:

- Base `Button` should be calm and Shadcn-like.
- Core variants should be small and predictable:
  - `primary`
  - `secondary`
  - `outline`
  - `ghost`
  - `destructive`
  - `link`
- Gradients and full-pill CTA styling should be opt-in, reserved for public/student hero-level moments.
- Operational admin/chapter/company actions should not hover-scale.
- Status-colored button variants (`success`, `warning`, `info`) should be avoided in the base primitive unless there is a strong recurring need.
- Material-style variants (`filled`, `tonal`, `outlined`, `text`) should either be removed or explicitly deprecated if not part of the chosen system.
- Icon-only buttons need stable dimensions and accessible labels/tooltips.

### 5. Badges And Status Semantics

Decision to encode:

- Base `Badge` should be compact, low-emphasis, and stable.
- Domain status mapping should exist for:
  - Event status.
  - Registration status.
  - Chapter membership status.
  - LEAD identity type.
  - Company access status.
  - Role labels and navigation counts.
- Animation should be reserved for genuinely live/active states.
- Secondary metadata should not always become badges on mobile.
- Badges should not be used as decorative chips.

### 6. Cards, Tables, Lists, And Mobile Records

Decision to encode:

- Desktop admin, chapter, and company workflows should prefer tables/lists for repeated records.
- Mobile alternatives should use a reusable record-card/list pattern.
- Cards should be used for summaries, forms, contained tools, and mobile records.
- Do not use cards as page sections or put cards inside cards.
- Company browse mobile should become a canonical example of why desktop tables need mobile record alternatives.

### 7. Inputs And Forms

Decision to encode:

- Inputs should use a consistent height, radius, border/focus style, and field spacing.
- Form sections should be grouped by user intent.
- Field labels and help text should be calm and consistent.
- Error states should be visible near the field and summarized for multi-error forms.
- Forms should not depend on page-specific one-off styling.

### 8. Page Headers

Decision to encode:

- Operational page headers use:
  - Literal title.
  - One short context sentence.
  - One primary action when needed.
  - Secondary actions grouped as outline/ghost/menu controls.
- Public pages can use larger hero composition.
- Avoid hero-scale headings in admin/editor/company pages.

### 9. App Shell And Sidebar

Decision to encode:

- One authenticated shell contract for student, chapter, admin, and company.
- Desktop sidebar should standardize:
  - User block.
  - Role/workspace label.
  - Optional member ID/company/chapter context.
  - Nav group labels.
  - Active state.
  - Count badges.
  - Logout placement.
- Mobile header should show current role/workspace and use a clear menu trigger.
- Mobile should not collapse all orientation into a tiny unlabeled icon.
- Toast/issue widgets must not obscure primary content or sidebar logout.

---

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `.github/plans/issue-95-cohesive-lead-design-system-decisions.plan.md` | CREATE | This plan |
| `docs/handbook/UI_UX.md` | UPDATE | Encode clarified decisions for future implementation |

No implementation files should change in #95.

---

## Tasks

### Task 1: Reconcile #94 Findings Into System vs Page Buckets

- **Action**: REVIEW
- **Inputs**:
  - `tmp/visual-audit/issue-94/audit-report.md`
  - GitHub issue #95 acceptance criteria
- **Implement**:
  - List system-level decisions that must be solved in #95/#96.
  - List page-specific issues that should be deferred to #97/#98/#99.
- **Validate**: The distinction is explicit in the updated handbook or issue comment.

### Task 2: Update Product Surface Rules

- **File**: `docs/handbook/UI_UX.md`
- **Action**: UPDATE
- **Implement**:
  - Clarify public/student warmth vs admin/editor/company operational density.
  - State that one visual language is preserved through primitives and spacing, not identical dark card-heavy layouts.
  - Add warning against one-note dark treatment for every workflow.
- **Validate**: Handbook explains how roles differ without becoming separate products.

### Task 3: Encode Primitive Decisions

- **File**: `docs/handbook/UI_UX.md`
- **Action**: UPDATE
- **Implement**:
  - Add explicit Button contract.
  - Add explicit Badge/status contract.
  - Add explicit Card/table/list/mobile-record contract.
  - Add radius scale guidance.
  - Add typography guidance for public vs operational pages.
- **Mirror**:
  - Existing sections: `Product System`, `Page Anatomy`, `Cards, Tables, And Lists`, `Status Semantics`.
- **Validate**: #96 implementer can update `components/ui` without guessing.

### Task 4: Encode Shell And Sidebar Decisions

- **File**: `docs/handbook/UI_UX.md`
- **Action**: UPDATE
- **Implement**:
  - Clarify desktop sidebar anatomy.
  - Clarify mobile authenticated header requirements.
  - Define active, count, role/workspace, and logout behavior at a product level.
- **Mirror**:
  - Existing `App Shell` and `Role Navigation` sections.
- **Validate**: Mobile shell issue from #94 is directly addressed.

### Task 5: Define Implementation Handoff To #96

- **File**: `docs/handbook/UI_UX.md`
- **Action**: UPDATE
- **Implement**:
  - Add a short "Implementation Order" or "Next Pass" note:
    1. Tokens and radius.
    2. Button primitive.
    3. Badge/status mapping.
    4. Card/table/input primitives.
    5. Sidebar/mobile shell.
    6. Route-level cleanup only after primitives.
- **Validate**: #96 scope is clear and route polish remains deferred.

### Task 6: Update GitHub Issue #95

- **Action**: GITHUB
- **Implement**:
  - Add `has-plan` label if missing.
  - Comment with plan path and decision summary.
  - After implementation, comment with the handbook sections changed and the handoff to #96.
- **Validate**: #95 has a plan reference and clear acceptance mapping.

---

## Validation

Because #95 is a documentation/decision issue, validation is review-based:

```bash
git diff -- docs/handbook/UI_UX.md
git status --short --branch
```

Optional if docs tooling exists:

```bash
pnpm lint
```

Do not run visual implementation validation here because no UI implementation should happen in #95.

---

## Acceptance Criteria Mapping

- [ ] System-level design problems are separated from page-specific problems.
- [ ] Final rules are defined for buttons, badges, cards, tables, inputs, forms, page headers, and app shells.
- [ ] `docs/handbook/UI_UX.md` is updated only where it improves future implementation.
- [ ] Public/student warmth and admin/editor/company operational density remain one visual language.
- [ ] No route-level polish or primitive implementation is applied in #95.
- [ ] #95 is commented with the plan and handoff to #96.
