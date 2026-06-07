# Issue #323 Report - Admin Mobile Shell Subtitle Localization

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/323

## Summary

The admin mobile shell title and subtitle now come from locale messages instead of hardcoded layout strings. This prevents Spanish admin routes from regressing to the English subtitle `Platform management`.

## Implementation

- Added `adminShell.mobileTitle` and `adminShell.mobileSubtitle` to:
  - `messages/es.json`
  - `messages/en.json`
- Updated `app/[locale]/admin/layout.tsx` to call `getTranslations('adminShell')` and pass localized copy into `SidebarLayout`.
- Added `tests/e2e/admin-mobile-shell-localization.spec.ts` to validate the Spanish mobile shell at `/es/admin`.

## Evidence

Screenshot:

- `outputs/issue-323-admin-mobile-shell-subtitle/admin-mobile-shell-desktop-chromium.png`

## Validation

- `PLAYWRIGHT_BASE_URL=http://localhost:3104 pnpm exec playwright test tests/e2e/admin-mobile-shell-localization.spec.ts --project=desktop-chromium --reporter=line`
  - Passed, 1/1 test.
- `pnpm exec tsc --noEmit --pretty false`
  - Passed.
- `pnpm run lint`
  - Passed with existing warnings only, 0 errors.
- `pnpm test`
  - Passed, 59 files / 533 tests.
