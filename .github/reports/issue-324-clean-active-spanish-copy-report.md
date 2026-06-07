# Issue #324 - Clean Active Spanish Copy Report

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/324

## Outcome

Active Spanish launch surfaces now use accented Spanish for the QA-016 vocabulary across admin events, chapter dashboards/events, student dashboard/events/profile, public events, shared event application/registration components, and related auth/error surfaces. The pass includes a copy-regression test so common unaccented variants do not return in active source roots.

## Files Changed

- `app/[locale]/**` active route copy
- `app/api/auth/hooks/send-email/route.tsx`
- `components/events/**` registration and application copy
- `lib/events/lifecycle.ts`
- `tests/copy/spanish-active-surfaces.test.ts`
- `.github/plans/issue-324-clean-active-spanish-copy.plan.md`

## Evidence

- Text sweep: `rg -n "\b(capitulo|Capitulo|postulacion|Postulacion|codigo|codigos|pagina|proximo|proximos|accion|aprobacion|revision|contrasena|limite|aqui|despues|sera|quedara|recuperara|cambiara)\b" app components lib/events -g "*.tsx" -g "*.ts"` returned no matches.
- Screenshot: `outputs/issue-324-clean-active-spanish-copy/public-events-mobile-copy.png`

## Validation

- `pnpm exec vitest run tests/copy/spanish-active-surfaces.test.ts` passed: 1 test.
- `pnpm exec tsc --noEmit --pretty false` passed.
- `pnpm run lint` passed with existing warnings only.
- `pnpm test` passed: 61 files, 535 tests.
