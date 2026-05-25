# Issue #223: Chapter Funding Request UI

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/223

Source PRD: `.github/PRDs/lead-funding-request-workflow.prd.md`

Depends on: #222 service/actions.

## Problem

Chapter e-board users need a Spanish-first, low-friction way to see their chapter funding requests and create new request-based funding records. The UI must make required fields, optional context, eligibility rules, and late-request warnings obvious without feeling like an accounting form.

## Codebase Findings

- Chapter routes use `MainContainer`, `Breadcrumb`, `PageHeader`, cards, and server actions.
- Chapter layout navigation comes from `lib/nav-config.ts` through `StudentNavigation`.
- Existing event/member pages keep dense operational UI with restrained cards and small stat blocks.
- The new funding service already exposes chapter list/create/save/submit methods and permission checks.

## Design

Routes:

- `/chapter/funding`: server-rendered request list, stats, grouped status visibility, and CTA.
- `/chapter/funding/new`: server-rendered shell plus client form for interactive budget rows, OKR/pillar checkboxes, event link selection, and draft/submit actions.

Shared helpers:

- Funding status labels and Spanish copy.
- Currency formatting.
- Status badge component.

UX decisions:

- Spanish-first text.
- Required labels are explicit but not noisy.
- Budget item total is shown live and compared with requested amount.
- `Guardar borrador` uses secondary/outline styling, never destructive.
- Late request warning appears when event date is less than 14 days away.
- Regular members/recruiters remain blocked by existing route/service guards.

## Tasks

- [x] Add funding nav item under chapter management.
- [x] Add shared funding display helpers/status badge.
- [x] Add `/chapter/funding` list page with stats, empty state, request cards, and status labels.
- [x] Add `/chapter/funding/new` page.
- [x] Add client funding request form with budget rows, OKR/pillar selections, optional event link, draft and submit flows.
- [x] Run targeted tests/typecheck and inspect rendered UI.

## Validation

- `pnpm exec tsc --noEmit`
- `pnpm run lint` (passes with existing warnings)
- `pnpm run test -- lib/services/__tests__/funding.service.test.ts`
- `pnpm run test -- lib/services/__tests__/chapter-permission.service.test.ts`
- Browser/Playwright screenshot of `/es/chapter/funding` and `/es/chapter/funding/new` after local server is running.

Validated on `http://localhost:3101` with seeded `president@test.com`:

- `outputs/lead-funding-chapter-list-desktop.png`
- `outputs/lead-funding-chapter-new-desktop.png`
- `outputs/lead-funding-chapter-new-mobile.png`

## Risks

- The form can get too long. Use compact sections and avoid repeating labels/descriptions.
- Submit flow currently creates a draft then submits it. Surface errors clearly if the second step fails.
- Event selector must be optional so initiatives without public events are not blocked.
