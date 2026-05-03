# Plan: LEAD-013 Implement Basic Onboarding With Person Profile

## Summary

Implement public-participant onboarding as a basic profile flow that writes `public.user` and `person_profile`, then saves newsletter preferences, without requiring chapter membership. The codebase already has the right service foundations (`PersonProfileService` and `NewsletterSubscriptionService`); LEAD-013 should replace the current student/member onboarding path with a thin server action, a lighter onboarding UI, and redirect logic that treats `person_profile` as onboarding completion.

## User Story

As a public participant,
I want basic onboarding saved once,
So that I can register for events and subscribe to updates without joining a chapter.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #14 |
| Type | Feature |
| Complexity | Medium |
| Systems Affected | Onboarding UI, server action, person profile service, newsletter service, auth redirects, tests |
| Dependencies | LEAD-005, LEAD-008, LEAD-012 |
| Blocks | LEAD-014 |

## Problem

The current onboarding route still behaves like member onboarding. It requires `lead_chapter`, validates with member schema, calls `StudentService.submitOnboarding()`, may upload resume, creates chapter membership, subscribes to the selected chapter, sends a chapter-specific welcome email, and redirects to `/student`.

That no longer matches the layered model. A public participant should complete reusable basic profile fields once, optionally subscribe to global/chapter newsletters, and continue without a chapter application.

## Codebase Findings

### Existing Basic Profile Service

Source: `lib/services/person-profile.service.ts:50`

`PersonProfileService.getBasicProfile()` reads `public.user` plus `person_profile` and returns reusable profile fields.

Source: `lib/services/person-profile.service.ts:87`

`PersonProfileService.upsertBasicProfile()` upserts `public.user` and `person_profile` by `user_id`. It already writes `university`, `major_or_interest`, `graduation_year`, `linkedin_url`, `portfolio_url`, `skills`, `gender`, and `is_recruiter_visible`.

Source: `lib/services/__tests__/person-profile.service.test.ts:129`

The service test already asserts that basic profile upsert does not write `chapter_membership`. LEAD-013 should preserve this boundary.

### Existing Newsletter Service

Source: `lib/services/newsletter-subscription.service.ts:34`

`NewsletterSubscriptionService` already supports `subscribeGlobal`, `subscribeToChapter`, `subscribeToChapters`, reactivation of existing subscriptions, and event-registration subscription behavior.

Source: `lib/services/__tests__/newsletter-subscription.service.test.ts:54`

Tests cover global creation, reactivation, chapter subscription, deduping chapter IDs, unsubscribe, and event chapter subscriptions.

### Current Onboarding Action Is Too Heavy

Source: `lib/actions/student/onboarding.ts:37`

The action validates with `createMemberProfileSchema()`, which requires `lead_chapter`.

Source: `lib/actions/student/onboarding.ts:62`

The action calls `StudentService.submitOnboarding()`, which belongs to the chapter/member flow, not public basic onboarding.

Source: `lib/actions/student/onboarding.ts:82`

The action gets chapter name and sends a chapter welcome email, which should not happen for basic public onboarding.

### Current Onboarding UI Requires Chapter And Resume

Source: `components/onboarding.tsx:40`

The component uses `createFullMemberSchemaFrontend()`, which extends member schema and requires resume plus terms.

Source: `components/onboarding.tsx:64`

Step validation includes `lead_chapter` in step 1 and `resume_pdf` in step 3.

Source: `components/onboarding.tsx:203`

The UI renders required `lead_chapter` selection as part of onboarding.

Source: `components/onboarding.tsx:284`

The UI renders resume upload as part of onboarding. Resume upload should move to chapter/member profile or later participant profile enrichment, not block basic onboarding.

### Completion Redirects Are Mixed

Source: `app/[locale]/auth/callback/route.ts:64`

OAuth callback already checks `person_profile` for member/editor completion and redirects to `/onboarding` if missing.

Source: `app/[locale]/auth/confirm/route.ts:55`

