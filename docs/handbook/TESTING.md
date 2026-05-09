# Testing Handbook

All new business logic in `lib/services/` **must** have 100% unit test coverage before merging.

## Philosophy

We follow a **Service Layer Pattern** (see `docs/adr/001-service-layer-pattern.md`).

- **Services** are pure functions/classes that contain all database queries and business rules.
- **Server Actions** are "thin controllers" — they only handle auth, Zod validation, and call services.
- This separation makes tests fast, deterministic, and framework-agnostic.

## Multi-Role Testing Strategy

Due to the complex, multi-role nature of the platform (Participants, Members, Editors, Admins, Staff, Company Representatives, and Alumni), tests should rely on **deterministic seed personas** rather than ad-hoc setups.

### Seed Personas Matrix
We maintain standard local accounts in `supabase/seed.sql` pre-loaded with the necessary auth and schema structures. Shared QA data is refreshed only through the manual GitHub Action that runs `supabase/qa.seed.sql`.

| Persona | Email | Required Tables / State |
|---------|-------|-------------------------|
| **Public Participant** | `participant@test.com` | `public.user.role='member'`, `person_profile` |
| **Member** | `member@test.com` | `public.user.role='member'`, `person_profile`, `chapter_membership` (`position='member'`, `status='approved'`) |
| **Editor** | `editor@test.com` | `public.user.role='editor'`, `person_profile`, `chapter_membership` (`position='editor'`, `status='approved'`) |
| **Admin** | `admin@test.com` | `public.user.role='admin'`, `person_profile`, `lead_identity` (`identity_type='founder'`) |
| **Staff** | `staff@test.com` | `public.user.role='admin'`, `person_profile`, `lead_identity` (`identity_type='staff'`) |
| **Company Representative** | `recruiter@test.com` | `public.user.role='recruiter'`, `person_profile`, active accepted `recruiter_access` |
| **Alumni** | `alumni@test.com` | `public.user.role='member'`, `person_profile`, `chapter_membership` (`position='member'`, `status='alumni'`) |

*(All seed accounts share the same password: `password123` for manual UI testing).*

### Auth in Tests
For unit testing service functions (`lib/services/`), **do not use real authentication**. Mock the Supabase Client as the correct user context. 
If testing server actions or E2E flows, utilize the standard seed credentials rather than relying on external providers like Google OAuth.

For hosted QA signup smoke tests, verify email/password and Google separately:

- Email/password signup should create an unconfirmed auth user and send the confirmation email to a QA-origin redirect URL.
- Google OAuth should return a redirect to Google from the QA Supabase project. If it returns `Unsupported provider`, the QA Supabase Google provider is not enabled.
- Delete smoke-test auth users after API-level tests so shared QA data stays clean.

### Admin Role vs LEAD Identity

Admin access is controlled by `public.user.role`, not by `lead_identity`:

- `public.user.role='admin'` is the authorization source for admin routes, server actions, and RLS bypass behavior.
- `lead_identity.identity_type='founder'` or `identity_type='staff'` is public LEAD status/display data; it does not grant admin access by itself.
- Do not create or test an `admin` LEAD identity type. Admin is an app role, not an official public identity.
- Local `admin@test.com` should have `public.user.role='admin'` plus a founder identity.
- Local `staff@test.com` should have `public.user.role='admin'` plus a staff identity.

### Company Representative Invite Access Flow (LEAD-022)

Company representative access is invite-only and independent from student onboarding:

- Accepting a valid company representative invite must set or preserve `public.user.role='recruiter'`.
- Accepted access must set `recruiter_access.accepted_at`, `accepted_by_user_id`, and `is_active=true`.
- Company routes should authorize company representatives from `public.user.role='recruiter'` plus active, non-revoked `recruiter_access`.
- Company representatives must not need `person_profile` or `chapter_membership` to use `/company/*` pages.
- Revoked, expired, missing, or inactive access should land in the company onboarding/help state, not student onboarding.
- Manual validation should use `recruiter@test.com` and confirm active accepted access reaches `/company/dashboard`.

### Basic Person Profile Flow (LEAD-005)

The public participant profile foundation is intentionally separate from chapter membership:

