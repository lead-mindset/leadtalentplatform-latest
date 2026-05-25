# Plan: Update Member Roster Visibility And Action Authorization

## Summary

Update chapter member management so roster visibility and actions follow scoped chapter permissions. Regular official e-board users can see approved members, alumni, and contact info. Applicant/rejected/inactive views and approve/reject actions require `chapter.members.manage_applications`. Revoking active membership requires `chapter.members.revoke`, a reason, an inactive membership state, and a chapter audit log entry.

## User Story

As a chapter e-board member  
I want roster visibility and member actions to match my chapter responsibility  
So that member data is transparent to the official e-board while sensitive lifecycle decisions stay controlled.

## Metadata

| Field | Value |
|-------|-------|
| Type | FRONTEND / BACKEND |
| Complexity | MEDIUM |
| Systems Affected | Supabase enum, chapter services, server actions, chapter members UI, tests |
| GitHub Issue | #202 |

---

## Patterns to Follow

### Permission Templates

```ts
// SOURCE: lib/services/chapter-permission.service.ts
'chapter.members.view_approved',
'chapter.members.view_alumni',
'chapter.members.view_member_contact',
'chapter.members.view_applicants',
'chapter.members.manage_applications',
'chapter.members.revoke',
```

### Existing Thin Action Boundary

```ts
// SOURCE: lib/actions/chapter/check-students.ts
const auth = await assertCanManageMember(parsed.data)
if (!auth.success) return auth

const result = await ChapterService.approveMember(...)
```

### Existing Roster UI Flow

```tsx
// SOURCE: app/[locale]/chapter/members/page.tsx
const allMembers = await getChapterMembers(chapter_id)
const stats = getMemberStats(allMembers)
const displayMembers = filterMembers(allMembers, safeStatus)
```

### Audit Table

```sql
-- SOURCE: supabase/migrations/20260522162000_add_chapter_audit_log_permission_helper.sql
CREATE TABLE IF NOT EXISTS public.chapter_audit_log (
  action text NOT NULL,
  actor_user_id uuid REFERENCES public."user"(id),
  target_user_id uuid REFERENCES public."user"(id),
  chapter_id text REFERENCES public.chapter(id),
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260522164000_add_inactive_membership_status.sql` | CREATE | Add `inactive` membership status for revoked active members. |
| `supabase/migrations/20260522164100_allow_revoke_permission_audit_insert.sql` | CREATE | Allow chapter users with `chapter.members.revoke` to insert revocation audit logs. |
| `lib/database.generated.ts` | UPDATE | Regenerate enum types after migration. |
| `lib/services/chapter-membership.service.ts` | UPDATE | Use scoped permission checks for approve/reject and add revoke-with-reason/audit service logic. |
| `lib/services/chapter.service.ts` | UPDATE | Add roster permission filtering/stats support and delegate revocation to membership service. |
| `lib/actions/chapter/get-data.ts` | UPDATE | Authorize/filter direct roster reads by scoped permissions. |
| `lib/actions/chapter/check-students.ts` | UPDATE | Authorize approve/reject/revoke through permission grants and require revoke reason. |
| `app/[locale]/chapter/members/page.tsx` | UPDATE | Render only permitted statuses/counts and pass action permissions to children. |
| `app/[locale]/chapter/members/components/member-tabs.tsx` | UPDATE | Support permission-filtered tabs and inactive status. |
| `app/[locale]/chapter/members/components/members-list.tsx` | UPDATE | Hide bulk approval unless application management is allowed. |
| `app/[locale]/chapter/members/components/member-card.tsx` | UPDATE | Hide action buttons based on permissions. |
| `app/[locale]/chapter/members/components/member-actions.tsx` | UPDATE | Require a reason before revocation. |
| `lib/services/__tests__/chapter-membership.service.test.ts` | UPDATE | Cover permission-based approve/reject and revoke audit behavior. |
| `lib/services/__tests__/chapter.service.test.ts` | UPDATE | Cover roster filtering and revoked inactive state delegation. |
| `.github/reports/issue-202-update-member-roster-visibility-and-action-authorization-report.md` | CREATE | Capture implementation and validation evidence. |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Add Inactive Membership State

Status: Completed

- **File**: `supabase/migrations/20260522164000_add_inactive_membership_status.sql`, `supabase/migrations/20260522164100_allow_revoke_permission_audit_insert.sql`, `lib/database.generated.ts`
- **Action**: CREATE / UPDATE
- **Implement**: Add `inactive` to `membership_status`, add scoped audit insert RLS for revocation, reset local DB, regenerate types.
- **Mirror**: `supabase/migrations/20260503002000_chapter_membership_foundation.sql`.
- **Validate**: `pnpm run supabase:reset`, `pnpm run types:generate`.

### Task 2: Update Service Authorization And Revocation

Status: Completed

- **File**: `lib/services/chapter-membership.service.ts`, `lib/services/chapter.service.ts`
- **Action**: UPDATE
- **Implement**: Replace editor-position management checks with scoped permission checks, add required reason revocation that sets status `inactive`, clears active identifiers, and inserts `chapter_audit_log`.
- **Mirror**: `ChapterPermissionService.hasChapterPermission`.
- **Validate**: `pnpm test -- lib/services/__tests__/chapter-membership.service.test.ts lib/services/__tests__/chapter.service.test.ts`.

### Task 3: Update Server Actions

Status: Completed

- **File**: `lib/actions/chapter/check-students.ts`, `lib/actions/chapter/get-data.ts`
- **Action**: UPDATE
- **Implement**: Gate approve/reject/bulk through `chapter.members.manage_applications`, revoke through `chapter.members.revoke`, and filter direct roster reads by permission.
- **Mirror**: `requireUser`, `getApprovedChapterMembership`, and `ChapterPermissionService.getChapterPermissionSet`.
- **Validate**: focused service/action tests and TypeScript.

### Task 4: Update Members UI

Status: Completed

- **File**: `app/[locale]/chapter/members/*`
- **Action**: UPDATE
- **Implement**: Render tabs, summary counts, bulk approval, and row actions only when viewer permissions allow them; require revoke reason in the client before calling the action.
- **Mirror**: existing members page/list/card component split.
- **Validate**: `pnpm lint`, `pnpm exec tsc --noEmit`.

### Task 5: Full Validation And GitHub Update

Status: Completed

- **File**: GitHub issue #202 and local report
- **Action**: UPDATE
- **Implement**: Run full validation, update plan/report, and move issue to review.
- **Validate**: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `gh issue view 202 --json labels,comments,title`.

---

## Validation

```bash
pnpm run supabase:reset
pnpm run types:generate
pnpm test -- lib/services/__tests__/chapter-membership.service.test.ts lib/services/__tests__/chapter.service.test.ts
pnpm lint
pnpm exec tsc --noEmit
pnpm test
```

---

## Acceptance Criteria

- [x] Regular official e-board users can see approved members, alumni, and approved member contact info.
- [x] Regular official e-board users cannot see or execute pending, rejected, or inactive workflows.
- [x] President, VP, chief of staff, or admin users with `chapter.members.manage_applications` can view and approve/reject pending applicants.
- [x] President, VP, or admin users with `chapter.members.revoke` must provide a reason to revoke active membership; the membership becomes inactive and an audit record is created.
- [x] Hidden UI actions are also rejected by backend permission checks when called directly.
