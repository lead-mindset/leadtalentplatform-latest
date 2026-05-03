# Plan: LEAD-014 Update Event Registration To Use Person Profile

## Summary

Update public event registration so an authenticated participant only needs a completed `person_profile`, not chapter membership. The existing event service already handles open registration, application registration, duplicate races, cancelled reactivation, capacity errors, and event newsletter subscription hooks. This plan keeps those behaviors and adds a thin person-profile completion gate in the event registration action/UI path.

## User Story

As an authenticated participant,
I want to register for public events using my basic profile,
So that I do not need chapter membership to attend LEAD events.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #15 |
| Type | Enhancement |
| Complexity | Medium |
| Systems Affected | Event registration action, event service tests, event detail route, event registration UI, application modal flow |
| Dependencies | LEAD-013 |
| Blocks | LEAD-018, LEAD-020, LEAD-028 |

## Problem

Event registration must treat `person_profile` as the completion boundary for public participants. Guests can browse events, but registration requires authentication. Authenticated users without `person_profile` should be sent to onboarding. Authenticated users with `person_profile` should be able to register for open events without any `chapter_membership` dependency. Newsletter opt-in should continue creating or reactivating host/collaborator chapter subscriptions.

## Codebase Findings

### Current Registration Action

Source: `lib/actions/events/register.ts:87`

`registerForEvent()` authenticates with `requireUser()`, validates `eventId`, reads `subscribeToHostChapters`, calls `EventService.validateEventForRegistration()`, then calls `EventService.registerForEvent()`.

Source: `lib/actions/events/register.ts:33`

`applyForEvent()` handles application-based events and calls `EventService.applyForEvent()` with parsed application answers and newsletter opt-in.

Gap: neither action checks `person_profile`, so incomplete authenticated users can attempt registration.

### Existing Event Service Behavior To Preserve

Source: `lib/services/event.service.ts:200`

`validateEventForRegistration()` validates event existence, published state, and start time.

Source: `lib/services/event.service.ts:307`

`registerForEvent()` checks existing registration, treats active registrations as idempotent success, revives cancelled registrations, inserts new registrations, handles capacity trigger failures, and handles duplicate-key race conditions.

Source: `lib/services/event.service.ts:234`

`applyForEvent()` creates `pending_review` registrations and stores application answers against the registration.

Source: `lib/services/event.service.ts:457`

Open registration already calls `NewsletterSubscriptionService.subscribeForEventRegistration()` when `subscribeToHostChapters` is true.

Source: `lib/services/event.service.ts:286`

Application registration already calls the same event newsletter hook when opted in.

### Profile Completion Source

Source: `lib/services/person-profile.service.ts:50`

`PersonProfileService.getBasicProfile()` returns `null` when the authenticated user has no reusable `person_profile`.

Source: `lib/actions/student/onboarding.helpers.ts:52`

LEAD-013 writes profile data through `PersonProfileService.upsertBasicProfile()` and newsletter preferences without creating `chapter_membership`.

### Event Detail UI

Source: `app/[locale]/events/[id]/page.tsx:15`

The event detail page already creates a server Supabase client, gets auth state, loads the event, and fetches the user's registration if logged in.

Source: `app/[locale]/events/[id]/_components/EventContent.tsx:62`

`EventContent` receives `isLoggedIn` and renders registration controls or application modal.

Source: `components/events/event-registration-checkout.tsx:98`

Guests see a sign-in CTA. Logged-in users see the registration form with the newsletter checkbox checked by default.

Gap: the page does not calculate whether the logged-in user has `person_profile`, so the UI cannot route incomplete users to onboarding before posting registration.

### Test Patterns

Source: `lib/services/__tests__/event.service.test.ts:307`

Event service tests use mocked Supabase table chains and assert registration result shape.

Source: `lib/services/__tests__/event.service.test.ts:331`

Newsletter opt-in tests spy on `NewsletterSubscriptionService.subscribeForEventRegistration()` and assert `source='event_registration'`.

Source: `lib/actions/student/__tests__/onboarding.helpers.test.ts:1`

LEAD-013 introduced action-helper tests for boundary logic that is awkward to test through `redirect()`. LEAD-014 should follow the same pattern for registration preflight helpers.

## Design

### Profile Gate

Add a small helper around event registration preconditions, preferably in `lib/actions/events/register.helpers.ts`:

- Accept `supabase`, `userId`, and `eventId`.
- Confirm `PersonProfileService.getBasicProfile(supabase, userId)` returns a profile.
- Return a typed status such as:
  - `{ ok: true }`
  - `{ ok: false, reason: 'missing_profile', onboardingPath: '/onboarding?next=/events/{eventId}' }`
  - `{ ok: false, reason: 'invalid_event', error: string }`

Keep this helper framework-light so it can be unit tested without mocking Next redirects.

### Action Behavior

Update both `registerForEvent()` and `applyForEvent()`:

- Guest/no auth behavior stays the same: sign-in required.
- Authenticated without profile returns a clear action state for form registration and a clear error/redirect instruction for application registration.
- Authenticated with profile continues to call existing `EventService` methods.
- No `chapter_membership` read should be introduced.

For regular form registration, extend `RegisterForEventState` with:

```ts
requiresOnboarding?: boolean
onboardingPath?: string
```

For application modal registration, either return `{ error, requiresOnboarding, onboardingPath }` or have the client route directly based on a structured result.

### UI Behavior

Update `app/[locale]/events/[id]/page.tsx` to derive `hasBasicProfile` for authenticated users using `PersonProfileService.getBasicProfile()`.

Pass `hasBasicProfile` and `onboardingUrl` to `EventContent`, then to:

- `EventRegistrationCheckout`
- `ApplyModal` trigger path