- `PersonProfileService.upsertBasicProfile()` must update `public.user` contact fields and upsert `person_profile`.
- Basic profile tests must assert `chapter_membership` is not required and not written.
- Returning-user flows should call `PersonProfileService.getBasicProfile()` and prefill reusable fields.
- Manual validation should use `participant@test.com` and confirm the account can complete/reuse `person_profile` without a `chapter_membership` row.
- RLS validation should confirm authenticated users can insert/update/select only their own `person_profile`; admins may access all profiles.

### Basic Onboarding Flow (LEAD-013)

Basic onboarding is a thin action over the profile and newsletter services:

- The action must validate form input with Zod, call `PersonProfileService.upsertBasicProfile()`, and never call `StudentService.submitOnboarding()`.
- Resume upload, chapter application, `lead_chapter`, and `chapter_membership` writes are out of scope for this flow.
- Global newsletter opt-in should call `NewsletterSubscriptionService.subscribeGlobal()` with `source='onboarding'`.
- Selected chapter interests should call `NewsletterSubscriptionService.subscribeToChapters()` with `source='onboarding'`.
- Manual validation should submit `/onboarding`, then confirm `person_profile` and `newsletter_subscription` rows exist while no new `chapter_membership` row is created.

### Event Registration With Basic Profile (LEAD-014)

Public event registration uses `person_profile` as the readiness gate:

- Guests may browse public events, but registration and application CTAs must route them to sign in.
- Authenticated users without `person_profile` must be routed to `/onboarding?next=/events/{eventId}` before open registration or application submission.
- Authenticated users with `person_profile` can register for open events without `chapter_membership`.
- Event registration tests must preserve capacity, duplicate-registration, cancelled reactivation, and application-event behavior.
- Leaving the event newsletter checkbox checked should call `NewsletterSubscriptionService.subscribeForEventRegistration()` with `source='event_registration'`.
- Helper tests should assert the registration preflight checks `person_profile` and never reads `chapter_membership`.

### Chapter Membership Flow (LEAD-006)

Chapter affiliation is explicit and separate from basic profile data:

- Applying to a chapter must create or reuse a `chapter_membership` row with `status='pending'` and `position='member'`.
- Approval must update the specific `(user_id, chapter_id)` membership row to `status='approved'`, assign `member_id`, set `approved_by_id`, and preserve one approved chapter membership per user.
- Editor promotion must require an approved membership first; assigning a chapter editor should set membership `position='editor'`.
- Alumni should be represented as `chapter_membership.status='alumni'` with a valid position such as `member`; do not encode alumni as a position.
- Manual validation should use `member@test.com`, `editor@test.com`, and `alumni@test.com` to confirm roster tabs, member IDs, positions, and pending approval counts come from `chapter_membership`.

### Newsletter Subscription Flow (LEAD-008)

Newsletter consent is stored in `newsletter_subscription`, not profile tables:

- Global onboarding opt-in should create or reactivate one `scope='global'` row per user.
- Chapter newsletter interests should create or reactivate `scope='chapter'` rows with a concrete `chapter_id`.
- Event registration should keep the host/collaborator chapter checkbox checked by default; leaving it checked should create or reactivate chapter subscription rows for the owner and collaborator chapters.
- Unsubscribe behavior should set `status='unsubscribed'` and `unsubscribed_at`, preserving the row for future campaign planning filters.
- Seed validation includes `participant@test.com` with an active global row, `member@test.com` with an active `leaduni` chapter row, and `alumni@test.com` with an unsubscribed global row.

### Event Application Questions (LEAD-009)

Application questions are first-party event data, not external form state:

- Editors should define ordered `event_application_question` rows for application-based events.
- Service tests must validate required answers, URL answers, select/checkbox options, and ordering.
- Participant submissions must create `event_registration.status='pending_review'` and store answers in `event_application_answer` using `registration_id`.
- Checkbox answers should use `answer_json`; text, URL, and single-select answers should use `answer_text`.
- Manual validation should use `editor@test.com` to create one event with all V1 question types, then `participant@test.com` to submit answers and confirm the editor review screen displays them.
- File upload and branching logic are not part of LEAD-009.

### Legacy Student Profile Migration (LEAD-010)

`student_profile` is a deprecated source table. LEAD-010 preserves its data in the layered model without making it the normal write path:

