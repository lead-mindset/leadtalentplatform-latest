# Plan: Issue #97 Unify Public And Authenticated App Shells

## Summary

Unify LEAD's public top navigation and authenticated sidebar-first shells after the #96 primitive normalization pass. This is a shell and navigation cohesion issue, not a page redesign. The implementation should keep public routes using the public navbar, keep authenticated student/chapter/admin/company routes using the shared sidebar shell, remove visual drift between those shells, and verify primary navigation click-through across roles.

The work should be built around the current real shell components:

- Public shell: `app/[locale]/(public)/_components/navbar*.tsx` plus public routes that import it.
- Authenticated shell: `components/ui/sidebar.tsx`, `components/ui/sidebars/*`, and role layouts under `app/[locale]/{student,chapter,admin,company}`.
- Canonical authenticated role nav: `lib/nav-config.ts`.

Do not switch to the legacy `components/global/navigation/*` or `components/navigation/app-sidebar.tsx` systems unless a separate cleanup task explicitly removes or consolidates them.

## User Story

As a LEAD user,
I want public browsing and authenticated role navigation to feel like one coherent product,
So that I can move between events, dashboards, chapter tools, admin tools, and company access without visual or interaction confusion.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #97 |
| Type | ENHANCEMENT / UI SYSTEM |
| Complexity | Medium |
| Systems Affected | Public navbar, authenticated sidebar shell, role layouts, navigation QA |
| Depends On | #96 Normalize global UI tokens and Shadcn primitives |
| Blocks | #98+ route-level workflow polish |
| Source Docs | `docs/handbook/UI_UX.md`, `.github/PRDs/lead-cohesive-ui-ux-system-visual-audit.prd.md`, `tmp/visual-audit/issue-96/visual-notes.md` |
| Commit Rule | Do not commit unless product owner explicitly approves |

---

## Current State

### Public Shell

- `app/[locale]/(public)/_components/navbar-client.tsx` is the real public navbar used by public pages and events.
- It already exposes public event browsing, auth CTAs, and company access.
- Current styling still uses pill-shaped nav links and mobile menu treatment that should align with the #96 button/radius/sidebar decisions.
- `app/[locale]/(public)/_components/nav-links.ts` defines public/auth-visible nav links for the public shell.
- `components/global/navigation/NavHeader.tsx`, `NavBar.tsx`, `DesktopMenu.tsx`, and `MobMenu.tsx` appear legacy/unused in current route scans. They should be audited but not expanded as the primary shell.

### Authenticated Shell

- `components/ui/sidebars/sidebar-layout.tsx` provides the shared authenticated layout wrapper.
- `components/ui/sidebars/base-sidebar.tsx` provides user block, sidebar content, and logout placement.
- `components/ui/sidebars/nav-item.tsx` handles active item, count, and attention state.
- `components/ui/sidebars/student-sidebar.tsx`, `admin-sidebar.tsx`, and `company-sidebar.tsx` map canonical nav config arrays into sidebar items.
- `lib/nav-config.ts` is already the canonical role navigation source for `STUDENT_NAV`, `CHAPTER_NAV`, `ADMIN_NAV`, and `COMPANY_NAV`.
- #96 added calmer sidebar styling and mobile title context, but #97 should verify consistency and click-through across all role shells.

### Known Risks From #96 Visual Notes

- Company browse currently redirected to login during local visual capture with `recruiter@test.com`; #97 should diagnose whether this is a local seed/access-state issue before calling company navigation verified.
- Admin chapters mobile still needs a route-level mobile record/list layout later. #97 should only ensure the shell/menu does not create overflow.
- Uncommitted #96 changes are currently in the working tree; #97 implementation should be planned and staged separately when the owner asks for commits.

---

## Patterns To Follow

