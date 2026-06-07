# Issue #327 Report - Localize Public FAQ On Spanish Route

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/327

## Summary

Focused browser validation confirms `/es/faq` now renders Spanish public FAQ content with correct accents and no mojibake markers. No page source change was needed on this branch; the durable implementation is a Playwright regression that verifies the rendered page.

## Implementation

- Added `tests/e2e/public-faq-spanish.spec.ts`.
- The test opens `/es/faq` at mobile width and asserts:
  - page title is `Preguntas frecuentes - LEAD`
  - heading is `Preguntas frecuentes`
  - question copy includes `¿Qué es LEAD?`
  - body copy includes `capítulos`
  - English `Frequently Asked Questions` is absent
  - mojibake markers `Ã`, `Â`, and `�` are absent from rendered body text

## Evidence

Screenshot:

- `outputs/issue-327-public-faq-spanish/es-faq-mobile-desktop-chromium.png`

## Validation

- `PLAYWRIGHT_BASE_URL=http://localhost:3104 pnpm exec playwright test tests/e2e/public-faq-spanish.spec.ts --project=desktop-chromium --reporter=line`
  - Passed, 1/1 test.
- `pnpm exec tsc --noEmit --pretty false`
  - Passed.
- `pnpm run lint`
  - Passed with existing warnings only, 0 errors.
- `pnpm test`
  - Passed, 59 files / 533 tests.
