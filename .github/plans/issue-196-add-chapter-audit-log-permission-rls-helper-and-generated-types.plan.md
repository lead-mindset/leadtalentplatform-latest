# Plan: Add Chapter Audit Log, Permission RLS Helper, And Generated Types

## Summary

Add the audit and database authorization foundation for chapter-scoped permissions. This includes `chapter_audit_log`, a `public.has_chapter_permission(check_chapter_id, check_permission_key)` helper that honors admin bypass and active approved membership plus active grants, and regenerated Supabase types.

## User Story

As a platform admin and engineer  
I want sensitive chapter operations auditable and permission checks centralized in the database  
So that future services, server actions, and RLS policies can enforce chapter access consistently.

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY / DATABASE / SECURITY |
| Complexity | MEDIUM |
| Systems Affected | Supabase migrations, RLS helpers, generated database types |
| GitHub Issue | #196 |

---

## Patterns to Follow

### Security Definer Helper

```sql
// SOURCE: supabase/migrations/20260507180000_fix_admin_rls_app_role.sql
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

### Admin-Only RLS Table

```sql
// SOURCE: supabase/migrations/20260522160000_add_chapter_preapproval.sql
ALTER TABLE public.chapter_preapproval ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chapter_preapproval_admin_all" ON public.chapter_preapproval
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

### Generated Type Workflow

```markdown
// SOURCE: docs/adr/002-database-type-generation.md
1. Developer creates migration.
2. Developer applies migration.
3. Types auto-generate to `lib/database.generated.ts`.
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260522162000_add_chapter_audit_log_permission_helper.sql` | CREATE | Add audit log table, admin-only RLS, and `public.has_chapter_permission`. |
| `lib/database.generated.ts` | UPDATE | Regenerate Supabase types after migration reset/generation. |
| `.github/reports/issue-196-add-chapter-audit-log-permission-rls-helper-and-generated-types-report.md` | CREATE | Capture implementation and validation evidence. |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Add Chapter Audit Log Table

Status: Completed

- **File**: `supabase/migrations/20260522162000_add_chapter_audit_log_permission_helper.sql`
- **Action**: CREATE
- **Implement**: Add `chapter_audit_log` with actor, target, chapter, action, entity type/id, metadata jsonb, and timestamp fields.
- **Mirror**: `supabase/migrations/20260522160000_add_chapter_preapproval.sql`.
- **Validate**: `rg -n "chapter_audit_log|metadata jsonb|actor_user_id" supabase/migrations/20260522162000_add_chapter_audit_log_permission_helper.sql`

### Task 2: Add Audit Constraints, Indexes, And RLS

Status: Completed

- **File**: `supabase/migrations/20260522162000_add_chapter_audit_log_permission_helper.sql`
- **Action**: UPDATE
- **Implement**: Add non-empty action/entity checks, metadata object check, indexes by chapter/action/actor/target/created_at, admin-only RLS, and no ordinary member/anonymous read policies.
- **Validate**: inspect `pg_policies` for admin-only audit log policy.

### Task 3: Add Permission Helper

Status: Completed

- **File**: `supabase/migrations/20260522162000_add_chapter_audit_log_permission_helper.sql`
- **Action**: UPDATE
- **Implement**: Add `public.has_chapter_permission(check_chapter_id text, check_permission_key text)` as `SECURITY DEFINER`, with admin bypass, recruiter exclusion, approved membership requirement, active unrevoked grant requirement, and execute grants to authenticated/service_role.
- **Mirror**: `public.is_admin()` and `public.is_chapter_editor()` helper style.
- **Validate**: local SQL smoke tests cover admin allowed, granted approved member allowed, regular member without grant denied, recruiter denied.

### Task 4: Regenerate Database Types

Status: Completed

- **File**: `lib/database.generated.ts`
- **Action**: UPDATE
- **Implement**: Apply/reset local migrations and regenerate types so `chapter_audit_log` appears in generated types and helper appears under functions if generated.
- **Validate**: `rg -n "chapter_audit_log|has_chapter_permission" lib/database.generated.ts`

### Task 5: Update GitHub Issue

Status: Completed

- **File**: GitHub issue #196
- **Action**: UPDATE
- **Implement**: Add plan link and implementation report link with validation evidence.
- **Validate**: `gh issue view 196 --json labels,comments,title`

---

## Validation

```bash
rg -n "chapter_audit_log|has_chapter_permission" supabase/migrations/20260522162000_add_chapter_audit_log_permission_helper.sql
pnpm run supabase:reset
pnpm run types:generate
rg -n "chapter_audit_log|has_chapter_permission" lib/database.generated.ts
pnpm lint
pnpm exec tsc --noEmit
pnpm test
```

---

## Acceptance Criteria

- [x] `chapter_audit_log` exists and can record actor, target, chapter, action, metadata, and timestamps.
- [x] `public.has_chapter_permission(check_chapter_id, check_permission_key)` allows active approved members with active grants.
- [x] Admin bypass works without requiring chapter membership.
- [x] Recruiter or regular member without a grant is denied.
- [x] `lib/database.generated.ts` includes `chapter_audit_log` and the permission helper.
