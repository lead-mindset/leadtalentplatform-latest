# Plan: LEAD-072 Company Representative Manual QA Checklist

## Summary

Create a docs-only manual QA checklist for company representative flows after the portal recovery work. The checklist should be reproducible, outcome-based, and light enough to run during local or staging validation without becoming a full regression suite.

## User Story

As the engineering team,
I want a manual QA checklist for company representative flows,
So that invite, access, talent visibility, saved profiles, and resume authorization can be validated consistently.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #72 |
| Type | Documentation / QA |
| Complexity | Small |
| Systems Affected | Docs, QA workflow |
| Parent | LEAD-027 / #28 |
| Dependencies | #69, #70, #71 |
| Blocks | #73 language cleanup, future company portal QA |

## Decisions

- Create a dedicated handbook doc: `docs/handbook/COMPANY-PORTAL-QA.md`.
- Keep #72 docs-only; do not add runtime code or automated tests.
- Include prerequisites and test data setup instead of assuming magic seed state.
- Include compatibility checks for old `/recruiter/*` redirects.
- Include destructive/admin state checks, clearly marked local/staging only.
- Keep hidden/unapproved talent checks focused, not exhaustive.
- Use expected outcomes, not screenshots or brittle exact-copy assertions.

## Patterns To Follow

### Recovery Decisions

Source: `docs/handbook/RECRUITER-PORTAL-RECOVERY.md`

The recovery doc defines canonical decisions: `/company/*` is the company portal, `/recruiter/access?token=...` remains invite acceptance, company access is `public.user.role='recruiter'` plus active accepted `recruiter_access`, and visible talent requires `person_profile.is_recruiter_visible = true` plus approved `chapter_membership`.

### Testing Handbook

Source: `docs/handbook/TESTING.md`

The testing handbook already documents seed personas, invite-only recruiter/company access, service tests, and deterministic test data expectations. The QA checklist should reference this instead of duplicating every testing policy.

### PR Evidence Style

Source: `.github/plans/lead-023-pr-validation-template-piv-evidence-checklist.plan.md`

Manual QA should be checklist-oriented with clear pass/fail evidence and concise expected outcomes.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `.github/plans/lead-072-company-representative-manual-qa-checklist.plan.md` | Create | Track implementation and validation |
| `docs/handbook/COMPANY-PORTAL-QA.md` | Create | Add reusable manual QA checklist |
| `docs/handbook/RECRUITER-PORTAL-RECOVERY.md` | Update if useful | Link to the dedicated QA checklist |
| GitHub Issue #72 | Update | Add plan/evidence and close when complete |

## Tasks

## Progress

- [x] Task 1: Create Plan And Confirm Scope
- [x] Task 2: Create Company Portal QA Checklist
- [x] Task 3: Link QA Checklist From Recovery Doc
- [x] Task 4: Validate Docs And Update GitHub

### Task 1: Create Plan And Confirm Scope

- **File**: `.github/plans/lead-072-company-representative-manual-qa-checklist.plan.md`
- **Action**: Create
- **Implement**:
  - Capture the docs-only scope and agreed decisions.
  - Keep `.agents/` and `.codex/` unstaged.
- **Validate**: `Test-Path .github/plans/lead-072-company-representative-manual-qa-checklist.plan.md`

### Task 2: Create Company Portal QA Checklist

- **File**: `docs/handbook/COMPANY-PORTAL-QA.md`
- **Action**: Create
- **Implement**:
  - Add purpose and when to run.
  - Add prerequisites:
    - Local/staging only for destructive scenarios.
    - Local Supabase seeded or equivalent test data.
    - Company invite created from admin flow.
    - One visible approved candidate and one hidden/unapproved candidate.
    - Separate browser session/incognito for email mismatch and unauthenticated checks.
  - Add checklist sections:
    - Invite creation and acceptance.
    - Legacy company onboard compatibility/help state.
    - Active company login.
    - Missing, inactive, revoked, expired access states.
    - Company dashboard/browse/saved/detail flows.
    - Save/unsave behavior.
    - Talent visibility smoke checks.
    - Resume download authorization and logging expectation.
    - Old `/recruiter/*` redirect compatibility.
  - Use expected outcomes only; no screenshots.
- **Validate**: `rg -n "Invite|Legacy|Access|Browse|Saved|Resume|Redirect|Visibility" docs/handbook/COMPANY-PORTAL-QA.md`

### Task 3: Link QA Checklist From Recovery Doc

- **File**: `docs/handbook/RECRUITER-PORTAL-RECOVERY.md`
- **Action**: Update
- **Implement**:
  - Add a short reference to `COMPANY-PORTAL-QA.md` near the manual QA follow-up section.
  - Do not rewrite the recovery plan or broaden scope.
- **Validate**: `rg -n "COMPANY-PORTAL-QA|manual QA" docs/handbook/RECRUITER-PORTAL-RECOVERY.md`

### Task 4: Validate Docs And Update GitHub

- **Files**: all changed docs/plans
- **Action**: Validate and update issue
- **Implement**:
  - Run docs-safe validation.
  - Comment on #72 with doc path, plan path, and validation evidence.
  - Add/keep `has-plan`.
  - Close #72 when acceptance criteria are met.
- **Validate**:

```bash
rg -n "Invite|Access|Visibility|Resume|Redirect" docs/handbook/COMPANY-PORTAL-QA.md
rg -n "COMPANY-PORTAL-QA|manual QA" docs/handbook/RECRUITER-PORTAL-RECOVERY.md
git diff --check
```

## Acceptance Criteria Mapping

- [x] Invite accept and login flows are covered.
- [x] Revoked/expired access checks expect company access/help states.
- [x] Hidden or unapproved talent visibility is denied.
- [x] Resume download QA checks current authorization and visibility.

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Checklist becomes too heavy to run | Keep it outcome-based and smoke-level where service tests already cover detail |
| Destructive QA damages production data | Mark destructive/admin cases local/staging only |
| Screenshots become stale after #73/#28 | Avoid screenshots and exact copy assertions |
| Docs duplicate testing handbook | Reference existing testing strategy for seed persona policy |
| Manual QA hides automation gaps | Create follow-up issues only if checklist reveals missing automated coverage |

## Out Of Scope

- Runtime code changes.
- New automated tests.
- Broad recruiter/company copy rename.
- UI redesign screenshots.
- Production data mutation.
