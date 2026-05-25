# Plan: Add Chapter Role Assignment And Permission Grant Schema

## Summary

Add the two core tables that separate official chapter responsibility from product capability: `chapter_role_assignment` and `chapter_permission_grant`. The migration will enforce normalized launch role taxonomy, permission key vocabulary, one active primary assignment per user/chapter, and one active grant per user/chapter/permission while keeping access locked behind admin-only RLS until the permission helper work in #196.

## User Story

As a platform admin and engineer  
I want chapter responsibilities and chapter dashboard permissions stored separately  
So that e-board users can remain global `member` accounts while receiving scoped operational access.

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY / DATABASE |
| Complexity | MEDIUM |
| Systems Affected | Supabase migrations, generated database types |
| GitHub Issue | #195 |

---

## Patterns to Follow

### Migration And Index Style

```sql
// SOURCE: supabase/migrations/20260503002000_chapter_membership_foundation.sql
ALTER TABLE public.chapter_membership
  ADD CONSTRAINT chapter_membership_position_check
  CHECK (...);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_membership_one_approved_per_user
  ON public.chapter_membership(user_id)
  WHERE status = 'approved';
```

### Admin-Only RLS Pattern

```sql
// SOURCE: supabase/migrations/20260522160000_add_chapter_preapproval.sql
ALTER TABLE public.chapter_preapproval ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chapter_preapproval_admin_all" ON public.chapter_preapproval
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

### Public User Foreign Keys

```sql
// SOURCE: supabase/migrations/20260429174400_base_schema.sql
ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "event_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id");
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260522161000_add_chapter_role_assignment_permission_grant.sql` | CREATE | Add role assignment and permission grant tables, constraints, indexes, admin-only RLS, and verification queries. |
| `lib/database.generated.ts` | UPDATE | Regenerate Supabase types after migration reset/generation. |
| `.github/reports/issue-195-add-chapter-role-assignment-and-permission-grant-schema-report.md` | CREATE | Capture implementation and validation evidence. |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Create Role Assignment Table

Status: Completed

- **File**: `supabase/migrations/20260522161000_add_chapter_role_assignment_permission_grant.sql`
- **Action**: CREATE
- **Implement**: Add `chapter_role_assignment` with user/chapter FKs, `role_level`, `functional_area`, `display_title`, optional `raw_title`, primary flag, active/inactive status, source metadata, preapproval link, start/end timestamps, and created/updated timestamps.
- **Mirror**: `supabase/migrations/20260522160000_add_chapter_preapproval.sql`.
- **Validate**: `rg -n "chapter_role_assignment|role_level|functional_area" supabase/migrations/20260522161000_add_chapter_role_assignment_permission_grant.sql`

### Task 2: Add Role Assignment Constraints And Indexes

Status: Completed

- **File**: `supabase/migrations/20260522161000_add_chapter_role_assignment_permission_grant.sql`
- **Action**: UPDATE
- **Implement**: Add allowed MVP `role_level` and `functional_area` checks, non-empty display/source checks, status/source checks, valid end-date check, and partial unique index for one active primary assignment per user/chapter.
- **Validate**: local SQL smoke test rejects duplicate active primary assignments.

### Task 3: Create Permission Grant Table

Status: Completed

- **File**: `supabase/migrations/20260522161000_add_chapter_role_assignment_permission_grant.sql`
- **Action**: UPDATE
- **Implement**: Add `chapter_permission_grant` with user/chapter FKs, permission key, source, optional source role assignment, grant/revoke metadata, and created timestamp.
- **Mirror**: PRD launch permission matrix and ADR 004 permission key list.
- **Validate**: `rg -n "chapter_permission_grant|permission_key|idx_chapter_permission_active_unique" supabase/migrations/20260522161000_add_chapter_role_assignment_permission_grant.sql`

### Task 4: Add Permission Constraints, Indexes, And Admin-Only RLS

Status: Completed

- **File**: `supabase/migrations/20260522161000_add_chapter_role_assignment_permission_grant.sql`
- **Action**: UPDATE
- **Implement**: Add permission key check, source check, active grant uniqueness, indexes, RLS enabled on both tables, admin-only policies, and no ordinary member broad read policies.
- **Validate**: local SQL smoke test rejects duplicate active grants and invalid permission keys.

### Task 5: Regenerate Database Types

Status: Completed

- **File**: `lib/database.generated.ts`
- **Action**: UPDATE
- **Implement**: Apply/reset local migrations and regenerate types so both tables appear in generated types.
- **Validate**: `rg -n "chapter_role_assignment|chapter_permission_grant" lib/database.generated.ts`

### Task 6: Update GitHub Issue

Status: Completed

- **File**: GitHub issue #195
- **Action**: UPDATE
- **Implement**: Add plan link and implementation report link with validation evidence.
- **Validate**: `gh issue view 195 --json labels,comments,title`

---

## Validation

```bash
rg -n "chapter_role_assignment|chapter_permission_grant|idx_chapter_permission_active_unique" supabase/migrations/20260522161000_add_chapter_role_assignment_permission_grant.sql
pnpm run supabase:reset
pnpm run types:generate
rg -n "chapter_role_assignment|chapter_permission_grant" lib/database.generated.ts
pnpm lint
pnpm exec tsc --noEmit
pnpm test
```

---

## Acceptance Criteria

- [x] `chapter_role_assignment` exists with role level, functional area, display title, lifecycle, source, and relationship fields.
- [x] `chapter_permission_grant` exists with permission key, source, grant/revoke metadata, and source assignment relationship fields.
- [x] Duplicate active primary assignments are rejected for one user/chapter.
- [x] Duplicate active permission grants are rejected for one user/chapter/permission.
- [x] Foreign keys align with `public."user"` and `public.chapter`.
- [x] `lib/database.generated.ts` includes both new tables.
