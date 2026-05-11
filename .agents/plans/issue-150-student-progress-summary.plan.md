# Plan: Issue 150 - Basic Student Progress Summary

## Summary

Add a calm student progress summary to the dashboard. The summary should show next moves completed, Growth Reflections completed, and proof items created without ranking students, scoring them against others, or making progress feel childish.

## User Story

As a LEAD student
I want to see small signs of my own progress
So that I can feel momentum without being compared to anyone else

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | LOW |
| Systems Affected | Student dashboard, growth reflection service, tests |
| GitHub Issue | #150 |

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/services/growth-reflection.service.ts` | UPDATE | Add student reflection/proof progress summary |
| `lib/services/__tests__/growth-reflection.service.test.ts` | UPDATE | Cover progress summary counts |
| `app/[locale]/student/page.tsx` | UPDATE | Render calm progress summary card |

---

## Tasks

### Task 1: Add reflection progress service

- Count completed Growth Reflections.
- Count proof items created. For V1, private Growth Reflections are the first proof item type.

### Task 2: Add dashboard summary

- Show next moves completed from pathway guidance progress.
- Show Growth Reflections completed.
- Show proof items created.
- Copy must emphasize personal progress only.

### Task 3: Validate

- Focused service tests.
- Lint.

---

## Acceptance Criteria

- [ ] Student can see next moves completed.
- [ ] Student can see Growth Reflections completed.
- [ ] Student can see proof items created.
- [ ] Progress summary does not rank students against others.
- [ ] Progress summary behavior is covered by tests.
