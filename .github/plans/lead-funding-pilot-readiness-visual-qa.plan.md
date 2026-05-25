# LEAD Funding Pilot Readiness Visual QA Loop

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/238

## Problem

LEAD Funding v1 is already a complete vertical slice: database, RLS/storage, service layer, server actions, chapter UI, admin UI, accountability/files, runbook, validation report, and focused Playwright coverage. The next risk is not missing architecture; it is pilot usability.

Before a controlled chapter/admin pilot, we need to run the workflow like a real user, inspect screenshots, improve confusing UI/copy/state, and repeat until the remaining risks are human policy decisions rather than product defects.

## User Story

As a chapter president or VP, I can submit a funding request, understand what information is required, and later regularize receipts/evidence without confusion.

As an admin/finance reviewer, I can review, decide, source-tag, and close funding requests without guessing what state the request is in or what action is expected.

## Type And Complexity

- Type: QA-driven UI/product stabilization.
- Complexity: Medium.
- Primary risk: visual/UX regressions across authenticated, role-specific flows.
- Secondary risk: Playwright specs mutate seeded funding records, so the run must use a controlled reset or disposable local state.

## Codebase Findings

- Existing E2E coverage: `tests/e2e/lead-funding.spec.ts`.
- Existing validation report: `docs/runbooks/lead-funding-validation-report.md`.
- Existing pilot runbook: `docs/runbooks/lead-funding-v1-runbook.md`.
- Existing screenshot output path: `outputs/`, ignored locally and not suitable for commits because screenshots may contain seed user emails.
- Playwright config uses:
  - base URL: `PLAYWRIGHT_BASE_URL` or `http://localhost:3100`
  - projects: `desktop-chromium`, `mobile-chromium`
  - workers: `1`
  - serial funding tests
- Current funding surfaces:
  - `/es/chapter/funding`
  - `/es/chapter/funding/new`
  - `/es/chapter/funding/[id]`
  - `/es/chapter/funding/[id]/edit`
  - `/es/admin/funding`
  - `/es/admin/funding?status=approved`
- The current validation report already marks the slice `pass with issues`, with known follow-ups:
  - Spanish mapping for service failures.
  - Admin-visible receipt summary if finance needs faster audit review.
  - Funding source/reporting exports after pilot feedback.
  - Real finance policy and exception process still need human governance.

## Design

Use a screenshot-first pilot-readiness loop:

1. Reset or verify seeded local data.
2. Run the existing Playwright funding spec on desktop and mobile.
3. Review every generated screenshot against a product checklist.
4. Make only targeted UI/copy/state fixes that reduce pilot confusion.
5. Rerun the spec and capture replacement screenshots.
6. Update the validation report with evidence, remaining issues, and the next human gate.

Do not broaden scope into exports, accounting integrations, SharePoint, scoring, or LEAD Pulse until the pilot flow has been reviewed by a real chapter/admin user.

## Visual QA Rubric

For each screenshot, check:

- The next action is obvious within 5 seconds.
- Required fields and optional context are visually distinguishable.
- Spanish copy is natural and operational, not literal or awkward.
- Status labels match the actual workflow state.
- Amounts, dates, chapter context, and funding source are easy to scan.
- Mobile has no horizontal overflow, clipped buttons, or cramped controls.
- Error, empty, loading, submitted, approved, receipts-due, and closed states are understandable.
- Admin decision controls do not look available in states where they should not be used.
- Receipt/evidence controls clearly explain what is expected after approval.

## Tasks

- [x] Create a GitHub issue for the pilot-readiness visual QA pass and link this plan.
- [ ] Start from clean `dev` on a branch such as `codex/lead-funding-pilot-visual-qa`.
- [ ] Confirm local Supabase seed state is ready for the funding spec.
- [ ] Run `PLAYWRIGHT_BASE_URL=http://localhost:3100 pnpm exec playwright test tests/e2e/lead-funding.spec.ts --project=desktop-chromium --project=mobile-chromium --reporter=line` or let Playwright start the local dev server.
- [ ] Inspect generated screenshots in `outputs/` for the chapter list, new request form, accountability detail, admin review queue, and admin close controls.
- [ ] Create a short screenshot review note under `docs/runbooks/lead-funding-validation-report.md` or a new dated QA report if the findings are substantial.
- [ ] Patch only high-confidence UI/copy issues found in the screenshots.
- [ ] Rerun the focused Playwright spec after each patch group.
- [ ] Run `pnpm lint`.
- [ ] Run focused service tests if behavior changes; otherwise document that the change is visual/copy-only.
- [ ] Update the validation report verdict and remaining pilot gates.
- [ ] Open a PR to `dev` with screenshot findings summarized; do not commit raw screenshots.

## Candidate Fix Areas

Only fix these if screenshots confirm the issue:

- Spanish service-error mapping visible to users.
- Funding request form helper text for budget matching and late requests.
- Admin review card density if mobile screenshots are hard to scan.
- Receipt/evidence explanation on chapter detail page.
- Admin receipt summary if the current detail makes finance review too slow.
- Empty-state or status-state wording if a seeded state feels ambiguous.

## Validation Commands

```bash
pnpm lint
pnpm exec playwright test tests/e2e/lead-funding.spec.ts --project=desktop-chromium --project=mobile-chromium --reporter=line
```

Run these when behavior changes:

```bash
pnpm run test -- lib/services/__tests__/funding.service.test.ts
pnpm build
```

## Evidence To Capture

- Playwright pass/fail summary.
- List of screenshot files reviewed, without committing them.
- Before/after summary for each UI improvement.
- Remaining pilot gates:
  - finance policy approval
  - chapter leader dry run
  - production storage/email smoke in target environment

## Out Of Scope

- New funding exports.
- Payment/reimbursement automation.
- Public funding transparency dashboards.
- Chapter funding scores.
- LEAD Pulse or impact metrics integration.
- Real accounting/SharePoint integrations.

## Risks

- Seeded tests mutate records. Keep the spec serial and reset or isolate state before trusting screenshots.
- Screenshots may include emails or seeded identities. Keep them ignored and out of PR commits.
- Fixing too much from a single screenshot pass can become redesign. Prefer small, observable improvements and rerun.
- Human finance policy cannot be solved by UI. Document policy gaps instead of hiding them in code.
