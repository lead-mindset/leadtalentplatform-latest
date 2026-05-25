# Plan: Roadmap Phase 4.0 - Multi-event Operations Readiness Validation

## Summary

Validate that LEAD Talent Platform can support real event operations before LEAD SPARK by exercising the event workflow in local Docker with deterministic seed personas and disposable local-only test rows. This issue should produce evidence for public discovery, open registration, application-based events with native questions, chapter editor management, application approval/rejection, check-in, and admin oversight. It should also create a minimum operating checklist chapters can follow before using the platform for real events.

This is a validation and readiness issue, not a production launch. It must not touch QA or production. Local Docker mutations are allowed only for disposable #132 validation rows and must be cleaned up or documented with rollback instructions.

## User Story

As Abigail and the LEAD operations team,  
I want to validate the full event operations flow with seeded local users,  
so that smaller events and LEAD SPARK do not become the first real test of registration, applications, editor workflows, and check-in.

## Metadata

| Field | Value |
| --- | --- |
| Type | VALIDATION / OPERATIONS |
| Complexity | MEDIUM |
| GitHub Issue | #132 |
| GitHub URL | `https://github.com/lead-mindset/leadtalentplatform-latest/issues/132` |
| Parent Roadmap | #130 |
| Depends On | Current event platform behavior and seeded local personas |
| Source Accounts | `docs/handbook/TESTING.md` |
| Main Services | `lib/services/event.service.ts`, `lib/services/event-application.service.ts` |
| Main Actions | `lib/actions/events/*` |
| Report | `.github/reports/issue-132-multi-event-operations-readiness-validation-report.md` |
| Checklist | `docs/handbook/EVENT-OPERATIONS-CHECKLIST.md` |
| Evidence Directory | `tmp/event-ops-132/` |

## Current Codebase Context

- Event business logic lives in `lib/services/event.service.ts`.
- Native application questions/answers live in `lib/services/event-application.service.ts`.
- Server actions in `lib/actions/events/` are thin controllers for create/update/register/check-in/application review.
- Local seed personas are documented in `docs/handbook/TESTING.md`.
- Local seed includes `participant@test.com`, `editor@test.com`, and `admin@test.com`.
- `supabase/seed.sql` includes deterministic published events and native application question fixtures, but #132 should create its own disposable validation events so results are not confused with normal seed content.

## Validation Strategy

Create a local-only script that:

1. Loads `.env.local`.
2. Refuses to run unless `NEXT_PUBLIC_SUPABASE_URL` points to `localhost` or `127.0.0.1`.
3. Uses `SUPABASE_SERVICE_ROLE_KEY` only for local validation setup and cleanup.
4. Deletes previous #132 disposable rows by deterministic IDs before starting.
5. Creates:
   - one published open-registration event owned by `leaduni`,
   - one published application-based event owned by `leaduni` with native questions.
6. Uses seed users:
   - `participant@test.com` for public participant registration/application,
   - `editor@test.com` for chapter editor ownership/management/check-in,
   - `admin@test.com` for admin oversight query.
7. Exercises service-layer behavior for:
   - public event discoverability,
   - open registration,
   - application submission with answers,
   - application approval and rejection paths,
   - check-in candidate resolution and attendee check-in,
   - admin event listing.
8. Writes aggregate evidence only under `tmp/event-ops-132/`.

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `scripts/event-ops-readiness-validation.ts` | CREATE | Local-only validation harness for disposable #132 event ops flow. |
| `package.json` | UPDATE | Add `event-ops:readiness` script. |
| `docs/handbook/EVENT-OPERATIONS-CHECKLIST.md` | CREATE | Minimum operating checklist for chapters running events. |
| `.github/reports/issue-132-multi-event-operations-readiness-validation-report.md` | CREATE | Validation evidence, results, blockers, and recommendation. |
| `.github/plans/issue-132-multi-event-operations-readiness-validation.plan.md` | UPDATE | Track task status during implementation. |

## Disposable Local Data Contract

Use deterministic IDs/prefixes so cleanup is safe and repeatable:

| Object | ID / Prefix |
| --- | --- |
| Open event | `13200000-0000-4000-8000-000000000001` |
| Application event | `13200000-0000-4000-8000-000000000002` |
| Required application question | `13200000-0000-4000-8000-000000000101` |
| Optional URL application question | `13200000-0000-4000-8000-000000000102` |

Before each run, delete #132 rows from:

- `event_application_answer`
- `event_application_question`
- `event_registration`
- `event_chapter`
- `event`

Only delete rows matching the deterministic #132 event/question IDs.

## Tasks

### Task 1: Confirm Local Preconditions

Status: Completed

- **Action**: INSPECT
- **Implement**:
  - Confirm `.env.local` has local Supabase URL and service role key.
  - Confirm local Docker is reachable.
  - Confirm seed users exist for participant, editor, and admin.
  - Confirm `leaduni` exists.
- **Validate**:
  - Script should fail clearly if any precondition is missing.

### Task 2: Add Local Event Ops Validation Harness

