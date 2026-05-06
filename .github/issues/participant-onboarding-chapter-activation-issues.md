# Participant Onboarding and Chapter Activation Issues

Source PRD: `.github/PRDs/participant-onboarding-chapter-activation.prd.md`

## Issue 1: Stabilize participant protected route access before onboarding activation

Type: Bug / Technical
Complexity: Medium
Labels: `LEAD`, `auth`, `backend`, `student`, `testing`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: None

### Description

Before changing onboarding and the participant dashboard, confirm that a seeded participant can authenticate and access protected student routes consistently. Recent local checks showed password auth succeeding while a protected student route could still bounce back to login, so this should be treated as the safety gate for the activation flow.

### Acceptance Criteria

- [ ] Given a seeded participant signs in with email/password, when they navigate to `/en/student`, then they remain authenticated.
- [ ] Given the browser has a valid Supabase session cookie, when server-side auth runs, then `requireUser` resolves the current user.
- [ ] Given auth fails, when the route redirects to login, then the reason is identifiable from logs or a focused test.
- [ ] Given the fix is complete, when validation runs, then related auth/session tests pass or a documented manual check is attached.

### Implementation Notes

- Inspect `lib/auth.ts`, `lib/supabase/server.ts`, middleware/proxy behavior, and protected student routes.
- Keep the fix narrow; do not redesign onboarding in this issue.
- Use the local Docker Supabase seed personas as the source of truth.

## Issue 2: Add chapter intent step to basic onboarding

Type: Feature
Complexity: Medium
Labels: `LEAD`, `onboarding`, `frontend`, `student`, `chapter`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issue 1

### Description

Update onboarding so students can quickly say whether they are already part of a LEAD chapter, want to apply to one, or only want to attend events for now. The UI should be a single simple card group with conditional chapter selection and no proof fields.

### Acceptance Criteria

- [ ] Given a new authenticated user reaches onboarding, when they reach the chapter step, then they see three clear choices: already part of a chapter, want to apply, events only.
- [ ] Given the user chooses either chapter path, when they continue, then chapter selection is required.
- [ ] Given the user chooses events only, when they continue, then no chapter is required.
- [ ] Given a chapter is selected, when the updates step is shown, then that chapter newsletter is selected by default but can be unchecked.
- [ ] Given onboarding copy renders in English and Spanish, when the user reads it, then it avoids confusing account access with official membership.

### Implementation Notes

- Likely files: `components/onboarding.tsx`, `lib/memberschema.ts`, `messages/en.json`, `messages/es.json`.
- Keep `user.role = member` as the standard authenticated account lane.
- Do not add a new database role or new intent column for MVP.

## Issue 3: Save onboarding chapter intent as pending chapter membership

Type: Feature
Complexity: Medium
Labels: `LEAD`, `onboarding`, `backend`, `services`, `chapter`, `testing`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issue 2

### Description

When onboarding captures chapter intent, persist it through the service layer. Both "already part of a LEAD chapter" and "want to apply" should create the same pending `chapter_membership` row for review. Events-only onboarding should not create membership.

### Acceptance Criteria

- [ ] Given a user chooses already part of a chapter, when onboarding submits, then `chapter_membership.status = pending` is created for the selected chapter.
- [ ] Given a user chooses want to apply, when onboarding submits, then `chapter_membership.status = pending` is created for the selected chapter.
- [ ] Given a user chooses events only, when onboarding submits, then no `chapter_membership` row is created.
- [ ] Given a user already has a pending application for the chapter, when onboarding is submitted again, then the operation is idempotent.
- [ ] Given service/action tests run, when onboarding paths are covered, then chapter intent behavior is verified.

### Implementation Notes

- Likely files: `lib/actions/student/onboarding.ts`, `lib/actions/student/onboarding.helpers.ts`, `lib/services/chapter-membership.service.ts`, `lib/actions/student/__tests__/onboarding.helpers.test.ts`.
- Reuse `ChapterMembershipService.applyToChapter`; do not duplicate membership rules in the action.
- Server action stays thin: auth, validation, service/helper delegation, revalidation, redirect.

## Issue 4: Build minimal participant activation dashboard

