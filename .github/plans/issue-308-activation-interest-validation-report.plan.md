# Plan: CHACT-03 Validate and Document Chapter Activation Interest Rollout

## Summary

Capture validation and rollout evidence for the chapter activation interest slice so reviewers can audit the implementation without relying on chat context.

## User Story

As a reviewer  
I want validation evidence and deferred scope documented  
So that I can assess whether the feature is launch-safe.

## Metadata

| Field | Value |
|-------|-------|
| Type | VALIDATION |
| Complexity | LOW |
| Systems Affected | Reports, GitHub issues, PR evidence |
| GitHub Issue | #308 |

---

## Patterns to Follow

### Implementation Reports

```md
<!-- SOURCE: .github/reports/issue-267-validate-document-dedicated-chapter-invite-rollout-report.md -->
# Implementation Report
```

### Validation Commands

```json
// SOURCE: package.json
"lint": "eslint .",
"test": "vitest run"
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `.github/reports/issue-306-307-308-chapter-activation-interest-report.md` | CREATE | Document changes, validation results, and deferred scope |

---

## Tasks

### Task 1: Run validation

- **Action**: RUN
- **Implement**: Execute focused service tests, type check, and lint.
- **Validate**: Commands complete with no errors.

### Task 2: Create rollout report

- **File**: `.github/reports/issue-306-307-308-chapter-activation-interest-report.md`
- **Action**: CREATE
- **Implement**: Summarize changed files, validation, source grounding, and deferred scope.
- **Validate**: Report exists and references issues #306-#308.

### Task 3: Update GitHub issues

- **Action**: RUN
- **Implement**: Add plan/implementation/validation comments to issues and close completed issues.
- **Validate**: `gh issue view` confirms status/comments.

---

## Validation

```bash
pnpm exec vitest run lib/services/__tests__/chapter-activation-interest.service.test.ts
pnpm exec tsc --noEmit
pnpm lint
```

---

## Acceptance Criteria

- [ ] Validation evidence is captured in a repo report.
- [ ] Deferred scope is explicit.
- [ ] Issues have a clear audit trail.
