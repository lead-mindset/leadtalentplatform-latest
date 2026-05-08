# Plan: Issue #96 Normalize Global UI Tokens And Shadcn Primitives

## Summary

Normalize LEAD's global CSS tokens and shared Shadcn-style primitives using the #94 audit and #95 handbook decisions. This is the first implementation pass in the cohesive UI/UX system sequence. The work should make the app feel more consistent by changing foundations first: tokens, radius, typography defaults, button variants, badge semantics, cards, inputs, tables, and authenticated shell primitives.

This should not become route-level redesign. Route-specific cleanup belongs to #97/#98 after the shared primitives are stable. Small compatibility changes are allowed only when a primitive API change would otherwise break existing pages.

## User Story

As the LEAD product owner,
I want global tokens and shared primitives normalized,
So that public, student, chapter, admin, and company screens inherit one coherent design foundation instead of relying on one-off page styling.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #96 |
| Type | ENHANCEMENT / DESIGN SYSTEM IMPLEMENTATION |
| Complexity | Large |
| Systems Affected | Global CSS, `components/ui`, sidebar shell primitives, visual QA artifacts |
| Depends On | #95 |
| Blocks | #97, #98, #99, #100 |
| Source Docs | `docs/handbook/UI_UX.md`, `tmp/visual-audit/issue-94/audit-report.md` |
| Commit Rule | Do not commit unless product owner explicitly approves |

---

## Scope

### In Scope

- Normalize global tokens in `app/[locale]/globals.css`.
- Normalize `Button`, `Badge`, `Card`, `Input`, and `Table`.
- Normalize shared sidebar/mobile shell primitives where needed:
  - `components/ui/sidebar.tsx`
  - `components/ui/sidebars/*`
- Add domain status mapping helpers/components only if needed to keep badge semantics consistent.
- Preserve source compatibility where practical:
  - Existing `variant="default"` should remain valid as an alias for primary.
  - Existing `success`, `warning`, and `info` button variants can remain but must be calm semantic variants, not decorative page styling.
  - Deprecated Material-style variants should either be mapped safely or removed only after usage is cleaned up.
- Capture representative before/after screenshots and visually inspect primary role surfaces.

### Out Of Scope

- Full page redesigns.
- Fixing all route-specific layout issues.
- Reworking public hero content.
- Solving `/en/company/access-help` 404.
- Rebuilding company browse mobile as a route feature unless a primitive/table change requires a minimal compatibility adjustment.
- Changing business logic, auth, services, or database.

---

## Inputs And Evidence

| Source | Key Evidence |
|--------|--------------|
| `docs/handbook/UI_UX.md` | Surface hierarchy, radius, button, badge, sidebar, table/list, implementation order |
| `tmp/visual-audit/issue-94/audit-report.md` | Buttons, badges, sidebar, cards/tables are central consistency problems |
| `components/ui/button.tsx` | Default full-pill gradient, hover scale, mixed Shadcn/Material/status variants |
| `components/ui/badge.tsx` | Semantic, role, count, live, link variants mixed in one primitive |
| `components/ui/card.tsx` | Default `rounded-[24px]`, hover/elevated/glass variants |
| `components/ui/input.tsx` | `rounded-2xl`, `md-input`, Material variants |
| `components/ui/table.tsx` | Desktop table primitive exists but has no mobile record alternative |
| `components/ui/sidebars/mobile-header.tsx` | Hardcoded `Dashboard`, weak role/workspace context |
| `components/ui/sidebars/base-sidebar.tsx` | Sidebar uses `bg-gradient-card`, strong visual treatment |
| `app/[locale]/globals.css` | Dark-first Material/Shadcn token mixture and duplicated Material button classes |

---

## Design Decisions To Implement

### Tokens And Surfaces

- Keep LEAD's brand identity, but reduce one-note dark treatment.
- Make operational surfaces calmer and more legible.
- Use consistent semantic colors for success, warning, info, destructive, muted, border, input, ring.
- Keep dark mode viable, but avoid excessive glow, tinted shadow, and high-saturation card backgrounds in app tools.
- Normalize radius variables to the #95 scale.
- Remove or de-emphasize Material button/input classes if no longer part of the system.

