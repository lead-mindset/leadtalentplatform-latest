# Plan: LEAD-019 Validate Multi-Chapter Event Collaboration

## Summary

Validate and harden multi-chapter event collaboration permissions. The core access helper already supports owner-chapter and collaborator-chapter editors through `canUserManageEvent()`, and chapter event listings already merge owned plus collaborated events through `EventService.getChapterEvents()`. This issue should prove those paths with focused tests and make small recovery fixes only where the validation exposes drift.

## User Story

As a chapter editor,
I want collaborative event permissions to work correctly,
So that all host chapters can manage shared events without overexposing unrelated chapter data.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #20 |
| Type | Technical |
| Complexity | Medium |
| Systems Affected | Auth access helpers, event collaborator services, chapter event listing, event manager actions, tests |
| Dependencies | LEAD-016 |
| Blocks | None |

## Problem

Editors from collaborating chapters must be allowed to manage shared events, while unrelated editors must be denied. Chapter event management pages must show owned and collaborated events, public browsing must continue to discover published events, and service-level tests must lock the collaborator behavior so future event PIVs do not regress it.

## Codebase Findings

### Permission Source

Source: `lib/auth.ts`

`canUserManageEvent()` loads the event, allows admins, requires editor role plus approved `chapter_membership`, allows owner-chapter editors, and checks `event_chapter` for collaborator access.

Source: `lib/auth.test.ts`

Existing tests already cover admin bypass, owner editor allow, collaborator editor allow, non-editor deny, and non-collaborator editor deny.

Gap: `canUserAccessChapter()` has similar event-scoped collaborator logic but lacks direct tests. Add coverage so chapter-scoped helpers and event-scoped helpers stay aligned.

### Event Manager Actions

Source: `lib/actions/events/access.ts`

`assertCanManageEvent()` is a thin server action helper that delegates authorization to `canUserManageEvent()`.

Source: `lib/actions/events/update-event.ts`, `delete-event.ts`, `checkin.ts`, `bulk-approve.ts`, and application pages

Event manager paths call `assertCanManageEvent()`, so collaborator access should flow through the shared helper instead of duplicating checks.

### Event Listing

Source: `lib/services/event.service.ts`

`getChapterEvents()` queries owned events from `event_with_chapter`, then `event_chapter` rows for the editor chapter, fetches collaborated events, dedupes by event id, and returns `is_owned_by_chapter`.

Gap: add a service test that proves owned and collaborated events both appear, duplicate owner/collab rows are deduped, and collaborated events are marked `is_owned_by_chapter: false`.

### Collaborator Management

Source: `lib/services/event.service.ts`

`addEventCollaborator()` blocks invalid event IDs, prevents adding the owner chapter, prevents duplicate collaborators, and inserts `event_chapter` rows. `removeEventCollaborator()` deletes by collaborator id. `getEventCollaborators()` filters owner rows from the returned collaborator list.

Gap: existing tests cover service helpers, but LEAD-019 should verify these still run with the new account model and that action-level authorization remains delegated.

## Design

### Scope

Keep this as a validation/recovery issue:

- Do not redesign the collaborator manager UI.
- Do not introduce new schemas or RLS policies unless tests reveal a gap.
- Do not change public event discovery semantics beyond verifying published event listing still includes events regardless of collaborator chapters.

### Tests To Add/Confirm

- `lib/auth.test.ts`
  - Add direct tests for `canUserAccessChapter()`:
    - owner chapter access allowed.
    - collaborator access allowed when event id is provided.
    - unrelated editor denied without collaboration.
    - non-editor denied.
- `lib/services/__tests__/event.service.test.ts`
  - Add `getChapterEvents()` coverage for owned + collaborated events.
  - Confirm duplicate event ids are deduped.
  - Confirm `is_owned_by_chapter` is false for collaborated events.
- Existing collaborator service tests should remain green.

### Fixes If Needed

If tests reveal drift:

- Keep business logic in `lib/services/` or `lib/auth.ts`.
- Keep server actions thin.
- Preserve `event_chapter` as the source of collaborator scope.
- Keep admin bypass in `canUserManageEvent()` without profile/membership dependencies.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/auth.test.ts` | Update | Add direct tests for chapter-scoped collaborator access through `canUserAccessChapter()`. |
| `lib/services/__tests__/event.service.test.ts` | Update | Add chapter event listing tests for owned/collaborated/deduped events. |
| `lib/auth.ts` | Update if needed | Fix any collaborator access drift exposed by tests. |
| `lib/services/event.service.ts` | Update if needed | Fix chapter event listing or collaborator semantics exposed by tests. |
| `docs/handbook/TESTING.md` | Update if needed | Add manual checks for shared event collaboration if validation reveals missing docs. |

## Tasks

- [x] Confirm `canUserManageEvent()` allows owner and collaborator editors and denies unrelated editors.
- [x] Add direct `canUserAccessChapter()` tests for owner, collaborator, unrelated editor, and non-editor cases.
- [x] Add `getChapterEvents()` service tests for owned plus collaborated events.
- [x] Confirm collaborated events are discoverable in chapter manager listings and marked `is_owned_by_chapter: false`.
- [x] Confirm duplicate owner/collaborator rows dedupe to one event.
- [x] Confirm public event discovery remains driven by published event listing, not editor collaborator scope.
- [x] Run focused validation: `pnpm vitest run lib/auth.test.ts lib/services/__tests__/event.service.test.ts`.
- [x] Run architecture guard: `pnpm vitest run tests/architecture.test.ts`.
- [x] Run full validation: `pnpm test`, `pnpm lint`, and `pnpm build`.
- [x] Comment on Issue #20 with implementation summary and validation results.

## Validation

```bash
pnpm vitest run lib/auth.test.ts lib/services/__tests__/event.service.test.ts
pnpm vitest run tests/architecture.test.ts
pnpm test
pnpm lint
pnpm build
```

Latest validation:

- `pnpm vitest run lib/auth.test.ts lib/services/__tests__/event.service.test.ts` passed: 2 files, 69 tests.
- `pnpm vitest run tests/architecture.test.ts` passed: 1 file, 5 tests.
- `pnpm test` passed: 15 files, 216 tests.
- `pnpm lint` passed with 99 warnings, 0 errors.
- `pnpm build` passed.

## GitHub Follow-Up

- Add/keep `has-plan` on Issue #20.
- Comment with this plan path: `.github/plans/lead-019-validate-multi-chapter-event-collaboration.plan.md`.
- Close Issue #20 after validation passes and any discovered recovery fixes are complete.
