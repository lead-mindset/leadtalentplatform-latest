# Issue #221: Lead Funding Database Foundation

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/221

Source PRD: `.github/PRDs/lead-funding-request-workflow.prd.md`

## Problem

LEAD Funding needs persistent, chapter-scoped records before services or UI can be built. The schema must support request-based funding, itemized budgets, admin decisions, receipt/accountability state, and private attachment metadata while preserving chapter-level permissions and admin review boundaries.

## Codebase Findings

- Chapter-scoped permission keys already exist in `lib/services/chapter-permission.service.ts` and in the migration that creates `chapter_permission_grant`.
- `public.has_chapter_permission(chapter_id, permission_key)` is the canonical RLS helper for approved chapter operators.
- Existing migrations use explicit check constraints instead of Postgres enums, which keeps generated type changes simpler.
- Existing storage migration defines buckets directly in SQL and uses `storage.foldername(name)` helpers for path-level access.
- Seed personas include `president@test.com`, `vp@test.com`, `eboard@test.com`, `member@test.com`, `admin@test.com`, and `recruiter@test.com`.

## Design

Add four tables:

1. `funding_request`
   - Owns request lifecycle, chapter, requester, optional event, amounts, OKRs, pillars, late flag, admin decision, internal source, and accountability fields.
2. `funding_request_budget_item`
   - Itemized requested budget rows.
3. `funding_request_file`
   - Private file metadata for supporting materials, receipts, and evidence.
4. `funding_request_status_event`
   - Lightweight status timeline for auditability.

Add a private `funding-files` storage bucket with RLS:

- Admin can read/manage all.
- Chapter users with `chapter.funding.view` can read files for their own chapter request.
- Chapter users with `chapter.funding.submit` can upload files for their own chapter request.

Use soft receipt accountability:

- Missing receipts move/show as `receipts_due`, but schema does not enforce lockouts.

## Tasks

- [x] Add migration `supabase/migrations/20260525120000_add_lead_funding_foundation.sql`.
- [x] Define funding status, source, file type, and decision constraints.
- [x] Add indexes for chapter/status/date, requester, reviewer, optional event, and request files.
- [x] Enable RLS and add admin/chapter policies using `public.has_chapter_permission`.
- [x] Add storage bucket and storage object policies for `funding-files`.
- [x] Add seed fixtures for submitted, approved, receipts-due, and draft funding states.
- [x] Regenerate `lib/database.generated.ts`.

## Validation

- `pnpm run supabase:reset`
- `pnpm run types:generate`
- `pnpm run test -- lib/services/__tests__/chapter-permission.service.test.ts`
- `git diff --check`

## Risks

- RLS recursion with request-file policies: keep request lookup inside stable helper functions if needed.
- Generated types may churn after Supabase reset: inspect diff and keep only schema-relevant changes.
- Storage paths must be deterministic enough for service actions later, but the database should not depend on the exact path format beyond bucket/request ownership checks.