### Buttons

- Normalize base button to restrained Shadcn-style behavior:
  - default shape: `rounded-md` or `rounded-lg`
  - no default hover scale
  - no default gradient
  - predictable focus ring
  - readable font weight
- Keep these variants:
  - `default` / primary alias
  - `secondary`
  - `outline`
  - `ghost`
  - `destructive`
  - `link`
  - `success`
  - `warning`
  - `info`
- Treat `success`, `warning`, and `info` as rare semantic action variants, not general styling.
- Preserve public/student hero gradient through an explicit opt-in variant such as `hero` or `brand` if needed.
- Keep `filled`, `tonal`, `outlined`, and `text` only as temporary deprecated aliases if usage still exists.

### Badges

- Normalize badge base to compact, readable, stable, and low-emphasis.
- Keep semantic variants aligned with `docs/handbook/UI_UX.md`:
  - `success`
  - `warning`
  - `destructive`
  - `info`
  - `secondary`
  - `outline`
  - `neutral`
  - `live`
  - `count`
- Move role-specific or domain-specific mappings out of ad hoc route styling where repeated.
- Avoid animation except `live`.

### Cards, Inputs, Tables

- Reduce card default radius from `24px` to the handbook scale.
- Remove default hover/elevated behavior from plain cards; interactive cards should opt in.
- Normalize input radius, focus, border, background, label/helper/error rhythm.
- Normalize table density and text wrapping.
- Add or document a mobile record primitive/pattern if a reusable component already fits; otherwise plan it as follow-up for route-level pages.

### Sidebar And Mobile Shell

- Reduce gradient-heavy sidebar treatment.
- Standardize active state, count badges, user block, role/workspace context, and logout placement.
- Update mobile header primitive to accept/display title or role/workspace context instead of hardcoded `Dashboard`.
- Ensure mobile sidebar trigger remains accessible and obvious.

---

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `.github/plans/issue-96-normalize-global-ui-tokens-and-shadcn-primitives.plan.md` | CREATE | This plan |
| `app/[locale]/globals.css` | UPDATE | Normalize tokens, radius, typography defaults, surfaces, focus, semantic colors, deprecated Material classes |
| `components/ui/button.tsx` | UPDATE | Normalize variants and base behavior |
| `components/ui/badge.tsx` | UPDATE | Normalize badge semantics |
| `components/ui/card.tsx` | UPDATE | Normalize radius, spacing, hover behavior |
| `components/ui/input.tsx` | UPDATE | Normalize form control styling |
| `components/ui/table.tsx` | UPDATE | Normalize dense table behavior |
| `components/ui/sidebars/mobile-header.tsx` | UPDATE | Add role/workspace context support |
| `components/ui/sidebars/base-sidebar.tsx` | UPDATE | Reduce sidebar visual heaviness |
| `components/ui/sidebars/nav-item.tsx` | UPDATE | Normalize active/count/attention states |
| `components/ui/sidebars/*` | UPDATE AS NEEDED | Keep shell consistent across roles |
| `docs/handbook/UI_UX.md` | UPDATE ONLY IF NEEDED | Clarify decisions discovered during implementation |
| `tmp/visual-audit/issue-96/*` | CREATE LOCAL | Before/after screenshots and notes; do not commit unless requested |

Potential compatibility-only route changes may be needed if renamed variants or mobile header props cause TypeScript errors. Keep those changes minimal and note them in the final summary.

---

## Tasks

### Task 1: Freeze And Inventory Current Primitive Usage

- **Action**: REVIEW
- **Implement**:
  - Run `git status --short --branch`.
  - Inventory current variant usage:
    - `Button` variants.
    - `Badge` variants.
    - direct `rounded-full`, `rounded-[24px]`, `button-gradient-primary`, and Material classes.
  - Record compatibility risks before editing.