| Category | Source | Pattern |
|----------|--------|---------|
| Public navbar | `app/[locale]/(public)/_components/navbar.tsx` | Server component loads Supabase user/role, computes visible links, then renders `NavbarClient`. |
| Public mobile menu | `app/[locale]/(public)/_components/navbar-client.tsx` | Client state toggles mobile menu and closes it on link click. Preserve this simple pattern. |
| Canonical auth nav | `lib/nav-config.ts` | Role nav items are arrays of `{ id, label, href, icon }`. Keep this as the source of truth. |
| Auth shell wrapper | `components/ui/sidebars/sidebar-layout.tsx` | Shared `SidebarProvider`, `SidebarInset`, mobile header, and main content wrapper. |
| Sidebar user context | `components/ui/sidebars/sidebar-user-header.tsx` | User identity, role label, and member ID/context live in one sidebar header hierarchy. |
| Role sidebar mapping | `components/ui/sidebars/student-sidebar.tsx`, `admin-sidebar.tsx`, `company-sidebar.tsx` | Role-specific navigation maps canonical `lib/nav-config.ts` items to `SidebarNavItem`. |
| Visual QA | `docs/handbook/UI_UX.md` | Capture desktop/mobile screenshots and click through primary flows before completion. |

---

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `.github/plans/issue-97-unify-public-and-authenticated-app-shells.plan.md` | CREATE | This implementation plan |
| `app/[locale]/(public)/_components/navbar-client.tsx` | UPDATE | Normalize public top nav spacing, active/hover/focus states, mobile menu panel, and CTA rhythm |
| `app/[locale]/(public)/_components/navbar-skeleton.tsx` | UPDATE AS NEEDED | Keep loading shell visually consistent with the real navbar |
| `app/[locale]/(public)/_components/nav-links.ts` | REVIEW / UPDATE IF NEEDED | Ensure public nav items are intentional and avoid duplicate route truth |
| `components/ui/sidebars/sidebar-layout.tsx` | UPDATE AS NEEDED | Confirm mobile header/title/menu rhythm across roles |
| `components/ui/sidebars/base-sidebar.tsx` | UPDATE AS NEEDED | Confirm shared user block/logout hierarchy and no visual drift |
| `components/ui/sidebars/nav-item.tsx` | UPDATE AS NEEDED | Confirm active/hover/focus/count/attention states match public nav tone |
| `components/ui/sidebars/student-sidebar.tsx` | UPDATE AS NEEDED | Ensure student/chapter groups stay canonical and readable |
| `components/ui/sidebars/admin-sidebar.tsx` | UPDATE AS NEEDED | Ensure admin counts/pings remain compact and intentional |
| `components/ui/sidebars/company-sidebar.tsx` | UPDATE AS NEEDED | Add a group label if needed for company context consistency |
| `app/[locale]/student/layout.tsx` | UPDATE AS NEEDED | Verify mobile title/subtitle/user badge behavior |
| `app/[locale]/chapter/layout.tsx` | UPDATE AS NEEDED | Verify chapter mobile/workspace context |
| `app/[locale]/admin/layout.tsx` | UPDATE AS NEEDED | Verify admin mobile/workspace context |
| `app/[locale]/company/(protected)/layout.tsx` | UPDATE AS NEEDED | Verify company mobile/workspace context and access behavior |
| `tmp/visual-audit/issue-97/*` | CREATE LOCAL | Screenshots, click-through notes, overflow notes; do not commit unless requested |

Potential cleanup-only files:

| File | Action | Purpose |
|------|--------|---------|
| `components/global/navigation/*` | REVIEW ONLY | Likely legacy public nav system; do not expand without separate cleanup |
| `components/navigation/app-sidebar.tsx` | REVIEW ONLY | Likely legacy animated sidebar; do not use as canonical shell |

---

## Tasks

### Task 1: Freeze Current Shell State

- **Action**: REVIEW
- **Implement**:
  - Run `git status --short --branch`.
  - Confirm #96 primitive work remains in place.
  - Identify whether #96 should be committed before #97 implementation; do not mix commits unless the owner asks.
- **Validate**:
  - No implementation files changed.

### Task 2: Audit Active Shell Ownership

- **Action**: REVIEW
- **Implement**:
  - Confirm which routes render `app/[locale]/(public)/_components/Navbar`.
  - Confirm authenticated role layouts use `SidebarLayout` and `BaseSidebar`.
  - Confirm `components/global/navigation/*` and `components/navigation/app-sidebar.tsx` are unused or legacy.
  - Record findings in the implementation summary.
- **Mirror**: Current route scan from `rg "Navbar|SidebarLayout|BaseSidebar" app components`.
- **Validate**:
  - No implementation files changed.

