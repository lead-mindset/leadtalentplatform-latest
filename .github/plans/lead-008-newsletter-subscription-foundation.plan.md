# Plan: LEAD-008 Newsletter Subscription Foundation

## Summary

Build the newsletter subscription foundation around the existing `newsletter_subscription` table. The implementation should add database-level identity constraints, a dedicated service layer for global/chapter subscription creation, reactivation, and unsubscribe behavior, then wire the service into onboarding and event registration. Campaign UI and delivery are out of scope; the goal is a reliable consent/preference model future campaign planning can query.

## User Story

As a participant,
I want global and chapter newsletter preferences,
So that I can receive LEAD updates relevant to my interests.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #9 |
| Type | Feature |
| Complexity | Small |
| Systems Affected | Supabase migrations/RLS, service layer, onboarding, event registration, tests, seed/docs |
| Dependencies | LEAD-002, LEAD-003 |
| Blocks | LEAD-013, LEAD-014, LEAD-026 |

## Problem

The database already has `newsletter_subscription`, but product behavior is not wired. Onboarding parses `emailNotificationsEnabled` and passes it into `StudentService.submitOnboarding()`, but the service never creates subscriptions. Event registration only posts `eventId`, so there is no host/collaborator chapter newsletter checkbox and no service call to create or reactivate subscriptions. The table also lacks uniqueness constraints for one logical global row per user and one logical chapter row per user/chapter, so duplicate subscriptions are still possible.

## Patterns To Follow

### Existing Newsletter Schema

Source: `supabase/migrations/20260502062203_add_newsletter_subscription.sql:55`

`newsletter_subscription` already stores `user_id`, `scope`, nullable `chapter_id`, `status`, `source`, `subscribed_at`, `unsubscribed_at`, and timestamps. Keep this table as the source of truth; do not add newsletter preference booleans back onto profile tables.

Source: `supabase/migrations/20260502062203_add_newsletter_subscription.sql:100`

The original migration explicitly skipped uniqueness and left duplicate prevention to application code. LEAD-008 should close that gap with forward-only unique indexes or constraints that match the intended model.

### RLS

Source: `supabase/migrations/20260503000000_define_rls_new_account_model.sql:140`

Use the newer policy model from LEAD-003: admins through `public.is_admin()`, users managing their own rows, and editor SELECT scoped by `public.is_chapter_editor(chapter_id)`. Do not reintroduce direct profile-table dependencies into newsletter RLS.

### Service Layer

Source: `docs/adr/001-service-layer-pattern.md:15`

Business/database logic belongs in `lib/services/`. Server actions should only handle auth, parsing/validation, and service delegation.

Source: `lib/services/chapter-membership.service.ts:141`

Mirror the recent foundation-service style: typed params, `{ success: true } | { success: false; error: string }` results, and focused helper methods around one table.

### Onboarding

Source: `components/onboarding.tsx:57`

`emailNotificationsEnabled` already defaults to `true` in the member onboarding UI.

Source: `lib/actions/student/onboarding.ts:51`

The action already parses `emailNotificationsEnabled` from `FormData` and passes it to `StudentService.submitOnboarding()`.

Source: `lib/services/student.service.ts:176`

`StudentService.submitOnboarding()` already accepts `emailNotificationsEnabled`; implementation should call the newsletter service after the profile/membership writes.

### Event Registration

Source: `components/events/event-registration-checkout.tsx:122`

Open event registration currently posts only `eventId`; add the host-chapter newsletter checkbox here, checked by default.

Source: `lib/actions/events/register.ts:78`

The server action currently reads only `eventId`; it should parse an opt-in flag and pass it to registration service logic.

Source: `lib/services/event.service.ts:259`

`EventService.registerForEvent()` currently creates/revives registrations only. Keep registration ownership in `EventService`, but delegate newsletter writes to `NewsletterSubscriptionService` after successful registration/revival.

### Event Collaborators

Source: `lib/services/event.service.ts:1204`

Event admin reads already join owner and collaborator chapters. The newsletter service should expose a helper that loads host/collaborator chapter IDs for a given event and subscribes to all unique IDs when the checkbox remains checked.

### Tests

Source: `lib/services/__tests__/chapter-membership.service.test.ts:40`

Use table-routed Supabase mocks and assert upsert payloads/options for foundational service behavior.

Source: `lib/services/__tests__/event.service.test.ts:291`

