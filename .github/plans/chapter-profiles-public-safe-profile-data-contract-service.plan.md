# Plan: Chapter Profiles Public-Safe Profile Data Contract and Service

## Summary

Implement issue #155 by adding a service-layer API that resolves public-safe chapter profile data by chapter ID. This creates the data contract needed by later chapter profile and directory UI work without changing the current public chapter page yet.

## User Story

As a student, I want chapter profile pages to use reliable public-safe data, so that I can discover chapters without seeing private or misleading internal information.

## Metadata

| Field | Value |
| --- | --- |
| GitHub Issue | #155 |
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Chapter services, tests |
| Parent | #141 |
| Status | Implemented |

## Current Patterns

- `ChapterService` owns chapter/member business logic in `lib/services/chapter.service.ts`.
- Existing chapter page data is currently fetched directly in `app/[locale]/chapter/[id]/page.tsx`.
- Service tests use local Supabase chain mocks in `lib/services/__tests__/chapter.service.test.ts` and `lib/services/__tests__/event.service.test.ts`.

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `lib/services/chapter-profile.service.ts` | CREATE | Public-safe chapter profile resolver and data contract |
| `lib/services/__tests__/chapter-profile.service.test.ts` | CREATE | Unit tests for found, missing, sparse, and active chapters |
| `.github/plans/chapter-profiles-public-safe-profile-data-contract-service.plan.md` | UPDATE | Track validation status |

## Tasks

### Task 1: Create Public Chapter Profile Service

- **File**: `lib/services/chapter-profile.service.ts`
- **Action**: CREATE
- **Implement**:
  - Export `ChapterProfileService.getPublicChapterProfile(supabase, chapterId)`.
  - Return `null` for missing/error chapter.
  - Include chapter identity, location/social fields, upcoming published events, approved member count, past published event count, and team preview.
  - Keep team preview public-safe: no emails, no unapproved memberships, no admin concepts.
  - Include empty-state flags for no upcoming events and no team preview.
- **Validate**: `pnpm test -- chapter-profile.service`

### Task 2: Add Unit Tests

- **File**: `lib/services/__tests__/chapter-profile.service.test.ts`
- **Action**: CREATE
- **Implement**:
  - Found chapter with events/members/counts.
  - Missing chapter returns null.
  - Sparse chapter returns empty arrays and zero counts.
  - Unapproved memberships/private emails are not exposed.
- **Validate**: `pnpm test -- chapter-profile.service`

### Task 3: Validate and Update GitHub

- **Action**: VALIDATE
- **Implement**:
  - Run targeted tests.
  - Run lint/build if needed after type-level changes.
  - Comment results on #155 and close if successful.

## Acceptance Criteria

- [x] Service-layer API resolves a chapter profile by chapter ID.
- [x] Profile includes identity, location/social fields, upcoming events, approved count, past count, and public-safe team preview.
- [x] Missing chapters return `null`.
- [x] Sparse chapters return usable empty state flags.
- [x] Public-safe rules avoid unapproved memberships, private emails, or admin-only concepts.
- [x] Unit tests cover found/missing/sparse/active chapter scenarios.

## Validation Results

Completed on 2026-05-11.

```bash
pnpm test -- chapter-profile.service
# 1 file passed, 4 tests passed

pnpm lint
# Passed with pre-existing warnings only
```