Email confirmation still checks `student_profile.is_filled`; LEAD-013 must switch this to `person_profile`.

Source: `app/[locale]/onboarding/page.tsx:1`

The onboarding route currently renders the client component without server-side prefill or skip logic.

## Implementation Design

### 1. Define Basic Onboarding Inputs

Use existing `createBasicPersonProfileSchema()` from `lib/memberschema.ts`, but review whether its required fields match public onboarding:

- Required: full name, phone, gender, career/major_or_interest, graduation year, skills, LinkedIn URL, recruiter visibility consent, global newsletter opt-in.
- Add or support: `university`, `portfolio_url`, selected newsletter chapter interests.
- Do not require: `lead_chapter`, `resume_pdf`, chapter application, chapter membership.

If the existing schema is still too student-career-specific, add a new `createBasicOnboardingSchema()` beside it rather than overloading the member schema.

### 2. Replace Action Boundary With Thin Controller

Update `lib/actions/student/onboarding.ts` or create `lib/actions/person-profile/onboarding.ts` and have the existing import delegate to it.

The action should:

- Authenticate via `createClient().auth.getUser()`.
- Parse FormData into a plain object.
- Validate with Zod at the action boundary.
- Call `PersonProfileService.upsertBasicProfile()`.
- If global newsletter opt-in is checked, call `NewsletterSubscriptionService.subscribeGlobal({ source: 'onboarding' })`.
- If chapter newsletter interests are selected, call `NewsletterSubscriptionService.subscribeToChapters({ source: 'onboarding' })`.
- Avoid `StudentService.submitOnboarding()`.
- Avoid `ChapterService.getChapterName()`.
- Avoid welcome email that requires a chapter.
- Revalidate appropriate routes and redirect to the requested next path or `/events`.

### 3. Simplify Onboarding UI

Update `components/onboarding.tsx` to represent basic onboarding:

- Use basic onboarding schema, not `createFullMemberSchemaFrontend()`.
- Remove required `lead_chapter` from step validation.
- Remove resume upload from the basic flow.
- Add optional chapter newsletter interests using existing chapter options.
- Keep global newsletter checkbox checked by default.
- Keep recruiter visibility separate from newsletter consent.
- Keep terms acceptance.

Suggested basic steps:

1. Contact and identity: full name, phone, gender.
2. Profile: university, major/interest, graduation year, skills, LinkedIn/portfolio.
3. Updates: global newsletter opt-in and optional chapter interests.
4. Terms and submit.

### 4. Add Returning User Skip/Prefill

Update `app/[locale]/onboarding/page.tsx` to become a server component that:

- Creates Supabase server client.
- Redirects unauthenticated users to login or auth error using existing app conventions.
- Calls `PersonProfileService.getBasicProfile()`.
- If profile exists, redirects to a safe destination, likely `/events` for public participants or role-specific destinations for admin/recruiter.
- If profile does not exist, renders onboarding with initial user metadata/name/email where available.

If prefill requires client props, pass `initialProfile`/`initialUser` into `Onboarding`.

### 5. Fix Auth Confirmation Completion Check

Update `app/[locale]/auth/confirm/route.ts` to match OAuth callback behavior:

- For member/editor roles, check `person_profile.user_id`, not `student_profile.is_filled`.
- Redirect completed users to `/student/profile` or a better post-onboarding destination.
- Redirect incomplete users to `/onboarding`.

### 6. Tests

Add or update service/action tests at the lowest useful level:

- Action parses and validates FormData, then calls `PersonProfileService.upsertBasicProfile`.
- Action subscribes global newsletter when checked.
- Action subscribes selected chapter newsletter interests.
- Action does not call `chapter_membership`/`StudentService` for basic onboarding.
- Returning user skip can be covered with a route-level smoke test only if the project has a pattern; otherwise document manual validation.

