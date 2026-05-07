# Issue #93: QA Participant Onboarding Activation Flow

GitHub: https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/93

## Summary

Run the closure QA pass for the participant onboarding and activation slice from #88-#92. This issue should prove that local users can test onboarding, chapter intent, participant dashboard states, and seeded event discovery without Google accounts.

This is primarily a verification issue. Keep implementation changes narrow and only fix defects that directly block the QA path.

## User Story

As the engineering team,
I want the participant onboarding activation flow tested end-to-end with deterministic local data,
so that we can move into deeper event PIVs with confidence.

## Metadata

| Field | Value |
| --- | --- |
| Type | Technical / Testing |
| Complexity | Small |
| GitHub Issue | #93 |
| Source PRD | `.github/PRDs/participant-onboarding-chapter-activation.prd.md` |
| Spec | `.github/issues/participant-onboarding-chapter-activation-issues.md` |
| Systems Affected | onboarding, `/student`, `/events`, seed personas, local Supabase |

## Current State

- #89 added the onboarding chapter intent step.
- #90 persists `already_member` and `apply_to_chapter` intents as pending `chapter_membership` rows.
- #91 added the minimal participant activation dashboard.
- #92 added 30 published demo events, including 15 future QA events and native questions for 5 application events.
- Seed personas are documented in `docs/handbook/TESTING.md`.

## Important Finding

`lib/actions/student/onboarding.ts` currently redirects successful onboarding to `/events`.

The PRD and activation flow expect onboarding to land on `/student`, because the dashboard explains whether the user is a participant, pending applicant, approved member, or alumni. Fix this before final QA.

Also, `participant@test.com` already has a `person_profile`, so it will not exercise first-time onboarding. Use fresh local test accounts for onboarding intent QA, and use seeded personas for dashboard state QA.

## QA Matrix

| Scenario | Account / Setup | Expected Result |
| --- | --- | --- |
| Events-only onboarding | Fresh local user | `person_profile` exists, no `chapter_membership`, `/student` shows participant copy. |
| Already part of chapter | Fresh local user, choose chapter | `person_profile` exists, pending `chapter_membership` exists, `/student` shows pending copy. |
| Apply to chapter | Fresh local user, choose chapter | `person_profile` exists, pending `chapter_membership` exists, `/student` shows pending copy. |
| Seed participant dashboard | `participant@test.com` | `/student` shows participant copy, no official member language. |
| Approved member dashboard | `member@test.com` | `/student` shows official member copy and member ID only after approval. |
| Alumni dashboard | `alumni@test.com` | `/student` shows alumni copy, not active official-member language. |
| Event discovery | Guest and participant | `/events` displays seeded published events after reset. |
| Application event discovery | Participant | Application-based seeded events show application behavior/questions where applicable. |

## Files To Inspect Or Change

| File | Action | Purpose |
| --- | --- | --- |
| `lib/actions/student/onboarding.ts` | UPDATE if needed | Redirect successful onboarding to `/student`. |
| `app/[locale]/onboarding/page.tsx` | INSPECT | Confirm returning-profile redirect remains intentional. |
| `components/onboarding.tsx` | INSPECT | Confirm chapter intent UI and chapter newsletter default. |
| `app/[locale]/student/page.tsx` | INSPECT | Confirm dashboard copy and member ID gating. |
| `lib/services/student-dashboard.service.ts` | INSPECT | Confirm status resolution priority. |
| `supabase/seed.sql` | VERIFY | Confirm demo events and personas load after reset. |
| `.github/plans/issue-93-qa-participant-onboarding-activation-flow.plan.md` | UPDATE | Track QA evidence and closure. |

## Implementation Tasks

- [x] Fix direct QA blocker.
  - **File**: `lib/actions/student/onboarding.ts`
  - **Action**: UPDATE
  - **Implement**: Change successful onboarding redirect from `/events` to `/student` if still present.
  - **Validate**: Successful onboarding lands on the activation dashboard.

- [x] Reset local Supabase and verify seeded data.
  - **Command**: `pnpm supabase db reset`
  - **Validate**: Reset succeeds with seed personas and event data.

- [x] Verify event seed counts.
  - **Command**: Use local Docker Postgres query.
  - **Validate**:
    - 30 published events.
    - 15 future published events.
    - 5 future application events with native questions.
    - 0 seeded registrations.

