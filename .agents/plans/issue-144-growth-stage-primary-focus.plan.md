# Plan: Issue 144 - Growth Stage and Primary Focus Classification

## Summary

Add deterministic, explainable classification to completed Pathway Check-Ins. The classifier derives one growth stage and one primary focus from the five V1 answers, stores the result on the check-in record, and keeps it explicitly separate from chapter membership, permissions, recruiter visibility, or official status.

## User Story

As a LEAD student
I want my check-in to produce a clear development context
So that my next guidance feels personal without changing my membership status

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Supabase schema, check-in service, classification tests |
| GitHub Issue | #144 |

---

## Patterns to Follow

### Existing Check-In Persistence
```ts
// SOURCE: lib/services/pathway-check-in.service.ts
await supabase
  .from('pathway_check_in')
  .upsert({ user_id: params.userId, status: 'completed' }, { onConflict: 'user_id' })
```

### Existing Service Test Style
```ts
// SOURCE: lib/services/__tests__/pathway-check-in.service.test.ts
await expect(PathwayCheckInService.getForUser(supabase, 'user-1')).resolves.toEqual({
  status: 'not_started',
  row: null,
})
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260511122000_add_pathway_growth_outputs.sql` | CREATE | Add `growth_stage` and `primary_focus` fields to check-ins |
| `lib/database.generated.ts` | UPDATE | Add generated field types |
| `lib/services/pathway-check-in.service.ts` | UPDATE | Add classifier and persist outputs during completed submission |
| `lib/services/__tests__/pathway-check-in.service.test.ts` | UPDATE | Cover deterministic classification and persistence |

---

## Tasks

### Task 1: Add output fields

- **File**: `supabase/migrations/20260511122000_add_pathway_growth_outputs.sql`
- **Action**: CREATE
- **Implement**: Add nullable text fields with check constraints for V1 growth stage and primary focus.
- **Validate**: Type definitions updated.

### Task 2: Implement deterministic classifier

- **File**: `lib/services/pathway-check-in.service.ts`
- **Action**: UPDATE
- **Implement**: Add pure `classifyPathwayCheckIn` function and call it during completed submission.
- **Validate**: Unit tests cover every stage/focus mapping.

### Task 3: Persist outputs without changing permissions

- **File**: `lib/services/pathway-check-in.service.ts`
- **Action**: UPDATE
- **Implement**: Save `growth_stage` and `primary_focus` to `pathway_check_in` only. Do not touch `chapter_membership`, `person_profile`, roles, or recruiter visibility.
- **Validate**: Existing tests still pass.

---

## Validation

```bash
pnpm vitest run lib/services/__tests__/pathway-check-in.service.test.ts
pnpm test
pnpm lint
```

---

## Acceptance Criteria

- [ ] Completed check-in produces one growth stage.
- [ ] Completed check-in produces one primary focus.
- [ ] Growth stage is stored in the guidance/check-in layer, separate from membership.
- [ ] Growth stage does not grant permissions, chapter access, or recruiter visibility.
- [ ] Classification behavior is covered by tests.
