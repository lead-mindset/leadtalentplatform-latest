# Plan: LEAD SPARK Validation Owners And Evidence Workflow

## Summary

Create the readiness setup plan for GitHub Issue #110. This issue establishes the operating frame for LEAD SPARK production readiness validation: owners, environments, evidence expectations, status/severity language, QA/production assumptions, and the single place where blockers and validation evidence will be tracked.

This is a documentation and coordination issue. It should not introduce runtime code changes. The goal is to make the rest of the LEAD SPARK validation issues easier to execute without ambiguity.

## User Story

As the activation team,
I want clear owners, evidence expectations, and validation tracking,
so that leadership can make a credible go/no-go decision before real member activation.

## Metadata

| Field | Value |
| --- | --- |
| Type | Technical / Process / Documentation |
| Complexity | Low |
| GitHub Issue | #110 |
| GitHub URL | https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/110 |
| Source PRD | `.github/PRDs/lead-spark-production-readiness-validation.prd.md` |
| Source Validation Doc | `docs/proposals/lead-spark-production-readiness-validation.md` |
| Systems Affected | validation workflow, QA evidence, production readiness process, GitHub Issues |

## Current State

- The PRD exists at `.github/PRDs/lead-spark-production-readiness-validation.prd.md`.
- The validation plan exists at `docs/proposals/lead-spark-production-readiness-validation.md`.
- GitHub Issue #110 exists and is labeled `LEAD`, `validation`, `process`, `docs`, `phase:active-piv-loop`, and `piv-status:plan-ready`.
- The validation doc already proposes owners, status/severity legends, environments, evidence rules, and validation layers.
- The plan should convert those proposed structures into a confirmed readiness setup checklist.

## Patterns To Follow

### Existing QA Plan Structure

Source: `.github/plans/issue-93-qa-participant-onboarding-activation-flow.plan.md`

Pattern:
- State the issue and source context.
- Define current state.
- Add a QA or validation matrix.
- Include concrete tasks with checkboxes.
- Include done criteria and GitHub update steps.

### Existing Evidence Workflow

Source: `.github/plans/lead-023-pr-validation-template-piv-evidence-checklist.plan.md`

Pattern:
- Request linked issue and plan artifact.
- Record validation evidence, manual QA, migration evidence, and follow-up issues.
- Keep the evidence format concise enough to be used.

### Source Validation Document

Source: `docs/proposals/lead-spark-production-readiness-validation.md`

Pattern:
- Use `Not Started`, `In Progress`, `Passed`, `Failed`, `Blocked`, and `N/A`.
- Use `P0`, `P1`, `P2`, and `P3` severity.
- Separate Local, QA, and Production environments.
- Require evidence for each validation claim.

## Files To Inspect Or Change

| File | Action | Purpose |
| --- | --- | --- |
| `.github/plans/issue-110-lead-spark-validation-owners-evidence-workflow.plan.md` | CREATE | Track the execution plan for #110. |
| `docs/proposals/lead-spark-production-readiness-validation.md` | UPDATE if needed | Mark owner/evidence workflow decisions once confirmed. |
| `.github/PRDs/lead-spark-production-readiness-validation.prd.md` | INSPECT only | Source requirements, avoid unnecessary edits. |
| GitHub Issue #110 | UPDATE | Add plan link, apply `has-plan`, and later add completion evidence. |

## Proposed Owner Matrix

Confirm or update this matrix before closing #110.

| Area | Proposed Owner | Confirmation Needed |
| --- | --- | --- |
| Platform and technical validation | Abigail | Yes |
| QA support and issue reproduction | Angela | Yes |
| Data readiness and activation sheet | Nikole | Yes |
| Chapter operations validation | Christopher | Yes |
| Member experience and consent language | Xiomara | Yes |
| Communications and support instructions | Kiara or Ariana | Decide one primary owner |
| Executive go/no-go | Luis, Antonny, Nicole, Abigail | Yes |

## Evidence Format

Confirm a lightweight evidence standard that works across all later validation issues.

Recommended fields:

| Field | Required | Notes |
| --- | --- | --- |
| Environment | Yes | Local, QA, or Production |
| Tester | Yes | Name of validator |
| Date | Yes | Date of validation |
| Account used | When applicable | Use role/test account, avoid exposing real member data |
| Result | Yes | Passed, Failed, Blocked, or N/A |
| Evidence | Yes | Command output, screenshot, query result, video, or manual note |
| Severity | If failed/blocked | P0/P1/P2/P3 |
| Follow-up issue | If needed | Link GitHub issue |

## Validation Tracker Decision

Choose one single place to capture readiness status and blockers.

Recommended options:

1. Use `docs/proposals/lead-spark-production-readiness-validation.md` as the canonical checklist and update statuses there.
2. Use a separate shared spreadsheet for operational validation, with the Markdown file as source of structure.
3. Use GitHub Issues only, one issue per validation area, with comments as evidence.

