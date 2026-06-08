# Playwright QA Issues - 2026-06-07

GitHub issue creation was attempted for `lead-mindset/leadtalentplatform-latest`, but the available GitHub connector returned a `404 NOT_FOUND` for issue creation. Until repo access is fixed, this file is the local `/to-issues` backlog for the branch `codex/full-role-playwright-production-qa`.

## Issue 1 - Align E2E assertions with current Spanish product copy

/plan
- Treat the app copy as source of truth where it is already clear and user-facing.
- Update Playwright selectors for accented Spanish labels and renamed Pathway headings.
- Prefer exact visible copy only where the product intentionally presents a stable label.

/implement
- Update `lead-intelligence-auth-qa.spec.ts`, `participant-onboarding-redirect.spec.ts`, and launch QA selectors for current Spanish strings.

/validate
- Run focused Playwright specs for onboarding redirect and Lead Intelligence Pathway flows.

## Issue 2 - Align chapter roster QA with responsive role controls

/plan
- Preserve the current mobile UI pattern where e-board role controls are behind `Gestionar rol e-board`.
- Update tests to reveal the disclosure before asserting assignment controls on mobile.
- Make revoke/confirmation selectors accent-tolerant.

/implement
- Add small helpers in chapter roster tests and launch matrix collection.

/validate
- Run `chapter-permissions.spec.ts` and `chapter-leader-member-management.spec.ts` across desktop and mobile projects.

## Issue 3 - Approved members hitting chapter operations should land on the explicit unauthorized boundary

/plan
- Keep the route guard behavior because it provides a clear boundary and safe onward navigation.
- Update the test from silent `/student` redirect to the actual `/auth/unauthorized` experience.

/implement
- Assert the unauthorized URL, message, and `Ir a mi espacio` link.

/validate
- Run `chapter-permissions.spec.ts`.

## Issue 4 - Fix check-in scanner hydration mismatch

/plan
- Avoid reading browser-only capability state during the initial render.
- Detect `BarcodeDetector` after mount so server and first client render match.

/implement
- Replace render-time `window` capability detection with mount-time state.

/validate
- Run the launch QA report or a focused check-in page smoke to confirm hydration errors are gone.

## Issue 5 - Investigate launch matrix mobile timeout and application submit target

/plan
- First remove false-positive selector drift in application and roster checks.
- Re-run launch matrix after the targeted fixes.
- If mobile still times out, split the exhaustive launch matrix or add per-flow isolation.

/implement
- Update launch matrix selectors for accented application and roster labels.

/validate
- Run `launch-qa-report.spec.ts` after focused specs pass.

## Issue 6 - Isolate Lead Funding mobile teardown flake

/plan
- Treat the observed failure as a likely runner/timeout issue because the error context showed the correct unauthorized page.
- Re-run the funding spec in isolation after the broader suite is stabilized.

/implement
- No product change unless the isolated funding run reproduces a real behavior mismatch.

/validate
- Run `lead-funding.spec.ts` on mobile only.

## Issue 7 - Suppress mobile navigation-abort console noise from collaborator loading

/plan
- Treat mobile `TypeError: network error` during route changes as the same abort-like class already handled by `CollaboratorManager`.
- Keep real server/action errors visible in the console.

/implement
- Extend the abort-like error filter to include the browser's `network error` wording.

/validate
- Re-run the mobile launch matrix and confirm zero launch findings.
