# Plan: Chapter Aggregate Check-In Insights

## Summary

Add a chapter-scoped aggregate insights layer for pathway check-ins and growth reflections. The implementation will live in `PathwayCheckInService` and surface a compact card on the chapter dashboard. It will show completion counts and common trends while avoiding private reflection content or individual student answers.

## User Story

As a chapter leader
I want to see aggregate student growth signals
So that I can plan better programming without exposing private student reflections.

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | pathway check-ins, growth reflections, chapter dashboard |
| Jira Issue | N/A |

---

## Patterns to Follow

### Service Queries
Use Supabase service methods that accept a scoped client and return safe fallback values on query errors.

### Chapter Scope
Use `requireChapterMember()` in `app/[locale]/chapter/page.tsx` to derive `chapter_id`; do not accept a user-provided chapter id.

### Privacy
Select aggregate-safe fields only. Do not select `learned`, `goal_connection`, `next_move`, or other private reflection text.

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/services/pathway-check-in.service.ts` | UPDATE | Add chapter aggregate insight method and types |
| `lib/services/__tests__/pathway-check-in.service.test.ts` | UPDATE | Cover aggregation, scoping, and privacy-safe reflection query |
| `app/[locale]/chapter/page.tsx` | UPDATE | Render aggregate insights for chapter leaders |

---

## Tasks

### Task 1: Add service aggregation

- **File**: `lib/services/pathway-check-in.service.ts`
- **Action**: UPDATE
- **Implement**: Add `getChapterAggregateInsights` that loads chapter check-ins and approved member ids, then counts reflection progress by member id.
- **Validate**: `pnpm vitest run lib/services/__tests__/pathway-check-in.service.test.ts`

### Task 2: Add dashboard card

- **File**: `app/[locale]/chapter/page.tsx`
- **Action**: UPDATE
- **Implement**: Add a privacy-safe card with completion, common needs, blockers, stage/focus trends, and reflection proof counts.
- **Validate**: `pnpm lint`

### Task 3: Commit

- **Validate**: focused tests and lint
- **Commit**: `feat(pathway): add chapter aggregate insights`