- [ ] Browser QA seeded personas.
  - **Accounts**:
    - `participant@test.com`
    - `member@test.com`
    - `alumni@test.com`
  - **Password**: `password123`
  - **Validate**: Dashboard language matches participant, official member, and alumni states.

- [ ] Browser QA fresh onboarding intents.
  - **Setup**: Create fresh local users through the app or Supabase Auth.
  - **Validate**:
    - `events_only` creates profile only.
    - `already_member` creates pending membership.
    - `apply_to_chapter` creates pending membership.
    - All successful paths land on `/student`.

- [x] Browser QA public event discovery.
  - **Routes**:
    - `/events`
    - selected open event detail
    - selected application event detail
  - **Validate**: Published events are visible and event CTAs match auth/profile state.

- [x] Run automated validation.
  - **Commands**:
    - `pnpm test`
    - `pnpm lint`
    - `pnpm build`
  - **Validate**: Test/build pass; lint has no new errors.

- [ ] Update GitHub and close if clean.
  - **Issue**: #93
  - **Action**: Comment with plan path, manual QA notes, seed counts, and validation results.
  - **Close**: Close #93 if no blocking defects remain.

## Validation Queries

```sql
select count(*) as published_events
from public.event
where is_published = true;

select count(*) as future_published_events
from public.event
where is_published = true
  and end_at > now();

select count(distinct e.id) as future_application_events_with_questions
from public.event e
join public.event_application_question q on q.event_id = e.id
where e.is_published = true
  and e.access_model = 'application'
  and e.end_at > now();

select count(*) as seeded_registrations
from public.event_registration;
```

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Seeded participant cannot test first-time onboarding | Use fresh local accounts for onboarding intent QA. |
| Manual QA mutates seed personas | Reset database before and after destructive checks when needed. |
| Route/session bug is mistaken for product scope | Fix direct blockers; create follow-up issues for unrelated legacy route defects. |
| Official membership copy appears before approval | Check `/student` for participant, pending, approved, and alumni states. |
| Event QA blocked by stale seed data | Run `pnpm supabase db reset` and verify counts before browser QA. |

## Done Criteria

- Onboarding success lands on `/student`.
- All three onboarding intents are manually verified.
- Participant, pending, approved member, and alumni dashboard states are verified.
- Public event discovery works with seeded demo events.
- Validation results are attached to #93.
- Follow-up issues exist for any unrelated defects found during QA.

## Implementation Results

Code fix:

- Changed successful onboarding redirect from `/events` to `/student`.
- Added `/student` revalidation after onboarding submission.

Local Supabase:

- First `pnpm supabase db reset` hit a transient `supabase_storage_linke container is not ready: unhealthy` race.
- `pnpm supabase status` showed the local stack running and Storage healthy.
- Second `pnpm supabase db reset` passed.

Seed counts after reset:

- Published events: 30
- Future published events: 15
- Future application events with native questions: 5
- Seeded registrations: 0

Seed persona checks:

- `participant@test.com` authenticates with `password123` and has no chapter membership.
- `member@test.com` authenticates with `password123` and has approved `member` membership plus `LEAD-UNI-0001`.
- `alumni@test.com` authenticates with `password123` and has `alumni` membership plus `LEAD-UNI-0003`.

Onboarding intent checks:

- Focused helper tests verify `events_only` writes profile/newsletter data without chapter membership.
- Focused helper tests verify `already_member` calls `ChapterMembershipService.applyToChapter()` with `position='member'`.
- Focused helper tests verify `apply_to_chapter` calls `ChapterMembershipService.applyToChapter()` with `position='member'`.
- Focused helper tests verify chapter selection is required for chapter-related intents.

Event discovery:

- `GET http://localhost:3000/en/events` returned HTTP 200 after the dev server warmed.
- Response contained seeded historical and future event names including `Networking Night Lima` and `Product Sprint LEAD`.

Browser automation note:

- In-app browser automation could not run because the local Node runtime used by `node_repl` is `v22.18.0`, while the browser plugin requires `>= v22.22.0`.
- Manual browser click-through remains recommended before closing #93, especially for first-time sign-up/onboarding UI interactions.

Validation:

- Focused tests passed: 2 files, 18 tests.
- `pnpm test` passed: 16 files, 259 tests.
- `pnpm lint` passed with 89 existing warnings and 0 errors.
- `pnpm build` passed.
