# Issue #316 - Chapter Members Mobile Density

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/316

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Problem

The chapter members page is already card-based, but the 390px mobile view is still too dense for repeated chapter-leader workflows. Status tabs are horizontally cramped, e-board assignment controls repeat in full on every approved member card, and Spanish copy includes unaccented or corrupted text.

## Scope

In scope:

- Replace mobile status-tab overflow with a wrapping/grid segmented layout.
- Keep desktop tab density for wider screens.
- Collapse less-common e-board role-management controls behind a mobile disclosure while keeping desktop controls visible.
- Clean Spanish copy on the chapter members route and e-board invite surface.
- Capture mobile screenshot evidence for chapter leader personas.

Out of scope:

- Changing chapter membership permissions or service behavior.
- Redesigning application approval/rejection flows.
- Changing e-board invite backend semantics.

## Tasks

### Task 1 - Make Status Selection Clear On Mobile

- **Files**: `app/[locale]/chapter/members/components/member-tabs.tsx`
- **Action**: Replace horizontal tab overflow with a small-screen grid/wrapping segmented control.
- **Status**: Completed.

### Task 2 - Reduce Repeated Role-Control Density

- **Files**: `app/[locale]/chapter/members/components/member-card.tsx`
- **Action**: Put e-board role assignment controls behind a mobile disclosure and keep them expanded on desktop.
- **Status**: Completed.

### Task 3 - Clean Spanish Copy

- **Files**:
  - `app/[locale]/chapter/members/page.tsx`
  - `app/[locale]/chapter/members/components/members-list.tsx`
  - `app/[locale]/chapter/members/components/member-card.tsx`
  - `app/[locale]/chapter/members/components/member-actions.tsx`
  - `app/[locale]/chapter/members/components/role-assignment-actions.tsx`
  - `app/[locale]/chapter/members/components/eboard-invite-management.tsx`
- **Action**: Fix mojibake, accents, and English words in Spanish context.
- **Status**: Completed.

### Task 4 - Validate And Capture Evidence

- **Action**:
  - Run typecheck, lint, and tests.
  - Capture `/es/chapter/members` mobile screenshot at 390px.
  - Record width metrics and tab/action visibility.
- **Status**: Completed.

## Validation

- `pnpm exec tsc --noEmit --pretty false` - passed.
- `pnpm run lint` - passed with 0 errors and existing warnings.
- `pnpm test` - passed, 59 files and 526 tests.
- Playwright screenshots at `390 x 844` for `/es/chapter/members`:
  - `outputs/issue-316-chapter-members-mobile/president-es-chapter-members-390-after.png`
  - `outputs/issue-316-chapter-members-mobile/vp-es-chapter-members-390-after.png`
  - `outputs/issue-316-chapter-members-mobile/editor-es-chapter-members-390-after.png`

## Definition Of Done

- [x] Chapter members mobile status selection is visible without horizontal clipping.
- [x] Repeated e-board role-management controls no longer dominate every mobile approved-member card.
- [x] Spanish copy on the route is cleaned.
- [x] Mobile screenshot evidence is captured and linked in the issue/report.