Recommendation:

- Use GitHub Issues for official tracking.
- Use the Markdown validation doc as the source checklist.
- Use a spreadsheet only if operational owners need a lower-friction shared tracker.

## Implementation Tasks

### Task 1: Confirm The Owner Matrix

- **File**: `docs/proposals/lead-spark-production-readiness-validation.md`
- **Action**: UPDATE if names change
- **Implement**:
  - Confirm owners for platform, QA, data, chapter ops, member experience, communications, and executive go/no-go.
  - Resolve whether Kiara or Ariana owns comms.
  - Note any backup owners.
- **Validate**:
  - Owner table has no ambiguous "or" value unless intentionally left as an open question.
- **Status**: Completed. Communications owner is Kiara, with Ariana as backup.

### Task 2: Confirm Evidence Rules

- **File**: `docs/proposals/lead-spark-production-readiness-validation.md`
- **Action**: UPDATE if needed
- **Implement**:
  - Confirm the evidence fields listed above.
  - Add a short example of acceptable evidence for command output, screenshot/manual QA, and database query.
  - Add the privacy constraint that real member PII should not be posted publicly.
- **Validate**:
  - Evidence rules are understandable by non-technical owners.
- **Status**: Completed. Evidence fields and examples were added.

### Task 3: Confirm Status And Severity Language

- **File**: `docs/proposals/lead-spark-production-readiness-validation.md`
- **Action**: UPDATE if needed
- **Implement**:
  - Keep or refine the status legend.
  - Keep or refine the severity legend.
  - Make clear that P0 blocks real member invitations.
- **Validate**:
  - Later validation issues can reuse the same status/severity language.
- **Status**: Completed. Status and severity legends remain canonical, and P0 blocking behavior is explicit.

### Task 4: Confirm Environment And Account Assumptions

- **File**: `docs/proposals/lead-spark-production-readiness-validation.md`
- **Action**: UPDATE if needed
- **Implement**:
  - Confirm QA URL.
  - Confirm production URL if known.
  - Confirm seed-user list and password for QA.
  - Confirm QA is not for real member activation.
- **Validate**:
  - QA and production expectations are not mixed.
- **Status**: Completed. QA and production environment assumptions remain separated in the validation doc.

### Task 5: Choose The Validation Tracker

- **File**: `docs/proposals/lead-spark-production-readiness-validation.md`
- **Action**: UPDATE
- **Implement**:
  - Add a "Canonical Tracker" note stating whether GitHub Issues, the Markdown doc, or a shared spreadsheet is the operating tracker.
  - If spreadsheet is chosen, add the owner responsible for maintaining it.
- **Validate**:
  - There is one clear place to look for blocker status.
- **Status**: Completed. GitHub Issues are the source of record, with the Markdown file as source checklist and optional spreadsheet mirror.

### Task 6: Update GitHub Issue #110

- **Issue**: #110
- **Action**: COMMENT / LABEL
- **Implement**:
  - Comment with this plan path.
  - Add `has-plan` label.
  - After completion, comment with owner/evidence/tracker decisions.
- **Validate**:
  - Issue #110 links to this plan and can be followed by operational owners.
- **Status**: Completed. Issue #110 already has the plan comment and `has-plan` label.

## Validation

This is docs/process-only. Recommended validation:

```bash
git diff --check
```

Optional:

```bash
pnpm lint
pnpm test
```

Full app validation is not required for #110 because no runtime behavior should change.

## Acceptance Criteria Mapping

| Issue Acceptance Criteria | Plan Task |
| --- | --- |
| Validation owners are confirmed | Task 1 |
| Evidence format is agreed | Task 2 |
| Status and severity labels are understood | Task 3 |
| QA URL, production URL, and seed-user assumptions are documented | Task 4 |
| A single place is chosen to capture evidence and blockers | Task 5 |
| GitHub issue reflects plan and progress | Task 6 |

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Too many owners make accountability unclear | Assign one primary owner per workstream and optional backups only. |
| Evidence rules are too heavy and ignored | Keep evidence lightweight and allow screenshots, notes, or query outputs. |
| QA and production assumptions get mixed | Explicitly separate Local, QA, and Production in the tracker. |
| Real member data appears in public issues | Add privacy rule and use redacted screenshots/notes. |
| #110 stalls waiting for perfect production URL/support details | Mark unknowns as open decisions, but do not block owner/evidence setup. |

## Done Criteria

- [x] Owner matrix is confirmed or open decisions are clearly listed.
- [x] Evidence fields are confirmed.
- [x] Status and severity language is confirmed.
- [x] QA/production/seed-user assumptions are documented.
- [x] Canonical validation tracker is chosen.
- [x] GitHub Issue #110 has a plan comment and `has-plan` label.
- Follow-up issues are linked if any owner or tracker decision remains unresolved.

No follow-up issues are required for #110 at this time.