- `student_profile.major` maps to `person_profile.major_or_interest`, not `person_profile.university`.
- `person_profile.university` should remain null unless a reliable university source exists outside legacy `student_profile`.
- `student_profile.chapter_id`, `approval_status`, `approved_by_id`, and `member_id` map to `chapter_membership`.
- Approved or alumni memberships should have an active `lead_identity` unless the user already has a stronger founder/staff identity.
- `consent_date` and `is_filled` have no direct target; keep them historical until `student_profile` is removed in a later cleanup.
- `supabase/seed.sql` is the canonical local Docker seed file.
- `supabase/qa.seed.sql` is the current manual QA refresh entrypoint.
- `supabase/seed-qa.sql` is a legacy migration fixture for old `student_profile` migration paths. Do not use it for routine QA refreshes.

After `pnpm supabase db reset`, run these checks against local Docker Supabase:

```sql
-- Every legacy profile has a layered person profile.
select count(*) as missing_person_profiles
from public.student_profile sp
left join public.person_profile pp on pp.user_id = sp.user_id
where pp.user_id is null;

-- Reusable fields match the accepted mapping.
select count(*) as profile_mismatches
from public.student_profile sp
join public.person_profile pp on pp.user_id = sp.user_id
where pp.major_or_interest is distinct from sp.major
  or pp.graduation_year is distinct from sp.graduation_year
  or pp.linkedin_url is distinct from sp.linkedin_url
  or pp.skills is distinct from sp.skills
  or pp.gender is distinct from sp.gender;

-- The old false major -> university mapping is gone.
select count(*) as false_university_mappings
from public.student_profile sp
join public.person_profile pp on pp.user_id = sp.user_id
where pp.university = sp.major;

-- Every legacy chapter profile has a membership target.
select count(*) as missing_memberships
from public.student_profile sp
left join public.chapter_membership cm
  on cm.user_id = sp.user_id
 and cm.chapter_id = sp.chapter_id
where sp.chapter_id is not null
  and cm.id is null;
```

### Testing Concurrency (Event Registrations)
When validating risk-prone flows like event registration (e.g., maximum capacity checks), you **must** write unit tests simulating concurrency.

Use `Promise.all()` to simulate simultaneous requests. Example:

```typescript
it('prevents registering over capacity via concurrent requests', async () => {
  // Mock event capacity = 1
  const registrations = Array(5).fill(null).map((_, i) =>
    EventService.registerUser(mockSupabase, { eventId: '123', userId: `user-${i}` })
      .catch(e => e) // Catch errors to prevent Promise.all from failing early
  );

  const results = await Promise.all(registrations);
  const successes = results.filter(r => !(r instanceof Error));

  expect(successes.length).toBe(1); // Only one should succeed
});
```

## Running Tests

```bash
pnpm test         # Run once (CI mode)
pnpm test:watch   # Run in watch mode (development)
```

## Writing Service Tests

### Pattern: Mock the Supabase Client

Services accept `SupabaseClient<Database>` as a parameter. In tests, pass a mocked client:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { EventService } from '../event.service';
import { SupabaseClient } from '@supabase/supabase-js';

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn(),
} as unknown as SupabaseClient;

it('should create an event', async () => {
  (mockSupabase.single as any).mockResolvedValue({
    data: { id: '123', title: 'Test' },
    error: null,
  });

  const result = await EventService.createEvent(mockSupabase, { /* params */ });
  expect(result.id).toBe('123');
});
```

### What to Test

| Scenario | Example |
|---|---|
| Happy path | Service returns expected data on success |
| Validation edge cases | Empty strings, nulls, boundary values |
| Error handling | Supabase returns error → service throws meaningful message |
| Security logic | HTML sanitization strips `<script>` tags |
| Multi-step workflows | `upsertBasicProfile` updates `user` **and** `person_profile` without `chapter_membership` |

### What NOT to Test

- UI rendering (use Playwright for E2E smoke tests)
- Next.js framework behavior (middleware, caching)
- Real database connections (keep tests fast and offline)

## Test File Location

Place tests alongside the service they cover:

```
lib/services/
  event.service.ts
  student.service.ts
  __tests__/
    event.service.test.ts
    student.service.test.ts   # ← add when refactoring Student domain
```

## CI Integration

Tests run automatically in GitHub Actions before any PR can merge:

```yaml
# .github/workflows/ci.yml (to be created)
- run: pnpm test
```

## Coverage Checklist (Definition of Done)

Before submitting a PR:

- [ ] All new functions in `lib/services/*` have at least one test.
- [ ] Both success and error paths are covered.
- [ ] No `any` types in test files.
- [ ] `pnpm test` passes locally.
