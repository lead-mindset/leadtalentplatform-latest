# Plan: LEAD-010 Migrate Existing Student Profile Data Into New Model

## Summary

Stabilize the migration from legacy `student_profile` into the layered account model introduced by LEAD-005, LEAD-006, and LEAD-007. The implementation should preserve current progress, correct lossy earlier mappings, document ambiguous field decisions, and add validation queries that prove migrated row counts and relationships match expectations.

This is a data migration and validation story. It should not become a broad UI/service cleanup. Old consumers can keep reading `student_profile` until LEAD-011, but the new model must become the reliable target for `person_profile`, `chapter_membership`, and identity data.

## User Story

As an engineer,
I want existing `student_profile` data migrated into the new layered model,
So that current progress is preserved while the schema becomes sustainable.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #11 |
| Type | Technical |
| Complexity | Medium |
| Systems Affected | Supabase migrations, seed data, validation docs, generated DB types if schema changes |
| Dependencies | LEAD-005, LEAD-006, LEAD-007 |
| Blocks | LEAD-011 |

## Problem

The project already has early migration files that copy data out of `student_profile`, but they are too weak to be the final LEAD-010 answer:

- `20260502062500_migrate_to_person_profile.sql` maps `student_profile.major` to both `person_profile.university` and `person_profile.major_or_interest`; `university` has no reliable source in `student_profile`.
- `20260502062500_migrate_to_person_profile.sql` uses `ON CONFLICT (user_id) DO NOTHING`, so existing partial `person_profile` rows are not backfilled.
- `20260502062600_migrate_to_chapter_membership.sql` uses `ON CONFLICT (member_id) DO NOTHING`; nullable `member_id` and duplicate/null behavior make this a poor identity for membership migration.
- `20260502062700_migrate_to_lead_identity.sql` creates identities from approved memberships, but earlier migrated memberships had null positions, so most identities collapse to generic `chapter_member`.
- Validation checks compare broad counts, but they do not prove source rows map to exact target rows.

LEAD-010 should add a corrective, idempotent migration after the current foundation migrations and keep the old table intact until consumers are moved in LEAD-011.

## Codebase Findings

### Legacy Source

Source: `supabase/migrations/20260429174400_base_schema.sql`

`student_profile` contains reusable profile fields (`major`, `graduation_year`, `linkedin_url`, `skills`, `gender`), recruiter visibility fields (`is_recruiter_visible`, `consent_recruiter_visibility`, `consent_date`), membership fields (`chapter_id`, `approval_status`, `approved_by_id`, `member_id`), and operational flags (`is_filled`, `email_notifications_enabled`).

`student_profile.user_id` references `public."user"`, while the new account tables reference `auth.users`. The implementation must audit for source rows whose user does not exist in `auth.users` before inserting into the new model.

Source: `docs/migrations/MIGRATION-PLAN-LEAD-002.md`

There is already a migration planning document with source-to-target mapping notes. Treat it as historical context, but let LEAD-010's corrective migration decisions override mappings that proved lossy, especially `major` being copied into `university`.

### New Targets

Source: `supabase/migrations/20260502061800_add_person_profile.sql`

`person_profile` stores reusable, chapter-independent data: `user_id`, `university`, `major_or_interest`, `graduation_year`, `linkedin_url`, `portfolio_url`, `skills`, `gender`, and timestamps. A later migration adds `is_recruiter_visible`.

Source: `supabase/migrations/20260502062200_add_chapter_membership.sql`

`chapter_membership` stores `user_id`, `chapter_id`, `status`, `position`, `approved_by_id`, `member_id`, and membership timestamps. LEAD-006 later adds the `alumni` status, position check, unique `(user_id, chapter_id)`, and the one-approved-membership-per-user rule.

Source: `supabase/migrations/20260502062202_add_lead_identity.sql`

`lead_identity` stores official identity state (`founder`, `staff`, `chapter_editor`, `chapter_member`, `alumni`) and has one active identity row per user in the current schema.

### RLS Context

Source: `supabase/migrations/20260503000000_define_rls_new_account_model.sql`

