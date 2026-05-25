# Issue #226: Lead Funding Validation, Visual QA, and Rollout Docs

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/226

Source PRD: `.github/PRDs/lead-funding-request-workflow.prd.md`

Depends on: #221-#225.

## Problem

Lead Funding v1 now has the full product slice, but it still needs launch evidence: repeatable browser coverage, a human-friendly rollout guide, and a concise validation report. The goal is controlled pilot readiness, not a broader finance automation system.

## Codebase Findings

- The core service tests cover permissions, submit validation, admin review, accountability transitions, and file upload/signing behavior.
- Existing E2E patterns use seeded personas, `password123`, screenshots in `outputs/`, and `PLAYWRIGHT_BASE_URL` when a dev server is already running.
- Funding pages now exist for chapter list/new/detail and admin review.
- Existing production readiness docs already define evidence rules and safe handling for screenshots, traces, and provider artifacts.

## Design

- Add a focused funding Playwright spec instead of a route crawler.
- Cover chapter leader list/detail/create-submit/accountability upload, role guard checks, and admin review/closure controls.
- Capture screenshots to ignored `outputs/` paths so evidence is available locally but not committed.
- Add a LEAD Funding v1 runbook for chapter leaders and admins.
- Add a validation report summarizing verdict, evidence, blockers, risks, and follow-ups.

## Tasks

- [x] Add focused Playwright coverage for Lead Funding v1.
- [x] Add local screenshots for chapter and admin funding views.
- [x] Add Lead Funding v1 rollout/runbook documentation.
- [x] Add concise validation report for controlled pilot readiness.
- [x] Run lint, typecheck, Vitest, and targeted Playwright validation.
- [x] Update GitHub issue with evidence and close if validated.

## Validation

- `pnpm run supabase:reset`
- `pnpm run lint`
- `pnpm exec tsc --noEmit`
- `pnpm run test`
- `PLAYWRIGHT_BASE_URL=http://localhost:3101 pnpm exec playwright test tests/e2e/lead-funding.spec.ts --project=desktop-chromium --project=mobile-chromium --reporter=line`

Completed:

- `pnpm run supabase:reset` passed.
- `pnpm run lint` passed with existing repo warnings only.
- `pnpm exec tsc --noEmit` passed.
- `pnpm run test` passed: 30 files, 358 tests.
- Fresh-reset funding Playwright passed: 8 tests across desktop and mobile Chromium.
- `git diff --check` passed with no patch errors.

Evidence:

- `outputs/lead-funding-chapter-list-desktop-chromium.png`
- `outputs/lead-funding-chapter-new-desktop-chromium.png`
- `outputs/lead-funding-chapter-accountability-desktop-chromium.png`
- `outputs/lead-funding-admin-review-desktop-chromium.png`
- `outputs/lead-funding-admin-close-desktop-chromium.png`
- Matching mobile Chromium screenshots are also generated under `outputs/`.

## Risks

- E2E tests mutate seed funding records; keep the spec serial and run after `supabase:reset`.
- Screenshots can include seed emails, so keep raw images ignored under `outputs/`.
- This does not prove real finance policy, reimbursement legality, or real bank/payment operations.
