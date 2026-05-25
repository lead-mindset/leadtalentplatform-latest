# Lead Funding Request Workflow Issues

Source PRD: `.github/PRDs/lead-funding-request-workflow.prd.md`

## Issue 1: Add Lead Funding database foundation, RLS, and seed fixtures

Labels: `enhancement`, `database`, `rls`, `supabase`, `phase:active-piv-loop`

Complexity: Large

Dependencies: none

### Description

Create the database foundation for request-based LEAD Funding. The model should support chapter-scoped requests, budget line items, admin review decisions, internal funding source tags, soft receipt accountability, and private attachment/evidence metadata.

### Acceptance Criteria

- [ ] Add Supabase migration for funding request tables, constraints, indexes, and RLS policies.
- [ ] Support statuses: `draft`, `submitted`, `changes_requested`, `approved`, `rejected`, `receipts_due`, `closed`.
- [ ] Store requested amount, approved amount, actual spend, OKRs, pillars, late-request flag, admin decision note, internal funding source, and accountability fields.
- [ ] Add seed data covering draft/submitted/approved/receipts-due states.
- [ ] Regenerate `lib/database.generated.ts`.

## Issue 2: Implement Lead Funding service and server actions

Labels: `enhancement`, `backend`, `services`, `server-actions`, `permissions`, `phase:active-piv-loop`

Complexity: Large

Dependencies: Issue 1

### Description

Implement the service-layer business rules and thin server actions for chapter and admin funding workflows.

### Acceptance Criteria

- [ ] Add `lib/services/funding.service.ts` with request creation, draft save, submit, admin review, funding source update, accountability update, and list/detail methods.
- [ ] Enforce chapter permissions: `chapter.funding.view`, `chapter.funding.submit`, and admin-only review.
- [ ] Enforce valid status transitions and required fields on submit/review/close.
- [ ] Add `lib/actions/funding/*` server actions with Zod validation and route revalidation.
- [ ] Add Vitest coverage for permissions, late warning, status transitions, and admin decisions.

## Issue 3: Build chapter funding request UI

Labels: `enhancement`, `frontend`, `ui`, `chapter`, `phase:active-piv-loop`

Complexity: Large

Dependencies: Issue 2

### Description

Build the Spanish-first chapter funding flow where approved e-board users can view their own chapter requests, create drafts, submit requests, and understand required/optional fields with low friction.

### Acceptance Criteria

- [ ] Add chapter navigation to `/chapter/funding`.
- [ ] Build funding request list with status groups and empty/loading/error states.
- [ ] Build create/edit form with required field clarity, budget item rows, OKR/pillar selections, eligibility guidance, and late-request warning.
- [ ] Allow optional event link or initiative-only request.
- [ ] Prevent regular members, recruiters, and other chapters from accessing request-level funding data.

## Issue 4: Build admin funding review UI

Labels: `enhancement`, `frontend`, `ui`, `admin`, `phase:active-piv-loop`

Complexity: Large

Dependencies: Issue 2

### Description

Build the admin funding review queue so LEAD admin/finance can review all submitted requests, decide them, and monitor receipt accountability.

### Acceptance Criteria

- [ ] Add admin navigation to `/admin/funding`.
- [ ] Build filters for pending, changes requested, approved, receipts due, closed, and all.
- [ ] Show chapter, requester, requested amount, approved amount, event/initiative date, OKRs/pillars, late warning, and receipt state.
- [ ] Implement decision actions: approve full, approve partial, request changes, reject.
- [ ] Support optional internal funding source tag without requiring chapters to choose it.

## Issue 5: Add receipt/evidence upload and post-event accountability flow

Labels: `enhancement`, `storage`, `frontend`, `backend`, `operations`, `phase:active-piv-loop`

Complexity: Medium

Dependencies: Issues 1, 2, 3, 4

### Description

Make receipts and impact evidence a first-class part of the funding lifecycle while keeping v1 flexible and non-punitive.

### Acceptance Criteria

- [ ] Add private file upload support for receipts/supporting materials or reuse an existing secure upload pattern.
- [ ] Allow actual spend, evidence links, receipt metadata, and impact/reflection notes to be saved.
- [ ] Show `receipts_due` and overdue warnings without blocking new requests.
- [ ] Allow admin regularization/closure with a note for justified exceptions.
- [ ] Validate that other chapters/recruiters cannot access uploaded funding files.

## Issue 6: Add Lead Funding validation, visual QA, and docs

Labels: `enhancement`, `testing`, `playwright`, `qa`, `documentation`, `phase:active-piv-loop`

Complexity: Medium

Dependencies: Issues 1-5

### Description

Validate the complete Lead Funding v1 slice with automated service tests, targeted browser QA, and lightweight documentation for controlled pilot rollout.

### Acceptance Criteria

- [ ] Add or update focused Playwright coverage for chapter e-board and admin funding flows.
- [ ] Run lint, typecheck, Vitest, and targeted Playwright validation.
- [ ] Capture desktop/mobile screenshots for chapter and admin funding pages.
- [ ] Update product/runbook docs with v1 process, eligibility rules, receipt expectations, and out-of-scope boundaries.
- [ ] Produce a concise validation report with blockers, risks, and follow-up recommendations.

