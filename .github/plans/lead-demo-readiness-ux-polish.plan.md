# Plan: LEAD Demo Readiness UX Polish

## Summary

Stabilize the current LEAD UI for local/team testing by fixing high-impact flow clarity issues found in the latest visual QA pass. This is not another broad redesign. The goal is to make the existing cohesive system trustworthy, readable, and easy to test across public, student, chapter, admin, and company flows.

## Problem

The visual system is now mostly coherent, but the demo experience still has user-facing friction:

- Action buttons with trailing arrows can wrap the arrow below the text.
- Public copy mixes English and Spanish on the same locale.
- Event times may look unrealistic because of timezone/date display.
- Event detail capture needs verification before registration demos.
- Badge colors do not always match semantic meaning.
- A few custom controls still report missing names or small targets.

## User Story

As a LEAD tester or team member,
I want the main flows to look consistent and explain the next action clearly,
so that I can test onboarding, events, chapter activation, admin, and company workflows without confusion.

## Scope

### In Scope

- Fix shared button/action layout so text and trailing icons stay on one row where space allows.
- Verify public event listing and event detail route behavior.
- Review event date/time formatting for realistic Peru-facing QA data.
- Normalize highest-impact copy inconsistencies across the public/student demo path.
- Tighten badge semantics for event availability/status labels.
- Fix accessible names for visible custom controls flagged by QA.
- Re-run targeted visual screenshots for affected pages.

### Out of Scope

- Another full redesign.
- New business logic.
- New database tables.
- Full i18n translation architecture.
- Rewriting every route copy string in the app.
- Solving existing service-test mock typing drift unless it blocks this UX work.

## Root Cause: Button Arrow Wrapping

`components/ui/button.tsx` used Radix `Slot` for `asChild`, but then wrapped the actual link contents in an extra inline `<span>`. That meant the slotted child was no longer the real anchor receiving the button flex classes. On full-width or narrow action links, text and trailing icons could wrap independently, putting arrows on a second line.

The fix belongs in the shared `Button` primitive, not in individual pages.

## Tasks

- [x] Identify why text + arrow action buttons wrap incorrectly.
- [x] Patch `components/ui/button.tsx` so non-slotted buttons keep aligned content while `asChild` passes classes directly to the slotted link/control.
- [x] Run targeted validation for affected button surfaces.
- [x] Verify `/en/events/[id]` renders the actual event detail page with H1 and primary action.
- [x] Decide and apply a demo-language pass for the public/student path.
- [x] Audit event time display and seed data timezone assumptions.
- [x] Normalize event availability/status badge semantics.
- [x] Fix QA-reported visible accessible-name issues.
- [x] Re-run visual QA screenshots for public events, event detail, and student dashboard mobile.

## Validation Results

- `pnpm supabase db reset` passed and reseeded local demo data.
- `pnpm lint` passed with existing warnings only.
- `pnpm build` passed.
- Playwright visual checks passed for:
  - `/en/events` desktop, no horizontal overflow, realistic Lima-facing event times.
  - `/en/events/92000000-0000-4000-8000-000000000016` desktop, real H1 rendered, no horizontal overflow.
  - `/en/student` mobile after seeded persona login, no horizontal overflow, action buttons keep text and arrow on one row.

## Screenshot Artifacts

- `tmp/visual-audit/demo-readiness/events-desktop-final.png`
- `tmp/visual-audit/demo-readiness/event-detail-desktop-final.png`
- `tmp/visual-audit/demo-readiness/student-dashboard-mobile-final.png`

## Suggested Validation

- `pnpm lint`
- `pnpm build`
- `pnpm exec playwright test tmp/visual-audit/issue-99/qa-gate.spec.cjs --reporter=line`
- Manual screenshot review:
  - `/en`
  - `/en/events`
  - `/en/events/[id]`
  - `/en/student`
  - `/en/student/profile`
  - `/en/admin/invites`
  - `/en/company/browse`

## Known Validation Caveat

`pnpm exec tsc --noEmit --pretty false` currently reports existing test mock typing errors and untracked visual-audit TypeScript specs under `tmp/`. Those are not caused by the button layout patch, but they should be handled separately if the team wants raw `tsc --noEmit` to become a gate.
