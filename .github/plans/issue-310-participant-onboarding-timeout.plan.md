# Issue #310 - Participant Onboarding Timeout

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/310

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Problem

The full route sweep recorded a 45 second `domcontentloaded` timeout for `participant@test.com` on `/es/onboarding` at desktop size. The same sweep later completed the mobile onboarding check and redirected the participant to `/es/events`, which is expected for a profile-complete participant.

## Scope

In scope:

- Reproduce `/es/onboarding` for `participant@test.com` at desktop and mobile viewport sizes.
- Confirm whether the route hangs, redirects, or depends on route-sweep ordering/dev-server instability.
- Add focused browser regression coverage for participant onboarding redirect behavior.
- Capture desktop and mobile screenshots.
- Document whether a code fix is needed.

Out of scope:

- Redesigning the onboarding form.
- Changing participant profile-completion policy.
- Route-sweep sharding or dev-server instability mitigation, which belongs to #322/#330 if reproduction stays clean.

## Tasks

### Task 1 - Reproduce Participant Onboarding

- **Files**: `outputs/issue-310-participant-onboarding-timeout/*`
- **Action**: Run focused desktop and mobile checks for `participant@test.com` on `/es/onboarding`.
- **Status**: Completed. Focused browser validation covered desktop `1365 x 900` and mobile `390 x 844`.

### Task 2 - Classify Timeout Source

- **Files**: `app/[locale]/onboarding/page.tsx`, `components/onboarding.tsx`, route-sweep evidence
- **Action**: Determine whether the timeout is caused by server data, auth redirect, client hydration, or route-sweep/dev-server noise.
- **Status**: Completed. The current route did not hang in isolation. `app/[locale]/onboarding/page.tsx` redirects profile-complete users to `/${locale}/events`, which matches the mobile route-sweep evidence and the focused desktop/mobile run. A first inline reproduction attempt submitted the login form before React state settled and stayed on login with a validation message; the final regression mirrors existing E2E helpers by asserting field values before submit.

### Task 3 - Add Regression Coverage

- **Files**: `tests/e2e/participant-onboarding-redirect.spec.ts`
- **Action**: Add focused Playwright coverage that logs in as the participant, navigates to `/es/onboarding`, asserts the expected safe redirect, and captures no app-origin errors.
- **Status**: Completed. Added `tests/e2e/participant-onboarding-redirect.spec.ts`.

### Task 4 - Validate

- **Action**:
  - Run the focused Playwright spec.
  - Run typecheck, lint, and tests.
  - Save screenshots and a report.
- **Status**: Completed.

## Validation

- `PLAYWRIGHT_BASE_URL=http://localhost:3104 pnpm exec playwright test tests/e2e/participant-onboarding-redirect.spec.ts --project=desktop-chromium --reporter=line`
- Result: Passed, 2/2 tests.
- `pnpm exec tsc --noEmit --pretty false`
- Result: Passed.
- `pnpm run lint`
- Result: Passed with existing warnings only, 0 errors.
- `pnpm test`
- Result: Passed, 59 files / 533 tests after clearing stale Vitest worker processes from a previous timed-out constrained run.

## Definition Of Done

- [x] Desktop and mobile participant onboarding behavior is reproduced.
- [x] Timeout source is classified.
- [x] Regression coverage exists or a product decision is documented.
- [x] Validation evidence is captured in the issue/report.
