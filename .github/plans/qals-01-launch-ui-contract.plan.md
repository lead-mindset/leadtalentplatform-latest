# Plan: QALS-01 Launch Scope and Spanish-First UI Contract

Issue: #283
PRD: `.github/PRDs/qa-launch-readiness-controlled-rollout.prd.md`

## Problem

The QA review identified inconsistent Spanish copy, unclear launch scope, mixed UI usage, and table/form/modal state drift across launch-critical routes. The repo already has a broad UI/UX handbook and shared primitives, but it needs a short launch-specific contract that implementation issues can cite.

## Scope

- Create a launch UI contract in `docs/handbook/LAUNCH_UI_STANDARD.md`.
- Keep the contract focused on the controlled rollout, not a full design-system rewrite.
- Link the contract from the QA synthesis and PRD.
- Update the GitHub issue with the plan reference after implementation.

## Implementation Tasks

- [x] Create `docs/handbook/LAUNCH_UI_STANDARD.md`.
- [x] Cover active launch routes, deferred roles, Spanish-first copy, button intent, page headers, forms, tables, modals, states, and mobile overflow.
- [x] Explain that `app/[locale]/globals.css`, `components/ui`, `app/brand.md`, and `docs/handbook/UI_UX.md` remain the base.
- [x] Add a concise visual QA checklist for future issues.
- [x] Link the contract from `.github/PRDs/qa-launch-readiness-controlled-rollout.prd.md`.
- [x] Link the contract from `docs/proposals/qa-validation-synthesis-2026-06-03.md`.
- [ ] Update issue #283 with the plan/contract references.

## Validation

- Manual documentation check: required sections exist and stay professional/org-facing.
- Verify no private/personally identifying reviewer details are introduced.
- `pnpm run lint` is not required for docs-only changes, but may be run later with broader validation.

## Risks

- Duplicating the broader UI/UX handbook. Mitigation: keep this contract launch-specific and link back to the canonical handbook.
- Over-scoping into English, Alumni, or Recruiter work. Mitigation: explicitly mark those as deferred.