### Task 3: Normalize Public Navbar

- **File**: `app/[locale]/(public)/_components/navbar-client.tsx`
- **Action**: UPDATE
- **Implement**:
  - Align navbar height, border, blur, focus ring, and spacing with #96 primitives.
  - Use `Button` for auth CTAs consistently.
  - Keep company access visible but low-friction.
  - Make desktop nav active/hover/focus states calm and readable.
  - Make mobile menu feel like the same shell: clear destination list, auth actions, company access, no horizontal overflow.
  - Do not add extra public routes unless the issue requires it.
- **Mirror**: `components/ui/sidebars/sidebar-layout.tsx` for restrained border/background/focus language.
- **Validate**:
  - `pnpm exec eslint app/[locale]/(public)/_components/navbar-client.tsx`

### Task 4: Align Public Navbar Loading State

- **File**: `app/[locale]/(public)/_components/navbar-skeleton.tsx`
- **Action**: UPDATE AS NEEDED
- **Implement**:
  - Ensure skeleton dimensions match the real navbar height and spacing.
  - Avoid a skeleton layout jump on public pages.
- **Mirror**: `navbar-client.tsx`.
- **Validate**:
  - `pnpm exec eslint app/[locale]/(public)/_components/navbar-skeleton.tsx`

### Task 5: Tighten Authenticated Sidebar Shell

- **Files**:
  - `components/ui/sidebars/sidebar-layout.tsx`
  - `components/ui/sidebars/base-sidebar.tsx`
  - `components/ui/sidebars/nav-item.tsx`
  - role sidebar files as needed
- **Action**: UPDATE AS NEEDED
- **Implement**:
  - Verify active, hover, focus, count, and attention states match #96 style.
  - Ensure mobile drawer opens with clear user/role/context information.
  - Ensure logout stays stable and does not fight toasts or issue widgets.
  - Add missing role group labels only where they improve orientation.
  - Preserve `lib/nav-config.ts` as the canonical source for role nav links.
- **Validate**:
  - `pnpm exec eslint components/ui/sidebar.tsx components/ui/sidebars`

### Task 6: Verify Role Layout Context

- **Files**:
  - `app/[locale]/student/layout.tsx`
  - `app/[locale]/chapter/layout.tsx`
  - `app/[locale]/admin/layout.tsx`
  - `app/[locale]/company/(protected)/layout.tsx`
- **Action**: UPDATE AS NEEDED
- **Implement**:
  - Verify mobile title/subtitle communicates role/workspace.
  - Verify member ID and user badge appear only when useful.
  - For company, diagnose whether protected route redirect is seed/access-state or shell behavior before editing auth.
- **Validate**:
  - `pnpm exec eslint app/[locale]/student/layout.tsx app/[locale]/chapter/layout.tsx app/[locale]/admin/layout.tsx app/[locale]/company/(protected)/layout.tsx`

### Task 7: Browser Click-Through QA

- **Action**: LOCAL QA
- **Implement**:
  - Use Playwright/Codex Desktop visual loop.
  - Capture screenshots under `tmp/visual-audit/issue-97/`.
  - Required public checks:
    - `/en`
    - `/en/events`
    - public mobile menu open
    - auth CTAs
    - company access link
  - Required authenticated checks:
    - student sidebar links: Browse Events, My Events, Profile, Resume
    - editor/chapter links: Overview, Events, Check-in, Members
    - admin links: Overview, Events, Chapters, Users, Companies, Invites, Activity
    - company links: Dashboard, Browse Talent, Saved Talent, Profile, or document access blocker if seed cannot reach these routes
  - Check 390px mobile for authenticated menu readability and no horizontal overflow.
- **Validate**:
  - Screenshot/notes files exist in `tmp/visual-audit/issue-97/`.

### Task 8: Validation

- **Action**: VERIFY
- **Implement**:
  - Run:
    - `pnpm lint`
    - `pnpm test`
    - `pnpm build`
  - If raw `tsc --noEmit` is run, document the known service-test mock typing failures separately from #97.
- **Validate**:
  - Commands pass or exact failures are recorded.

### Task 9: Update GitHub Issue #97

