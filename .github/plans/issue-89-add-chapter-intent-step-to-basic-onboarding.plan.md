# Issue #89 Plan: Add Chapter Intent Step to Basic Onboarding

GitHub Issue: https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/89
Source PRD: `.github/PRDs/participant-onboarding-chapter-activation.prd.md`
Type: Feature
Complexity: Medium

## Problem

Most first-wave users are expected to already be connected to a LEAD chapter, but the current onboarding flow only collects reusable profile data and newsletter preferences. Users need a clear, low-friction way to say whether they are already part of a chapter, want to apply, or only want to attend events for now.

## Scope Boundary

This issue is UI, schema, and copy only.

In scope:

- Add the chapter intent step to onboarding.
- Add `chapterIntent` and `selectedChapterId` to onboarding validation.
- Require `selectedChapterId` only for chapter-related intents.
- Preselect the chosen chapter in newsletter interests by default.
- Update English and Spanish onboarding copy.

Out of scope:

- Creating pending `chapter_membership` rows. That belongs to #90.
- Redirecting onboarding to `/student`. That belongs to #91 or the persistence slice if needed.
- Adding a new `participant` database role.
- Adding a new intent/source column to the database.
- Adding proof fields or auto-approval.

## Current Code Findings

- `components/onboarding.tsx` owns the client onboarding stepper.
- `lib/memberschema.ts` defines `createBasicOnboardingSchema`.
- `lib/actions/student/onboarding.helpers.ts` parses form data and saves profile/newsletter choices.
- `lib/actions/student/onboarding.ts` is a thin server action wrapper.
- `messages/en.json` and `messages/es.json` contain onboarding and validation copy.
- `LEAD_CHAPTER_VALUES` and translated chapter options already exist in `lib/options.ts` and `lib/use-translated-options.ts`.
- Current onboarding steps are:
  1. Contact basics
  2. School and interests
  3. Updates and visibility
  4. Review and consent

## Design

Add a new step between school/interests and updates/visibility:

1. Contact basics
2. School and interests
3. Chapter status
4. Updates and visibility
5. Review and consent

Chapter intent values:

- `already_member`
- `apply_to_chapter`
- `events_only`

UI behavior:

- Render one simple card group with the three options.
- Show the chapter selector only when the user chooses `already_member` or `apply_to_chapter`.
- When the user selects a chapter, ensure that chapter is included in `chapterNewsletterIds` by default.
- Let users remove the chapter newsletter checkbox later in the updates step.
- Copy should say that chapter verification/application is reviewable and does not make the user official yet.

Validation behavior:

- `chapterIntent` is required.
- `selectedChapterId` is required and must be a valid chapter for `already_member` and `apply_to_chapter`.
- `selectedChapterId` is optional/empty for `events_only`.
- `chapterNewsletterIds` remains optional and user-editable.

## Tasks

- [x] Update schema and form parsing
  - Add `chapterIntent` enum to `createBasicOnboardingSchema`.
  - Add conditional validation for `selectedChapterId`.
  - Add fields to `BasicPersonProfileData` if needed for action typing.
  - Parse `chapterIntent` and `selectedChapterId` in `parseBasicOnboardingFormData`.
  - Update onboarding helper tests for valid chapter intents and invalid missing chapter.

- [x] Update onboarding stepper structure
  - Add default values for `chapterIntent` and `selectedChapterId`.
  - Move current updates/visibility step from step 3 to step 4.
  - Move terms step from step 4 to step 5.
  - Update `stepFields` so per-step validation matches the new structure.

- [x] Build chapter intent UI
  - Add a card group with three clear choices.
  - Use familiar controls: radio/card selection or equivalent accessible buttons.
  - Add conditional chapter selector for the first two choices.
  - Avoid proof fields and avoid official membership wording before approval.

- [x] Wire newsletter default behavior
  - Watch `selectedChapterId` and `chapterIntent`.
  - When a chapter path is selected, add the selected chapter to `chapterNewsletterIds` if missing.
  - Do not force it back if the user later unchecks it in the updates step unless they change chapter selection again.

- [x] Update translations
  - Add English onboarding copy for the new step, option labels, helper text, and validation messages.
  - Add Spanish equivalents using simple, clear language.
  - Adjust existing profile-only copy so onboarding no longer says chapter membership is absent from the flow.

- [x] Validate
  - `pnpm vitest run lib/actions/student/__tests__/onboarding.helpers.test.ts`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm build`
  - Browser smoke: new user onboarding shows the chapter status step, requires chapter only for the two chapter paths, and preselects newsletter for selected chapter.

- [x] Update GitHub
  - Comment on #89 with plan path and validation results after implementation.
  - Keep `has-plan`.

## Validation Results

- `pnpm vitest run lib/actions/student/__tests__/onboarding.helpers.test.ts` passed: 1 file, 6 tests.
- `pnpm test` passed: 15 files, 247 tests.
- `pnpm lint` passed with 89 existing warnings and 0 errors.
- `pnpm build` passed after one retry; first attempt was blocked by a transient Google Fonts fetch failure for Montserrat/Raleway.
- Browser smoke passed with a temporary local user: onboarding showed the chapter status step, the chapter selector appeared for the already-member path, and selecting LEAD UNI preselected the LEAD UNI newsletter checkbox.

## Risks

- If #89 accidentally creates membership rows, it overlaps with #90 and makes testing less clear.
- The current stepper validates future steps when clicking step indicators; `stepFields` must be precise or users may be blocked by hidden fields.
- Defaulting newsletter selection should not prevent the user from opting out.
- Spanish message file currently has some encoding artifacts; keep edits minimal and consistent with the existing file style.

## Open Questions

- None. Product decision is settled: both chapter-related intents map to the same future pending membership state in #90, and #89 only captures the intent cleanly.