Prefer service-layer tests for reusable logic. If action testing is awkward because of `redirect()`, extract an action helper such as `parseBasicOnboardingFormData()` or `saveBasicOnboarding()` and test that pure boundary.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/memberschema.ts` | Update | Add or refine basic onboarding schema without chapter/resume requirements. |
| `lib/actions/student/onboarding.ts` | Update | Replace member onboarding behavior with thin basic profile/newsletter controller, or delegate to a new action module. |
| `components/onboarding.tsx` | Update | Remove required chapter/resume, add basic profile and newsletter chapter-interest controls. |
| `app/[locale]/onboarding/page.tsx` | Update | Add server-side completion check and optional prefill props. |
| `app/[locale]/auth/confirm/route.ts` | Update | Check `person_profile` completion instead of `student_profile.is_filled`. |
| `messages/en.json`, `messages/es.json` | Update if needed | Add UI labels for university, portfolio, newsletter chapter interests, and basic onboarding copy. |
| `lib/services/__tests__/person-profile.service.test.ts` | Update if needed | Preserve no-membership assertion and null visibility handling. |
| `lib/actions/**/__tests__` or `lib/services/__tests__` | Create/Update | Cover onboarding action/helper and newsletter calls. |
| `docs/handbook/TESTING.md` | Update | Add manual validation flow for `participant@test.com` completing onboarding without membership. |

## Tasks

- [x] Add/refine a basic onboarding Zod schema that excludes `lead_chapter` and `resume_pdf`.
- [x] Update onboarding action to call `PersonProfileService.upsertBasicProfile()`.
- [x] Add newsletter handling for global opt-in and selected chapter interests.
- [x] Remove chapter membership/resume/welcome-email behavior from basic onboarding.
- [x] Update onboarding UI to show only basic profile fields, newsletter choices, and terms.
- [x] Add returning-user skip/prefill on `app/[locale]/onboarding/page.tsx`.
- [x] Update email confirm route to check `person_profile`.
- [x] Add focused tests for action/helper behavior and no `chapter_membership` writes.
- [x] Update testing handbook/manual validation notes.
- [x] Run `pnpm test`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm build` and record any remaining LEAD-011/legacy drift separately.

## Validation

```bash
pnpm test
pnpm lint
pnpm build
```

Latest validation:

- `pnpm vitest run lib/actions/student/__tests__/onboarding.helpers.test.ts` passes.
- `pnpm test` passes: 11 files, 175 tests.
- `pnpm lint` passes with existing warnings.
- `pnpm build` compiles, then fails during TypeScript on legacy chapter/admin code still reading `student_profile` from `MemberWithProfile` (`app/[locale]/admin/chapters/[id]/page.tsx:30`). This is outside the LEAD-013 onboarding slice and should stay attached to the remaining schema-alignment work.

Manual checks:

- Sign in as a new member/public participant and visit `/onboarding`.
- Confirm no required chapter selection appears.
- Submit basic profile with global newsletter checked and one or more chapter interests.
- Confirm `person_profile` exists, no `chapter_membership` row is created, and newsletter rows are active.
- Revisit `/onboarding` and confirm the user is not forced through it again.

## Risks

- Current `StudentService.updateProfile()` still creates chapter membership. Do not reuse it for public onboarding.
- Existing component names (`career`, `lead_chapter`) are member-era names. Map carefully to `major_or_interest` and optional newsletter chapter IDs.
- Auth callback already uses `person_profile`, but confirm route still uses `student_profile`; leaving it unchanged would make email-login users loop incorrectly.
- `pnpm build` may still fail on unrelated legacy `student_profile` consumers from LEAD-011. Record those separately if unchanged.
- The dirty worktree contains LEAD-009, LEAD-010, and LEAD-011 work. Implementation must not revert unrelated changes.

## GitHub Follow-Up

Create sub-issues for:

1. Update basic onboarding action and schema.
2. Redesign onboarding UI for person profile plus newsletter preferences.
3. Add onboarding completion redirects and auth confirm fix.
4. Add onboarding tests and manual validation docs.
