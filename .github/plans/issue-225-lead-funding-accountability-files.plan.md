# Issue #225: Funding Receipts and Accountability

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/225

Source PRD: `.github/PRDs/lead-funding-request-workflow.prd.md`

Depends on: #221 database/storage foundation, #222 funding service/actions, #223 chapter UI, #224 admin review UI.

## Problem

Approved LEAD Funding requests need a flexible, non-punitive way to collect receipts, evidence links, actual spend, and impact reflection. Chapters should be able to regularize after the event without being blocked from future requests in v1, while admin can close/regularize with a note when exceptions are justified.

## Codebase Findings

- The database already has private `funding-files` storage and `funding_request_file` metadata with file/link types: `supporting_material`, `receipt`, and `evidence`.
- RLS expects storage object paths to begin with the `funding_request_id`.
- `FundingService.getRequestDetail` already returns file metadata and status history.
- Chapter action `updateFundingAccountability` already saves actual spend, accountability note, result summary, and `receipts_due` status.
- Admin action `closeAdminFundingRequest` already exists; it needs UI access.

## Design

Service/actions:

- Add funding file upload/link helpers to `FundingService`.
- Add server actions for chapter upload, external link registration, and signed URL creation.
- Keep file upload validation pragmatic: image/PDF files, size limit, secure storage path.

Chapter UI:

- Add `/chapter/funding/[id]` detail/accountability page.
- Show request summary, budget, files/evidence, overdue or receipts-due warning, and timeline notes.
- Add a client accountability panel for actual spend, result summary, receipt/evidence upload, and external evidence links.
- Update list cards to link to detail for approved/submitted/receipts due and edit for drafts/change requests.

Admin UI:

- Extend admin review panel with close/regularize controls for approved or receipts-due requests.

## Tasks

- [x] Add funding file service helpers and actions.
- [x] Add tests for file permission/upload metadata behavior.
- [x] Build chapter funding detail/accountability page.
- [x] Add accountability form, receipt/evidence upload, and external link registration.
- [x] Add admin close/regularize controls.
- [x] Validate targeted tests, typecheck, and visual QA.

## Validation

- `pnpm run lint`
- `pnpm exec tsc --noEmit`
- `pnpm run test -- lib/services/__tests__/funding.service.test.ts`
- Playwright visual check of `/es/chapter/funding/[id]` and `/es/admin/funding`.

Completed:

- `pnpm exec tsc --noEmit` passed.
- `pnpm run test -- lib/services/__tests__/funding.service.test.ts` passed: 11 tests.
- `pnpm run lint` passed with the repository's existing warnings.
- `git diff --check` passed with line-ending warnings only.
- Playwright smoke passed for president accountability save, private PDF upload, desktop/mobile screenshots, admin close controls, no console errors, no failed network responses, and no horizontal overflow.

Evidence:

- `outputs/lead-funding-accountability-detail-before-desktop.png`
- `outputs/lead-funding-accountability-detail-after-desktop.png`
- `outputs/lead-funding-accountability-detail-mobile.png`
- `outputs/lead-funding-admin-close-desktop.png`

## Risks

- Browser file inputs can make the panel feel heavy. Keep uploads separate from the reflection save action.
- Signed URLs should be short-lived and generated only after service permission checks.
- Do not block future funding requests automatically in v1; surface warnings instead.
