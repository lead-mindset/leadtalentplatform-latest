# Issue #92: Seed Published Demo Events

GitHub: https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/92

## Summary

Add deterministic local Supabase seed events so the participant activation flow has real content to test after `supabase db reset`. The seed should include a realistic past LEAD event catalog inspired by the provided examples, remove noisy/fake event rows, and add enough future published events for local QA of `/events`, event details, registration, application-based event forms, and dashboard CTAs from #91.

This is a seed-data issue only. Do not refactor `/events` UI or registration logic.

## User Story

As a local tester,
I want realistic published LEAD events in seed data,
so that onboarding, participant dashboard links, event browsing, and registration flows can be tested immediately without manually creating events.

## Metadata

| Field | Value |
| --- | --- |
| Type | Enhancement / Database |
| Complexity | Small |
| GitHub Issue | #92 |
| Systems Affected | `supabase/seed.sql`, local Supabase seed data, event application question fixtures |
| Source PRD | `.github/PRDs/participant-onboarding-chapter-activation.prd.md` |
| Spec | `.github/issues/participant-onboarding-chapter-activation-issues.md` |

## Decisions From Grill

- Keep real-style historical LEAD examples as past published events.
- Remove noisy/fake events such as `fewfafew`, `1111fewfew`, and placeholder descriptions.
- Add fresh future published events for QA; total can exceed 15.
- Ensure at least 15 future published events are usable for event browsing and registration testing.
- Use native `event_application_question` rows for application-based future events.
- Do not seed event registrations in #92.
- Use deterministic seed UUIDs, not production-looking IDs.
- Delete known demo event/question IDs first, then insert.
- Use seeded editor `33333333-3333-3333-3333-333333333333` for LEAD UNI-owned events.
- Use seeded admin `44444444-4444-4444-4444-444444444444` for cross-chapter and non-UNI events.
- Spanish-first, polished LEAD community tone.
- Keep `/events` page unchanged; a future issue can split upcoming/past if needed.

## Existing Patterns

### Seed Structure

- `supabase/seed.sql` currently inserts chapters first, then deterministic auth users, app users, person profiles, memberships, identities, recruiter access, and newsletter subscriptions.
- Event seed data should be appended after persona setup so `created_by_id` values already exist.

### Event Schema

From `lib/database.generated.ts`, `public.event` supports:

- `id`
- `title`
- `description`
- `cover_image`
- `start_at`
- `end_at`
- `location`
- `meeting_url`
- `event_type`
- `capacity`
- `is_published`
- `chapter_id`
- `created_by_id`
- `access_model`
- `application_form_url`
- `location_name`
- `location_address`
- `location_city`
- `location_region`
- `location_latitude`
- `location_longitude`
- `location_point`

### Public Event Read Path

- `EventService.getPublishedEvents()` reads from `event_with_chapter`, filters `is_published = true`, and orders by `start_at` ascending.
- `/events` displays format, chapter, location, capacity, registration count, and application/open labels.

### Application Questions

- `event_application_question` supports `short_text`, `long_text`, `single_select`, `checkbox`, and `url`.
- #92 should seed questions only, not answers or registrations.

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `supabase/seed.sql` | UPDATE | Add deterministic past and future published events plus native application questions. |
| `.github/plans/issue-92-seed-published-demo-events.plan.md` | UPDATE | Track implementation and validation results. |

## Seed Design

### Past Published Catalog

Add a historical LEAD catalog inspired by the user's examples. These should remain past events and feel like real activity history:

- Networking Night Lima
- Networking Trujillo - Edicion Verano
- Leadership Workshop Series
- AI & Innovation Panel
- LEAD UPN - Finanzas Personales
- LEAD Villarreal - Networking Empresarial
- LeadTech Summit
- Product Design Sprint
- LEAD UPC 1 Year Anniversary
- AXIS Summit
- LEAD Coderhouse - Intro a Programacion
- Startup Weekend LEAD
- LEAD HER - Women in STEM
- MENTES EN VIVO - Diseno de Interfaces
- IBM Integration Day

Use clean titles/descriptions, no fake cover images, and existing chapter IDs/locations.

### Future QA Events

Add at least 15 future published events, with a deliberate mix:

- Formats: `in_person`, `online`, `hybrid`
- Access: mostly `open`, at least 3 `application`
- Capacity: mix of `null`, small limited capacity, and medium capacity
- Chapters: spread across existing chapters such as `leaduni`, `leadpucp`, `leadupc`, `leadutec`, `leadunmsm`, `leadupntrujillo`, `leadunsa`, `leadusil`
- Dates: future relative to the current project context; use explicit 2026 dates after May 7, 2026.

Recommended future event themes:

- Taller de Liderazgo para Nuevos Miembros
- Product Sprint LEAD
- Foro Mujeres en STEM
- Pitch Lab para Emprendedores
- Data Analytics Bootcamp
- Networking Intercapitulos Lima
- Career Readiness Clinic
- AI for Social Impact
- Finanzas Personales para Universitarios
- LEAD Tech Night
- Public Speaking Lab
- Community Impact Challenge
- UX Research Workshop
- Founder Stories: Peru
- Simulacion de Entrevistas

### Native Application Question Fixtures

For at least 3 future `access_model = 'application'` events, insert `event_application_question` rows. Include a mix of:

- `short_text`
- `long_text`
- `single_select`
- `checkbox`
- `url`

Question examples:

- "Por que quieres participar en este evento?"
- "Que experiencia o interes quieres fortalecer?"
- "Selecciona tu area principal de interes."
- "Que temas te gustaria trabajar durante la sesion?"
- "Comparte un enlace a tu LinkedIn o portafolio."

## Implementation Tasks

- [x] Add deterministic seed cleanup block.
  - **File**: `supabase/seed.sql`
  - **Action**: UPDATE
  - **Implement**: Delete known seeded `event_application_question` rows and `event` rows by deterministic UUID lists before inserting.
  - **Validate**: SQL remains syntactically readable and scoped to known demo IDs only.

- [x] Insert past published LEAD event catalog.
  - **File**: `supabase/seed.sql`
  - **Action**: UPDATE
  - **Implement**: Insert polished past events inspired by the provided examples with stable IDs, real chapter IDs, locations, coordinates, and `is_published = true`.
  - **Validate**: Past event rows use existing chapter IDs and seeded admin/editor `created_by_id`.

- [x] Insert future published QA events.
  - **File**: `supabase/seed.sql`
  - **Action**: UPDATE
  - **Implement**: Insert at least 15 future events after May 7, 2026 with mixed formats, access models, capacities, chapters, and locations.
  - **Validate**: At least 15 future events have `is_published = true` and `end_at > NOW()` after reset.

- [x] Insert native application questions.
  - **File**: `supabase/seed.sql`
  - **Action**: UPDATE
  - **Implement**: Insert application questions for at least 3 future application-based events using current `event_application_question` columns.
  - **Validate**: No `event_application_answer` or `event_registration` rows are seeded.

- [x] Verify with local Supabase.
  - **Command**: `pnpm supabase db reset`
  - **Follow-up SQL**:
    - Count all published events.
    - Count future published events.
    - Count application-based future events with questions.
  - **Validate**: Reset succeeds; counts satisfy #92 acceptance criteria.

- [x] Run project validation.
  - **Commands**:
    - `pnpm test`
    - `pnpm lint`
    - `pnpm build`
  - **Validate**: Tests/build pass; lint has no new errors.

- [x] Update GitHub.
  - **Issue**: #92
  - **Action**: Comment with plan path, seed summary, counts, and validation results.
  - **Labels**: Keep/add `has-plan`.

## Validation Queries

Use equivalent SQL after reset:

```sql
SELECT COUNT(*) AS published_events
FROM public.event
WHERE is_published = true;

SELECT COUNT(*) AS future_published_events
FROM public.event
WHERE is_published = true
  AND end_at > NOW();

SELECT COUNT(DISTINCT e.id) AS future_application_events_with_questions
FROM public.event e
JOIN public.event_application_question q ON q.event_id = e.id
WHERE e.is_published = true
  AND e.access_model = 'application'
  AND e.end_at > NOW();
```

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Seed data becomes noisy or fake-looking | Remove placeholder rows; use polished Spanish-first LEAD copy. |
| Future dates become stale later | Use dates sufficiently far in 2026 for current QA; revisit in future seed maintenance issue if needed. |
| Seed reset duplicates events | Delete deterministic event/question IDs before insert. |
| Non-UNI events created by UNI editor violate realism | Use admin user for non-UNI and cross-chapter events. |
| Application event fixtures miss LEAD-018 needs | Add native questions across at least 3 future application events. |
| Coordinates or location_point cause SQL errors | Prefer known chapter coordinates/location_point from existing chapter seed rows; use `null` only when acceptable for online events. |

## Done Criteria

- `supabase/seed.sql` includes realistic past published events and at least 15 future published QA events.
- No noisy/fake event rows are introduced.
- At least 3 future application-based events have native questions.
- No event registrations are seeded.
- `pnpm supabase db reset` succeeds or blocker is documented.
- Counts and validation results are posted to #92.

## Implementation Results

- Added 15 past published LEAD catalog events inspired by the provided examples.
- Added 15 future published QA events dated after May 7, 2026.
- Added native application questions for 5 future application-based events.
- Seeded 0 event registrations.
- `pnpm supabase db reset` passed after a transient first-run Storage health retry.

Post-reset counts:

- Published events: 30
- Future published events: 15
- Future application events with native questions: 5
- Seeded registrations: 0

Validation:

- `pnpm test` passed: 16 files, 259 tests.
- `pnpm lint` passed with 89 existing warnings and 0 errors.
- `pnpm build` passed.
