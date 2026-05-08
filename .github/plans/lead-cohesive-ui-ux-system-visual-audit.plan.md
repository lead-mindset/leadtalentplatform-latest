# Plan: Cohesive LEAD UI/UX System Visual Audit And Redesign Foundation

## Summary

Create a design-system-first UI/UX improvement plan for LEAD using the project UI handbook, LEAD-028 redesign scope, and Codex Desktop visual loop. This is not an isolated component polish task. The work should audit every major screen, identify systemic inconsistency, update shared Tailwind/Shadcn-style primitives and shell patterns first, then apply workflow-level refinements only where the shared system is insufficient.

## User Story

As the LEAD product owner,
I want one cohesive visual language across public, student, chapter editor, admin, and company surfaces,
So that users experience the platform as one trustworthy product instead of a collection of separately styled pages.

## Metadata

| Field | Value |
|-------|-------|
| Type | REFACTOR / ENHANCEMENT |
| Complexity | HIGH |
| Systems Affected | Global CSS, Shadcn-style UI primitives, public shell, authenticated shells, event, onboarding, student, chapter, admin, company workflows |
| GitHub Issue | TBD |
| Source Docs | `docs/handbook/UI_UX.md`, `.github/plans/lead-028-professional-ui-ux-redesign-scope.plan.md`, `docs/PRODUCT-SPECIFICATION.md`, `AGENTS.md` |
| Working Rule | Do not commit until product owner reviews screenshots and direction |

---

## Product Direction

LEAD should feel clear, credible, organized, and mission-driven. Student/public surfaces can be warmer and more aspirational; editor/admin/company workflows should be restrained and efficient. The difference is density and information architecture, not separate visual systems.

The implementation must preserve service/action/auth behavior. This is a UI system pass, not a backend rewrite.

---

## Current Context And Risks

### Current Uncommitted Work

- `app/[locale]/events/page.tsx` has an uncommitted visual-loop patch that sorts upcoming/live events before past events and separates the archive section.
- `tmp/visual-loop/*` contains generated screenshots from the previous visual pass.
- `.agents/`, `.codex/`, `.qa-backups/`, and old plan drafts are untracked local artifacts and should remain unstaged unless explicitly requested.

Before starting implementation, decide whether to keep, refine, or revert the current event-page patch as part of the broader system pass.

### Key System Risks

| Risk | Evidence | Mitigation |
|------|----------|------------|
| Isolated page fixes create more drift | Multiple route-level custom card/button/header patterns | Change shared primitives and shell patterns before page-specific polish |
| UI primitives have competing visual languages | `Button` mixes rounded-full, gradients, Material classes, hover scale; `Card` defaults to 24px radius; docs call for Shadcn-style consistency | Normalize primitive variants and token usage first |
| Operational screens become too decorative | Admin/chapter/company workflows use repeated cards and custom tiles | Prefer tables/dense lists for operational records |
| Mobile text/CTA overflow | Event page screenshot showed cramped mobile cards and intentional truncation | Run mobile screenshots and overflow checks for every workflow |
| Visual QA becomes ceremony | Handbook says light visual QA, not screenshot bureaucracy | Capture only primary desktop/mobile states per workflow |

---

## Patterns To Follow

### Canonical Product Model

Source: `docs/PRODUCT-SPECIFICATION.md`

Pattern:
- Public participation is low-friction.
- Membership is meaningful and explicit.
- Student, editor, admin, company representative workflows are distinct roles in one product.
- UI must preserve the layered account model and avoid old `student_profile` assumptions.

### UI/UX System Contract

Source: `docs/handbook/UI_UX.md`

Pattern:
- `components/ui` is the source of truth for reusable primitives.
- Page-level Tailwind is for layout and composition, not one-off component systems.
- Public pages use top navigation.
- Authenticated student/chapter/admin/company pages use sidebar-first layout.
- Status badge semantics must be consistent.
- Cards, tables, and lists must be used by workflow density.
- Visual design loop: build, run, screenshot, inspect, click/test, revise, recheck.

### Existing Primitive Surface

Source files:
- `components/ui/button.tsx`
- `components/ui/badge.tsx`
- `components/ui/card.tsx`
- `components/ui/input.tsx`
- `components/ui/table.tsx`
- `components/ui/sidebar.tsx`
- `components/ui/sidebars/*`
- `app/[locale]/globals.css`

Observed pattern:
- Shared primitives exist and should be improved centrally.
- Current visual language mixes dark brand tokens, Material-style classes, rounded-full buttons, large-radius cards, gradient buttons, and page-specific overrides.

### Navigation Pattern

Source: `lib/nav-config.ts`

Pattern:
- Role navigation is centralized.
- Student: Browse events, My events, Profile, Resume.
- Chapter: Overview, Events, Check-in, Members, My Profile.
- Admin: Overview, Events, Chapters, Users, Companies, Invites, Activity.
- Company: Dashboard, Browse Talent, Saved Talent, Profile.

