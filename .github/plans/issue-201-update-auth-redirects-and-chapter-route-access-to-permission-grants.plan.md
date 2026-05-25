# Plan: Update Auth Redirects And Chapter Route Access To Permission Grants

## Summary

Move chapter dashboard routing and route guards from global `user.role = 'editor'` checks to the chapter-scoped permission model. The implementation will keep admin and recruiter lanes explicitly role-based, while allowing approved e-board users who remain `public.user.role = 'member'` to land in and access chapter operations when they have `chapter.dashboard.access`.

## User Story

As a chapter e-board user  
I want chapter dashboard access to come from my approved chapter permissions  
So that presidents, VPs, and e-board members can use chapter operations without being promoted to a global editor role.

## Metadata

| Field | Value |
|-------|-------|
| Type | AUTH / ROUTING |
| Complexity | MEDIUM |
| Systems Affected | Auth helpers, auth callback, onboarding redirect, chapter/student layouts, sidebar navigation, tests |
| GitHub Issue | #201 |

---

## Patterns to Follow

### Existing Auth Guard Shape

```ts
// SOURCE: lib/auth.ts
export async function requireChapterMember(): Promise<{
  supabase: SupabaseClient<Database>
  user: UserRow
  chapter_id: string
}> {
  const { supabase, user } = await requireUser()
  ...
}
```

### Existing Redirect Helper

```ts
// SOURCE: lib/auth-redirects.ts
export function getPostAuthRedirectPath({
  hasProfile,
  role,
}: {
  hasProfile: boolean
  role: Role | null | undefined
}) {
```

### Permission Service

```ts
// SOURCE: lib/services/chapter-permission.service.ts
async hasChapterPermission(
  supabase: SupabaseClient<Database>,
  params: PermissionCheckParams
): Promise<boolean> {
```

### Onboarding Activation Result

```ts
// SOURCE: lib/services/chapter-preapproval.service.ts
return {
  success: true,
  activated: true,
  chapterId: preapproval.chapter_id,
  preapprovalType: preapproval.preapproval_type,
  grantedPermissions,
}
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/auth.ts` | UPDATE | Add permission-aware chapter dashboard helpers and use them in chapter route/event guards. |
| `lib/auth-redirects.ts` | UPDATE | Add an async post-auth resolver that sends permitted e-board members to `/chapter`. |
| `app/[locale]/auth/callback/route.ts` | UPDATE | Use the async redirect resolver after sign-in. |
| `lib/actions/student/onboarding.helpers.ts` | UPDATE | Return preapproval activation metadata so onboarding can route e-board users correctly. |
| `lib/actions/student/onboarding.ts` | UPDATE | Redirect preapproved e-board users with dashboard permission to `/chapter`. |
| `components/ui/sidebars/student-sidebar.tsx` | UPDATE | Show chapter navigation based on a `canManageChapter` boolean instead of global editor role. |
| `app/[locale]/student/layout.tsx` | UPDATE | Compute sidebar chapter visibility from scoped dashboard permission. |
| `app/[locale]/chapter/layout.tsx` | UPDATE | Pass scoped chapter access state to navigation. |
| `lib/auth.test.ts` | UPDATE | Cover permission-aware chapter and event access for member-role e-board users. |
| `lib/auth-redirects.test.ts` | UPDATE | Cover post-auth redirects for permitted e-board vs regular members. |
| `lib/actions/student/__tests__/onboarding.helpers.test.ts` | UPDATE | Cover returned activation metadata for e-board onboarding. |
| `.github/reports/issue-201-update-auth-redirects-and-chapter-route-access-to-permission-grants-report.md` | CREATE | Capture implementation and validation evidence. |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Add Permission-Aware Auth Helpers

Status: Completed

- **File**: `lib/auth.ts`
- **Action**: UPDATE
- **Implement**: Add a reusable `getChapterDashboardMembership` helper that returns approved membership only when the user has `chapter.dashboard.access`, and use it in `requireChapterMember`, `requireChapterEditor`, `canUserAccessChapter`, and `canUserManageEvent` while preserving explicit admin/recruiter behavior.
- **Mirror**: `getApprovedChapterMembership` and `ChapterPermissionService.hasChapterPermission`.
- **Validate**: `pnpm test -- lib/auth.test.ts`

### Task 2: Update Sign-In Redirects

Status: Completed

- **File**: `lib/auth-redirects.ts`, `app/[locale]/auth/callback/route.ts`
- **Action**: UPDATE
- **Implement**: Keep the pure role fallback, add an async resolver that checks `chapter.dashboard.access` for profiled member/editor users, and route permitted users to `/chapter`.
- **Mirror**: current locale-preserving callback redirect.
- **Validate**: `pnpm test -- lib/auth-redirects.test.ts`

### Task 3: Update Onboarding Redirect

Status: Completed

- **File**: `lib/actions/student/onboarding.helpers.ts`, `lib/actions/student/onboarding.ts`, `lib/actions/student/__tests__/onboarding.helpers.test.ts`
- **Action**: UPDATE
- **Implement**: Return preapproval activation metadata from `saveBasicOnboarding` and redirect to `/chapter` when activation grants `chapter.dashboard.access`; otherwise keep `/student`.
- **Mirror**: current preapproval activation flow.
- **Validate**: `pnpm test -- lib/actions/student/__tests__/onboarding.helpers.test.ts`

### Task 4: Update Sidebar Visibility

Status: Completed

- **File**: `components/ui/sidebars/student-sidebar.tsx`, `app/[locale]/student/layout.tsx`, `app/[locale]/chapter/layout.tsx`
- **Action**: UPDATE
- **Implement**: Show chapter navigation from scoped dashboard access rather than `user.role === 'editor'`.
- **Mirror**: current layout/sidebar prop flow.
- **Validate**: `pnpm lint`

### Task 5: Full Validation And GitHub Update

Status: Completed

- **File**: GitHub issue #201 and local report
- **Action**: UPDATE
- **Implement**: Run full validation, write the report, mark tasks/acceptance complete, and move issue to review.
- **Validate**: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `gh issue view 201 --json labels,comments,title`

---

## Validation

```bash
pnpm test -- lib/auth.test.ts
pnpm test -- lib/auth-redirects.test.ts
pnpm test -- lib/actions/student/__tests__/onboarding.helpers.test.ts
pnpm lint
pnpm exec tsc --noEmit
pnpm test
```

---

## Acceptance Criteria

- [x] Approved e-board users with `chapter.dashboard.access` can land in `/chapter` even when `public.user.role = 'member'`.
- [x] Approved regular members without dashboard permission land in `/student` and cannot access chapter operations.
- [x] Preapproved presidents/VPs activated through onboarding redirect to `/chapter`.
- [x] Admin access remains explicitly tied to `public.user.role = 'admin'`.
- [x] Recruiter/company access remains tied to `public.user.role = 'recruiter'` plus active `recruiter_access`.