- **Validate**:
  - No files changed by this task.

### Task 2: Normalize Global Tokens And Utility Classes

- **File**: `app/[locale]/globals.css`
- **Action**: UPDATE
- **Implement**:
  - Normalize `--radius` and related shape variables to the #95 scale.
  - Calm operational surfaces, borders, inputs, focus rings, muted colors, and semantic colors.
  - Remove duplicated or conflicting Material button/input rules where safe.
  - Keep public/student brand affordances available through explicit opt-in classes.
- **Validate**:
  - `pnpm exec eslint app/[locale]/globals.css` is not applicable; inspect CSS diff manually.
  - `pnpm lint` later catches import/type issues.

### Task 3: Normalize Button Primitive

- **File**: `components/ui/button.tsx`
- **Action**: UPDATE
- **Implement**:
  - Remove default full-pill, default gradient, default hover scale, and forced heavy typography.
  - Normalize core variants.
  - Keep `default` as the primary alias to avoid broad route churn.
  - Keep `success`, `warning`, and `info` as calm semantic variants per #96 acceptance.
  - Add explicit `brand`/`hero` variant if public/student CTAs need gradient opt-in.
  - Decide temporary handling for `filled`, `tonal`, `outlined`, and `text` based on current usage.
- **Validate**:
  - `pnpm exec eslint components/ui/button.tsx`

### Task 4: Normalize Badge Primitive And Status Mapping

- **File**: `components/ui/badge.tsx`
- **Action**: UPDATE
- **Implement**:
  - Reduce badge visual weight.
  - Normalize semantic variants against handbook.
  - Keep `live` animation only for live state.
  - Keep `count` compact for navigation/count usage.
  - Remove or de-emphasize role-specific variants if they duplicate status semantics.
  - If repeated domain mappings are obvious, create a small helper in `components/ui/status-badge.tsx` or similar; otherwise defer domain helpers to #98 route cleanup.
- **Validate**:
  - `pnpm exec eslint components/ui/badge.tsx`

### Task 5: Normalize Card, Input, And Table Primitives

- **Files**:
  - `components/ui/card.tsx`
  - `components/ui/input.tsx`
  - `components/ui/table.tsx`
- **Action**: UPDATE
- **Implement**:
  - Card: restrained radius, no default decorative hover, clear interactive opt-in.
  - Input: restrained radius, calm surface, consistent focus/error/success states.
  - Table: readable density, less horizontal pressure, consistent header/cell styling.
  - Preserve existing props and exports.
- **Validate**:
  - `pnpm exec eslint components/ui/card.tsx components/ui/input.tsx components/ui/table.tsx`

### Task 6: Normalize Sidebar And Mobile Shell Primitives

- **Files**:
  - `components/ui/sidebar.tsx`
  - `components/ui/sidebars/mobile-header.tsx`
  - `components/ui/sidebars/base-sidebar.tsx`
  - `components/ui/sidebars/nav-item.tsx`
  - role sidebar files as needed
- **Action**: UPDATE
- **Implement**:
  - Calm sidebar background and active states.
  - Standardize count badge styling.
  - Make mobile header accept/display title or role/workspace context.
  - Avoid hardcoded `Dashboard` where the actual current area is known.
  - Preserve drawer behavior and close-on-nav.
- **Validate**:
  - `pnpm exec eslint components/ui/sidebar.tsx components/ui/sidebars`

### Task 7: Minimal Compatibility Pass

- **Action**: UPDATE AS NEEDED
- **Implement**:
  - Run TypeScript/build or lint.
  - Fix compile errors from variant typing or prop changes.
  - Do not polish route layouts.
  - If a page uses a deprecated variant, either preserve the alias or make the smallest safe replacement.
- **Validate**:
  - `pnpm lint`

### Task 8: Visual Builder Verification

