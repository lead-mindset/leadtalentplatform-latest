# Plan: Implement Chapter Role Assignment Service Rules

## Summary

Create the service-layer API for official chapter e-board role assignment and deactivation. The service will enforce launch rules: only admin can assign president/vice president; president/VP capability can assign regular e-board roles to approved same-chapter members; deactivation revokes role-linked permissions without changing `chapter_membership`.

## User Story

As a chapter president, vice president, or platform admin  
I want official e-board role assignments managed through one backend service  
So that chapter structure, product permissions, and membership status stay consistent and auditable.

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY / BACKEND |
| Complexity | MEDIUM |
| Systems Affected | Services, permissions, role assignment, tests |
| GitHub Issue | #199 |

---

## Patterns to Follow

### Permission Service Integration

```ts
// SOURCE: lib/services/chapter-permission.service.ts:246
const templatePermissions = this.getTemplatePermissions(params.roleLevel)
if (templatePermissions.length === 0) return { success: true, grantedPermissions: [] }
```

### Result Object Pattern

```ts
// SOURCE: lib/services/chapter-membership.service.ts:289
if (!canManage) {
  return { success: false, error: 'Only admins and same-chapter editors can approve memberships.' }
}
```

### Role Assignment Table Shape

```ts
// SOURCE: lib/database.generated.ts:360
chapter_role_assignment: {
  Row: {
    role_level: string
    functional_area: string
    display_title: string
    status: string
  }
}
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/services/chapter-role-assignment.service.ts` | CREATE | Add assignment authorization, one-primary-role handling, role creation, permission grants, and deactivation/revoke behavior. |
| `lib/services/__tests__/chapter-role-assignment.service.test.ts` | CREATE | Cover admin assignment, president/VP regular assignment, protected-role rejection, target membership checks, one-primary-role behavior, and deactivation permission revocation. |
| `.github/reports/issue-199-implement-chapter-role-assignment-service-rules-report.md` | CREATE | Capture implementation and validation evidence. |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Add Role Assignment Service Contract

Status: Completed

- **File**: `lib/services/chapter-role-assignment.service.ts`
- **Action**: CREATE
- **Implement**: Export `ChapterRoleAssignmentService`, role/functional-area types, assignment and deactivation parameter/result types, and shared protected-role helpers.
- **Mirror**: service object pattern in `lib/services/chapter-membership.service.ts`.
- **Validate**: Typecheck and unit tests import the service.

### Task 2: Implement Assignment Authorization

Status: Completed

- **File**: `lib/services/chapter-role-assignment.service.ts`
- **Action**: UPDATE
- **Implement**: Admin may assign any official role. Non-admins must have `chapter.roles.assign_eboard` for the chapter and cannot assign `president` or `vice_president`.
- **Mirror**: `ChapterPermissionService.hasChapterPermission`.
- **Validate**: Tests cover admin president assignment, president/VP regular assignment, protected-role rejection, and no-permission rejection.

### Task 3: Implement Approved-Member And One-Primary Checks

Status: Completed

- **File**: `lib/services/chapter-role-assignment.service.ts`
- **Action**: UPDATE
- **Implement**: Require target user to have approved same-chapter membership. Deactivate any existing active primary role before inserting a new primary assignment.
- **Mirror**: `chapter_role_assignment` unique active primary constraint from migration.
- **Validate**: Tests cover target membership rejection and one-primary-role update before insert.

### Task 4: Insert Assignment And Grant Permissions

Status: Completed

- **File**: `lib/services/chapter-role-assignment.service.ts`
- **Action**: UPDATE
- **Implement**: Insert active primary `chapter_role_assignment` with normalized fields, then grant role-template permissions linked by `sourceRoleAssignmentId`.
- **Mirror**: `ChapterPermissionService.grantRoleTemplatePermissions`.
- **Validate**: Tests assert insert payload and permission service call.

### Task 5: Deactivate Assignment And Revoke Permissions

Status: Completed

- **File**: `lib/services/chapter-role-assignment.service.ts`
- **Action**: UPDATE
- **Implement**: Deactivate active role assignment with `ends_at`, then revoke active permission grants by `sourceRoleAssignmentId`; do not update `chapter_membership`.
- **Mirror**: `ChapterPermissionService.revokeChapterPermissions`.
- **Validate**: Tests cover regular deactivation, protected-role deactivation rejection, reason requirement, and membership untouched.

### Task 6: Update GitHub Issue

Status: Completed

- **File**: GitHub issue #199
- **Action**: UPDATE
- **Implement**: Add plan link, implementation report link, validation results, and move issue to review.
- **Validate**: `gh issue view 199 --json labels,comments,title`

---

## Validation

```bash
pnpm test -- lib/services/__tests__/chapter-role-assignment.service.test.ts
pnpm lint
pnpm exec tsc --noEmit
pnpm test
```

---

## Acceptance Criteria

- [x] Admin assignment of president or vice president creates role assignment and permission grants.
- [x] President/VP-capable users can assign regular e-board roles to approved same-chapter members.
- [x] President/VP-capable users cannot assign president or vice president status.
- [x] Deactivation revokes linked e-board permissions and does not remove approved membership.
- [x] Tests cover assignment, rejection, deactivation, one-primary-role, and cross-chapter boundaries.
