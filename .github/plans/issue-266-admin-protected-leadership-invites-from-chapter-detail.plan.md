# Plan: Admin Protected Leadership Invites From Chapter Detail

GitHub Issue: #266
PRD: `.github/PRDs/chapter-invite-system.prd.md`

## Objective

Add admin-only President and Vice President invites from the admin chapter detail page using the shared `chapter_invite` model.

## Tasks

- [ ] Extend admin chapter data loading to include active protected role assignments and pending/expired protected invites.
- [ ] Add admin server actions for protected leadership invite create/revoke/reinvite.
- [ ] Add a chapter detail panel for current President/VP, pending protected invites, and conflict states.
- [ ] Enforce one President and one Vice President through the service and UI messaging.
- [ ] Add service/action/UI tests for protected invite constraints.
- [ ] Validate targeted tests, TypeScript, lint, and browser smoke screenshots.

## Validation

```bash
pnpm exec vitest run lib/services/__tests__/chapter-invite.service.test.ts
pnpm exec tsc --noEmit
pnpm run lint
```
