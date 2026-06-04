# Plan: COMPANY-DEF-01 Deferred Company And Recruiter Scope

GitHub issue: #301

## Problem

Angela's QA observations for company/recruiter surfaces identify copy, metrics, search, filters, saved talent, profile detail, resume access, and access-history gaps. The product decision for this launch is to keep company/recruiter out of active Spanish-first launch scope instead of patching partial UI assumptions.

## Scope

In:

- Record a product decision for deferred company/recruiter scope.
- Define terminology for future user-facing surfaces.
- Specify the minimum decisions required before implementation issues are created.
- Update the QA issue set and observation register with auditable evidence.

Out:

- Implementing company/recruiter UI changes.
- Enabling company discovery or talent browsing in the controlled launch.
- Defining Alumni visibility beyond an explicit deferral.

## Implementation Tasks

- [x] Create a product decision document for deferred company/recruiter scope.
- [x] Cover invite-only access, profile visibility, search/filter scope, saved talent, notes, resume/download access, and access history.
- [x] Choose future-facing terminology for company representative/company portal.
- [x] Explicitly defer Alumni visibility in company discovery.
- [x] Update QA issue and register documentation.
- [x] Validate docs formatting.

## Validation

- `git diff --check`
- Docs-only change; runtime validation is not required.
- Commit hook may still run `pnpm test`.

## Risks

- Over-scoping a deferred area into the current launch. Mitigation: this plan documents decision boundaries only.
- Hiding a product decision inside implementation. Mitigation: no follow-up implementation issues should be created until leadership approves the scope.
