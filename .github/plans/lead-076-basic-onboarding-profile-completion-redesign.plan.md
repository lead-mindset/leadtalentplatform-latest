# Plan: LEAD-076 Basic Onboarding And Profile Completion Redesign

## Summary

Redesign basic onboarding and profile completion against `docs/handbook/UI_UX.md`. The implementation should make onboarding feel like reusable basic profile completion for LEAD participation, not chapter membership application. Preserve `PersonProfileService`, `NewsletterSubscriptionService`, validation, login/profile gates, and event registration/onboarding return behavior.

## User Story

As a public participant,
I want onboarding to save my reusable basic profile once,
So that I can register for LEAD events and subscribe to updates without joining a chapter.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #76 |
| Type | Enhancement / UI |
| Complexity | Medium |
| Phase | Active PIV Loop |
| Systems Affected | Basic onboarding, student profile, person profile service, newsletter subscriptions |
| Behavior Scope | Preserve current service/action/schema behavior |

## Foundation Contract

Follow `docs/handbook/UI_UX.md`:

- Basic onboarding is mobile-first.
- Forms are grouped by user intent, not database table.
- Validation errors appear near fields and should not obscure the flow.
- Newsletter preferences must not be confused with chapter membership.
- Basic onboarding must not ask for or imply required chapter membership.
- Use `components/ui` primitives and avoid one-off visual systems.

## Codebase Patterns To Follow

### Basic Onboarding Route

Sources:

- `app/[locale]/onboarding/page.tsx`
- `app/[locale]/onboarding/layout.tsx`
- `components/onboarding.tsx`

Pattern:

- `/onboarding` requires an authenticated Supabase user.
- Existing users with `PersonProfileService.getBasicProfile()` are redirected to events.
- `components/onboarding.tsx` owns the client-side form and stepper experience.

### Onboarding Action And Services

Sources:

- `lib/actions/student/onboarding.ts`
- `lib/actions/student/onboarding.helpers.ts`
- `lib/services/person-profile.service.ts`
- `lib/services/newsletter-subscription.service.ts`

Pattern:

- `submitOnboarding()` is a thin action: auth, parsing, service call, revalidate, redirect.
- `saveBasicOnboarding()` writes `person_profile` through `PersonProfileService.upsertBasicProfile()`.
- Global newsletter and chapter-interest subscriptions are optional and handled through `NewsletterSubscriptionService`.
- Do not add `chapter_membership` writes.

### Validation And Tests

Sources:

- `lib/memberschema.ts`
- `lib/actions/student/__tests__/onboarding.helpers.test.ts`

Pattern:

- `createBasicOnboardingSchema()` defines the basic profile fields and newsletter choices.
- Existing tests assert onboarding does not require chapter membership.
- If behavior changes, update tests. If this remains presentation-only, keep tests as protection and run the focused test.

### Student Profile Context

Sources:

- `app/[locale]/student/profile/page.tsx`
- `app/[locale]/student/profile/components/profile-update-form.tsx`
- `lib/actions/student/profile.ts`

Observed risk:

- Student profile still contains member/chapter-oriented concepts like `lead_chapter`, `memberId`, and approval status.
- #76 should not become a full member profile refactor. It may add clarity to profile page copy/state only if needed, but the main redesign target is `/onboarding`.

### Current UI Issues

Sources:

- `components/onboarding.tsx`
- `components/ui/stepper.tsx`

Observed issues:

- The generic `FormStepper` enforces a narrow centered layout and can feel disconnected from the page anatomy.
- Step copy should make the flow clearly about reusable profile completion.
- Newsletter chapter interests may visually resemble chapter application unless explicitly framed as updates.
- Form controls should be easier to scan and tap on mobile.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `app/[locale]/onboarding/layout.tsx` | UPDATE | Align layout with handbook page anatomy and remove excessive gap/centering behavior. |
| `components/onboarding.tsx` | UPDATE | Redesign the basic onboarding flow, step content, preference framing, validation visibility, and mobile layout. |
| `components/ui/stepper.tsx` | UPDATE | Add optional styling hooks or safer layout defaults only if needed for onboarding presentation; preserve existing stepper behavior. |
| `app/[locale]/student/profile/page.tsx` | UPDATE | Optional light copy/layout alignment so profile completion language matches onboarding without refactoring member profile behavior. |
| `app/[locale]/student/profile/loading.tsx` | UPDATE | Optional alignment if profile page layout changes. |
| `app/[locale]/student/profile/error.tsx` | UPDATE | Optional alignment if profile page layout changes. |
| `.github/plans/lead-076-basic-onboarding-profile-completion-redesign.plan.md` | UPDATE | Track task completion and validation evidence. |

