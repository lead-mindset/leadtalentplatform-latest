# Issue #267 Report: Validate And Document Dedicated Chapter Invite Rollout

## Summary

Updated the chapter activation runbook and validated the dedicated invite rollout across the shared invite service, chapter e-board wrapper, email link generation, architecture boundary rules, TypeScript, and lint.

## Documentation Updates

- Documented `chapter_invite` as the active link-based invite lifecycle for:
  - admin-created President/VP invites,
  - chapter leader-created regular e-board invites,
  - 30-day re-invite behavior.
- Clarified that `chapter_preapproval` remains for bulk, admin-loaded, verified activation lists that do not need per-recipient app links.
- Updated the activation flow so invite recipients accept `/chapter/invites/accept?token=...` after signing in with the invited email.
- Added support and rollback guidance for revoking unclaimed dedicated invites.
- Updated pilot readiness checks for admin President/VP invites, chapter leader regular e-board invites, and expired invite re-invite testing.

## Validation

```bash
pnpm exec vitest run lib/services/__tests__/chapter-invite.service.test.ts lib/services/__tests__/chapter-eboard-invite.service.test.ts lib/emails/__tests__/send-email.test.ts tests/architecture.test.ts
pnpm exec tsc --noEmit
pnpm run lint
```

Results:

- Targeted lifecycle, wrapper, email, and architecture tests passed: 4 files, 25 tests.
- TypeScript passed.
- Lint passed with 0 errors and 74 existing warnings.

## Screenshot Note

Authenticated screenshots were not captured because this local slice does not have a ready migrated admin session for the new `chapter_invite` table. The validation evidence for this issue is code-path based: service tests, email URL tests, action-boundary architecture tests, TypeScript, lint, and the full commit-hook test suite from the implementation commits.