---

## Screens To Audit

Capture desktop and mobile screenshots for representative screens. Use seeded personas where auth is required.

### Public

- `/en`
- `/en/events`
- `/en/events/[id]`
- `/en/about`
- `/en/faq`
- `/en/partner-info`
- `/en/auth/login`
- `/en/auth/sign-up`

### Onboarding And Student

- `/en/onboarding`
- `/en/student`
- `/en/student/events`
- `/en/student/profile`
- `/en/student/resume`

### Chapter Editor

- `/en/chapter`
- `/en/chapter/events`
- `/en/chapter/events/new`
- `/en/chapter/events/[id]`
- `/en/chapter/events/[id]/applications`
- `/en/chapter/events/[id]/checkin`
- `/en/chapter/members`
- `/en/chapter/checkin`

### Admin

- `/en/admin`
- `/en/admin/users`
- `/en/admin/users/[id]`
- `/en/admin/chapters`
- `/en/admin/chapters/[id]`
- `/en/admin/events`
- `/en/admin/companies`
- `/en/admin/invites`
- `/en/admin/activity`

### Company Representative

- `/en/company/dashboard`
- `/en/company/browse`
- `/en/company/saved`
- `/en/company/students/[id]`
- `/en/company/profile`
- `/en/company/access-help`

---

## Vera Audit Rubric

For each representative screen, record findings using this rubric:

| Lens | Question |
|------|----------|
| Primary action | Can a user identify the next action in 2 seconds? |
| Cognitive load | Are there too many equally weighted choices? |
| Spacing and grouping | Are related elements grouped and separated with a consistent rhythm? |
| Component consistency | Do buttons, cards, badges, tables, and forms behave like one system? |
| Accessibility | Are contrast, target size, focus states, and labels acceptable? |
| Mobile fit | Does text wrap/truncate intentionally without overlap or horizontal chaos? |
| Status clarity | Are pending, approved, rejected, registered, application required, invited, revoked, and active states visually consistent? |
| Role clarity | Does the screen match the role without becoming a separate product? |

Output finding severity:
- Critical: blocks task completion or access.
- Major: causes confusion, friction, or serious inconsistency.
- Minor: polish or visual refinement.

---

## Files To Change

Do not change all files immediately. Use this dependency order.

| File / Area | Action | Purpose |
|-------------|--------|---------|
| `tmp/visual-audit/*` | CREATE | Store local before/after screenshots only; do not commit unless requested |
| `.github/plans/lead-cohesive-ui-ux-system-visual-audit.plan.md` | CREATE | This implementation plan |
| `docs/handbook/UI_UX.md` | UPDATE IF NEEDED | Capture final design rules discovered during audit |
| `app/[locale]/globals.css` | UPDATE | Normalize tokens, radius, typography, surfaces, focus, density rules |
| `components/ui/button.tsx` | UPDATE | Normalize variants, sizing, radius, focus, hover behavior |
| `components/ui/badge.tsx` | UPDATE | Enforce status semantics and readable colors |
| `components/ui/card.tsx` | UPDATE | Normalize radius, padding, hover, operational vs record card behavior |
| `components/ui/input.tsx` and form primitives | UPDATE | Normalize form rhythm and validation affordances |
| `components/ui/table.tsx` | UPDATE | Improve operational density and scanability |
| `components/ui/sidebar.tsx`, `components/ui/sidebars/*` | UPDATE | Normalize authenticated shell and mobile behavior |
| `app/[locale]/(public)/_components/*` | UPDATE AS NEEDED | Align public shell with design system |
| Workflow pages under `app/[locale]/*` | UPDATE AS NEEDED | Remove page-level drift only after shared primitives are corrected |

---

## Tasks

### Task 1: Freeze Current Working State

- **Action**: REVIEW
- **Implement**:
  - Run `git status --short --branch`.
  - Decide whether to keep the current uncommitted `/events` patch inside this design pass.
  - Do not stage or commit.
- **Validate**: No accidental tracked files beyond intended UI work.

### Task 2: Capture Baseline Screenshot Matrix

- **Action**: CREATE LOCAL ARTIFACTS
- **Implement**:
  - Run the local app.
  - Use Playwright or Codex browser tooling to screenshot every representative route listed above.
  - Capture at least desktop `1440px` and mobile `390px`.
  - Use seeded users for participant, member/editor, admin, and company representative.
- **Mirror**: Visual loop in `docs/handbook/UI_UX.md`.
- **Validate**: Screenshot folders exist under `tmp/visual-audit/baseline`.

### Task 3: Produce Vera Audit Matrix

- **Action**: CREATE LOCAL OR PLAN ATTACHMENT
- **Implement**:
  - Score every screen using the audit rubric.
  - Identify repeated design failures before proposing fixes.
  - Separate system-level findings from page-specific findings.
- **Validate**: Findings are grouped by severity and workflow.

### Task 4: Design System Decision Pass

