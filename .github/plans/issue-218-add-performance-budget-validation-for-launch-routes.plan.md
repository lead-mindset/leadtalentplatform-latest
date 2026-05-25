# Plan: Issue #218 - Add Performance Budget Validation For Launch Routes

GitHub Issue: #218
Source PRD: `.github/PRDs/production-readiness-validation.prd.md`
Type: Technical / Performance
Complexity: Medium

## Summary

Add a Playwright performance-budget smoke harness for launch routes. The harness should warm routes in the local dev server, measure browser navigation/LCP/CLS where available, capture console and 5xx errors, write sanitized JSON artifacts, and fail when documented budgets are exceeded.

## Implementation Status

- [x] Task 1: Add performance Playwright spec.
- [x] Task 2: Add package script and runbook instructions.
- [x] Task 3: Run performance validation.
- [x] Task 4: Record findings in the readiness report.
- [x] Task 5: Write implementation report and update GitHub.

## Patterns To Follow

| Category | File | Pattern |
| --- | --- | --- |
| E2E config | `playwright.config.ts` | Desktop and mobile Chromium projects with local dev server reuse. |
| Launch QA collector | `tests/e2e/launch-qa-report.spec.ts` | Route matrix, seeded login, console/network capture, JSON artifacts. |
| Production runbook | `docs/runbooks/production-readiness-validation.md` | Budgets and environment caveats live in the runbook. |

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `tests/e2e/production-readiness-performance.spec.ts` | Create | Measure route budgets and errors. |
| `package.json` | Update | Add `qa:performance` script. |
| `docs/runbooks/production-readiness-validation.md` | Update | Document performance command and local-dev caveats. |
| `.github/reports/production-readiness-validation-report.md` | Update | Record performance verdict and findings. |
| `.github/plans/issue-218-add-performance-budget-validation-for-launch-routes.plan.md` | Create/Update | Track issue execution and validation. |

## Tasks

### Task 1: Add Performance Spec

- Measure public routes with LCP <= 2.5s and CLS <= 0.1.
- Measure authenticated routes with LCP <= 3.5s and CLS <= 0.1.
- Capture console errors and unexpected 5xx responses.
- Write JSON to `outputs/production-readiness/performance-results-*.json`.

### Task 2: Document Command

```bash
pnpm run qa:performance
```

### Task 3: Run Validation

```bash
pnpm run qa:performance
```

### Task 4: Record Findings

- Mark local dev results clearly as local smoke.
- Do not treat local dev timing as final production proof without preview/staging rerun.

### Task 5: Validate

```bash
pnpm run qa:performance
pnpm run lint
```

## Acceptance Criteria Mapping

- [x] Public and authenticated route budgets are measured.
- [x] Console errors and unexpected 5xx responses are captured.
- [x] Results are written to ignored/sanitized output artifacts.
- [x] Local-dev environment caveats are documented.
- [x] Failing budgets are recorded with route and metric.
