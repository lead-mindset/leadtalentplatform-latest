# Issue #202 Report: Update Member Roster Visibility And Action Authorization

## Summary

Completed permission-scoped chapter member roster access and lifecycle actions. Regular e-board users now see approved members, alumni, and contact info only. Applicant/rejected/inactive workflows are hidden unless the user has the matching scoped permissions. Revoking an approved member now requires a reason, moves the membership to `inactive`, and writes a chapter audit log.

## Changes

- Added `inactive` to `membership_status`.
- Added a narrow `chapter_audit_log` insert policy for authenticated users with `chapter.members.revoke`.
- Updated membership approval/rejection services to use `ChapterPermissionService` instead of legacy same-chapter editor position checks.
- Added `revokeMembership` service logic with required reason, inactive status update, and audit insert.
- Added roster permission flags and filtering helpers.
- Updated `getChapterMembers` and recent activity reads to authorize same-chapter access and filter returned rows by permission.
- Updated chapter members UI tabs, summary counts, bulk approval, card contact info, and row actions based on permissions.
- Updated revocation UI to require a reason before submitting.

## Verification

- `pnpm run supabase:reset` passed after both #202 migrations.
- `pnpm run types:generate` passed.
- `pnpm test -- lib/services/__tests__/chapter-membership.service.test.ts lib/services/__tests__/chapter.service.test.ts` passed: 41 tests.
- `pnpm exec tsc --noEmit` passed.
- `pnpm lint` passed with the existing 81 warnings and 0 errors.
- `pnpm test` passed: 20 files, 309 tests.

## Notes

- Rejected applications are now read-only in the chapter members view. Reopening rejected applications can be added later as a distinct workflow instead of overloading membership revocation.
- The admin user detail page still uses the shared member action component, but rejected memberships are no longer treated as actionable through the revoked-membership path.
