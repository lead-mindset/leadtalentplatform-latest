# Issue #201 Report: Update Auth Redirects And Chapter Route Access To Permission Grants

## Summary

Completed chapter dashboard routing and guard updates so approved e-board users can remain `public.user.role = 'member'` while accessing chapter operations through `chapter.dashboard.access`. Admin and recruiter lanes remain explicitly role-based.

## Changes

- Added permission-aware chapter dashboard membership resolution in `lib/auth.ts`.
- Updated `requireChapterMember`, `requireChapterEditor`, `canUserAccessChapter`, and `canUserManageEvent` to use approved membership plus scoped chapter grants.
- Added `resolvePostAuthRedirectPath` in `lib/auth-redirects.ts` and wired the auth callback to route permitted e-board users to `/chapter`.
- Updated onboarding to redirect preapproved e-board activations with `chapter.dashboard.access` to `/chapter`.
- Updated student/chapter sidebar navigation to show chapter tools from scoped dashboard access instead of only `user.role = editor`.
- Added focused regression coverage for member-role e-board access, regular member denial, recruiter separation, and onboarding redirect metadata.

## Verification

- `pnpm test -- lib/auth.test.ts` passed: 18 tests.
- `pnpm test -- lib/auth-redirects.test.ts` passed: 8 tests.
- `pnpm test -- lib/actions/student/__tests__/onboarding.helpers.test.ts` passed: 10 tests.
- `pnpm lint` passed with the existing 81 warnings and 0 errors.
- `pnpm exec tsc --noEmit` passed.
- `pnpm test` passed: 20 files, 304 tests.

## Notes

- `user.role = admin` still bypasses chapter permission checks where admin-specific helpers already allowed it.
- Company representative access remains in `requireRecruiter` and `resolveRecruiterAccess`, unchanged and still based on `user.role = recruiter` plus active `recruiter_access`.
