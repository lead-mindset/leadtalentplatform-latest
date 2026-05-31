# Plan: Chapter Onboarding Guion and Invite Rollout Language

## Summary

Update chapter activation documentation with the actual invitation workflow and support path. The guion should explain platform purpose, president/VP first steps, e-board onboarding, and where to ask for help.

## User Story

As a chapter president or vice president
I want a clear onboarding script and invite explanation
So that I can activate my chapter team without misusing accounts or roles

## Metadata

| Field | Value |
| --- | --- |
| Type | DOCUMENTATION |
| Complexity | LOW |
| Systems Affected | Runbooks, launch language |
| GitHub Issue | #260 |

## Patterns to Follow

`docs/runbooks/chapter-activation-runbook.md` already explains the layered membership/role/permission model and training flow. Update it rather than creating a disconnected doc.

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `docs/runbooks/chapter-activation-runbook.md` | UPDATE | Add invite workflow, guion, and president/VP launch email |
| `docs/runbooks/chapter-leader-training-dry-run.md` | UPDATE | Add invite-specific dry-run tasks |

## Tasks

### Task 1: Update chapter activation runbook
- **File**: `docs/runbooks/chapter-activation-runbook.md`
- **Action**: UPDATE
- **Implement**: purpose, first steps, e-board invite workflow, expiration/re-invite/cancel rules, support contact, president/VP launch email draft.
- **Validate**: Markdown review

### Task 2: Update dry-run checklist
- **File**: `docs/runbooks/chapter-leader-training-dry-run.md`
- **Action**: UPDATE
- **Implement**: invite creation, pending invite review, cancel/re-invite discussion, exact-email activation checks.
- **Validate**: Markdown review

## Validation

```bash
pnpm run lint
```

## Acceptance Criteria

- [x] Guion explains purpose, first actions, e-board invite onboarding, and help path.
- [x] Support contact is `abriones@leadmindset.org`.
- [x] Docs avoid promising tokenized invite behavior.
