# Plan: VISUAL-I18N-01 Spanish Visible Copy Polish

GitHub issue: #303

## Problem

Visual QA screenshots still show English copy on active Spanish-first launch surfaces: the public homepage allies label, member Pathway recommendation cards, seeded profile focus values, and the admin overview dashboard. This undermines the current launch decision that active routes ship in Spanish first.

## Scope

In:

- Translate active visible copy found in screenshots.
- Keep Company/Recruiter and Alumni deferred scope decisions intact.
- Add presentation-level labels for seeded profile focus values shown to Spanish users.
- Update tests that assert seeded Pathway recommendation text.

Out:

- Full English locale parity.
- Company/Recruiter product activation.
- Alumni product activation.

## Implementation Tasks

- [x] Translate public homepage allies label.
- [x] Translate admin overview copy and operational labels.
- [x] Translate seeded Pathway recommendation fixture text and matching test expectations.
- [x] Add presentation labels for common English profile focus values in student cards.
- [x] Run focused i18n/type validation.

## Validation

- `pnpm exec vitest run lib/services/__tests__/student-dashboard.service.test.ts`
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- Relevant launch QA screenshot rerun if runtime is available.

## Risks

- Translating internal identifiers instead of user-facing labels. Mitigation: keep values intact and translate only presentation copy.
- Accidentally reactivating deferred company surfaces. Mitigation: admin copy should frame company data as controlled/invite-only where it remains visible.
