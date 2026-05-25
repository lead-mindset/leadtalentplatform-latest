# Issue #222: Lead Funding Service Layer and Server Actions

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/222

Source PRD: `.github/PRDs/lead-funding-request-workflow.prd.md`

Depends on: #221 database foundation.

## Problem

The database exists, but chapter/admin workflows need a service-layer API that enforces LEAD Funding rules before UI is built. Server actions should stay thin: authenticate, validate, call the service, and revalidate paths.

## Codebase Findings

- Services live in `lib/services` and receive `SupabaseClient<Database>`.
- `ChapterPermissionService.requireChapterPermission` is the established authorization gate for chapter-scoped capabilities.
- Admin checks use `requireAdmin()` or a service-side app role lookup.
- Existing actions use Zod schemas, then call services and `revalidatePath`.
- Service tests use mocked Supabase chains and mock `ChapterPermissionService` where permission behavior is the core branch.

## Design

Add `FundingService` with typed params and small return unions.

Core methods:

- `listChapterRequests(supabase, { actorUserId, chapterId })`
- `listAdminRequests(supabase, { status? })`
- `getRequestDetail(supabase, { actorUserId, requestId })`
- `createDraft(supabase, params)`
- `saveDraft(supabase, params)`
- `submitRequest(supabase, params)`
- `reviewRequest(supabase, params)`
- `setFundingSource(supabase, params)`
- `updateAccountability(supabase, params)`
- `closeRequest(supabase, params)`

Rules:

- Chapter users need `chapter.funding.view` to list/detail and `chapter.funding.submit` to create/update/submit/accountability.
- Admin can list/detail/review all requests.
- Regular members/recruiters fail through missing permissions or admin guard.
- Submit requires title, purpose, expected audience, event date, requested amount, at least one OKR, at least one pillar, and at least one positive budget item.
- `is_late_request` is computed at submit when event date is less than 14 days away.
- Admin decisions:
  - `approve_full` sets status `approved`, approved amount = requested amount.
  - `approve_partial` requires approved amount and note.
  - `request_changes` requires note and sets `changes_requested`.
  - `reject` requires note and sets `rejected`.
- Accountability can move approved requests to `receipts_due`; closure requires accountability fields or explicit admin closure note.

## Tasks

- [x] Add `lib/services/funding.service.ts` with typed constants, status/source labels, validations, DB writes, and status-event writes.
- [x] Add `lib/actions/funding/requests.ts` with Zod schemas for chapter actions.
- [x] Add `lib/actions/funding/admin.ts` with admin review/source/closure actions.
- [x] Add `lib/actions/funding/get-data.ts` for route loaders.
- [x] Add `lib/services/__tests__/funding.service.test.ts` for permission, submit validation, late warning, admin decisions, and accountability transitions.
- [x] Link plan on GitHub and keep issue labels updated.

## Validation

- `pnpm run test -- lib/services/__tests__/funding.service.test.ts`
- `pnpm run test -- lib/services/__tests__/chapter-permission.service.test.ts`
- `pnpm exec tsc --noEmit`
- `git diff --check`

## Risks

- Supabase mock chains can become brittle if the service does too many nested calls. Keep helper functions focused and test around high-value branches.
- Generated types expose table names but not domain-friendly types. Use explicit exported domain types where UI will need them.
- Closure rules can become too restrictive. Keep v1 soft: warnings and admin override, no automatic lockout.
