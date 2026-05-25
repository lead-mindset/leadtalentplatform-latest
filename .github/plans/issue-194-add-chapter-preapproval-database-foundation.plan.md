# Plan: Add Chapter Preapproval Database Foundation

## Summary

Add a Supabase migration for `chapter_preapproval`, the email-bound activation table used by admins to preapprove verified members and e-board before they create accounts. The table will store normalized email, chapter, type, optional role fields, expiration, consumption, revocation, source metadata, and timestamps with indexes and RLS that prevent broad member/anonymous reads.

## User Story

As Abigail  
I want to load verified chapter member and e-board emails into a safe preapproval table  
So that users can create their own accounts while the platform can automatically activate approved chapter status later.

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY / DATABASE |
| Complexity | MEDIUM |
| Systems Affected | Supabase migrations, generated database types |
| GitHub Issue | #194 |

---

## Patterns to Follow

### Foundational Migration Structure

```sql
-- SOURCE: supabase/migrations/20260502062200_add_chapter_membership.sql
BEGIN;

CREATE TABLE IF NOT EXISTS chapter_membership (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    chapter_id text NOT NULL,
    status membership_status NOT NULL DEFAULT 'pending',
    ...
);

CREATE INDEX IF NOT EXISTS idx_chapter_membership_user_id
    ON chapter_membership(user_id);

ALTER TABLE chapter_membership ENABLE ROW LEVEL SECURITY;
```

### Canonical Admin RLS Helper

```sql
-- SOURCE: supabase/migrations/20260507180000_fix_admin_rls_app_role.sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."user" u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  );
$$;
```

### Existing Public User Foreign Keys

```sql
-- SOURCE: supabase/migrations/20260429174400_base_schema.sql
ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "event_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id");
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260522160000_add_chapter_preapproval.sql` | CREATE | Add `chapter_preapproval` table, constraints, indexes, RLS, and verification queries. |
| `lib/database.generated.ts` | UPDATE | Regenerate Supabase types after local migration reset/generation. |
| `.github/reports/issue-194-add-chapter-preapproval-database-foundation-report.md` | CREATE | Capture implementation and validation evidence. |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Create Migration

Status: Completed

- **File**: `supabase/migrations/20260522160000_add_chapter_preapproval.sql`
- **Action**: CREATE
- **Implement**: Create `chapter_preapproval` with `email`, `normalized_email`, `chapter_id`, `preapproval_type`, optional role fields, default 6-month `expires_at`, consumption/revocation fields, creator/source/notes, timestamps, foreign keys to `public.chapter` and `public."user"`.
- **Mirror**: `supabase/migrations/20260502062200_add_chapter_membership.sql`.
- **Validate**: `rg -n "chapter_preapproval|expires_at|preapproval_type" supabase/migrations/20260522160000_add_chapter_preapproval.sql`

### Task 2: Add Constraints And Indexes

Status: Completed

- **File**: `supabase/migrations/20260522160000_add_chapter_preapproval.sql`
- **Action**: UPDATE
- **Implement**: Add checks for non-empty normalized email, normalized email matching `lower(btrim(email))`, `preapproval_type in ('member', 'eboard')`, role fields required for e-board, and partial indexes for active lookup and active email/chapter uniqueness.
- **Mirror**: `supabase/migrations/20260503002000_chapter_membership_foundation.sql` constraint/index style.
- **Validate**: migration reset must reject duplicate active email/chapter records in later service tests.

### Task 3: Add RLS

Status: Completed

- **File**: `supabase/migrations/20260522160000_add_chapter_preapproval.sql`
- **Action**: UPDATE
- **Implement**: Enable RLS and add admin-only policies for authenticated users. Do not allow anonymous or ordinary member reads. Service role remains available for secure server-side claim/import operations.
- **Mirror**: `supabase/migrations/20260503000000_define_rls_new_account_model.sql` policy style and `public.is_admin()`.
- **Validate**: migration includes no non-admin user select policy.

### Task 4: Regenerate Database Types

Status: Completed

- **File**: `lib/database.generated.ts`
- **Action**: UPDATE
- **Implement**: Apply/reset local migrations and regenerate types so `chapter_preapproval` is represented in generated types.
- **Mirror**: `docs/adr/002-database-type-generation.md`.
- **Validate**: `rg -n "chapter_preapproval" lib/database.generated.ts`

### Task 5: Update GitHub Issue

Status: Completed

- **File**: GitHub issue #194
- **Action**: UPDATE
- **Implement**: Add plan link and implementation report link with validation evidence.
- **Validate**: `gh issue view 194 --json labels,comments,title`

---

## Validation

```bash
rg -n "chapter_preapproval|idx_chapter_preapproval_active_email_chapter|chapter_preapproval_admin_all" supabase/migrations/20260522160000_add_chapter_preapproval.sql
pnpm run supabase:reset
pnpm run types:generate
rg -n "chapter_preapproval" lib/database.generated.ts
pnpm lint
pnpm exec tsc --noEmit
pnpm test
```

---

## Acceptance Criteria

- [x] `chapter_preapproval` exists with required email, chapter, type, role metadata, lifecycle, source, and timestamp fields.
- [x] Duplicate active normalized email/chapter preapprovals are rejected.
- [x] Expired, consumed, and revoked records can be excluded through indexed active lookup.
- [x] No committed migration contains real chapter email data.
- [x] RLS/policies do not permit broad anonymous or ordinary member reads.
- [x] `lib/database.generated.ts` includes the new table.
