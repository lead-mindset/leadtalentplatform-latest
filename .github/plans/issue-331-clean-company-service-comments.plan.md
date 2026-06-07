# Issue #331 - Clean Company Service Comments

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/331

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Problem

`lib/services/company.service.ts` contains mojibake/noisy separator comments. This has no runtime product impact, but it makes reviews harder and suggests encoding drift.

## Scope

In scope:

- Remove mojibake separator comments in `company.service.ts`.
- Replace mojibake em dashes in comments with ASCII punctuation.
- Run service-focused and standard validation.

Out of scope:

- Behavior changes to company/recruiter services.
- Broad repository encoding cleanup.

## Tasks

### Task 1 - Clean Comments

- **Files**: `lib/services/company.service.ts`
- **Action**: Replace noisy mojibake comments with concise ASCII comments.
- **Status**: Completed.

### Task 2 - Validate No Behavior Change

- **Action**: Run `rg` for mojibake markers and run tests/typecheck/lint.
- **Status**: Completed.

## Validation

- `rg "Ã|Â|â|�" -n lib/services/company.service.ts`
- Result: Passed; no matches. Also verified with `rg "[^\x00-\x7F]" -n lib/services/company.service.ts`.
- `pnpm exec tsc --noEmit --pretty false`
- Result: Passed.
- `pnpm run lint`
- Result: Passed with existing warnings only, 0 errors.
- `pnpm exec vitest run lib/services/__tests__/company.service.test.ts`
- Result: Passed, 1 file / 25 tests.
- `pnpm test`
- Result: Passed, 59 files / 533 tests.

## Definition Of Done

- [x] `company.service.ts` comments are clean ASCII.
- [x] No behavior code is changed.
- [x] Validation evidence is captured in the issue/report.