The current RLS model avoids admin lockouts through `public.is_admin()` using JWT claims and avoids recursion with `public.is_chapter_editor(check_chapter_id)`. LEAD-010 should not rework RLS; it should ensure migrated data lands in tables protected by those policies.

### Seed Context

Source: `supabase/seed.sql`

The current seed personas create auth users, `person_profile`, `chapter_membership`, `lead_identity`, recruiter access, and newsletter rows. The seed data should be adjusted so personas include realistic profile and membership fields that exercise the migration decisions.

Source: `supabase/seed-qa.sql`

The QA seed still inserts into deprecated `student_profile`. LEAD-010 should either update this seed to the layered model or explicitly keep it as a legacy migration fixture with comments explaining when to use it.

## Field Mapping Decisions

| Legacy Field | Target | Decision |
|--------------|--------|----------|
| `student_profile.major` | `person_profile.major_or_interest` | Copy here. This is the reusable academic/interest field. |
| `student_profile.major` | `person_profile.university` | Do not copy. If earlier migrations set `university = major`, clear it when that exact false mapping is detected and no better university source exists. |
| `graduation_year` | `person_profile.graduation_year` | Copy. |
| `linkedin_url` | `person_profile.linkedin_url` | Copy. |
| `skills` | `person_profile.skills` | Copy array as-is. |
| `gender` | `person_profile.gender` | Copy if it satisfies current target constraints. |
| `is_recruiter_visible`, `consent_recruiter_visibility` | `person_profile.is_recruiter_visible` | Set true if either legacy visibility flag is true; otherwise false. |
| `consent_date` | No direct target | Document as not preserved unless future audit/consent history table is introduced. |
| `chapter_id` | `chapter_membership.chapter_id` | Copy, after validating the chapter exists. |
| `approval_status` | `chapter_membership.status` | Map `pending`, `approved`, `rejected` directly; map null or unexpected values to `inactive` only with a documented validation warning. |
| `member_id` | `chapter_membership.member_id` | Copy, but do not use it as the migration conflict key. |
| `approved_by_id` | `chapter_membership.approved_by_id`, `lead_identity.issued_by_id` | Copy when present and valid. |
| `created_at` | `chapter_membership.joined_at`, target timestamps | Use as the best available historical timestamp. |
| `is_filled` | No direct target | Document as deprecated; target presence plus non-null reusable fields replaces this flag. |
| `email_notifications_enabled` | `newsletter_subscription` | Verify existing newsletter migration handles this; do not add newsletter booleans to profile tables. |

## Implementation Design

### 1. Add A Pre-Migration Audit

Add a migration section that fails loudly before data writes when source rows cannot be safely migrated:

- `student_profile.user_id` missing in `auth.users`.
- `student_profile.chapter_id` missing in `chapter`.
- Duplicate source rows for the same `user_id` and `chapter_id`.
- Duplicate non-null `member_id` values.
- Existing target rows with conflicting non-null data that cannot be safely merged.

The audit should use `RAISE EXCEPTION` for unsafe cases and comments for accepted ambiguity.

### 2. Add Corrective Idempotent Migration

Create a new migration after the current LEAD-009 migration timestamp, for example:

`supabase/migrations/20260503005000_stabilize_student_profile_migration.sql`

The migration should:

- Upsert `person_profile` by `user_id`.
- Backfill reusable fields from `student_profile`.
- Correct the earlier false `university = major` mapping when it is detected.
- Upsert `chapter_membership` by `(user_id, chapter_id)`.
- Preserve `approval_status`, `approved_by_id`, and `member_id`.
- Default migrated membership `position` to `member` when no better role exists.
- Create `lead_identity` rows only for approved memberships when the user does not already have a stronger identity.
- Avoid deleting or dropping `student_profile`.

Prefer `ON CONFLICT (user_id)` for `person_profile` and `ON CONFLICT (user_id, chapter_id)` for `chapter_membership`. Do not use `member_id` as the membership conflict key.

### 3. Add Validation Queries

Add validation SQL in migration comments or `docs/handbook/TESTING.md` so future maintainers can rerun checks after database reset:

