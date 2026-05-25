# Plan: Issue 149 - Event Participation to Growth Reflection Prompts

## Summary

Connect event participation to private Growth Reflections by showing an optional prompt on attended or past registered events. When students start a reflection from an event, the reflection can carry the event id and a prefilled participation label, keeping the experience supportive instead of mandatory.

## User Story

As a LEAD student
I want a gentle reflection prompt after an event
So that I can turn the experience into proof when it feels useful

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Growth reflection schema/service/action, student events UI, tests |
| GitHub Issue | #149 |

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260511125000_link_growth_reflections_to_events.sql` | CREATE | Add optional `event_id` link to reflections |
| `lib/database.generated.ts` | UPDATE | Add generated `event_id` type |
| `lib/services/growth-reflection.service.ts` | UPDATE | Persist optional event link |
| `lib/services/__tests__/growth-reflection.service.test.ts` | UPDATE | Cover event-linked private reflection |
| `lib/actions/student/growth-reflection.helpers.ts` | UPDATE | Parse optional `event_id` |
| `app/[locale]/student/growth-reflection/page.tsx` | UPDATE | Accept query params for event/reflection prefill |
| `app/[locale]/student/events/page.tsx` | UPDATE | Show optional Growth Reflection prompt for relevant event participation |

---

## Tasks

### Task 1: Add event linkage

- Add nullable `event_id` to `growth_reflection`.
- Preserve private default and student-owned RLS behavior.

### Task 2: Persist event-linked reflections

- Parse `event_id` from the form/query path.
- Store it in `GrowthReflectionService.createReflection`.
- Validate with focused tests.

### Task 3: Prompt from student events

- Show optional reflection CTA only for attended or past registered events.
- Copy must be supportive and non-punitive.

---

## Validation

```bash
pnpm vitest run lib/services/__tests__/growth-reflection.service.test.ts
pnpm lint
```

Full `pnpm test` is currently blocked by unrelated dirty chapter-directory work unless that work is isolated.