Event registration tests already cover create, revive, duplicate, and capacity behavior; extend them only where needed to prove newsletter side effects happen after success and not after failure.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/*_newsletter_subscription_foundation.sql` | Create | Add uniqueness/check constraints for global vs chapter subscriptions and supporting indexes |
| `lib/database.generated.ts` | Regenerate | Keep generated types aligned with Docker Supabase after migration |
| `lib/types.ts` | Update | Export newsletter row/insert/update aliases if useful |
| `lib/services/newsletter-subscription.service.ts` | Create | Own subscribe/reactivate/unsubscribe/get-preferences logic |
| `lib/services/__tests__/newsletter-subscription.service.test.ts` | Create | Unit tests for global, chapter, event, reactivation, inactive/unsubscribed behavior |
| `lib/services/student.service.ts` | Update | Call newsletter service during onboarding according to global opt-in and selected chapter |
| `lib/services/__tests__/student.service.test.ts` | Update | Assert onboarding writes global/chapter subscriptions when opted in and skips global when not |
| `lib/actions/person-profile.ts` | Update if LEAD-005 basic onboarding path remains active | Pass email opt-in to the appropriate service path or explicitly defer if route is not used |
| `components/events/event-registration-checkout.tsx` | Update | Add checked-by-default host/chapter newsletter checkbox for open registration |
| `lib/actions/events/register.ts` | Update | Parse checkbox and delegate option to service |
| `lib/services/event.service.ts` | Update | Accept newsletter opt-in option and call newsletter service after successful registration/revival |
| `lib/services/__tests__/event.service.test.ts` | Update | Cover registration subscription side effects and failure isolation |
| `app/[locale]/events/[id]/_components/EventContent.tsx` | Update if application flow should include same checkbox | Pass opt-in through application modal/handler for application events if scoped in implementation |
| `components/events/apply-modal.tsx` | Update if application flow included | Add checked-by-default checkbox for application submission |
| `lib/actions/events/register.ts` | Update if application flow included | Parse/pass opt-in for `applyForEvent()` |
| `supabase/seed.sql` | Update | Seed deterministic subscription rows for manual validation personas |
| `docs/handbook/TESTING.md` | Update | Document newsletter manual and service-test validation |

## Dependency Order

1. Add database invariants so service upserts have stable conflict targets.
2. Regenerate Supabase types from Docker Supabase.
3. Add newsletter service tests first.
4. Implement `NewsletterSubscriptionService`.
5. Wire onboarding subscription behavior.
6. Wire open event registration checkbox and service call.
7. Decide and wire application-event checkbox if keeping parity with event registration in this slice.
8. Update seed/docs and run full validation.

## Tasks

## Progress

- [x] Task 1: Add Newsletter Database Invariants
- [x] Task 2: Create Newsletter Subscription Service Tests
- [x] Task 3: Implement NewsletterSubscriptionService
- [x] Task 4: Wire Onboarding Newsletter Preferences
- [x] Task 5: Wire Event Registration Chapter Subscriptions
- [x] Task 6: Cover Application Event Opt-In Path Or Explicitly Defer
- [x] Task 7: Update Seed And Testing Docs
- [ ] Task 8: Final Validation And GitHub Updates

### Task 1: Add Newsletter Database Invariants

- **Files**: `supabase/migrations/*_newsletter_subscription_foundation.sql`, `lib/database.generated.ts`
- **Action**: Create migration and regenerate types
- **Implement**: Add a unique index for one global subscription row per user where `scope='global'`; add a unique index for one chapter subscription row per `(user_id, chapter_id)` where `scope='chapter'`; add check constraints that global rows require `chapter_id IS NULL` and chapter rows require `chapter_id IS NOT NULL`; add an index for active chapter campaign planning such as `(chapter_id, status)` where `scope='chapter'`.
- **Mirror**: `supabase/migrations/20260503002000_chapter_membership_foundation.sql`
- **Validate**: `pnpm supabase db reset`

### Task 2: Create Newsletter Subscription Service Tests

- **File**: `lib/services/__tests__/newsletter-subscription.service.test.ts`
- **Action**: Create
- **Implement**: Cover global opt-in creation/reactivation, global opt-out/inactive handling, chapter subscription creation/reactivation, batch chapter subscription dedupe, unsubscribe behavior setting `status='unsubscribed'` and `unsubscribed_at`, event host/collaborator chapter ID lookup, and friendly error behavior.
- **Mirror**: `lib/services/__tests__/chapter-membership.service.test.ts`
- **Validate**: `pnpm test lib/services/__tests__/newsletter-subscription.service.test.ts`

### Task 3: Implement NewsletterSubscriptionService

- **File**: `lib/services/newsletter-subscription.service.ts`
- **Action**: Create
- **Implement**: Add methods such as `subscribeGlobal`, `subscribeToChapter`, `subscribeToChapters`, `unsubscribe`, `getUserSubscriptions`, `getEventChapterIds`, and `subscribeForEventRegistration`. Use upserts with the new conflict targets; reactivation should set `status='active'`, refresh `source`, set `subscribed_at`, clear `unsubscribed_at`, and update `updated_at`. Preserve `inactive`/`unsubscribed` rows rather than deleting them.
- **Mirror**: `lib/services/chapter-membership.service.ts:141`
- **Validate**: `pnpm test lib/services/__tests__/newsletter-subscription.service.test.ts`

### Task 4: Wire Onboarding Newsletter Preferences

- **Files**: `lib/services/student.service.ts`, `lib/services/__tests__/student.service.test.ts`, optionally `lib/actions/person-profile.ts`
- **Action**: Update
- **Implement**: In `StudentService.submitOnboarding()`, after successful profile and chapter application writes, call `NewsletterSubscriptionService.subscribeGlobal()` only when `emailNotificationsEnabled` is true. Also create/reactivate a chapter subscription for the selected `leadChapter` when global opt-in is true unless product chooses chapter interest independent of global; if independent, add explicit `chapterNewsletterInterests` form data before implementation.
- **Mirror**: `lib/services/student.service.ts:232`
- **Validate**: `pnpm test lib/services/__tests__/student.service.test.ts`

### Task 5: Wire Event Registration Chapter Subscriptions

- **Files**: `components/events/event-registration-checkout.tsx`, `lib/actions/events/register.ts`, `lib/services/event.service.ts`, `lib/services/__tests__/event.service.test.ts`
- **Action**: Update
- **Implement**: Add a checked-by-default checkbox named `subscribeToHostChapters` to the open registration form. Parse it in `registerForEvent()`. Extend `EventService.registerForEvent()` with an option such as `{ subscribeToHostChapters?: boolean }`; after successful new or revived registration, call `NewsletterSubscriptionService.subscribeForEventRegistration()` for the event owner chapter and collaborators. Do not create subscriptions if registration validation/insert fails or if the checkbox is unchecked.
- **Mirror**: `components/events/event-registration-checkout.tsx:122`, `lib/actions/events/register.ts:78`, `lib/services/event.service.ts:259`
- **Validate**: `pnpm test lib/services/__tests__/event.service.test.ts`

### Task 6: Cover Application Event Opt-In Path Or Explicitly Defer

- **Files**: `app/[locale]/events/[id]/_components/EventContent.tsx`, `components/events/apply-modal.tsx`, `lib/actions/events/register.ts`, `lib/services/event.service.ts`
- **Action**: Update or document deferral
- **Implement**: Acceptance criteria says "event registration", and application events also insert `event_registration` rows with `pending_review`. Prefer adding the same checked-by-default chapter newsletter checkbox to the application modal and passing it through `applyForEvent()`. If implementation scope keeps only open registration, add a short plan note and GitHub comment explicitly making application-event parity a follow-up.
- **Mirror**: `lib/services/event.service.ts:227`
- **Validate**: `pnpm test lib/services/__tests__/event.service.test.ts`

### Task 7: Update Seed And Testing Docs

- **Files**: `supabase/seed.sql`, `docs/handbook/TESTING.md`
- **Action**: Update
- **Implement**: Seed deterministic examples: a global active subscription, a chapter active subscription, and an unsubscribed row so future campaign planning can test respecting inactive/unsubscribed status. Update the testing handbook with manual validation steps for onboarding opt-in, event registration checkbox checked/unchecked, and unsubscribe state.
- **Mirror**: `docs/handbook/TESTING.md:20`
- **Validate**: `pnpm supabase db reset`

### Task 8: Final Validation And GitHub Updates

- **Files**: all changed files
- **Action**: Validate and update issue
- **Implement**: Run all validation, mark this plan checklist complete during implementation, comment results on #9, close sub-issues, and move #9 to review.
- **Mirror**: LEAD-006 plan workflow in `.github/plans/lead-006-chapter-membership-foundation.plan.md`
- **Validate**:

```bash
pnpm supabase db reset
pnpm test lib/services/__tests__/newsletter-subscription.service.test.ts
pnpm test lib/services/__tests__/student.service.test.ts
pnpm test lib/services/__tests__/event.service.test.ts
pnpm test
pnpm lint
git diff --check
```

## Acceptance Criteria Mapping

- [x] Global onboarding opt-in creates or reactivates a global `newsletter_subscription`.
- [x] Chapter interests/onboarding selected chapter create or reactivate chapter subscriptions.
- [x] Event registration checked checkbox creates or reactivates owner/collaborator chapter subscriptions.
- [x] Unsubscribed/inactive rows remain queryable so future campaign planning can respect them.

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Existing duplicate rows block new unique indexes | Add a pre-index cleanup/dedupe step in the migration if local reset or production drift exposes duplicates |
| Global opt-in vs chapter interest semantics are ambiguous | Keep global and chapter rows separate; if no explicit chapter-interest multi-select exists, use selected onboarding chapter for LEAD-008 and document future multi-chapter interests as follow-up |
| Event registration succeeds but subscription write fails | Do not fail registration for a newsletter side-effect; log/return service error where possible and cover with tests |
| Application events are forgotten | Task 6 forces a decision: include application path or create an explicit follow-up with GitHub comment |
| Unsubscribe gets overwritten accidentally | Reactivate only on explicit opt-in sources; never delete rows; always clear/set `unsubscribed_at` consistently |
| RLS regression | Keep policies based on `auth.uid()`, `public.is_admin()`, and `public.is_chapter_editor(chapter_id)` |

## Out Of Scope

- Campaign builder UI
- Email delivery engine
- Preference center UI beyond the service foundation
- Segment export/reporting UI
- Full multi-chapter interest picker unless implementation finds one already present