Open-event UI should:

- Guests: show sign-in CTA as today.
- Logged in without profile: show onboarding CTA.
- Logged in with profile: show registration form.

Application-event UI should:

- Guests: require sign-in.
- Logged in without profile: route to onboarding before opening/submitting application.
- Logged in with profile: open modal and submit as today.

### Newsletter Behavior

Keep the existing `subscribeToHostChapters` checkbox default checked in `EventRegistrationCheckout`.

Preserve service calls to `NewsletterSubscriptionService.subscribeForEventRegistration()` for:

- New open registration
- Cancelled registration revival
- Duplicate-key cancelled revival
- Application registration

Do not make newsletter failure block registration; existing service behavior logs failures and returns registration success.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/actions/events/register.helpers.ts` | Create | Add testable profile/onboarding preflight for event registration. |
| `lib/actions/events/register.ts` | Update | Gate open and application registration on `person_profile` before calling event service. |
| `app/[locale]/events/[id]/page.tsx` | Update | Load `hasBasicProfile` for authenticated users and build onboarding return URL. |
| `app/[locale]/events/[id]/_components/EventContent.tsx` | Update | Route incomplete users to onboarding for open and application events. |
| `components/events/event-registration-checkout.tsx` | Update | Show onboarding CTA and handle action-state onboarding response. |
| `components/events/apply-modal.tsx` | Update if needed | Keep newsletter checkbox default checked and surface profile-gate messaging if submission returns it. |
| `lib/actions/events/__tests__/register.helpers.test.ts` | Create | Test profile gate without invoking redirects. |
| `lib/services/__tests__/event.service.test.ts` | Update if needed | Preserve existing capacity, duplicate, cancelled, and newsletter tests. Add no-membership assertion if registration test mocks add profile gate. |
| `docs/handbook/TESTING.md` | Update | Add manual validation for event registration with participant persona and missing-profile user. |

## Tasks

- [x] Create `lib/actions/events/register.helpers.ts` with a typed `getEventRegistrationPreflight()` helper that checks `person_profile` and builds onboarding path.
- [x] Add unit tests for the helper: profile exists, profile missing, profile lookup returns null, and no `chapter_membership` table access.
- [x] Update `registerForEvent()` to call the helper before `EventService.validateEventForRegistration()` and return structured onboarding state when missing.
- [x] Update `applyForEvent()` to use the same profile gate before creating `pending_review` registration.
- [x] Update event detail page to compute `hasBasicProfile` for logged-in users and pass it into the client component.
- [x] Update `EventContent` application-event path so missing-profile users go to onboarding instead of opening the modal.
- [x] Update `EventRegistrationCheckout` to show an onboarding CTA for logged-in users missing a basic profile, while leaving guest sign-in CTA unchanged.
- [x] Preserve default-checked event newsletter checkbox and service opt-in wiring.
- [x] Add or update tests around event action/helper behavior and newsletter preservation.
- [x] Update `docs/handbook/TESTING.md` with LEAD-014 manual checks.
- [x] Run targeted tests: `pnpm vitest run lib/actions/events/__tests__/register.helpers.test.ts lib/services/__tests__/event.service.test.ts`.
- [x] Run `pnpm test`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm build` and record any remaining unrelated legacy schema drift.

## Validation

```bash
pnpm vitest run lib/actions/events/__tests__/register.helpers.test.ts lib/services/__tests__/event.service.test.ts
pnpm test
pnpm lint
pnpm build
```

Latest validation:

- `pnpm vitest run lib/actions/events/__tests__/register.helpers.test.ts lib/services/__tests__/event.service.test.ts` passes: 2 files, 58 tests.
- Targeted ESLint on changed LEAD-014 files passes with one existing `<img>` warning in `EventContent.tsx`.
- `pnpm test` passes: 12 files, 179 tests.
- `pnpm lint` passes with existing warnings.
- `pnpm build` compiles, then fails during TypeScript on existing legacy schema drift: `app/[locale]/admin/chapters/[id]/page.tsx:30` still reads `student_profile` from `MemberWithProfile`.

Manual checks:

- Guest can browse `/events` and `/events/{id}` but sees sign-in CTA for registration.
- Authenticated user without `person_profile` sees onboarding CTA or is routed to `/onboarding?next=/events/{id}`.
- Authenticated user with `person_profile` can register for an open event without `chapter_membership`.
- Open registration creates `event_registration.status='registered'` and a QR token.
- Application event creates `event_registration.status='pending_review'` and stores answers against `registration_id`.
- Leaving newsletter checkbox checked creates/reactivates host and collaborator chapter subscriptions.
- Unchecking newsletter checkbox skips event newsletter subscriptions.
- Capacity and duplicate-registration behavior matches existing tests.

## Risks

| Risk | Mitigation |
|------|------------|
| Accidentally reintroducing chapter membership as a registration dependency | Keep profile gate exclusively on `PersonProfileService.getBasicProfile()` and assert no `chapter_membership` mock calls in helper tests. |
| Breaking capacity or duplicate-race behavior | Do not rewrite `EventService.registerForEvent()` flow; add the profile gate before service call. |
| Application modal silently failing for missing profile | Return structured onboarding state and route users before opening/submitting application. |
| Newsletter subscription failures blocking registration | Preserve existing service behavior: log subscription failure, keep registration success. |
| Build still failing on unrelated legacy schema drift | Record separately; do not expand LEAD-014 into admin/chapter legacy cleanup. |

## GitHub Follow-Up

Suggested sub-issues:

1. Add event registration person-profile preflight.
2. Update event registration UI for missing-profile onboarding CTA.
3. Add LEAD-014 registration/helper tests and manual validation docs.
