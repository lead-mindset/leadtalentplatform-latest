# Plan: Chapter Profiles Public-Safe Team Preview and Activity Signals

## Summary

Implement #157 by tightening the chapter team/community preview and sidebar activity signals so public chapter pages show only approved, public-safe, reliable information.

## Metadata

| Field | Value |
| --- | --- |
| GitHub Issue | #157 |
| Type | ENHANCEMENT |
| Complexity | LOW |
| Systems Affected | Chapter profile components, chapter profile service tests |
| Status | Completed |

## Tasks

### Task 1: Update Team Preview UI

- [x] Use `PublicChapterProfileMember`.
- [x] Do not reference email at all.
- [x] Avoid "Our Team" hierarchy language when positions are not validated.
- [x] Render an intentional empty state for sparse chapters.

### Task 2: Update Activity Signals UI

- [x] Use reliable service stats only.
- [x] Keep labels neutral and student-facing.
- [x] Keep location/directions public-safe.

### Task 3: Extend Tests

- [x] Add an assertion that service output never exposes email even when joined user rows include email-like data.

### Task 4: Validate and Update GitHub

- [x] Run `pnpm test -- chapter-profile.service`.
- [x] Run `pnpm lint`.
- [x] Comment/close #157.

## Acceptance Criteria

- [x] Team/community preview only includes approved members from the service.
- [x] Public UI does not expose member emails.
- [x] UI avoids implying unofficial hierarchy as official leadership.
- [x] Activity signals are limited to reliable counts.
- [x] Sparse chapters render intentionally.
- [x] Tests cover public-safe member/team preview behavior.

## Validation Results

- `pnpm test -- chapter-profile.service` passed.
- `pnpm lint` passed with pre-existing warnings and no errors.
