# Plan: ALUMNI-DEF-01 Deferred Alumni Scope

GitHub issue: #302

## Problem

Angela's QA observations for Alumni identify contradictions around navigation, chapter status, Member ID copy, profile messages, visibility language, event eligibility, attendance history, trajectory content, and re-engagement. The product decision for this launch is to defer Alumni as a full product experience and treat Alumni as a historical membership state only.

## Scope

In:

- Record a product decision for deferred Alumni scope.
- Specify launch-safe eligibility defaults.
- Document historical chapter affiliation and Member ID expectations.
- Explicitly defer attendance/history, trajectory, re-engagement, and company visibility.
- Update the QA issue set and observation register with auditable evidence.

Out:

- Building an Alumni dashboard.
- Adding Alumni-only events or re-engagement workflows.
- Enabling Alumni company/recruiter discovery.

## Implementation Tasks

- [x] Create a product decision document for deferred Alumni scope.
- [x] Define event eligibility defaults for public, member-only, alumni-only, and chapter events.
- [x] Specify historical chapter affiliation and Member ID behavior.
- [x] Specify attendance/history, trajectory, re-engagement, and company visibility decisions.
- [x] Update QA issue and register documentation.
- [x] Validate docs formatting.

## Validation

- `git diff --check`
- Docs-only change; runtime validation is not required.
- Commit hook may still run `pnpm test`.

## Risks

- Treating Alumni as an active member by accident. Mitigation: launch-safe defaults block active-member privileges.
- Promising future Alumni workflows before approval. Mitigation: this plan documents deferral and requires product approval before implementation issues.
