# Plan: Validate Document Dedicated Chapter Invite Rollout

GitHub Issue: #267
PRD: `.github/PRDs/chapter-invite-system.prd.md`

## Objective

Validate the dedicated chapter invite lifecycle and update operational documentation so the activation team can use it safely.

## Tasks

- [ ] Run targeted service/action/email tests for chapter invite lifecycle.
- [ ] Run TypeScript and lint, and categorize any pre-existing warnings.
- [ ] Capture browser screenshots or smoke evidence for chapter leader invite UI, recipient acceptance, and admin protected invite UI.
- [ ] Update `docs/runbooks/chapter-activation-runbook.md` with `chapter_invite` versus `chapter_preapproval` responsibilities.
- [ ] Add issue comments with validation evidence and mark issues review-ready.
- [ ] Prepare final branch summary with commit hashes and validation commands.

## Validation

```bash
pnpm exec vitest run lib/services/__tests__/chapter-invite.service.test.ts lib/services/__tests__/chapter-eboard-invite.service.test.ts lib/emails/__tests__/send-email.test.ts
pnpm exec tsc --noEmit
pnpm run lint
```
