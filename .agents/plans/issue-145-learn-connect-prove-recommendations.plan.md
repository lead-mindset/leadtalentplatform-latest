# Plan: Issue 145 - Learn + Connect + Prove Recommendations

## Summary

Generate and persist exactly three deterministic recommendations from a completed Pathway Check-In: one Learn move, one Connect move, and one Prove move. The recommendations should be explainable in student-facing language and remain simple rules, not AI output.

## User Story

As a LEAD student
I want three clear next moves after my check-in
So that I know what to learn, who to connect with, and what proof to build next

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Supabase schema, check-in service, recommendation tests |
| GitHub Issue | #145 |

---

## Patterns to Follow

### Deterministic Classification
```ts
// SOURCE: lib/services/pathway-check-in.service.ts
export function classifyPathwayCheckIn(answers: PathwayCheckInAnswers): PathwayClassification {
  return {
    growth_stage: growthStage,
    primary_focus: primaryFocusByGoal[answers.looking_for] ?? 'career_exploration',
  }
}
```

### Submission-Time Persistence
```ts
// SOURCE: lib/services/pathway-check-in.service.ts
await supabase
  .from('pathway_check_in')
  .upsert({ user_id: params.userId, status: 'completed' }, { onConflict: 'user_id' })
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260511123000_add_pathway_recommendations.sql` | CREATE | Store recommendation records with category and active state |
| `lib/database.generated.ts` | UPDATE | Add `pathway_recommendation` generated type |
| `lib/types.ts` | UPDATE | Export recommendation row/insert/update aliases |
| `lib/services/pathway-check-in.service.ts` | UPDATE | Add generation function and persist generated recommendations after check-in save |
| `lib/services/__tests__/pathway-check-in.service.test.ts` | UPDATE | Cover exact category generation and persistence |

---

## Tasks

### Task 1: Add recommendation storage

- **File**: `supabase/migrations/20260511123000_add_pathway_recommendations.sql`
- **Action**: CREATE
- **Implement**: Create `pathway_recommendation` with one row per check-in/category, category check constraint, status default `active`, title/body/reason fields, and RLS for own-row read plus admin access.
- **Validate**: Type update compiles.

### Task 2: Generate exactly three moves

- **File**: `lib/services/pathway-check-in.service.ts`
- **Action**: UPDATE
- **Implement**: Add pure `generatePathwayRecommendations` function returning exactly Learn, Connect, Prove.
- **Validate**: Unit tests assert one of each category and explainable reason text.

### Task 3: Persist generated recommendations

- **File**: `lib/services/pathway-check-in.service.ts`
- **Action**: UPDATE
- **Implement**: After a completed check-in upsert returns the row id, replace existing recommendations for that check-in and insert the generated set as `active`.
- **Validate**: Unit tests cover delete + insert behavior.

---

## Validation

```bash
pnpm vitest run lib/services/__tests__/pathway-check-in.service.test.ts
pnpm lint
```

Full `pnpm test` is currently blocked by unrelated untracked chapter-directory work unless that work is stashed or fixed.

---

## Acceptance Criteria

- [ ] Every recommendation set includes exactly one Learn recommendation.
- [ ] Every recommendation set includes exactly one Connect recommendation.
- [ ] Every recommendation set includes exactly one Prove recommendation.
- [ ] Recommendations are deterministic and explainable in student-facing language.
- [ ] Recommendation generation is covered by tests.
