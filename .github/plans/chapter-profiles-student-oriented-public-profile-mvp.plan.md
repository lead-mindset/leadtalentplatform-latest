# Plan: Chapter Profiles Student-Oriented Public Profile MVP

## Summary

Implement issue #156 by wiring the existing public chapter detail route to `ChapterProfileService` from #155 and polishing the chapter page into a student-oriented profile MVP. This should keep routing and event links intact while replacing direct page queries with a public-safe service contract.

## Metadata

| Field | Value |
| --- | --- |
| GitHub Issue | #156 |
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Public chapter route, chapter profile components |
| Blocked By | #155 complete |
| Status | Implemented |

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `app/[locale]/chapter/[id]/page.tsx` | UPDATE | Use `ChapterProfileService` instead of route-level direct queries |
| `app/[locale]/chapter/[id]/_components/chapter-portal-content.tsx` | UPDATE | Accept the profile data contract and arrange page sections |
| `app/[locale]/chapter/[id]/_components/chapter-hero.tsx` | UPDATE | Student-oriented hero, official context, and safe CTAs |
| `app/[locale]/chapter/[id]/_components/chapter-events.tsx` | UPDATE | Align event cards with profile data and polished empty states |
| `.github/plans/chapter-profiles-student-oriented-public-profile-mvp.plan.md` | UPDATE | Track validation |

## Tasks

### Task 1: Wire Route to Service

- Use `ChapterProfileService.getPublicChapterProfile`.
- Keep `notFound()` behavior for missing chapters.
- Use service data for metadata and content.

### Task 2: Polish Profile Layout

- Make the page feel like a chapter mini-home.
- Keep student CTAs focused on events and joining/interest.
- Avoid Impact Metrics/Pulse/awards implementation.

### Task 3: Polish Event Section

- Use service event shape.
- Preserve event detail links.
- Keep empty states intentional.

### Task 4: Validate

- Run targeted tests if applicable.
- Run lint and build.
- Update GitHub issue.

## Acceptance Criteria

- [x] Existing chapter detail route uses the public-safe profile service.
- [x] Hero shows chapter name, university, city/region, and official context.
- [x] CTAs guide students toward events and applying/expressing interest through safe existing flows.
- [x] Upcoming events use published event data and link to public event detail pages.
- [x] Empty states are polished.
- [x] Layout is mobile-safe and avoids horizontal overflow.
- [x] No Impact Metrics, Pulse, awards, or sponsor reporting added.

## Validation Results

Completed on 2026-05-11.

```bash
pnpm test -- chapter-profile.service
# 1 file passed, 4 tests passed

pnpm lint
# Passed with pre-existing warnings only
```
