# Plan: Explicit Recipient Chapter Invite Acceptance Flow

GitHub Issue: #265
PRD: `.github/PRDs/chapter-invite-system.prd.md`

## Objective

Add a recipient-facing `/chapter/invites/accept?token=...` flow that works for existing and new accounts and requires matching-email explicit acceptance.

## Tasks

- [ ] Add thin server actions for token validation and invite acceptance.
- [ ] Add `/[locale]/chapter/invites/accept/page.tsx` and a small client component for accept submission states.
- [ ] Show signed-out, email mismatch, missing profile, expired, revoked, already accepted, and ready-to-accept states.
- [ ] Preserve invite return path through login/signup and onboarding where needed.
- [ ] Add action/UI tests where practical and service acceptance tests in #263.
- [ ] Validate targeted tests and browser smoke screenshots.

## Validation

```bash
pnpm exec vitest run lib/services/__tests__/chapter-invite.service.test.ts
pnpm exec tsc --noEmit
pnpm run lint
```
