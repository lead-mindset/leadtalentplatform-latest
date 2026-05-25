# Plan: Issue #219 - Run Chapter Leader Training Dry Run

GitHub Issue: #219
Source PRD: `.github/PRDs/production-readiness-validation.prd.md`
Type: Operations / Training
Complexity: Medium

## Summary

Create the chapter leader training dry-run packet and evidence template, grounded in the current activation runbook. The actual dry run requires Abigail, Christopher or chapter operations, and a pilot president/VP; this plan can prepare the materials and mark the gate not testable until the session happens.

## Implementation Status

- [x] Task 1: Create chapter leader dry-run packet.
- [x] Task 2: Create dry-run notes/evidence template.
- [x] Task 3: Update production-readiness report with scheduling blocker.
- [x] Task 4: Validate documentation.
- [x] Task 5: Write implementation report and update GitHub.

## Patterns To Follow

| Category | File | Pattern |
| --- | --- | --- |
| Activation source of truth | `docs/runbooks/chapter-activation-runbook.md` | Separates membership, role, permissions, preapproval, and support cases. |
| Production readiness runbook | `docs/runbooks/production-readiness-validation.md` | Gate verdicts and sensitive evidence rules. |
| Founder summary | `docs/runbooks/chapter-activation-runbook.md` | Explains LEAD Talent Platform as an operating layer for chapters. |

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `docs/runbooks/chapter-leader-training-dry-run.md` | Create | Facilitator agenda, task script, evidence checklist, and decision rules. |
| `.github/reports/chapter-leader-training-dry-run-notes.md` | Create | Sanitized note template for the actual call. |
| `.github/reports/production-readiness-validation-report.md` | Update | Mark training gate not testable until scheduled. |
| `.github/plans/issue-219-run-chapter-leader-training-dry-run.plan.md` | Create/Update | Track issue execution and validation. |

## Tasks

### Task 1: Create Dry-Run Packet

- Define participants, pre-work, agenda, exact product tasks, success criteria, and stop conditions.
- Include Spanish facilitator language.
- Keep real emails and rosters out of git.

### Task 2: Create Notes Template

- Provide sections for attendance, environment, task completion, time-to-task, questions, blockers, screenshots, and founder recommendation.
- Keep all personal data redaction rules explicit.

### Task 3: Update Readiness Report

- Mark the gate `not testable` until the call is scheduled and completed.
- List required decisions: pilot chapter, attendee, environment, date/time.

### Task 4: Validate

```bash
pnpm run lint
```

### Task 5: Report

- Write issue implementation report.
- Comment on GitHub with the scheduling decision needed.

## Acceptance Criteria Mapping

- [x] Dry-run packet exists.
- [x] Evidence template exists.
- [x] Required participants and product tasks are clear.
- [x] Report does not imply the human training was completed.
- [x] Sensitive chapter data is protected.
