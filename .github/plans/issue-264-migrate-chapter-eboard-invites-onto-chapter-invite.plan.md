# Plan: Migrate Chapter Eboard Invites Onto Chapter Invite

GitHub Issue: #264
PRD: `.github/PRDs/chapter-invite-system.prd.md`

## Objective

Move the current chapter-leader regular e-board invite flow from `chapter_preapproval` to `chapter_invite` while preserving the chapter members UI and 30-day re-invite behavior.

## Tasks

- [ ] Refactor `lib/services/chapter-eboard-invite.service.ts` to delegate lifecycle operations to `ChapterInviteService`.
- [ ] Update `lib/actions/chapter/eboard-invites.ts` to use raw invite tokens returned by create/reinvite when sending email.
- [ ] Update `sendChapterEboardInviteEmail` and `ChapterEboardInviteEmail` copy to use the explicit accept route and stop promising automatic onboarding activation.
- [ ] Preserve the existing chapter members invite management UI behavior and types.
- [ ] Update e-board invite service/action/email tests.
- [ ] Validate targeted invite tests, TypeScript, and lint.

## Validation

```bash
pnpm exec vitest run lib/services/__tests__/chapter-eboard-invite.service.test.ts lib/emails/__tests__/send-email.test.ts
pnpm exec tsc --noEmit
pnpm run lint
```
