# Plan: Issue 147 - Recommendation State Transitions

## Summary

Allow students to move recommendations through active, started, completed, and dismissed states without deleting historical data. The dashboard should expose low-friction actions, while the service enforces own-row updates through Supabase RLS and returns simple progress counts for visible momentum.

## User Story

As a LEAD student
I want to mark my next moves as started, completed, or dismissed
So that my dashboard reflects real progress without feeling like a heavy task tracker

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Student dashboard, server action, check-in service, tests |
| GitHub Issue | #147 |

---

## Patterns to Follow

### Server Action Pattern
```ts
// SOURCE: lib/actions/student/pathway-check-in.ts
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Dashboard Recommendation Rendering
```tsx
// SOURCE: app/[locale]/student/page.tsx
{guidance.recommendations.map((recommendation) => (
  <div key={recommendation.id}>...</div>
))}
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/services/pathway-check-in.service.ts` | UPDATE | Add recommendation status update and progress counts |
| `lib/services/__tests__/pathway-check-in.service.test.ts` | UPDATE | Cover transition persistence and dashboard progress |
| `lib/actions/student/pathway-recommendation.ts` | CREATE | Authenticated action for student state transitions |
| `app/[locale]/student/page.tsx` | UPDATE | Render action buttons and visible progress |

---

## Tasks

### Task 1: Add service transition method

- **File**: `lib/services/pathway-check-in.service.ts`
- **Action**: UPDATE
- **Implement**: Add `updateRecommendationStatus` for `started`, `completed`, and `dismissed` updates by `id` and `user_id`.
- **Validate**: Unit tests cover successful updates and failures.

### Task 2: Add visible progress

- **File**: `lib/services/pathway-check-in.service.ts`
- **Action**: UPDATE
- **Implement**: Return recommendation progress counts from dashboard guidance.
- **Validate**: Unit tests cover completed/total counts.

### Task 3: Add server action and dashboard controls

- **Files**: `lib/actions/student/pathway-recommendation.ts`, `app/[locale]/student/page.tsx`
- **Action**: CREATE/UPDATE
- **Implement**: Add forms/buttons to mark recommendations started, completed, or dismissed and refresh `/student`.
- **Validate**: `pnpm lint` and focused service tests.

---

## Validation

```bash
pnpm vitest run lib/services/__tests__/pathway-check-in.service.test.ts
pnpm lint
```

Full `pnpm test` is currently blocked by unrelated untracked chapter-directory work unless that work is stashed or fixed.

---

## Acceptance Criteria

- [ ] Recommendation supports active, started, completed, and dismissed states.
- [ ] Student can mark a recommendation as started.
- [ ] Student can mark a recommendation as completed.
- [ ] Student can dismiss a recommendation without deleting historical data.
- [ ] State transitions and progress updates are covered by tests.
