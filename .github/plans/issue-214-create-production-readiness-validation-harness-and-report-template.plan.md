# Plan: Issue #214 - Create Production-Readiness Validation Harness And Report Template

GitHub Issue: #214
Source PRD: `.github/PRDs/production-readiness-validation.prd.md`
Type: Technical / QA
Complexity: Small

## Summary

Create the shared evidence harness for production-readiness validation. This issue should not change product behavior; it should define the runbook, report template, artifact handling, gate verdicts, and environment expectations that issues #215-#220 will use.

## Implementation Status

- [x] Task 1: Create production-readiness validation runbook.
- [x] Task 2: Create production-readiness report template.
- [x] Task 3: Cross-link the runbook and report to existing testing/activation guidance.
- [x] Task 4: Validate documentation and repository state.

## Patterns To Follow

| Category | File | Pattern |
| --- | --- | --- |
| Testing handbook | `docs/handbook/TESTING.md` | Seed personas, command blocks, and explicit scope notes live in handbook docs. |
| Activation runbook | `docs/runbooks/chapter-activation-runbook.md` | Operational runbooks protect real chapter emails and keep launch data outside git. |
| Existing QA report | `.github/reports/launch-user-flow-playwright-qa-report.md` | Reports use verdicts, persona/flownotes, findings, screenshots, and not-testable sections. |
| Git ignore | `.gitignore` | `outputs/`, `test-results/`, and `playwright-report/` are already ignored evidence locations. |

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `docs/runbooks/production-readiness-validation.md` | Create | Define environment setup, artifact rules, gate procedures, and blockers. |
| `.github/reports/production-readiness-validation-report.md` | Create | Provide the pending report template that later issues will fill. |
| `docs/handbook/TESTING.md` | Update | Link to the new production-readiness validation runbook. |
| `.github/plans/issue-214-create-production-readiness-validation-harness-and-report-template.plan.md` | Create/Update | Track issue execution and validation. |

## Tasks

### Task 1: Create Runbook

- Document the five gates: email, storage, accessibility, performance, and chapter leader dry run.
- Document safe artifact paths and redaction rules.
- Document local and staging-like environment assumptions.
- Mark real email provider and human training as gates that cannot be truthfully passed without external evidence.

### Task 2: Create Report Template

- Add an overall verdict section: pending, pass, pass with issues, or blocked.
- Add gate summary table with owner, environment, status, and evidence.
- Add sections for confirmed bugs, expected behavior, not-testable flows, and founder recommendation.
- Initialize every gate as pending.

### Task 3: Cross-Link Existing Guidance

- Add a concise production-readiness section to `docs/handbook/TESTING.md`.
- Link to `docs/runbooks/production-readiness-validation.md`.
- Preserve the existing seed persona and chapter activation guidance.

### Task 4: Validate

```bash
git status --short
pnpm run lint
```

## Acceptance Criteria Mapping

- [x] Every PRD gate has a clear evidence destination.
- [x] Sensitive artifacts are directed to ignored or sanitized locations.
- [x] Required accounts, inboxes, buckets, and test users are listed without exposing real data.
- [x] The report can record verdict, environment, repro steps, evidence path, owner, severity, and recommendation.
- [x] Pending gates do not imply production readiness.
