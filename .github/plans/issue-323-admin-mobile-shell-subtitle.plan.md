# Issue #323 - Admin Mobile Shell Subtitle Localization

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/323

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Problem

The admin mobile shell was observed showing English copy, `Platform management`, on Spanish routes. The current branch already shows Spanish hardcoded copy, but the safer source-of-truth fix is to source the admin shell title/subtitle from locale messages.

## Scope

In scope:

- Add admin shell title/subtitle messages for `en` and `es`.
- Update `app/[locale]/admin/layout.tsx` to use locale messages.
- Capture a mobile screenshot on `/es/admin`.
- Run typecheck/lint/tests.

Out of scope:

- Full admin page copy sweep, tracked separately by other QA issues.
- Redesigning the admin shell.

## Tasks

### Task 1 - Add Locale Messages

- **Files**: `messages/en.json`, `messages/es.json`
- **Action**: Add admin shell title/subtitle keys.
- **Status**: Completed.

### Task 2 - Wire Admin Layout To Messages

- **Files**: `app/[locale]/admin/layout.tsx`
- **Action**: Replace hardcoded mobile shell strings with `next-intl` server translations.
- **Status**: Completed.

### Task 3 - Visual Validation

- **Files**: `outputs/issue-323-admin-mobile-shell-subtitle/*`
- **Action**: Screenshot `/es/admin` at mobile width and confirm Spanish title/subtitle.
- **Status**: Completed. Screenshot captured at `outputs/issue-323-admin-mobile-shell-subtitle/admin-mobile-shell-desktop-chromium.png`.

### Task 4 - Validate

- **Action**: Run focused browser check, typecheck, lint, and tests.
- **Status**: Completed.

## Validation

- `PLAYWRIGHT_BASE_URL=http://localhost:3104 pnpm exec playwright test tests/e2e/admin-mobile-shell-localization.spec.ts --project=desktop-chromium --reporter=line`
- Result: Passed, 1/1 test.
- `pnpm exec tsc --noEmit --pretty false`
- Result: Passed.
- `pnpm run lint`
- Result: Passed with existing warnings only, 0 errors.
- `pnpm test`
- Result: Passed, 59 files / 533 tests.

## Definition Of Done

- [x] Admin mobile shell strings come from locale messages.
- [x] Spanish mobile screenshot shows localized shell copy.
- [x] Validation evidence is captured in the issue/report.
