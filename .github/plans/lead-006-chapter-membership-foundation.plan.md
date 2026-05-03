# Plan: LEAD-006 Chapter Membership Foundation

## Summary

Build the chapter membership foundation around `chapter_membership` as the source of truth for chapter applications, approval state, positions, member IDs, and editor eligibility. This should finish the split started by LEAD-005: `person_profile` stores reusable basic profile data, while `chapter_membership` stores explicit, reviewable chapter affiliation.

## User Story

As a chapter applicant,
I want chapter membership to be tracked separately from my basic profile,
So that applying to a chapter is explicit and reviewable.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #7 |
| Type | Feature |
| Complexity | Medium |
| Systems Affected | Supabase migrations/RLS, service layer, member onboarding, chapter roster, admin/editor role updates, tests |
| Dependencies | LEAD-002, LEAD-003 |
| Blocks | LEAD-010, LEAD-015, LEAD-016 |

## Problem

The database has a `chapter_membership` table and some services already use it, but the membership workflow is not yet a stable foundation. The status enum is missing `alumni`, there is no database-level guard for only one approved membership per user, member ID generation still checks `student_profile`, and several chapter/editor reads still depend on legacy `student_profile` fields. LEAD-006 should make membership explicit, enforce the important V1 constraints, and narrow the chapter roster/editor path onto `chapter_membership`.

## Patterns To Follow

### Service Layer

Source: `lib/services/chapter.service.ts:97`

Keep DB/business logic in services that accept `SupabaseClient<Database>`. Existing `ChapterService.getChapterMembers()` already joins `person_profile` with `chapter_membership`; new membership-specific logic should either live in a dedicated `ChapterMembershipService` or be clearly isolated in `ChapterService`.

### Thin Actions

Source: `lib/actions/chapter/get-data.ts:5`

Actions should stay as auth/validation wrappers and delegate data logic to services. Avoid adding approval, uniqueness, or role-transition rules directly to routes/components.

### Existing Membership Schema

Source: `supabase/migrations/20260502062200_add_chapter_membership.sql:12`

`chapter_membership` already has `status`, `position`, `approved_by_id`, `member_id`, `joined_at`, timestamps, and indexes for user, chapter, member ID, and `(chapter_id, status)`.

Source: `lib/database.generated.ts:79`

Generated types currently represent `chapter_membership.status` as `membership_status`, and `membership_status` is currently `pending | approved | rejected | inactive`; LEAD-006 needs an `alumni` path and should treat `inactive` as legacy/deprecated unless the product chooses to keep it.

### RLS

Source: `supabase/migrations/20260503000000_define_rls_new_account_model.sql:24`

Use the `SECURITY DEFINER` `is_chapter_editor(check_chapter_id text)` helper to avoid recursive RLS. Do not reintroduce self-referencing editor policies directly inside `chapter_membership` policies.

### Membership Creation

Source: `lib/services/student.service.ts:217`

Current member onboarding upserts `chapter_membership` with `position = 'member'` and `status = 'pending'`. LEAD-006 should extract this into an explicit membership application method and ensure it does not rely on `student_profile`.

### Approval And Roster

Source: `lib/services/chapter.service.ts:211`

Approval currently updates `chapter_membership` but filters only by `user_id`. It should target the specific pending membership row by `user_id` and `chapter_id`, set `approved_by_id`, `status = 'approved'`, `member_id`, and membership `position`.

Source: `lib/services/chapter.service.ts:132`

Roster reads should return membership status, member ID, chapter ID, position, and joined date with the basic `person_profile` fields and `public.user` contact fields needed by the UI.

### Editor Role Guard

Source: `lib/services/admin.service.ts:1534`

`AdminService.updateUserRole()` currently updates `public.user.role` directly. LEAD-006 must block `newRole = 'editor'` unless the user has an approved `chapter_membership`.

Source: `lib/services/admin.service.ts:1903`

`AdminService.assignEditor()` checks only chapter equality, not approved status. It should require an approved membership for that chapter before assigning editor role/position.

### Tests

Source: `lib/services/__tests__/chapter.service.test.ts:52`

