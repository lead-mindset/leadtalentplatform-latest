# Plan: Admin Protected Leadership Invites From Chapter Detail

GitHub Issue: #266
PRD: `.github/PRDs/chapter-invite-system.prd.md`

## Objective

Add admin-only President and Vice President invites from the admin chapter detail page using the shared `chapter_invite` model.

## Tasks

- [x] Extend admin chapter data loading to include active protected role assignments and pending/expired protected invites.
- [x] Add admin server actions for protected leadership invite create/revoke/reinvite.
- [x] Add a chapter detail panel for current President/VP, pending protected invites, and conflict states.
- [x] Enforce one President and one Vice President through the service and UI messaging.
- [x] Add service/action/UI tests for protected invite constraints.
- [x] Validate targeted tests, TypeScript, lint, and architecture boundaries.

## Validation

```bash
pnpm exec vitest run lib/services/__tests__/chapter-invite.service.test.ts
pnpm exec tsc --noEmit
pnpm run lint
```

## Validation Results

- `pnpm exec vitest run lib/services/__tests__/chapter-invite.service.test.ts lib/emails/__tests__/send-email.test.ts` passed: 2 files, 12 tests.
- `pnpm exec vitest run tests/architecture.test.ts lib/services/__tests__/chapter-invite.service.test.ts` passed: 2 files, 16 tests.
- `pnpm exec tsc --noEmit` passed.
- `pnpm run lint` passed with 0 errors and 74 existing warnings.
