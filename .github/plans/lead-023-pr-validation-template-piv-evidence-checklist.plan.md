# LEAD-023: Add PR Validation Template and PIV Evidence Checklist

## Issue

- GitHub Issue: #24
- Type: Technical
- Priority: High
- Complexity: Small
- Phase: System Evolution

## Problem

PRs need consistent validation evidence so changes are reviewed against linked issue scope, implementation plan, test output, migration proof, and manual QA notes. The repo currently has a basic `.github/pull_request_template.md`, but it does not encode the PIV evidence expected by the product specification and workflow docs.

## User Story

As the engineering team, I want PRs to require PIV validation evidence, so that code changes are reviewed with proof instead of vibes.

## Current State From Codebase

- `.github/pull_request_template.md` exists and is the GitHub-recognized default PR template.
- `.github/PR_TEMPLATE.md` exists but appears empty; keeping two template names risks confusion.
- `docs/PRODUCT-SPECIFICATION.md` explicitly calls out PR validation evidence as a system evolution requirement.
- `docs/handbook/CONTRIBUTING.md` defines the PIV loop and stores plans in `.github/plans/{name}.plan.md`.
- `docs/handbook/DEFINITION_OF_DONE.md` already lists quality, testing, architecture, migration, and documentation expectations.
- `.github/workflows/validate.yml` runs lint, type check, and tests for PRs to `dev` and `master`.

## Scope

1. Update the PR template to request linked issue, plan artifact, validation commands/results, and manual test evidence.
2. Add migration-specific evidence prompts: migration command, type regeneration, validation queries, and rollback notes.
3. Add UI-specific evidence prompts: screenshots or manual notes for changed flows.
4. Add a repeated-bug/system-evolution prompt so recurring problems create or link follow-up issues.
5. Keep the template concise enough to be used instead of ignored.

## Implementation Status

- [x] Updated the canonical PR template.
- [x] Resolved duplicate PR template ambiguity.
- [x] Added handbook cross-reference.
- [x] Ran validation.

## Non-Goals

- Do not change CI workflow behavior.
- Do not add PR automation or required checks.
- Do not create a long release checklist.
- Do not rewrite the full contributing handbook.

## Patterns to Follow

### PIV Workflow

- `docs/handbook/CONTRIBUTING.md` defines Plan -> Implement -> Validate.
- Existing plans live under `.github/plans/`.
- Recent implementation issue comments include plan path and validation evidence.

### Definition of Done

- `docs/handbook/DEFINITION_OF_DONE.md` includes type safety, lint/build/test, service coverage, migration, RLS, documentation, and ADR expectations.

### Existing PR Template

- `.github/pull_request_template.md` uses short sections and checkboxes.
- Keep that concise structure, but replace vague “How to Test” with evidence-oriented fields.

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `.github/pull_request_template.md` | UPDATE | Main PR evidence template used by GitHub. |
| `.github/PR_TEMPLATE.md` | UPDATE or DELETE | Remove ambiguity with duplicate/empty template; prefer making it point to the canonical template if deletion feels risky. |
| `docs/handbook/CONTRIBUTING.md` | UPDATE if needed | Briefly mention that PRs must include PIV evidence from the template. |
| `.github/plans/lead-023-pr-validation-template-piv-evidence-checklist.plan.md` | CREATE/UPDATE | Track plan and implementation evidence. |

## Implementation Tasks

### Task 1: Update the Canonical PR Template

- **File**: `.github/pull_request_template.md`
- **Action**: UPDATE
- **Implement**:
  - Add concise sections:
    - Linked issue
    - Plan artifact
    - Summary
    - Validation evidence
    - Manual QA
    - Migration evidence, if applicable
    - UI evidence, if applicable
    - System Evolution follow-up
    - Final checklist
  - Include commands with result placeholders, not just checkbox claims.
  - Keep the template short enough to fit comfortably in a PR body.
- **Mirror**:
  - Existing `.github/pull_request_template.md` section style.
  - `docs/handbook/DEFINITION_OF_DONE.md` checklist content.
- **Validate**:
  - Manual read-through.

### Task 2: Resolve Duplicate Template Ambiguity

- **File**: `.github/PR_TEMPLATE.md`
- **Action**: UPDATE or DELETE
- **Implement**:
  - Since GitHub recognizes `.github/pull_request_template.md`, prefer replacing `.github/PR_TEMPLATE.md` with a short pointer to `.github/pull_request_template.md`.
  - If the file is truly unused and empty, deletion is acceptable, but a pointer avoids surprising someone who opens it manually.
- **Mirror**:
  - Keep wording minimal.
- **Validate**:
  - `rg -n "pull_request_template|PR_TEMPLATE" .github docs`

### Task 3: Add Handbook Cross-Reference

- **File**: `docs/handbook/CONTRIBUTING.md`
- **Action**: UPDATE
- **Implement**:
  - Add one short sentence or bullet under PR/validation workflow pointing PR authors to the PIV evidence template.
  - Avoid duplicating the full PR template in docs.
- **Mirror**:
  - Existing concise workflow sections in `docs/handbook/CONTRIBUTING.md`.
- **Validate**:
  - Manual read-through.

### Task 4: Update Plan Status and GitHub

- **File**: `.github/plans/lead-023-pr-validation-template-piv-evidence-checklist.plan.md`
- **Action**: UPDATE
- **Implement**:
  - Mark implementation tasks complete after edits.
  - Comment on GitHub Issue #24 with plan path, changed files, and validation result.
  - Add/keep `has-plan`.
- **Validate**:
  - `git diff --check`

## Suggested PR Template Shape

```markdown
## Linked Issue
Closes #

## Plan
- [ ] Plan artifact: `.github/plans/...`

## Summary

## Validation Evidence
| Command | Result | Notes |
|---------|--------|-------|
| `pnpm test` |  |  |
| `pnpm lint` |  |  |
| `pnpm build` |  |  |

## Manual QA
- Flow/persona:
- Evidence:

## Migration Evidence
- [ ] Not applicable
- Migration files:
- Local Docker Supabase command:
- Validation queries/results:
- Rollback notes:

## UI Evidence
- [ ] Not applicable
- Screenshots/manual notes:

## System Evolution
- [ ] No repeated bug/process gap found
- [ ] Linked or created follow-up issue:

## Checklist
- [ ] Service-layer boundaries preserved
- [ ] Generated types updated if schema changed
- [ ] Docs/ADR updated if behavior or architecture changed
- [ ] No secrets or unrelated files included
```

## Full Validation

This is docs/process-only. Run:

```bash
git diff --check
pnpm test
```

`pnpm lint` and `pnpm build` are optional for implementation confidence, but not required unless the handbook edit touches code-related syntax. If run, record results in the issue comment.

## Risks

| Risk | Mitigation |
|------|------------|
| Template becomes too long and ignored | Keep evidence fields concise and use N/A checkboxes. |
| Duplicate template confuses contributors | Make `.github/PR_TEMPLATE.md` point to the canonical `.github/pull_request_template.md`. |
| Migration evidence is skipped | Include explicit migration section with Not applicable option. |
| UI evidence becomes screenshot-only | Allow screenshots or manual notes so non-visual flow changes are still covered. |

## GitHub Updates

- Comment on Issue #24 with this plan path.
- Add `has-plan`.
- Close only after implementation and validation pass.
