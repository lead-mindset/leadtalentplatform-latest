# Plan: Issue #208 - Enforce Student Workspace Role Boundaries

GitHub Issue: #208
Source PRD: `.github/PRDs/launch-user-flow-qa-fixes.prd.md`
Type: Bug / Authorization
Complexity: Medium

## Summary

Authenticated recruiters and admins can currently render `/student/*` routes directly because `app/[locale]/student/layout.tsx` only calls `requireUser`. Add an explicit role boundary so student pages remain for participant/member/alumni/editor-style users, while recruiters go to company and admins/staff go to admin.

## Implementation Status

- [x] Task 1: Add a tested student-workspace redirect helper.
- [x] Task 2: Wire the student layout to redirect workspace roles.
- [x] Task 3: Validate targeted helper tests and full repo checks.

## Patterns To Follow

| Category | File | Pattern |
| --- | --- | --- |
| Route guard | `app/[locale]/chapter/layout.tsx` | Server layout performs access checks before rendering workspace UI. |
| Redirect mapping | `lib/auth-redirects.ts` | Centralized role-to-workspace helpers are tested in Vitest. |
| Tests | `lib/auth-redirects.test.ts` | Table-style expectations for role redirect behavior. |

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `lib/auth-redirects.ts` | Update | Add `getStudentWorkspaceRedirectPath`. |
| `lib/auth-redirects.test.ts` | Update | Cover recruiter/admin redirects and allowed student roles. |
| `app/[locale]/student/layout.tsx` | Update | Redirect recruiter/admin roles before student data rendering. |

## Tasks

### Task 1: Add Student Workspace Boundary Helper

- Return `/company` for `recruiter`.
- Return `/admin` for `admin`.
- Return `null` for `member` and `editor`.
- Return `/auth/error` for unknown non-null roles.

### Task 2: Apply Guard In Student Layout

- Call the helper immediately after `requireUser`.
- `redirect(path)` before loading student/chapter sidebar data.
- Preserve anonymous login behavior through `requireUser`.

### Task 3: Validate

```bash
pnpm exec vitest run lib/auth-redirects.test.ts
pnpm run lint
pnpm exec tsc --noEmit
pnpm test
```

## Acceptance Criteria Mapping

- Recruiters no longer render `/student/*`.
- Admin/staff no longer render `/student/*`.
- Participant/member/alumni accounts keep student access.
- The boundary is covered by a deterministic helper test.