- **Action**: DESIGN BEFORE CODE
- **Implement**:
  - Decide final primitive rules for:
    - radius scale
    - button variants
    - badge colors and status mapping
    - card use and padding
    - table density
    - form spacing
    - page header anatomy
    - shell/sidebar behavior
  - Record decisions in `docs/handbook/UI_UX.md` if they clarify future work.
- **Validate**: No implementation until decisions are explicit.

### Task 5: Normalize Global Tokens

- **File**: `app/[locale]/globals.css`
- **Action**: UPDATE
- **Implement**:
  - Remove contradictory token behavior where practical.
  - Make typography, surface, border, radius, focus, and status colors consistent.
  - Avoid making the app one-note purple; keep restrained LEAD brand color with semantic system colors.
- **Mirror**: `docs/handbook/UI_UX.md` product system and accessibility rules.
- **Validate**:
  - `pnpm exec eslint app/[locale]/globals.css` if applicable, or `pnpm lint`.
  - Screenshot public and admin pages after token update.

### Task 6: Normalize Shadcn-Style Primitives

- **Files**:
  - `components/ui/button.tsx`
  - `components/ui/badge.tsx`
  - `components/ui/card.tsx`
  - `components/ui/input.tsx`
  - `components/ui/table.tsx`
- **Action**: UPDATE
- **Implement**:
  - Make primitives calm, consistent, accessible, and role-agnostic.
  - Remove over-specific visual behavior that forces page-level workarounds.
  - Keep variants that pages already use, but normalize their visual meaning.
- **Mirror**: Current primitive APIs to avoid breaking consumers.
- **Validate**:
  - `pnpm test`
  - `pnpm lint`
  - Screenshot representative pages before workflow-specific edits.

### Task 7: Normalize App Shells

- **Files**:
  - `lib/nav-config.ts`
  - `components/ui/sidebar.tsx`
  - `components/ui/sidebars/*`
  - `app/[locale]/(public)/_components/navbar*.tsx`
- **Action**: UPDATE
- **Implement**:
  - Keep role navigation from `lib/nav-config.ts`.
  - Make public top nav and authenticated sidebars feel related.
  - Ensure mobile shell has clear menu affordance and no horizontal pressure.
- **Validate**:
  - Browser click-through for public nav, student nav, admin nav, company nav.
  - Mobile screenshots.

### Task 8: Apply Workflow-Level Refinements

- **Action**: UPDATE SELECTIVE ROUTES
- **Implement**:
  - Only after global primitives are normalized, update pages that still violate the system.
  - Prioritize:
    1. public event discovery/detail
    2. onboarding/student dashboard
    3. student event status/QR
    4. chapter editor dashboard/events/members/applications/check-in
    5. admin overview/users/chapters/events/companies/invites/activity
    6. company dashboard/browse/saved/profile/access states
  - Replace isolated custom styling with shared primitive usage.
- **Validate**:
  - Screenshot before/after for each workflow.
  - Click primary task per workflow.

### Task 9: Accessibility And Overflow Pass

- **Action**: VERIFY
- **Implement**:
  - Run mobile overflow checks.
  - Check focus visibility on buttons, links, inputs, tabs, dialogs, menus.
  - Check low-information states: empty, loading, unauthorized, error.
- **Validate**:
  - Browser checks documented.
  - No obvious target below comfortable tap size on mobile primary actions.

### Task 10: Final Validation

- **Action**: VERIFY
- **Commands**:
  ```bash
  pnpm test
  pnpm lint
  pnpm build
  ```
- **Browser Validation**:
  - Public visitor can browse event and open detail.
  - Participant can sign in, onboard, view dashboard, browse/register/apply.
  - Editor can use chapter overview, events, members, applications, check-in.
  - Admin can view overview and management pages.
  - Company representative can browse/saved/profile/access flows.
- **Output**:
  - Before/after screenshots.
  - Vera audit summary.
  - Known residual risks.
  - No commit until product owner approves.

---

## Acceptance Criteria

- [ ] Every primary route has baseline desktop and mobile screenshots.
- [ ] Vera audit matrix identifies critical, major, and minor issues.
- [ ] Shared tokens/primitives are updated before page-level polish.
- [ ] UI changes are cohesive across public, student, chapter, admin, and company contexts.
- [ ] No isolated one-off component styling is introduced.
- [ ] Status badge semantics remain aligned with `docs/handbook/UI_UX.md`.
- [ ] Mobile screens have no visible overlap or broken primary actions.
- [ ] Primary workflows are click-tested.
- [ ] `pnpm test` passes.
- [ ] `pnpm lint` passes or warnings are documented.
- [ ] `pnpm build` passes or any blocker is explicitly diagnosed.
- [ ] Product owner reviews before commit.

---

## Out Of Scope

- Schema changes.
- Service/action behavior rewrites.
- Renaming recruiter/company internals.
- Adding decorative imagegen assets before the system is coherent.
- Full marketing art direction or generated hero imagery.
- Committing without explicit approval.

