# Issue #266 Report: Admin Protected Leadership Invites From Chapter Detail

## Summary

Implemented admin-only President and Vice President invitations from the admin chapter detail page using the dedicated `chapter_invite` model.

## Changes

- Added `ChapterProtectedLeadershipInviteService` for protected leadership invite state, create, revoke, and re-invite operations.
- Added thin admin server actions for protected invite validation, email delivery, rollback on send failure, and page revalidation.
- Added a chapter detail panel showing active President/VP roles, pending or expired protected invites, conflict messaging, revoke, and 30-day re-invite controls.
- Fixed protected invite acceptance so an invite does not conflict with itself while the recipient accepts it.
- Added service coverage for protected invite acceptance.

## Validation

```bash
pnpm exec vitest run lib/services/__tests__/chapter-invite.service.test.ts lib/emails/__tests__/send-email.test.ts
pnpm exec vitest run tests/architecture.test.ts lib/services/__tests__/chapter-invite.service.test.ts
pnpm exec tsc --noEmit
pnpm run lint
```

Results:

- Targeted invite/email tests passed: 2 files, 12 tests.
- Architecture and invite service tests passed: 2 files, 16 tests.
- TypeScript passed.
- Lint passed with 0 errors and 74 existing warnings.

## Notes

- The UI prevents inviting a President or Vice President when that role is already active or has a non-expired pending invite.
- Expired protected invites can be re-invited, creating a new 30-day link.
- Email delivery failure revokes the just-created invite so admins do not see a dangling pending invite.
