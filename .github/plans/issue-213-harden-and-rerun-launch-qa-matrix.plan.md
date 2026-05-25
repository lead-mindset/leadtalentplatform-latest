# Plan: Issue #213 - Harden And Re-Run The Launch QA Matrix

GitHub Issue: #213
Source PRD: `.github/PRDs/launch-user-flow-qa-fixes.prd.md`
Type: Technical / Testing
Complexity: Medium

## Summary

After issues #207-#212, promote the launch QA harness from report-only evidence into a stable validation pass. The matrix should still write JSON/screenshots for review, but expected auth guards should be tracked separately from bugs and the test should fail when confirmed findings remain.

## Implementation Status

- [x] Task 1: Harden launch QA result classification.
- [x] Task 2: Document launch QA commands and seed assumptions.
- [x] Task 3: Reset Supabase and run baseline chapter permissions.
- [x] Task 4: Run launch QA matrix on desktop and mobile Chromium.
- [x] Task 5: Commit results/harness updates and report validation.

## Patterns To Follow

| Category | File | Pattern |
| --- | --- | --- |
| E2E baseline | `tests/e2e/chapter-permissions.spec.ts` | Deterministic seed personas, screenshots, and explicit dashboard expectations. |
| Launch matrix | `tests/e2e/launch-qa-report.spec.ts` | Collector records screenshots, console/network findings, and persona flows. |
| Handbook | `docs/handbook/TESTING.md` | Seed persona and command documentation live with testing guidance. |

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `tests/e2e/launch-qa-report.spec.ts` | Update | Separate expected redirects from findings and fail on confirmed findings. |
| `docs/handbook/TESTING.md` | Update | Add exact launch QA commands, scope options, and seed assumptions. |
| `.github/plans/issue-213-harden-and-rerun-launch-qa-matrix.plan.md` | Create/Update | Track issue execution and validation. |

## Tasks

### Task 1: Harden Matrix

- Add expected-behavior collection for route-guard redirects.
- Treat expected redirects as documentation, not findings.
- Assert the final findings list is empty after the run.
- Keep JSON output and screenshots for evidence.

### Task 2: Document Commands

- Document `pnpm run supabase:reset`.
- Document baseline chapter permission command.
- Document full launch matrix and scoped `LAUNCH_QA_SCOPE` runs.
- Re-state seeded password and personas.

### Task 3: Baseline Validation

```bash
pnpm run supabase:reset
pnpm exec playwright test tests/e2e/chapter-permissions.spec.ts --reporter=line
```

### Task 4: Launch Matrix Validation

```bash
pnpm exec playwright test tests/e2e/launch-qa-report.spec.ts --reporter=line
```

### Task 5: Final Checks

```bash
pnpm run lint
pnpm exec tsc --noEmit
pnpm test
```

## Acceptance Criteria Mapping

- [x] Local Docker Supabase reset restores seeded launch personas.
- [x] Baseline chapter permission suite passes.
- [x] Launch matrix passes on desktop and mobile Chromium with zero confirmed findings.
- [x] Expected auth redirects are documented separately in the JSON result.
- [x] Handbook includes exact commands and seed persona assumptions.
