# Issue #324 - Clean Active Spanish Copy

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/324

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Problem

Active Spanish launch surfaces still include unaccented copy such as `capitulo`, `postulacion`, `codigo`, `pagina`, and related variants. This makes the product feel unfinished on Spanish-first workflows.

## Scope

In scope:

- Clean the named active surfaces from QA-016: admin events, chapter members, and student events.
- Clean shared event registration/application components that those routes render.
- Add a focused copy-regression test for the cleaned active surfaces.
- Capture text-sweep evidence.

Out of scope:

- Historical tests, fixtures, generated database types, and migration-only strings.
- Broad rewrite of all Spanish copy beyond the QA-016 active surfaces.

## Tasks

### Task 1 - Patch Active Spanish Copy

- **Files**: selected `app/[locale]`, `components/events`, and `lib/events` files used by active admin/chapter/student event surfaces.
- **Action**: Replace unaccented Spanish user-facing strings with proper accented Spanish.
- **Status**: Complete.

### Task 2 - Add Copy Regression Test

- **Files**: `tests/copy/spanish-active-surfaces.test.ts`
- **Action**: Assert scoped active surface files do not reintroduce the QA-016 unaccented variants.
- **Status**: Complete.

### Task 3 - Validate

- **Action**: Run focused copy test, text sweep, typecheck, lint, and full tests.
- **Status**: Complete.

## Validation

- `pnpm exec vitest run tests/copy/spanish-active-surfaces.test.ts`
- `rg -n "\\b(capitulo|Capitulo|postulacion|Postulacion|codigo|codigos|pagina|proximo|proximos|accion|aprobacion|revision|decision)\\b" <scoped files>`
- `pnpm exec tsc --noEmit --pretty false`
- `pnpm run lint`
- `pnpm test`

## Definition Of Done

- [x] Named active surfaces use proper Spanish accents.
- [x] Shared event application/registration copy is covered.
- [x] Text sweep or test evidence is attached.
- [x] Validation evidence is captured.
