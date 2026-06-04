# Plan: CHAPTER-UX-01 Destructive Mobile Event Actions

GitHub issue: #304

## Problem

Chapter mobile event cards show `Eliminar` as a repeated red primary-looking action. Existing confirmation protects deletion, but the mobile visual treatment makes destructive behavior too prominent for chapter operators.

## Scope

In:

- De-emphasize delete on mobile event cards.
- Preserve existing permission checks and confirmation dialog.
- Preserve desktop table behavior.

Out:

- Rewriting event management IA.
- Changing delete/archive business rules.

## Implementation Tasks

- [x] Add a secondary/quiet rendering mode to the delete event button.
- [x] Use the quiet mode for mobile event cards.
- [x] Keep destructive confirmation action unchanged inside the dialog.
- [x] Run focused chapter event validation.

## Validation

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- Launch QA chapter scope if runtime is available.

## Risks

- Hiding delete too much for authorized operators. Mitigation: keep the action visible as a lower-emphasis control with the same label and confirmation.
