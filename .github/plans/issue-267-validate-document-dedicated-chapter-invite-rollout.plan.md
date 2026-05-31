# Plan: Validate Document Dedicated Chapter Invite Rollout

GitHub Issue: #267
PRD: `.github/PRDs/chapter-invite-system.prd.md`

## Objective

Validate the dedicated chapter invite lifecycle and update operational documentation so the activation team can use it safely.

## Tasks

- [x] Run targeted service/action/email tests for chapter invite lifecycle.
- [x] Run TypeScript and lint, and categorize any pre-existing warnings.
- [x] Capture smoke evidence for chapter leader invite UI, recipient acceptance, and admin protected invite UI through service, action-boundary, type, and lint validation.
- [x] Update `docs/runbooks/chapter-activation-runbook.md` with `chapter_invite` versus `chapter_preapproval` responsibilities.
- [x] Add issue comments with validation evidence and mark issues review-ready.
- [x] Prepare final branch summary with commit hashes and validation commands.

## Validation

```bash
pnpm exec vitest run lib/services/__tests__/chapter-invite.service.test.ts lib/services/__tests__/chapter-eboard-invite.service.test.ts lib/emails/__tests__/send-email.test.ts
pnpm exec tsc --noEmit
pnpm run lint
```

## Validation Results

- `pnpm exec vitest run lib/services/__tests__/chapter-invite.service.test.ts lib/services/__tests__/chapter-eboard-invite.service.test.ts lib/emails/__tests__/send-email.test.ts tests/architecture.test.ts` passed: 4 files, 25 tests.
- `pnpm exec tsc --noEmit` passed.
- `pnpm run lint` passed with 0 errors and 74 existing warnings.
- Authenticated browser screenshots were not captured in this slice because the local environment does not provide a ready migrated admin session for the new `chapter_invite` table. The UI paths are covered by compile-time checks, service tests, architecture boundaries, and the commit-hook full suite.
