# Lead Funding V1 Validation Report

Date: 2026-05-25

Verdict: `pass with issues` for controlled pilot.

## Summary

Lead Funding v1 has a complete request-based slice: database, RLS/storage foundation, service layer, server actions, chapter UI, admin UI, receipt/evidence upload, and focused validation coverage.

The slice is ready for a controlled pilot with trained chapter leaders and admin oversight. It is not yet a full finance operations system.

## Evidence

Implemented issues:

- #221 Database foundation, RLS, storage, seed fixtures.
- #222 Service layer and server actions.
- #223 Chapter request dashboard and form.
- #224 Admin review queue.
- #225 Receipts, evidence, accountability, and closure controls.
- #226 Focused validation, docs, and rollout report.

Automated checks:

- `pnpm run supabase:reset` passed.
- `pnpm run lint` passed with existing repo warnings only.
- `pnpm exec tsc --noEmit` passed.
- `pnpm run test` passed: 30 files, 358 tests.
- `PLAYWRIGHT_BASE_URL=http://localhost:3101 pnpm exec playwright test tests/e2e/lead-funding.spec.ts --project=desktop-chromium --project=mobile-chromium --reporter=line` passed: 8 tests.

Screenshot evidence is kept in ignored local paths under `outputs/`.

## Pilot-Readiness Visual QA Loop - 2026-05-25

Issue: #238.

Result: `pass with issues`, unchanged from the original controlled-pilot verdict. The visual loop reduced copy/seed polish risk but did not change finance policy readiness.

Run notes:

- Initial focused Playwright attempt against `http://localhost:3100` hit a stale server and returned a 404 for `/es/auth/login`.
- A clean Next.js dev server was started on `http://localhost:3101`.
- `pnpm supabase:reset` was used before trusted screenshot runs so local QA-created rows did not pollute the review.
- `PLAYWRIGHT_BASE_URL=http://localhost:3101 pnpm exec playwright test tests/e2e/lead-funding.spec.ts --project=desktop-chromium --project=mobile-chromium --reporter=line` passed: 8 tests.
- `pnpm lint` passed with existing repo warnings only.

Screenshots reviewed under ignored `outputs/`:

- `lead-funding-chapter-list-desktop-chromium.png`
- `lead-funding-chapter-new-desktop-chromium.png`
- `lead-funding-chapter-accountability-desktop-chromium.png`
- `lead-funding-admin-review-desktop-chromium.png`
- `lead-funding-admin-close-desktop-chromium.png`
- `lead-funding-chapter-list-mobile-chromium.png`
- `lead-funding-chapter-new-mobile-chromium.png`
- `lead-funding-chapter-accountability-mobile-chromium.png`
- `lead-funding-admin-review-mobile-chromium.png`
- `lead-funding-admin-close-mobile-chromium.png`

High-confidence fixes made:

- Replaced screenshot-facing Spanglish such as `chapter`, `Budget de chapters`, and `Refreshments para` with Spanish operational copy.
- Added missing accents across funding status labels, form helper text, admin controls, seed demo rows, and Playwright-created QA copy.
- Updated seed data so the clean local pilot review shows polished request titles, budget items, status history, and admin notes.
- Tightened Playwright assertions that became ambiguous after Spanish QA titles were introduced.

Visual review findings:

- Chapter dashboard, request form, accountability detail, admin queue, and admin close controls render without horizontal overflow in the focused desktop/mobile screenshots.
- Mobile admin close controls are long but usable; no clipped primary action was observed.
- Remaining English terms are intentional product/proper nouns or existing broader seed content outside the funding slice, such as `Career Readiness Clinic`.

Focused service tests were not rerun for this visual loop because the implementation changed UI copy, seed/demo text, and E2E assertions only; funding service behavior was not changed.

## Validated Flows

Chapter:

- President can open funding dashboard.
- President can create and submit a funding request.
- Required/optional funding fields are visible in Spanish.
- President can open an approved request detail page.
- President can save post-event accountability.
- President can upload a controlled PDF receipt.
- Desktop and mobile funding pages have no horizontal overflow in the focused checks.

Admin:

- Admin can open funding queue.
- Admin can see submitted request review controls.
- Admin can see approved request closure controls.
- Admin can filter review queue by funding status.

Permissions:

- Regular member does not see request creation controls.
- Recruiter does not see admin review controls.
- File signing is service-checked against chapter funding view permission or admin bypass.

## Current Non-Blocking Issues

- Browser screenshots may include seed user emails. Keep raw screenshots ignored and do not commit them.
- Funding service error strings are mostly English internally; UI copy is Spanish-first, but future polish could map all service failures to Spanish user-facing messages.
- Admin close controls are available, but finance/legal policy for real reimbursement still needs human governance.
- This does not verify real SharePoint, accounting, bank transfer, or receipt compliance integrations.

## Blockers

No code blockers found for a controlled pilot.

Human gates before real rollout:

- Admin/finance confirms the funding policy and exception process.
- At least one chapter president or VP completes a training dry run.
- Real production storage and email smoke are rechecked in the target environment.

## Recommended Follow-Ups

- Add funding source/reporting exports after pilot feedback.
- Add admin-visible receipt summary if finance needs faster audit review.
- Add Spanish error mapping for funding service failures.
- Add optional SharePoint export or folder-link convention if LEAD wants documents mirrored outside the platform.
- Consider LEAD Pulse and LEAD Impact Metrics connections only after the request workflow is stable.
