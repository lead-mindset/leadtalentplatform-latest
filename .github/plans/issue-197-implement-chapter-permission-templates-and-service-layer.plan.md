# Plan: Implement Chapter Permission Templates And Service Layer

## Summary

Create the canonical service-layer API for chapter-scoped permissions. The service will expose launch role templates, permission checks with admin bypass and recruiter exclusion, grant/revoke helpers, and a permission-set reader for future actions and route guards.

## User Story

As a chapter platform engineer  
I want a tested service for chapter permission templates and grants  
So that dashboard, members, event, preapproval, and role-assignment flows can authorize users without relying on the legacy global `editor` role.

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY / BACKEND |
| Complexity | MEDIUM |
| Systems Affected | Services, permissions, Supabase access, tests |
| GitHub Issue | #197 |

---

## Patterns to Follow

### Service Export Pattern

```ts
// SOURCE: lib/services/chapter-membership.service.ts:113
export const ChapterMembershipService = {
  async applyToChapter(
    supabase: SupabaseClient<Database>,
    params: ApplyToChapterParams
  ): Promise<ActionResult> {
```

### Result Object Pattern

```ts
// SOURCE: lib/services/chapter-membership.service.ts:279
if (!canManage) {
  return { success: false, error: 'Only admins and same-chapter editors can approve memberships.' }
}
```

### Supabase Table Access Pattern

```ts
// SOURCE: lib/services/lead-identity.service.ts:75
const { data: existing, error: existingError } = await existingQuery.maybeSingle()
if (existingError) {
  logger.error({ context: 'lead-identity/issue', error: existingError }, 'Failed to find existing identity')
  return { success: false, error: 'Failed to issue LEAD identity.' }
}
```

### Service Test Mock Pattern

```ts
// SOURCE: lib/services/__tests__/lead-identity.service.test.ts:7
const buildMockSupabase = () => {
  const createBuilder = () => {
    const valueQueue: unknown[] = []
```

### Permission Tables

```ts
// SOURCE: lib/database.generated.ts:184
chapter_permission_grant: {
  Row: {
    chapter_id: string
    permission_key: string
    revoked_at: string | null
    source_role_assignment_id: string | null
    user_id: string
  }
}
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/services/chapter-permission.service.ts` | CREATE | Add permission constants, role templates, checks, grant, revoke, and set-reading helpers. |
| `lib/services/__tests__/chapter-permission.service.test.ts` | CREATE | Cover templates, admin bypass, recruiter/member denial, grant creation idempotency, and revoke behavior. |
| `.github/reports/issue-197-implement-chapter-permission-templates-and-service-layer-report.md` | CREATE | Capture implementation and validation evidence. |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Define Permission Types And Templates

Status: Completed

- **File**: `lib/services/chapter-permission.service.ts`
- **Action**: CREATE
- **Implement**: Export `CHAPTER_PERMISSION_KEYS`, `CHAPTER_ROLE_PERMISSION_TEMPLATES`, `ChapterPermissionKey`, and `ChapterRoleLevel`. President and VP templates include all launch permissions; chief of staff excludes active member revoke and e-board assignment; regular e-board roles include dashboard, approved/alumni/contact member visibility, event manage, registrations, and check-in.
- **Mirror**: `docs/adr/004-chapter-scoped-roles-permissions.md` launch permission model.
- **Validate**: Service tests assert template boundaries.

### Task 2: Add Permission Check Helpers

Status: Completed

- **File**: `lib/services/chapter-permission.service.ts`
- **Action**: UPDATE
- **Implement**: Add `hasChapterPermission`, `requireChapterPermission`, and `getChapterPermissionSet`. Checks must allow admin, deny recruiters, require approved same-chapter membership for non-admins, and require active unrevoked grant.
- **Mirror**: `lib/services/chapter-membership.service.ts:85` for chapter manager checks, but use `chapter_permission_grant` instead of `user.role = editor`.
- **Validate**: Tests cover admin bypass, approved member with grant, approved member without grant, recruiter, revoked grants.

### Task 3: Add Grant Helper

Status: Completed

- **File**: `lib/services/chapter-permission.service.ts`
- **Action**: UPDATE
- **Implement**: Add `grantRoleTemplatePermissions` that inserts missing active grants for a role template, skips already-active grants, and returns granted permission keys. Support `source`, `grantedById`, and optional `sourceRoleAssignmentId`.
- **Mirror**: Result-object pattern from `ChapterMembershipService`.
- **Validate**: Tests confirm idempotent active grant behavior and correct insert payloads.

### Task 4: Add Revoke Helper

Status: Completed

- **File**: `lib/services/chapter-permission.service.ts`
- **Action**: UPDATE
- **Implement**: Add `revokeChapterPermissions` that marks matching active grants revoked with `revoked_at`, `revoked_by_id`, and required `revoke_reason`. Support revoking by permission keys and/or `sourceRoleAssignmentId`.
- **Mirror**: Existing update/query chain style in services.
- **Validate**: Tests confirm revoke reason is required and update filters target only active grants.

### Task 5: Add Service Tests

Status: Completed

- **File**: `lib/services/__tests__/chapter-permission.service.test.ts`
- **Action**: CREATE
- **Implement**: Mock Supabase table chains and cover the acceptance criteria without relying on `user.role = editor`.
- **Mirror**: `lib/services/__tests__/lead-identity.service.test.ts:7`.
- **Validate**: `pnpm test -- lib/services/__tests__/chapter-permission.service.test.ts`

### Task 6: Update GitHub Issue

Status: Completed

- **File**: GitHub issue #197
- **Action**: UPDATE
- **Implement**: Add plan link, implementation report link, validation results, and move issue to review.
- **Validate**: `gh issue view 197 --json labels,comments,title`

---

## Validation

```bash
pnpm test -- lib/services/__tests__/chapter-permission.service.test.ts
pnpm lint
pnpm exec tsc --noEmit
pnpm test
```

---

## Acceptance Criteria

- [x] `hasChapterPermission(userId, chapterId, permissionKey)` handles active grants, admin bypass, recruiter denial, and approved membership.
- [x] President and vice president templates include dashboard, member, applicant, revoke, e-board assignment, event management, registration, check-in, and archive permissions.
- [x] Chief of staff template includes applicant and event archive permissions, but excludes active member revoke and e-board assignment.
- [x] Regular e-board templates include dashboard, approved/alumni/contact member visibility, event management, registration view, and check-in.
- [x] Grant and revoke flows are covered by service tests without relying on `user.role = editor`.