- **Action**: GITHUB
- **Implement**:
  - Add `has-plan`.
  - Comment with plan path.
  - After implementation, comment with files changed, screenshots/notes path, click-through evidence, validation results, and any follow-up issues.
- **Validate**:
  - #97 includes implementation evidence and follow-up notes.

---

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Accidentally reviving legacy nav components | Treat `components/global/navigation/*` and `components/navigation/app-sidebar.tsx` as audit-only unless cleanup is explicitly scoped |
| Public navbar becomes too operational and loses warmth | Keep public top nav spacious enough while sharing primitives, focus, and spacing rhythm |
| Authenticated shell changes cause route regressions | Preserve `SidebarLayout`, `BaseSidebar`, and `lib/nav-config.ts`; validate role click-through |
| Company browse cannot be visually verified locally | Diagnose and document access-state separately; do not change auth in shell work unless the blocker is clearly shell-related |
| Mobile menu creates overflow or hides orientation | Screenshot 390px views with menu open and check document overflow |
| Mixing #96 and #97 commits | Keep plan/implementation summaries explicit and commit only when owner asks |

---

## Validation Commands

```bash
pnpm exec eslint app/[locale]/(public)/_components/navbar-client.tsx app/[locale]/(public)/_components/navbar-skeleton.tsx components/ui/sidebar.tsx components/ui/sidebars app/[locale]/student/layout.tsx app/[locale]/chapter/layout.tsx app/[locale]/admin/layout.tsx app/[locale]/company/(protected)/layout.tsx
pnpm lint
pnpm test
pnpm build
```

Visual validation:

```text
tmp/visual-audit/issue-97/
```

---

## Implementation Results

Completed on 2026-05-08.

- Public navbar and skeleton were normalized to the shared LEAD shell rhythm: calmer active states, consistent button usage, clear company access, and mobile menu spacing.
- Authenticated sidebars now use defined sidebar theme tokens, so `bg-sidebar`, `text-sidebar-foreground`, active states, borders, and mobile drawers render as a real cohesive surface.
- Sidebar user text and mobile shell labels were tightened so global typography rules do not inflate shell text.
- Company sidebar now has a role group label for orientation.
- Visual QA script was added under `tmp/visual-audit/issue-97/shell-clickthrough.spec.cjs`; it uses local Supabase seed personas and captures public, student, chapter, admin, and company shell evidence.

## Validation Results

- `pnpm exec playwright test tmp/visual-audit/issue-97/shell-clickthrough.spec.cjs --reporter=line` passed.
- `pnpm exec eslint "app/[locale]/(public)/_components/navbar-client.tsx" "app/[locale]/(public)/_components/navbar-skeleton.tsx" components/ui/sidebar.tsx components/ui/sidebars "app/[locale]/student/layout.tsx" "app/[locale]/chapter/layout.tsx" "app/[locale]/admin/layout.tsx" "app/[locale]/company/(protected)/layout.tsx"` passed.
- `pnpm lint` passed with existing warnings only.
- `pnpm test` passed: 16 files, 261 tests.
- `pnpm build` passed.

Visual evidence:

- `tmp/visual-audit/issue-97/clickthrough-notes.md`
- `tmp/visual-audit/issue-97/public-home-desktop.png`
- `tmp/visual-audit/issue-97/public-events-desktop.png`
- `tmp/visual-audit/issue-97/public-mobile-menu-open.png`
- `tmp/visual-audit/issue-97/student-shell-desktop.png`
- `tmp/visual-audit/issue-97/student-mobile-sidebar-open.png`
- `tmp/visual-audit/issue-97/chapter-shell-desktop.png`
- `tmp/visual-audit/issue-97/admin-shell-desktop.png`
- `tmp/visual-audit/issue-97/company-shell-desktop.png`

## Acceptance Criteria Mapping

- [x] Public routes expose public browsing, authentication, and company access with consistent spacing and mobile behavior.
- [x] Authenticated student, chapter, admin, and company routes use shared sidebar primitives and consistent active/hover/focus states.
- [x] Mobile authenticated navigation is easy to understand and does not create horizontal overflow.
- [x] `lib/nav-config.ts` remains the canonical source for role nav items.
- [x] Browser QA verifies public, student, admin, chapter, and company navigation click-through, or records an explicit company access-state blocker.