Service tests should use table-routed Supabase mocks and assert table names, payloads, and error paths. Add tests for application creation, approval constraints, roster mapping, and editor eligibility.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/*_chapter_membership_foundation.sql` | Create | Add `alumni` enum value if needed, add one-approved-membership constraint/index, and optionally validate position values |
| `lib/database.generated.ts` | Regenerate | Sync generated types after Docker Supabase migration |
| `lib/services/chapter-membership.service.ts` | Create | Own application, approval, rejection, alumni, active-membership, and editor-eligibility logic |
| `lib/services/__tests__/chapter-membership.service.test.ts` | Create | Unit tests for membership foundation rules |
| `lib/services/chapter.service.ts` | Update | Delegate approval/rejection/roster membership logic or remove duplicated membership rules |
| `lib/services/__tests__/chapter.service.test.ts` | Update | Align existing chapter tests to `chapter_membership` source of truth |
| `lib/services/student.service.ts` | Update | Replace inline membership upsert with membership service call for member onboarding |
| `lib/utils/member-id.ts` | Update | Check uniqueness against `chapter_membership.member_id`, not `student_profile.member_id` |
| `lib/actions/student/onboarding.ts` | Update if needed | Keep member onboarding thin while using the extracted membership service path |
| `lib/actions/chapter/check-students.ts` | Update | Use membership service approval/rejection/bulk operations and chapter-scoped checks |
| `lib/actions/admin/users.ts` | Update if needed | Preserve thin action while service enforces editor role preconditions |
| `lib/services/admin.service.ts` | Update | Require approved membership before editor role assignment/update |
| `app/api/chapter/members/route.ts` | Update or remove | Stop reading `student_profile`; route through service or replace consumers with actions |
| `app/[locale]/chapter/members/page.tsx` | Update | Filter roster tabs by `chapter_membership.status`, not `student_profile.approval_status` |
| `app/[locale]/chapter/members/components/members-list.tsx` | Update | Use `MemberWithProfile.person_profile` and `chapter_membership` fields |
| `app/[locale]/chapter/members/components/member-card.tsx` | Update | Render membership status, position, and member ID from `chapter_membership` |
| `lib/auth.ts` | Update | Replace chapter access/sidebar checks that still query `student_profile` with approved `chapter_membership` |
| `docs/handbook/TESTING.md` | Update | Document LEAD-006 membership personas/manual validation |

## Dependency Order

1. Add database invariants first so application logic cannot drift.
2. Regenerate Supabase types from Docker Supabase.
3. Add membership service tests first for the core rules.
4. Implement `ChapterMembershipService`.
5. Refactor student onboarding and member ID generation to use the service/table.
6. Refactor chapter approval/roster reads to include `position` and avoid legacy `student_profile`.
7. Add editor role guards in admin service methods.
8. Update auth helpers/API route touched by chapter/editor membership flows.
9. Update docs and run full validation.

## Tasks

## Progress

- [x] Task 1: Add Membership Database Invariants
- [x] Task 2: Create Chapter Membership Service Tests
- [x] Task 3: Implement ChapterMembershipService
- [x] Task 4: Move Member Onboarding Membership Creation Into Service
- [x] Task 5: Move Member ID Uniqueness To Chapter Membership
- [x] Task 6: Refactor Approval And Bulk Approval To Chapter Membership Rows
- [x] Task 7: Refactor Chapter Roster Reads And UI
- [x] Task 8: Enforce Editor Role Preconditions
- [x] Task 9: Replace Touched Auth Helper Legacy Membership Reads
- [x] Task 10: Document Manual And Seed Validation

### Task 1: Add Membership Database Invariants

- **Files**: `supabase/migrations/*_chapter_membership_foundation.sql`, `lib/database.generated.ts`
- **Action**: Create migration and regenerate types
- **Implement**: Add `alumni` to `membership_status` if missing; add a partial unique index on `chapter_membership(user_id)` where `status = 'approved'`; add a unique index on `(user_id, chapter_id)` if missing; add a check constraint for allowed `position` values if the team keeps `position` as text; backfill `position = 'member'` where migrated memberships have `position IS NULL`.
- **Mirror**: `supabase/migrations/20260502062200_add_chapter_membership.sql:48`
- **Validate**: `pnpm supabase db reset`

### Task 2: Create Chapter Membership Service Tests

- **File**: `lib/services/__tests__/chapter-membership.service.test.ts`
- **Action**: Create
- **Implement**: Cover application creation as pending, duplicate same-chapter application behavior, approval requiring a specific chapter membership, only-one-approved-membership failure handling, roster read shape with chapter and position, rejection/alumni transitions, and editor eligibility requiring approved membership.
- **Mirror**: `lib/services/__tests__/chapter.service.test.ts:52`
- **Validate**: `pnpm test lib/services/__tests__/chapter-membership.service.test.ts`

### Task 3: Implement ChapterMembershipService

- **File**: `lib/services/chapter-membership.service.ts`
- **Action**: Create
- **Implement**: Add methods such as `applyToChapter`, `getUserMemberships`, `getChapterRoster`, `approveMembership`, `rejectMembership`, `markAlumni`, `hasApprovedMembership`, and `ensureCanBecomeEditor`. Keep all methods framework-agnostic and return structured success/error results.
- **Mirror**: `lib/services/person-profile.service.ts:40`
- **Validate**: `pnpm test lib/services/__tests__/chapter-membership.service.test.ts`

### Task 4: Move Member Onboarding Membership Creation Into Service

- **Files**: `lib/services/student.service.ts`, `lib/actions/student/onboarding.ts`
- **Action**: Update
- **Implement**: Keep profile creation in `person_profile`, then call `ChapterMembershipService.applyToChapter()` for the explicit chapter application. Ensure created membership has `status = 'pending'`, `position = 'member'`, and no dependency on `student_profile`.
- **Mirror**: `lib/services/student.service.ts:217`
- **Validate**: `pnpm test lib/services/__tests__/student.service.test.ts`

### Task 5: Move Member ID Uniqueness To Chapter Membership

- **File**: `lib/utils/member-id.ts`
- **Action**: Update
- **Implement**: Check `chapter_membership.member_id` for uniqueness instead of `student_profile.member_id`; preserve member ID format and retry behavior.
- **Mirror**: `lib/utils/member-id.ts:16`
- **Validate**: `pnpm test lib/services/__tests__/chapter.service.test.ts`

### Task 6: Refactor Approval And Bulk Approval To Chapter Membership Rows

- **Files**: `lib/services/chapter.service.ts`, `lib/actions/chapter/check-students.ts`
- **Action**: Update
- **Implement**: Require `chapter_id` for approval operations; update only the matching pending membership row; set `approved_by_id`, `status`, `member_id`, `joined_at`, and `updated_at`; handle duplicate-approved constraint errors with a clear message; keep bulk approval chapter-scoped.
- **Mirror**: `lib/services/chapter.service.ts:211`
- **Validate**: `pnpm test lib/services/__tests__/chapter.service.test.ts`

### Task 7: Refactor Chapter Roster Reads And UI

- **Files**: `lib/services/chapter.service.ts`, `app/api/chapter/members/route.ts`, `app/[locale]/chapter/members/page.tsx`, `app/[locale]/chapter/members/components/members-list.tsx`, `app/[locale]/chapter/members/components/member-card.tsx`
- **Action**: Update
- **Implement**: Read from `chapter_membership` joined with `person_profile`, `user`, and `chapter`; include `chapter_id`, `status`, `position`, `member_id`, and `joined_at`. Stop using `student_profile.approval_status`, `student_profile.member_id`, or `student_profile.chapter_id` in this touched roster path.
- **Mirror**: `lib/services/chapter.service.ts:132`
- **Validate**: `pnpm test`

### Task 8: Enforce Editor Role Preconditions

- **Files**: `lib/services/admin.service.ts`, `lib/services/__tests__/admin.service.test.ts`
- **Action**: Update
- **Implement**: Block direct `updateUserRole(..., 'editor')`, bulk role changes to editor, and `assignEditor()` unless the user has an approved membership for the relevant chapter. When assigning a chapter editor, update membership `position` to `editor` or a valid editor position as part of the transaction-like service flow.
- **Mirror**: `lib/services/admin.service.ts:1534`
- **Validate**: `pnpm test lib/services/__tests__/admin.service.test.ts`

### Task 9: Replace Touched Auth Helper Legacy Membership Reads

- **Files**: `lib/auth.ts`, `app/[locale]/chapter/layout.tsx`, `app/[locale]/auth/callback/route.ts`
- **Action**: Update
- **Implement**: Replace `student_profile` chapter access/sidebar reads with `chapter_membership` queries filtered to approved memberships. Preserve admin bypass behavior. Ensure member/editor routing no longer depends on `student_profile.is_filled` for the touched auth flow.
- **Mirror**: `lib/auth.ts:124`
- **Validate**: `pnpm test`

### Task 10: Document Manual And Seed Validation

- **Files**: `docs/handbook/TESTING.md`, `supabase/seed.sql` if seed data needs alignment
- **Action**: Update
- **Implement**: Document that chapter applications create pending memberships; approved personas have one approved membership; editor persona has approved membership plus editor position; alumni uses membership status/position consistently with the final enum choice.
- **Mirror**: `docs/handbook/TESTING.md:20`
- **Validate**: `pnpm supabase db reset`

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Partial unique index blocks existing seed data | Check `supabase/seed.sql` before migration validation; keep only one approved membership per seeded user |
| Postgres enum cannot remove `inactive` cleanly | Add `alumni` forward-only and treat `inactive` as deprecated unless a later cleanup migration rebuilds the enum |
| RLS recursion returns | Keep editor checks inside `public.is_chapter_editor()` security definer helper; do not inline self-joins in policies |
| Approval updates the wrong chapter row | Require `chapter_id` in service methods and filter by both `user_id` and `chapter_id` |
| Editor role and membership position drift apart | Admin service should check approved membership before role update and update membership position when assigning chapter editor |
| Migrated memberships have no position | Backfill `position = 'member'` for non-editor/null rows before relying on position in rosters and editor checks |
| Scope expands into all legacy student pages | Limit route updates to chapter membership, roster, onboarding, and auth/editor access paths required by acceptance criteria |

## Acceptance Criteria Mapping

- [x] Applying to a chapter creates a `chapter_membership` row with `status = 'pending'`
- [x] Approved roster rows include chapter and position
- [x] Only one active approved chapter membership is allowed per user
- [x] A user can become editor only with approved chapter membership

## Validation

```bash
pnpm supabase db reset
pnpm test lib/services/__tests__/chapter-membership.service.test.ts
pnpm test lib/services/__tests__/chapter.service.test.ts
pnpm test lib/services/__tests__/admin.service.test.ts
pnpm test
pnpm lint
git diff --check
```

## Out Of Scope

- Full replacement of every public/company legacy `student_profile` read
- Event registration membership requirements beyond roster/editor access foundations
- Production data backfill beyond local Docker seed/migration validation
