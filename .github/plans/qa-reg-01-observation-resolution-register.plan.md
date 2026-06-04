# Plan: QA-REG-01 Observation Resolution Register

GitHub issue: #294

## Problem

The QA review contains 112 numbered observations. The current PR documents grouped resolution status, but future work needs a one-row-per-observation register so every observation has an explicit status, evidence trail, next action, and linked issue.

## Scope

In:

- Create a durable register under `docs/runbooks/`.
- Map all 112 observations to a consistent status.
- Link observations to grouped issues #295-#302 where future work remains.
- Keep Alumni and company/recruiter deferred rather than marking them complete.

Out:

- Implementing follow-up UI or service changes.
- Closing #295-#302.
- Rewriting the original QA PDF.

## Implementation Tasks

- [x] Create `.github/issues/qa-observation-full-resolution-issues.md`.
- [x] Create `docs/runbooks/qa-observation-resolution-register-2026-06-04.md`.
- [x] Include one row per observation ID from 1 to 112.
- [x] Use consistent status values.
- [x] Link fixed/deferred/future work to the relevant GitHub issues.
- [x] Validate docs formatting and Git state.

## Validation

- `git diff --check`
- Docs-only change; runtime validation is not required.
- Commit hook may still run `pnpm test`.

## Risks

- Overstating completion: mitigated by using `guarded-for-pilot`, `deferred-company`, and `deferred-alumni`.
- Creating noisy follow-up work: mitigated by grouped issues rather than 112 individual tickets.

