# Issue #310 Report - Participant Onboarding Timeout

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/310

## Summary

The original full route sweep recorded a 45 second desktop `domcontentloaded` timeout for `participant@test.com` on `/es/onboarding`, but the mobile route-sweep check completed and redirected to `/es/events`.

Focused reproduction did not reproduce the onboarding hang. The current route behavior is coherent: `app/[locale]/onboarding/page.tsx` loads the signed-in user, checks `PersonProfileService.getBasicProfile`, and redirects profile-complete participants to `/${locale}/events`.

## Implementation

- Added `tests/e2e/participant-onboarding-redirect.spec.ts`.
- The new regression logs in as `participant@test.com`, visits `/es/onboarding`, and asserts redirect to `/es/events`.
- The test covers both:
  - desktop `1365 x 900`
  - mobile `390 x 844`
- The test captures page errors, console errors, and 500 responses so a future route hang or server failure fails loudly.

## Classification

No product code change was needed for onboarding itself. The old desktop timeout is best classified as route-sweep/dev-server instability or ordering noise, not a current route-level onboarding defect.

One inline reproduction attempt stayed on `/es/auth/login` with `Ingresa un correo electronico valido.` because it submitted before the controlled login state settled. The committed regression uses the same resilient pattern as the existing E2E helpers: assert the email/password field values before submit and race redirect vs visible login error.

## Evidence

Screenshots:

- `outputs/issue-310-participant-onboarding-timeout/desktop-1365-desktop-chromium.png`
- `outputs/issue-310-participant-onboarding-timeout/mobile-390-desktop-chromium.png`

Diagnostic reproduction artifact:

- `outputs/issue-310-participant-onboarding-timeout/login-after-submit.json`
- `outputs/issue-310-participant-onboarding-timeout/login-after-submit.png`

## Validation

- `PLAYWRIGHT_BASE_URL=http://localhost:3104 pnpm exec playwright test tests/e2e/participant-onboarding-redirect.spec.ts --project=desktop-chromium --reporter=line`
  - Passed, 2/2 tests.
- `pnpm exec tsc --noEmit --pretty false`
  - Passed.
- `pnpm run lint`
  - Passed with existing warnings only, 0 errors.
- `pnpm test`
  - Initial two runs failed after passing assertions because Vitest workers failed to spawn/terminate in this Windows session.
  - After stopping only stale Vitest worker PIDs, the normal `pnpm test` run passed, 59 files / 533 tests.