Status: Completed

- **File**: `scripts/event-ops-readiness-validation.ts`
- **Action**: CREATE
- **Implement**:
  - Parse flags:
    - `--out`, default `tmp/event-ops-132`
    - `--keep-data`, default false
    - `--help`
  - Load `.env.local` without printing secrets.
  - Refuse non-local Supabase URLs.
  - Create Supabase service client.
  - Cleanup prior #132 disposable rows.
  - Create/publish open and application events.
  - Create native application questions for the application event.
  - Verify public discoverability by querying published events.
  - Register participant for open event through `EventService.registerForEvent`.
  - Apply participant/member to application event through `EventService.applyForEvent` with native answers.
  - Approve one application and reject one application using existing service methods or RPC/action-equivalent service calls.
  - Resolve check-in candidate for the approved/open registration and check in attendee.
  - Verify checked-in counter.
  - Verify admin event listing includes the disposable events.
  - Write `event-ops-readiness-summary.json`.
  - Write `event-ops-readiness-report.md`.
  - Cleanup disposable rows unless `--keep-data` is passed.
- **Validate**:
  - `pnpm event-ops:readiness` exits 0 when local Docker is running.
  - Output contains no secrets and no full PII dumps.

### Task 3: Add Package Script

Status: Completed

- **File**: `package.json`
- **Action**: UPDATE
- **Implement**:

```json
"event-ops:readiness": "tsx scripts/event-ops-readiness-validation.ts"
```

- **Validate**:
  - `pnpm event-ops:readiness -- --help`

### Task 4: Create Chapter Event Operations Checklist

Status: Completed

- **File**: `docs/handbook/EVENT-OPERATIONS-CHECKLIST.md`
- **Action**: CREATE
- **Implement**:
  - Spanish-first operational checklist for chapter leaders.
  - Include sections:
    - before creating an event,
    - event configuration,
    - open registration vs application,
    - application questions,
    - application review,
    - check-in day-of-event,
    - post-event evidence,
    - escalation/support path.
  - Keep it practical and short enough for chapter operators.
  - Mention that public participants can register/apply without chapter membership.
  - Mention that check-in evidence matters for future Impact Metrics.
- **Validate**:
  - Checklist aligns with actual routes/actions and does not promise unavailable features.

### Task 5: Run Service-Level Regression Tests

Status: Completed

- **Action**: VALIDATE
- **Commands**:

```bash
pnpm test -- lib/services/__tests__/event.service.test.ts lib/services/__tests__/event-application.service.test.ts lib/actions/events/__tests__/register.helpers.test.ts
pnpm exec eslint scripts/event-ops-readiness-validation.ts lib/services/event.service.ts lib/services/event-application.service.ts lib/actions/events/register.helpers.ts
```

- **Validate**:
  - Existing event/application service tests pass.
  - New script lints.

### Task 6: Run Local Readiness Harness

Status: Completed

- **Action**: RUN
- **Command**:

```bash
pnpm event-ops:readiness
```

- **Validate**:
  - Open event registration passes.
  - Application event submission with answers passes.
  - Application review approval/rejection passes.
  - Check-in candidate and check-in pass.
  - Admin event oversight query passes.
  - Disposable rows are cleaned up unless `--keep-data` is used.

### Task 7: Create GitHub Report

Status: Completed

- **File**: `.github/reports/issue-132-multi-event-operations-readiness-validation-report.md`
- **Action**: CREATE
- **Implement**:
  - Summarize tested flows and pass/fail status.
  - Include evidence paths under `tmp/event-ops-132/`.
  - Include known gaps and whether they block wider usage.
  - Include recommendation:
    - `Ready for controlled event ops pilot`,
    - `Ready with caveats`,
    - or `Not ready`.
  - Explicitly state local-only validation and no QA/production changes.
- **Validate**:
  - Report does not expose secrets or unnecessary participant PII.

### Task 8: Update GitHub Issue

Status: Completed

- **Action**: UPDATE
- **Implement**:
  - Comment on #132 with:
    - plan path,
    - report path,
    - checklist path,
    - validation summary,
    - recommendation,
    - any blockers/follow-ups.
  - Close #132 only if acceptance criteria pass.

## Acceptance Criteria

- [x] At least one open event is tested end-to-end.
- [x] At least one application-based event with native questions is tested end-to-end.
- [x] Public participant can register/apply without chapter membership.
- [x] Chapter editor-owned event operations are validated without admin access.
- [x] Application review approval/rejection is validated.
- [x] Check-in evidence is captured correctly.
- [x] Admin event oversight is validated.
- [x] Minimum event operating checklist exists for chapters.
- [x] Known gaps are documented before wider usage.
- [x] QA and production are not touched.

## Out Of Scope

- LEAD SPARK-specific event buildout.
- Production event creation.
- QA data refresh.
- Real member invitations.
- Real company access.
- UI redesign.
- Importing real e-board members from #131/#134.
- Fixing unrelated event UX issues unless they are P0 blockers discovered during validation.
