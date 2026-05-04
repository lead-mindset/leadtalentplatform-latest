# Plan: Fix Admin Chapter Page Build Blocker

## Summary

Fix the current production build blocker by updating the admin chapter detail page to use the canonical account model. The page still groups members with legacy `student_profile` fields, while `getChapterMembers()` now returns `MemberWithProfile` built from `person_profile` and `chapter_membership`.

Implementation expanded beyond the first page because production build revealed additional schema-alignment blockers in services/actions after the admin chapter page was fixed. The final change keeps the production app on the new account-model types and narrows the Next.js production typecheck boundary away from standalone scripts/test config.

## User Story

As an engineer,
I want the admin chapter detail page to use the new account model,
So that `pnpm build` passes before LEAD-018 event work resumes.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #68 |
| Parent | #66 |
| Type | BUG_FIX / STABILIZATION |
| Complexity | LOW |
| Systems Affected | Admin chapter page, member profile typing, build validation |

## Codebase Findings

- Current build failure is at `app/[locale]/admin/chapters/[id]/page.tsx:30`.
- The page reads `member.student_profile?.approval_status`, `member.student_profile?.is_filled`, and `member.student_profile?.is_recruiter_visible`.
- `MemberWithProfile` in `lib/types.ts` now exposes:
  - `person_profile`
  - `chapter_membership`
  - `chapter`
- `AdminService.getChapterMembers()` reads from `person_profile` and maps rows through `mapAdminProfile()`.
- Chapter member UI already follows the correct pattern in `app/[locale]/chapter/members/page.tsx`:
  - pending: `member.person_profile && member.chapter_membership?.status === 'pending'`
  - approved: `member.chapter_membership?.status === 'approved'`
  - rejected: `member.chapter_membership?.status === 'rejected'`

## Mapping

| Legacy Field | Canonical Replacement |
|--------------|-----------------------|
| `student_profile.approval_status` | `chapter_membership.status` |
| `student_profile.is_filled` | `Boolean(person_profile)` for this page |
| `student_profile.is_recruiter_visible` | `person_profile.is_recruiter_visible` |

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `app/[locale]/admin/chapters/[id]/page.tsx` | UPDATE | Replace legacy member grouping and recruiter visibility reads. |
| `lib/services/admin.service.ts` | UPDATE IF NEEDED | Only adjust `mapAdminProfile()` if build reveals a direct `MemberWithProfile` shape mismatch. |
| `lib/types.ts` | UPDATE IF NEEDED | Only adjust type shape if the canonical member type is missing fields already returned by services. |

## Tasks

- [x] Update member grouping in `app/[locale]/admin/chapters/[id]/page.tsx`.
  - Approved: `m.chapter_membership?.status === 'approved'`
  - Pending: `m.person_profile && m.chapter_membership?.status === 'pending'`
  - Rejected: `m.chapter_membership?.status === 'rejected'`
  - Incomplete: `!m.person_profile`

- [x] Replace approved member recruiter visibility badge.
  - Use `member.person_profile?.is_recruiter_visible`.

- [x] Run focused type/build validation.
  - `pnpm build`

- [x] If build reveals a direct `MemberWithProfile` shape issue, fix only the service/type mismatch needed by this page.

- [x] Run standard stabilization validation.
  - `pnpm test`
  - `pnpm lint`
  - `pnpm build`

- [x] Update Issue #68 with validation results.

## Validation

```bash
pnpm build # pass
pnpm test  # pass: 14 files, 201 tests
pnpm lint  # pass: warnings only
```

## Implementation Notes

- Admin chapter and admin user pages now read `person_profile` plus `chapter_membership`.
- Service/action exports were aligned so type-only imports come from service modules, not `"use server"` action modules.
- Event, company, recruiter, chapter, and admin services were updated where generated Supabase relationship typing exposed stale account-model assumptions.
- `tsconfig.json` excludes standalone `scripts/` and `vitest.config.ts` from the Next.js production typecheck boundary.
- Remaining `student_profile` references outside this change should be audited under #67 rather than folded into this build-blocker fix.

## Risks

| Risk | Mitigation |
|------|------------|
| Fix grows into a broad `student_profile` migration | Keep this issue scoped to the known build blocker; use #67 for the wider audit. |
| Incomplete profile semantics changed from `is_filled` | For this page, `getChapterMembers()` is sourced from `person_profile`, so `!person_profile` is the closest canonical equivalent. |
| Build reveals additional legacy references | Fix only directly related `MemberWithProfile` blockers here; route unrelated references to #67. |