Type: Feature
Complexity: Medium
Labels: `LEAD`, `student`, `frontend`, `onboarding`, `chapter`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issue 1, Issue 3

### Description

Replace the `/student` redirect with a minimal activation dashboard that explains the user's current status and next best action. This page should encourage chapter joining without blocking event participation, and it should reserve official member language and member IDs for approved memberships.

### Acceptance Criteria

- [ ] Given a user has no chapter membership, when they visit `/student`, then they see participant status and an apply-to-chapter CTA.
- [ ] Given a user has pending membership, when they visit `/student`, then they see pending review status and event-related CTAs.
- [ ] Given a user has approved membership, when they visit `/student`, then they see official member status and member ID.
- [ ] Given a user has alumni status, when they visit `/student`, then they see alumni status without being pushed into application.
- [ ] Given the page renders, when viewed on mobile and desktop, then actions are clear and the layout follows the unified UI guidance.

### Implementation Notes

- Likely files: `app/[locale]/student/page.tsx`, `app/[locale]/student/layout.tsx`, shared UI components if needed.
- Keep dashboard minimal; do not build analytics, recommendations, or a full redesign in this issue.
- Use `person_profile`, `chapter_membership`, and `lead_identity` as separate concepts.

## Issue 5: Seed 15 published demo events for local testing

Type: Enhancement / Database
Complexity: Small
Labels: `LEAD`, `events`, `database`, `testing`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: None

### Description

Add realistic published event data to local seed so onboarding, event browsing, registration, and dashboard links can be tested immediately after a Supabase reset.

### Acceptance Criteria

- [ ] Given local Supabase is reset, when `/events` loads, then 15 published events are available.
- [ ] Given seeded events are inspected, when their fields are checked, then they include a realistic mix of chapters, formats, dates, and capacities.
- [ ] Given application-based events exist in seed, when future application flow work runs, then at least a small sample supports manual testing.
- [ ] Given the seed changes are complete, when Docker Supabase is available, then reset succeeds or any blocker is documented.

### Implementation Notes

- Likely file: `supabase/seed.sql`.
- Use only columns present in the current Docker Supabase schema/generated types.
- Keep event dates future-looking and local-test friendly.

## Issue 6: QA participant onboarding activation flow

Type: Technical / Testing
Complexity: Small
Labels: `LEAD`, `onboarding`, `testing`, `student`, `events`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issue 1, Issue 2, Issue 3, Issue 4, Issue 5

### Description

Run a focused closure pass for the participant onboarding and activation flow. This issue verifies that the feature works end-to-end with local seed personas and catches route/session, dashboard copy, and event visibility regressions before moving deeper into event PIVs.

### Acceptance Criteria

- [ ] Given a fresh local reset, when a new or seeded participant logs in, then onboarding and `/student` are testable without external Google accounts.
- [ ] Given each onboarding intent is selected, when submission completes, then the resulting profile and membership state match the PRD.
- [ ] Given demo events are seeded, when the participant browses events, then public event discovery works.
- [ ] Given approved member, pending applicant, alumni, and events-only states are tested, when dashboard copy is reviewed, then official membership language is only used after approval.
- [ ] Given validation runs, when `pnpm test`, `pnpm lint`, and `pnpm build` complete, then results are attached to the issue.

### Implementation Notes

- Use deterministic seed personas from `docs/handbook/TESTING.md`.
- Prefer browser-level manual QA for the final smoke test.
- Keep follow-up issues explicit if QA exposes unrelated legacy route problems.

## Creation Report

| Issue | Title | Complexity | Dependency |
| --- | --- | --- | --- |
| [#88](https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/88) | Stabilize participant protected route access before onboarding activation | Medium | None |
| [#89](https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/89) | Add chapter intent step to basic onboarding | Medium | #88 |
| [#90](https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/90) | Save onboarding chapter intent as pending chapter membership | Medium | #89 |
| [#91](https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/91) | Build minimal participant activation dashboard | Medium | #88, #90 |
| [#92](https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/92) | Seed 15 published demo events for local testing | Small | None |
| [#93](https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/93) | QA participant onboarding activation flow | Small | #88-#92 |
