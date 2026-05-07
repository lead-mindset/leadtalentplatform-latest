# Issue #90 Plan: Save Onboarding Chapter Intent as Pending Membership

GitHub Issue: https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/90
Source PRD: `.github/PRDs/participant-onboarding-chapter-activation.prd.md`
Source issue spec: `.github/issues/participant-onboarding-chapter-activation-issues.md`
Type: Feature
Complexity: Medium

## Problem

Issue #89 added a low-friction onboarding step where a user can say whether they are already part of a LEAD chapter, want to apply to one, or only want to attend events for now. The selected intent is currently validated and submitted, but it is not persisted as a reviewable chapter membership request.

## User Story

As a chapter-connected participant or applicant,
I want onboarding to create a pending chapter membership request when I choose a chapter path,
so that chapter editors can review me without requiring a separate application flow.

## Scope Boundary

In scope:

- Persist `already_member` as `chapter_membership.status = pending`.
- Persist `apply_to_chapter` as `chapter_membership.status = pending`.
- Skip membership creation for `events_only`.
- Reuse `ChapterMembershipService.applyToChapter`.
- Keep `position: 'member'` explicit for onboarding-created requests.
- Add onboarding helper tests for orchestration behavior.
- Comment validation results on #90.

Out of scope:

- Redirecting onboarding to `/student`; this belongs to #91.
- Building the participant activation dashboard; this belongs to #91.
- Adding a membership intent/source column.
- Distinguishing "already member" from "apply" in the database.
- Adding proof fields, auto-approval, or editor review UI.
- Adding an RPC/transaction wrapper.

## Product Decisions From Grill

- `already_member` and `apply_to_chapter` map to the same backend state: pending membership.
- `events_only` creates no membership row.
- Existing service failures should fail onboarding rather than be swallowed.
- Newsletter writes remain fail-fast, matching current behavior.
- Operation order should be profile upsert, membership application, newsletters.
- No redirect change in this issue.
- No new schema.
- Tests should focus on onboarding orchestration because `ChapterMembershipService.applyToChapter` already covers membership rules.

## Current Code Findings

- `lib/actions/student/onboarding.ts:12` owns the server action and stays thin: auth, parse, helper delegation, revalidation, redirect.
- `lib/actions/student/onboarding.helpers.ts:54` owns `saveBasicOnboarding`, currently upserting `person_profile` and writing newsletter subscriptions.
- `lib/services/chapter-membership.service.ts:194` exposes `ChapterMembershipService.applyToChapter`.
- `lib/services/chapter-membership.service.ts:194-255` already requires `person_profile`, inserts pending rows, treats existing pending as idempotent success, reopens rejected rows, and blocks approved/alumni.
- `lib/actions/student/__tests__/onboarding.helpers.test.ts:125` already verifies onboarding helper persistence for profile/newsletter writes.
- `lib/services/__tests__/chapter-membership.service.test.ts:53` already covers core `applyToChapter` behavior.

## Design

Add membership orchestration to `saveBasicOnboarding` after `PersonProfileService.upsertBasicProfile` succeeds.

Intent mapping:

```ts
const shouldApplyToChapter =
  data.chapterIntent === 'already_member' || data.chapterIntent === 'apply_to_chapter'
```

When `shouldApplyToChapter` is true:

- call `ChapterMembershipService.applyToChapter(supabase, { userId, chapterId: data.selectedChapterId, position: 'member' })`
- if it returns failure, return that failure from `saveBasicOnboarding`
- do not continue to newsletter writes after membership failure

When `events_only`:

- do not call `ChapterMembershipService.applyToChapter`
- continue current profile/newsletter behavior

This keeps server action thin and avoids duplicating membership rules outside the service layer.

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `lib/actions/student/onboarding.helpers.ts` | Update | Delegate chapter-related onboarding intents to `ChapterMembershipService.applyToChapter`. |
| `lib/actions/student/__tests__/onboarding.helpers.test.ts` | Update | Mock chapter membership service and verify the three intent paths plus failure ordering. |
| `.github/plans/issue-90-save-onboarding-chapter-intent-as-pending-membership.plan.md` | Update | Track implementation progress and validation results. |

## Tasks

- [x] Update onboarding helper orchestration
  - Import `ChapterMembershipService`.
  - After `PersonProfileService.upsertBasicProfile` succeeds, check `chapterIntent`.
  - For `already_member` and `apply_to_chapter`, call `applyToChapter` with `selectedChapterId` and `position: 'member'`.
  - Return membership failure immediately.
  - Keep newsletter behavior unchanged after successful membership handling.

- [x] Update helper test setup
  - Mock `ChapterMembershipService.applyToChapter`.
  - Reset it in `beforeEach`.
  - Ensure existing events-only profile/newsletter tests assert membership is not called where relevant.

- [x] Add onboarding persistence tests
  - `already_member` calls `applyToChapter` with selected chapter and member position.
  - `apply_to_chapter` calls `applyToChapter` with selected chapter and member position.
  - `events_only` does not call `applyToChapter`.
  - Membership failure returns the service error and stops newsletter writes.

- [x] Validate
  - `pnpm vitest run lib/actions/student/__tests__/onboarding.helpers.test.ts lib/services/__tests__/chapter-membership.service.test.ts`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm build`

- [x] Update GitHub
  - Comment on #90 with plan path and validation results after implementation.
  - Add or keep `has-plan`.

## Risks

| Risk | Mitigation |
| --- | --- |
| Membership call happens before `person_profile` exists. | Keep order as profile, membership, newsletters. |
| Events-only users accidentally get a membership row. | Add explicit helper test that `applyToChapter` is not called. |
| Onboarding duplicates membership rules. | Delegate to `ChapterMembershipService.applyToChapter` only. |
| Issue grows into dashboard redirect work. | Keep redirect unchanged; #91 owns `/student`. |
| Partial writes happen without a transaction. | Use ordered idempotent services; no RPC/transaction in #90. |

## Acceptance Criteria Mapping

- [x] `already_member` creates/reuses pending membership through `applyToChapter`.
- [x] `apply_to_chapter` creates/reuses pending membership through `applyToChapter`.
- [x] `events_only` creates no membership row.
- [x] Existing pending idempotency remains owned by `ChapterMembershipService.applyToChapter`.
- [x] Service/action tests verify onboarding chapter intent behavior.

## Validation Results

- `pnpm vitest run lib/actions/student/__tests__/onboarding.helpers.test.ts lib/services/__tests__/chapter-membership.service.test.ts` passed: 2 files, 24 tests.
- `pnpm test` passed: 15 files, 250 tests.
- `pnpm lint` passed with 89 existing warnings and 0 errors.
- `pnpm build` passed.

## Open Questions

None. Product decision is settled: both chapter-related onboarding choices create the same pending review state for MVP.
