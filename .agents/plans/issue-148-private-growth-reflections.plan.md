# Plan: Issue 148 - Private LEAD Growth Reflections

## Summary

Add the first proof artifact: a private-by-default LEAD Growth Reflection. The reflection asks the five V1 questions from the PRD, supports draft and completed states, and keeps proof visibility separate from recruiter visibility or public profile exposure.

## User Story

As a LEAD student
I want to create a private growth reflection
So that I can turn participation into proof without feeling exposed

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | Supabase schema, service, server action, student route, tests |
| GitHub Issue | #148 |

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260511124000_add_growth_reflections.sql` | CREATE | Store private growth reflections |
| `lib/database.generated.ts` | UPDATE | Add generated table type |
| `lib/types.ts` | UPDATE | Export growth reflection aliases |
| `lib/services/growth-reflection.service.ts` | CREATE | Persist private draft/completed reflections |
| `lib/services/__tests__/growth-reflection.service.test.ts` | CREATE | Cover private defaults and state validation |
| `lib/actions/student/growth-reflection.helpers.ts` | CREATE | Parse V1 reflection form |
| `lib/actions/student/growth-reflection.ts` | CREATE | Authenticated create action |
| `app/[locale]/student/growth-reflection/page.tsx` | CREATE | Focused creation form |

---

## Tasks

### Task 1: Add private reflection storage

- **Implement**: `growth_reflection` with `visibility = private` default, `status in draft/completed`, five PRD answer fields, user-owned RLS.
- **Validate**: Types updated.

### Task 2: Add service/action

- **Implement**: Parse five answers, create draft or completed reflection, keep visibility private by default.
- **Validate**: Service tests cover private default and completed submission.

### Task 3: Add student route

- **Implement**: `/student/growth-reflection` with five prompts and calm proof-building copy.
- **Validate**: `pnpm vitest run lib/services/__tests__/growth-reflection.service.test.ts` and `pnpm lint`.

---

## Acceptance Criteria

- [ ] Student can create a Growth Reflection.
- [ ] Reflection asks the V1 reflection questions from the PRD.
- [ ] Reflection is private by default.
- [ ] Reflection supports draft and completed states.
- [ ] Private proof behavior is covered by tests.