- **Action**: LOCAL QA
- **Implement**:
  - Use Codex Desktop/Playwright visual loop.
  - Capture before/after representative screens under `tmp/visual-audit/issue-96/`.
  - Required screens:
    - `/en`
    - `/en/events`
    - `/en/auth/login`
    - `/en/student`
    - `/en/chapter/events/new`
    - `/en/admin`
    - `/en/admin/chapters`
    - `/en/company/browse`
  - Capture desktop and mobile where relevant.
  - Check horizontal overflow on admin chapters and company browse mobile.
- **Validate**:
  - Screenshot files exist.
  - Visual notes summarize improvements and remaining page-specific follow-ups.

### Task 9: Full Validation

- **Action**: VERIFY
- **Implement**:
  - Run:
    - `pnpm lint`
    - `pnpm test`
    - `pnpm build`
  - If `pnpm build` times out or fails for an unrelated existing issue, document exact result.
- **Validate**:
  - Commands pass or failures are clearly recorded.

### Task 10: Update GitHub Issue #96

- **Action**: GITHUB
- **Implement**:
  - Add `has-plan`.
  - Comment with plan path.
  - After implementation, comment with:
    - files changed
    - visual screenshots path
    - validation results
    - follow-up issues for route-specific polish if needed
- **Validate**:
  - #96 has plan and implementation evidence.

---

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Shared primitive changes alter many pages at once | Preserve APIs and aliases where practical; run broad visual checks |
| Removing `default`/Material variants creates broad TypeScript churn | Keep aliases during #96, deprecate later if needed |
| Operational surfaces still look dark-heavy after token changes | Use visual loop on admin/chapter/company screens before finishing |
| Route-specific bugs tempt page polish | Record route follow-ups for #97/#98/#99 instead of drifting scope |
| Badge semantics remain ad hoc | Normalize base variants now; create domain helpers only where low-risk |
| Mobile company browse remains clipped | If not solved by table primitive, record as #98 route-level follow-up |

---

## Validation Commands

```bash
pnpm exec eslint components/ui/button.tsx components/ui/badge.tsx components/ui/card.tsx components/ui/input.tsx components/ui/table.tsx components/ui/sidebar.tsx components/ui/sidebars
pnpm lint
pnpm test
pnpm build
```

Visual validation:

```text
tmp/visual-audit/issue-96/
```

---

## Acceptance Criteria Mapping

- [x] Global tokens in `app/[locale]/globals.css` are coherent for typography, surfaces, borders, radius, focus, and semantic colors.
- [x] `Button` variants are normalized and compatible with existing primary, secondary, outline, ghost, destructive, success, warning, and info states.
- [x] `Badge` variants match `docs/handbook/UI_UX.md` semantics.
- [x] `Card`, `Input`, and `Table` primitives use consistent spacing, density, and focus behavior.
- [x] Representative public, student, chapter, and admin screenshots are reviewed before page-specific edits. Company browse was attempted but currently redirects to login for the local recruiter seed; see `tmp/visual-audit/issue-96/visual-notes.md`.
- [x] Route-level polish remains deferred unless required for compatibility.

## Implementation Results

- Normalized shared primitives in `components/ui/button.tsx`, `components/ui/badge.tsx`, `components/ui/card.tsx`, `components/ui/input.tsx`, and `components/ui/table.tsx`.
- Normalized shared authenticated shell primitives in `components/ui/sidebar.tsx` and `components/ui/sidebars/*`.
- Added mobile title context to authenticated layouts.
- Applied one compatibility fix in `app/[locale]/student/page.tsx` so normalized buttons do not clip action labels.
- Captured visual artifacts in `tmp/visual-audit/issue-96/`.

Validation:

- `pnpm exec eslint components/ui/button.tsx components/ui/badge.tsx components/ui/card.tsx components/ui/input.tsx components/ui/table.tsx components/ui/sidebar.tsx components/ui/sidebars` passed.
- `pnpm lint` passed with existing warnings.
- `pnpm test` passed: 16 files, 261 tests.
- `pnpm build` passed.
- Raw `pnpm exec tsc --noEmit --pretty false` still fails in existing service test mock typings; Next build TypeScript passed, so this is not introduced by #96.
