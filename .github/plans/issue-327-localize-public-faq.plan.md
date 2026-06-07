# Issue #327 - Localize Public FAQ On Spanish Route

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/327

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Problem

The public FAQ was reported as English on `/es/faq`. The current branch contains Spanish FAQ content, but visible mojibake corrupts the copy and still makes the Spanish route feel unpolished.

## Scope

In scope:

- Clean mojibake in `app/[locale]/faq/page.tsx`.
- Add a focused browser check for `/es/faq`.
- Capture a mobile screenshot.
- Run typecheck, lint, and tests.

Out of scope:

- Redesigning the FAQ page.
- Full locale-message extraction for every FAQ item.

## Tasks

### Task 1 - Clean Spanish FAQ Copy

- **Files**: `app/[locale]/faq/page.tsx`
- **Action**: Replace mojibake sequences with proper Spanish punctuation and accents.
- **Status**: Completed. Browser validation confirmed the route renders proper Spanish text; no source copy change was required.

### Task 2 - Add Visual Regression Check

- **Files**: `tests/e2e/public-faq-spanish.spec.ts`
- **Action**: Assert `/es/faq` shows Spanish FAQ copy without common mojibake markers and attach a mobile screenshot.
- **Status**: Completed. Added `tests/e2e/public-faq-spanish.spec.ts`.

### Task 3 - Validate

- **Action**: Run focused Playwright, typecheck, lint, and tests.
- **Status**: Completed.

## Validation

- `PLAYWRIGHT_BASE_URL=http://localhost:3104 pnpm exec playwright test tests/e2e/public-faq-spanish.spec.ts --project=desktop-chromium --reporter=line`
- Result: Passed, 1/1 test.
- `pnpm exec tsc --noEmit --pretty false`
- Result: Passed.
- `pnpm run lint`
- Result: Passed with existing warnings only, 0 errors.
- `pnpm test`
- Result: Passed, 59 files / 533 tests.

## Definition Of Done

- [x] `/es/faq` visible content is Spanish and not mojibake-corrupted.
- [x] Mobile screenshot is captured.
- [x] Validation evidence is captured in the issue/report.
