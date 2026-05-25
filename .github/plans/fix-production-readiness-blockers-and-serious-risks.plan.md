# Plan: Fix Production Readiness Blockers And Serious Risks

Source evidence:

- `.github/reports/production-readiness-validation-report.md`
- `.github/reports/issue-216-validate-supabase-storage-uploads-and-private-file-access-report.md`
- `.github/reports/issue-217-add-axe-accessibility-and-keyboard-launch-checks-report.md`
- `.github/reports/issue-218-add-performance-budget-validation-for-launch-routes-report.md`

## Release Bar

Controlled pilot is approved only when proven launch blockers and serious trust/access/core-flow risks are fixed. Non-critical polish can wait.

## Implementation Status

- [x] Task 1: Repair Storage launch blockers.
- [x] Task 2: Add accessibility evidence detail so blockers are traceable to source UI.
- [x] Task 3: Fix critical accessibility failures on chapter, student, and company core routes.
- [x] Task 4: Fix serious accessibility failures on launch-critical shared surfaces where source is clear.
- [x] Task 5: Rerun targeted validation gates.
- [x] Task 6: Update readiness report and list any remaining external judgment calls.

## Files Expected To Change

| Area | Files |
| --- | --- |
| Storage migrations | `supabase/migrations/*` |
| Accessibility QA harness | `tests/e2e/production-readiness-accessibility.spec.ts` |
| UI fixes | Student, chapter, company, auth/public/admin shared components as identified |
| Reports | `.github/reports/production-readiness-validation-report.md` and issue/fix report |

## Acceptance Criteria

- `pnpm run qa:storage` passes once local Supabase is available.
- `pnpm run qa:accessibility` has zero critical violations and no serious violations on pilot-critical routes, or any remaining serious findings are explicitly documented with a reason.
- `pnpm run lint` passes.
- Any validation blocked by Docker or external inbox decisions is clearly separated from product blockers.