## Tasks

### Task 1: Redesign Onboarding Page Layout - Completed

- **Files**:
  - `app/[locale]/onboarding/layout.tsx`
  - `components/onboarding.tsx`
- **Action**: UPDATE
- **Implement**:
  - Add a clear onboarding page header: profile completion, reusable for events, no chapter membership requirement.
  - Use a two-zone layout on desktop if helpful: form flow plus a short status/context panel.
  - Keep mobile-first spacing and tappable controls.
  - Avoid oversized hero treatment or disconnected visual effects.
- **Mirror**: `docs/handbook/UI_UX.md` page anatomy, forms, mobile-first workflows.
- **Validate**: `pnpm build`

### Task 2: Clarify Step Content And Preferences - Completed

- **File**: `components/onboarding.tsx`
- **Action**: UPDATE
- **Implement**:
  - Keep the same fields and `submitOnboarding()` behavior.
  - Make steps read as:
    - Contact basics.
    - School and interests.
    - Updates and visibility.
    - Review and consent.
  - Explicitly frame chapter newsletter selections as update preferences, not chapter applications.
  - Keep company visibility opt-in conservative and clearly optional.
  - Keep terms links and consent behavior.
- **Mirror**: `docs/handbook/UI_UX.md` forms and newsletter status guidance.
- **Validate**: `pnpm vitest run lib/actions/student/__tests__/onboarding.helpers.test.ts`

### Task 3: Improve Validation And Mobile Flow Presentation - Completed

- **Files**:
  - `components/onboarding.tsx`
  - `components/ui/stepper.tsx` only if needed
- **Action**: UPDATE
- **Implement**:
  - Ensure field-level errors remain near fields.
  - Prevent stepper controls from being hard to reach or cramped on mobile.
  - Avoid hidden overflow or clipped content in taller steps.
  - Preserve current validation gates between steps.
- **Mirror**: existing `FormStepper` behavior and handbook validation/mobile overflow rules.
- **Validate**: `pnpm build`

### Task 4: Align Profile Completion Copy Without Expanding Scope - Completed

- **Files**:
  - `app/[locale]/student/profile/page.tsx`
  - optional loading/error files if touched
- **Action**: UPDATE
- **Implement**:
  - Keep existing profile action/service behavior.
  - Adjust page copy to distinguish basic profile data from chapter membership/member status.
  - Do not remove member/chapter fields in this issue unless they are purely presentational and safe.
- **Mirror**: `docs/handbook/UI_UX.md` page header and status clarity.
- **Validate**: `pnpm build`

### Task 5: Validate And Update GitHub - Completed

- **File**: GitHub issue #76
- **Action**: UPDATE
- **Implement**:
  - Run `pnpm build`.
  - Run `pnpm lint`.
  - Run focused onboarding helper tests.
  - Add a GitHub comment with changed files and validation.
  - Add `has-plan`.
  - Close #76 if acceptance criteria are met.
- **Validate**:
  - `gh issue view 76 --repo abigailbrionesa/leadtalentplatform-latest --json state,labels`

## Validation

Primary validation:

```bash
pnpm build
pnpm lint
pnpm vitest run lib/actions/student/__tests__/onboarding.helpers.test.ts
```

Results:

- `pnpm vitest run lib/actions/student/__tests__/onboarding.helpers.test.ts` - passed, 1 file / 3 tests.
- `pnpm build` - passed, including `/[locale]/onboarding`.
- `pnpm lint` - passed with existing warnings only.
- Local route check: `http://127.0.0.1:3000/en/onboarding` returned HTTP 200.

Visual QA expectation:

- Desktop: `/onboarding`
- Mobile: `/onboarding`
- Confirm the flow never implies chapter membership is required.
- Confirm newsletter choices read as subscriptions/update preferences.
- Confirm validation errors remain near fields.
- Confirm form controls are readable and tappable on mobile.

## Acceptance Criteria Mapping

- [x] Onboarding communicates basic profile completion without implying chapter membership is required.
- [x] Existing `PersonProfileService` and `NewsletterSubscriptionService` behavior is preserved.
- [x] Newsletter choices remain clear and secondary to profile completion.
- [x] Validation errors are visible near fields and do not obscure the stepper flow.
- [x] Mobile onboarding controls remain readable and tappable.

## Out Of Scope

- Chapter membership application UI.
- Full student profile/member profile refactor.
- Resume upload redesign.
- Database/schema/RLS changes.
- Service/action behavior changes unless required by existing bug discovery.
- Replacing the entire stepper system globally.

## Recommended Next Step

Implement the onboarding redesign first, validate behavior with focused tests, then continue to #77 student event registration/status/QR flow.