- Every `student_profile` row has one `person_profile` row for the same `user_id`.
- Reusable fields match expected mapped values.
- Every valid legacy chapter profile has one `chapter_membership` row for `(user_id, chapter_id)`.
- Approved legacy profiles produce approved memberships.
- `member_id` and `approved_by_id` are preserved where present.
- Existing `student_profile.major` is no longer copied into `person_profile.university`.
- Counts exclude intentionally unmigratable rows and document why.

### 4. Update Seed Data

Update `supabase/seed.sql` only after the migration behavior is clear:

- Give seed personas realistic `major_or_interest`, `graduation_year`, `linkedin_url`, `skills`, and `gender`.
- Add `member_id`, `approved_by_id`, and explicit `position/status` fields to chapter membership personas.
- Keep public participant independent from `chapter_membership`.
- Keep recruiter access explicit through `recruiter_access`, not profile visibility alone.
- Keep all test accounts using the existing `password123` convention.

### 5. Regenerate Types Only If Needed

If LEAD-010 is data-only, `lib/database.generated.ts` should not need regeneration. If the implementation adds constraints or enum values, regenerate from Docker Supabase and commit the generated type changes with the migration.

## Tasks

- [x] Create pre-migration audit queries for unsafe legacy source states.
- [x] Add corrective migration `stabilize_student_profile_migration`.
- [x] Preserve reusable profile fields in `person_profile`.
- [x] Preserve chapter membership fields in `chapter_membership`.
- [x] Preserve approved member identity where safe in `lead_identity`.
- [x] Document ambiguous field decisions in the migration plan and SQL comments.
- [x] Update `supabase/seed.sql` with realistic persona fields.
- [x] Update or document `supabase/seed-qa.sql` so QA data does not accidentally bypass the new layered model.
- [x] Add validation queries to `docs/handbook/TESTING.md` or migration comments.
- [x] Run `pnpm supabase db reset`.
- [x] Run targeted validation SQL against Docker Supabase.
- [x] Run `pnpm test` and record any schema-drift failures that belong to LEAD-011.

## Implementation Results

- `pnpm supabase db reset` passed with the LEAD-010 stabilization migration applied.
- Targeted validation SQL returned zero missing or mismatched migrated rows.
- Seed validation returned 7 `person_profile` rows, 3 `chapter_membership` rows, and 5 `lead_identity` rows.
- `pnpm test` passed: 10 files, 172 tests.
- `pnpm lint` passed with warnings only.
- `pnpm build` compiled successfully but failed type checking on the known LEAD-011 legacy consumer: `app/[locale]/admin/chapters/[id]/page.tsx` still reads `member.student_profile`.

## Validation Commands

```bash
pnpm supabase db reset
pnpm test
pnpm build
```

If `pnpm build` or `pnpm test` still fails because legacy consumers reference `student_profile`, document the failing files and link them to LEAD-011 instead of expanding LEAD-010 into a full cleanup.

## Risks

- `public."user"` and `auth.users` can drift. The migration must fail before writing partial target rows if auth users are missing.
- Existing earlier migrations may already have written `person_profile.university = student_profile.major`. LEAD-010 must correct that false data.
- `lead_identity` currently allows one row per user, so migrating approved chapter member identity must not overwrite founder/staff/admin-style identities.
- Old UI/services still query `student_profile`. LEAD-010 should preserve the old table until LEAD-011 removes those consumers.
- `member_id` may be null or duplicated. It should be preserved as a field, not treated as the target row identity.

## Out Of Scope

- Removing `student_profile`.
- Refactoring every old student route or recruiter/admin UI consumer.
- Changing the RLS model created by LEAD-003.
- Adding new production profile fields beyond the accepted new model.
- Campaign UI or newsletter preference redesign.

## GitHub Follow-Up

Create sub-issues for:

1. Audit legacy `student_profile` migration safety.
2. Add corrective migration for profile and membership data.
3. Update seed personas and validation queries.
4. Document ambiguous field decisions and LEAD-011 cleanup boundaries.
