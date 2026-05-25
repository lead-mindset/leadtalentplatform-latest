# Plan: Backfill Legacy Editor Access And Stop Overwriting Membership Position

## Summary

Backfill existing legacy `public.user.role = 'editor'` chapter operators into explicit chapter role assignments and permission grants, while preserving compatibility. Update the legacy admin `assignEditor` wrapper so it grants chapter access through `chapter_role_assignment` and `chapter_permission_grant` instead of overwriting `chapter_membership.position`.

## User Story

As a platform operator  
I want legacy chapter editors migrated into the new scoped role model  
So that no current chapter operator loses access while new chapter access stops depending on `chapter_membership.position = 'editor'`.

## Metadata

| Field | Value |
|-------|-------|
| Type | MIGRATION / BACKEND |
| Complexity | MEDIUM |
| Systems Affected | Supabase migration, seed data, admin service, tests |
| GitHub Issue | #200 |

---

## Patterns to Follow

### Legacy Admin Wrapper

```ts
// SOURCE: lib/services/admin.service.ts:2152
async assignEditor(
  supabase: SupabaseClient<Database>,
  userId: string,
  chapter_id: string,
  issuedById?: string
): Promise<ActionResult> {
```

### Role Assignment Service

```ts
// SOURCE: lib/services/chapter-role-assignment.service.ts:244
const grantResult = await ChapterPermissionService.grantRoleTemplatePermissions(supabase, {
  userId: params.targetUserId,
  chapterId: params.chapterId,
  roleLevel: params.roleLevel,
  grantedById: params.actorUserId,
  source: 'role_template',
  sourceRoleAssignmentId: createdRole.id,
})
```

### Idempotent Backfill

```sql
-- SOURCE: supabase/migrations/20260522161000_add_chapter_role_assignment_permission_grant.sql:159
CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_permission_active_unique
  ON public.chapter_permission_grant(user_id, chapter_id, permission_key)
  WHERE revoked_at IS NULL;
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260522163000_backfill_legacy_editor_permissions.sql` | CREATE | Backfill legacy editors into `chief_of_staff` role assignments and migration-sourced grants idempotently. |
| `supabase/seed.sql` | UPDATE | Keep seeded `editor@test.com` compatible after reset because seed runs after migrations. |
| `lib/services/admin.service.ts` | UPDATE | Stop overwriting `chapter_membership.position`; delegate role/grant creation to `ChapterRoleAssignmentService`. |
| `lib/services/__tests__/admin.service.test.ts` | UPDATE | Assert `assignEditor` does not update membership position or global role and does create role assignment/identity. |
| `.github/reports/issue-200-backfill-legacy-editor-access-and-stop-overwriting-membership-position-report.md` | CREATE | Capture implementation and validation evidence. |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Add Idempotent Legacy Editor Backfill Migration

Status: Completed

- **File**: `supabase/migrations/20260522163000_backfill_legacy_editor_permissions.sql`
- **Action**: CREATE
- **Implement**: For approved chapter memberships where `user.role = 'editor'`, insert active primary `chief_of_staff` role assignments if none exist, then insert missing active permission grants using the chief-of-staff launch template.
- **Mirror**: role/permission constraints from `20260522161000_add_chapter_role_assignment_permission_grant.sql`.
- **Validate**: `pnpm run supabase:reset` and SQL counts for seeded editor grants.

### Task 2: Update Seed Compatibility

Status: Completed

- **File**: `supabase/seed.sql`
- **Action**: UPDATE
- **Implement**: Add the same idempotent role/grant seed block for `editor@test.com`, because seed rows are inserted after migrations run in local reset.
- **Mirror**: migration SQL.
- **Validate**: Supabase reset shows seeded editor has role assignment and grants.

### Task 3: Update Admin Assign Editor Wrapper

Status: Completed

- **File**: `lib/services/admin.service.ts`
- **Action**: UPDATE
- **Implement**: Keep approved membership eligibility check, call `ChapterRoleAssignmentService.assignChapterRole` with the legacy `chief_of_staff` compatibility role, and stop updating `chapter_membership.position` or `public.user.role`.
- **Mirror**: `ChapterRoleAssignmentService.assignChapterRole`.
- **Validate**: Admin service tests cover no membership/global-role overwrite.

### Task 4: Update Tests

Status: Completed

- **File**: `lib/services/__tests__/admin.service.test.ts`
- **Action**: UPDATE
- **Implement**: Mock role assignment service and update `assignEditor` expectations for compatibility grants and identity issuance.
- **Mirror**: existing admin service mock patterns.
- **Validate**: `pnpm test -- lib/services/__tests__/admin.service.test.ts`

### Task 5: Update GitHub Issue

Status: Completed

- **File**: GitHub issue #200
- **Action**: UPDATE
- **Implement**: Add plan link, implementation report link, validation results, and move issue to review.
- **Validate**: `gh issue view 200 --json labels,comments,title`

---

## Validation

```bash
pnpm run supabase:reset
pnpm run types:generate
pnpm test -- lib/services/__tests__/admin.service.test.ts
pnpm lint
pnpm exec tsc --noEmit
pnpm test
```

---

## Acceptance Criteria

- [x] Existing approved legacy editors are backfilled into role assignments and permission grants.
- [x] `assignEditor` no longer overwrites `chapter_membership.position`.
- [x] Legacy editor compatibility remains through either `user.role = editor` for existing users or explicit grants for newly assigned users.
- [x] Backfill is idempotent and does not create duplicate active assignments or grants.
- [x] Tests/dry-run validation show legacy and new models preserve operator access.
