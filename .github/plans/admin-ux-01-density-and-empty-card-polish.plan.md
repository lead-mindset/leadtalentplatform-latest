# Plan: ADMIN-UX-01 Density And Empty Card Polish

GitHub issue: #305

## Problem

Admin mobile is usable but overly long, and some dashboard panels preserve too much empty space. The admin dashboard should stay dense and operational without becoming visually heavy.

## Scope

In:

- Tighten admin overview spacing.
- Reduce large empty card feel in management/dashboard panels.
- Keep management links and recent joins visible.

Out:

- Full admin IA redesign.
- New admin data queries.
- Company/Recruiter activation.

## Implementation Tasks

- [x] Reduce top-level and card spacing.
- [x] Use denser stat tiles and management links.
- [x] Compact admin sections while preserving mobile readability.
- [x] Validate layout through type/lint and launch QA if available.

## Validation

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `LAUNCH_QA_SCOPE=admin-recruiter pnpm exec playwright test tests/e2e/launch-qa-report.spec.ts --reporter=line`

## Risks

- Making admin too cramped. Mitigation: keep readable line heights and spacing, but remove unnecessary empty card height.
