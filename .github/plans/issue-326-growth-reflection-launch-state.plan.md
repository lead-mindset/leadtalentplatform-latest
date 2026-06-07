# Issue #326 - Growth Reflection Launch State

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/326

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Product Decision

Growth Reflection stays active for launch as a private student proof tool. It is already connected to student recommendations, event follow-up, and personal progress metrics, so hiding it would remove a live pathway loop. The launch positioning should be clear: private by default, student-owned, and focused on turning LEAD experiences into learning evidence.

## Scope

In scope:

- Localize the remaining student dashboard Growth Reflection CTA/copy.
- Localize the Growth Reflection page field labels/placeholders.
- Localize chapter event Pathway labels that expose Growth Reflection as an outcome.
- Add focused regression coverage for the active Growth Reflection launch copy.

Out of scope:

- Reworking Growth Reflection storage or privacy semantics.
- Changing Pathway recommendation logic.

## Tasks

### Task 1 - Localize Active Growth Reflection Copy

- **Files**: `app/[locale]/student/page.tsx`, `app/[locale]/student/growth-reflection/page.tsx`, `app/[locale]/chapter/events/_components/event-form.tsx`
- **Action**: Replace English or experimental wording with Spanish private-proof positioning.
- **Status**: Complete.

### Task 2 - Add Regression Test

- **Files**: `tests/copy/growth-reflection-launch-copy.test.ts`
- **Action**: Assert active Growth Reflection surfaces no longer expose the QA-018 English phrases.
- **Status**: Complete.

### Task 3 - Validate

- **Action**: Run focused test, typecheck, lint, and full tests.
- **Status**: Complete.

## Validation

- `pnpm exec vitest run tests/copy/growth-reflection-launch-copy.test.ts`
- `pnpm exec tsc --noEmit --pretty false`
- `pnpm run lint`
- `pnpm test`

## Definition Of Done

- [x] Product decision is documented.
- [x] Growth Reflection is localized and positioned if active.
- [x] Validation evidence is captured.
