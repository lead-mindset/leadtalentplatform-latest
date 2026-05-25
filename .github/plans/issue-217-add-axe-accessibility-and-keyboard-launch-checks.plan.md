# Plan: Issue #217 - Add Axe Accessibility And Keyboard Launch Checks

GitHub Issue: #217
Source PRD: `.github/PRDs/production-readiness-validation.prd.md`
Type: Technical / Accessibility
Complexity: Medium

## Summary

Add a production-readiness accessibility spec that runs axe against representative launch routes and records critical/serious violations as launch evidence. Include a small keyboard smoke path for login and major dashboards so the gate is about usable flows, not only static rule scanning.

## Implementation Status

- [x] Task 1: Add axe dependency.
- [x] Task 2: Add accessibility Playwright spec.
- [x] Task 3: Document accessibility command.
- [x] Task 4: Run accessibility validation.
- [x] Task 5: Record findings and update GitHub.

## Patterns To Follow

| Category | File | Pattern |
| --- | --- | --- |
| E2E config | `playwright.config.ts` | Desktop and mobile Chromium projects, local dev server on port 3100. |
| Launch QA collector | `tests/e2e/launch-qa-report.spec.ts` | Writes sanitized JSON and separates expected guard behavior from findings. |
| Persona login | `tests/e2e/chapter-permissions.spec.ts` | Seeded password and deterministic persona route checks. |
| Testing handbook | `docs/handbook/TESTING.md` | Commands and scope assumptions live in documentation. |

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `package.json` / `pnpm-lock.yaml` | Update | Add `@axe-core/playwright` dev dependency and script. |
| `tests/e2e/production-readiness-accessibility.spec.ts` | Create | Run axe and keyboard smoke checks on launch routes. |
| `docs/runbooks/production-readiness-validation.md` | Update | Document accessibility command and artifact. |
| `.github/reports/production-readiness-validation-report.md` | Update | Record validation status and findings. |
| `.github/plans/issue-217-add-axe-accessibility-and-keyboard-launch-checks.plan.md` | Create/Update | Track issue execution and validation. |

## Tasks

### Task 1: Add Axe Dependency

```bash
pnpm add -D @axe-core/playwright
```

### Task 2: Add Accessibility Spec

- Run axe against scoped public, auth, student, chapter, company, and admin routes.
- Fail on unwaived critical or serious violations.
- Write sanitized JSON to `outputs/production-readiness/accessibility-results.json`.
- Include keyboard smoke for login and dashboard focus movement.

### Task 3: Document Command

```bash
pnpm run qa:accessibility
```

### Task 4: Run Validation

```bash
pnpm run qa:accessibility
```

### Task 5: Report Findings

- Mark the gate as pass if no critical/serious violations are found.
- Mark the gate as blocked or pass with issues if violations are found.

## Acceptance Criteria Mapping

- [x] Axe runs on scoped launch routes.
- [x] Critical violations fail the gate.
- [x] Serious violations fail unless waived in the report.
- [x] Keyboard smoke path is included.
- [x] Results are written to ignored/sanitized output artifacts.
