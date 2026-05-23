# Issue #200 Report: Backfill Legacy Editor Access And Stop Overwriting Membership Position

## Summary

Completed the legacy editor compatibility migration into the chapter-scoped role and permission model. Existing approved legacy editors now receive a `chief_of_staff` role assignment and active permission grants, while `AdminService.assignEditor` no longer overwrites `chapter_membership.position` or promotes `public.user.role`.

## Changes

- Added `supabase/migrations/20260522163000_backfill_legacy_editor_permissions.sql`.
- Updated `supabase/seed.sql` so seeded `editor@test.com` receives the same compatibility assignment/grants after local reset.
- Updated `lib/services/admin.service.ts` to delegate chapter editor compatibility access to `ChapterRoleAssignmentService.assignChapterRole`.
- Updated `lib/services/__tests__/admin.service.test.ts` to mock the role assignment service and assert that membership position/global role are not overwritten.

## Verification

- `pnpm run supabase:reset` reached migrations and seed; the CLI hit a local 502 while restarting containers, then `supabase stop; supabase start` recovered the stack.
- SQL smoke check confirmed `editor@test.com` has `role_level = chief_of_staff`, `functional_area = strategy_operations`, `display_title = Legacy Chapter Editor`, and `active_grants = 12`.
- `pnpm run types:generate` passed.
- `pnpm test -- lib/services/__tests__/admin.service.test.ts` passed: 41 tests.
- `pnpm lint` passed with the existing 81 warnings and 0 errors.
- `pnpm exec tsc --noEmit` passed.
- `pnpm test` passed: 20 files, 297 tests.

## Notes

- Legacy users may still retain `public.user.role = editor` as compatibility data, but new `assignEditor` calls now grant scoped access through `chapter_role_assignment` and `chapter_permission_grant`.
- The backfill maps legacy editors to `chief_of_staff`, preserving chapter operations without granting new president/VP-only powers such as e-board assignment or member revocation.
