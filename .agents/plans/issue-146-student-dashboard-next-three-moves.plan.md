# Plan: Issue 146 - Student Dashboard Next Three Moves

## Summary

Add a student dashboard card that shows the active Pathway Check-In guidance when the recommendation card rollout flag is enabled. The card should show growth stage, primary focus, and the current Learn + Connect + Prove moves. Students without a completed check-in should see a simple entry point instead of an empty dashboard.

## User Story

As a LEAD student
I want to see my current next moves on my dashboard
So that I remember what to do after completing the check-in

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Student dashboard, check-in service, tests |
| GitHub Issue | #146 |

---

## Patterns to Follow

### Student Dashboard Layout
```tsx
// SOURCE: app/[locale]/student/page.tsx
<div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
  <div className="space-y-6">...</div>
  <MembershipDetailsCard dashboard={dashboard} />
</div>
```

### Feature Flags
```ts
// SOURCE: lib/services/pathway-rollout.service.ts
const flags = await PathwayRolloutService.getFlagsForChapter(supabase, chapterId)
```

### Service Data Access
```ts
// SOURCE: lib/services/pathway-check-in.service.ts
async getForUser(supabase, userId) {
  return { status, row }
}
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/services/pathway-check-in.service.ts` | UPDATE | Add dashboard data assembly method |
| `lib/services/__tests__/pathway-check-in.service.test.ts` | UPDATE | Cover dashboard data assembly cases |
| `app/[locale]/student/page.tsx` | UPDATE | Render Next Three Moves card or check-in entry point when enabled |

---

## Tasks

### Task 1: Add dashboard data assembly

- **File**: `lib/services/pathway-check-in.service.ts`
- **Action**: UPDATE
- **Implement**: Add `getDashboardGuidanceForUser` to return check-in state plus active recommendations ordered by sort order.
- **Validate**: Unit tests cover not-started, completed with recommendations, and recommendation query errors.

### Task 2: Render dashboard card

- **File**: `app/[locale]/student/page.tsx`
- **Action**: UPDATE
- **Implement**: If `enable_recommendation_card` is true, show either a start-check-in entry point or current growth stage/focus/recommendations.
- **Validate**: `pnpm lint`.

### Task 3: Preserve pilot boundaries

- **File**: `app/[locale]/student/page.tsx`
- **Action**: UPDATE
- **Implement**: Do not show the card when the pilot flag is disabled.
- **Validate**: Service-focused tests plus lint.

---

## Validation

```bash
pnpm vitest run lib/services/__tests__/pathway-check-in.service.test.ts
pnpm lint
```

Full `pnpm test` is currently blocked by unrelated untracked chapter-directory work unless that work is stashed or fixed.

---

## Acceptance Criteria

- [ ] Student dashboard shows growth stage, primary focus, and current Learn + Connect + Prove moves.
- [ ] Dashboard copy feels supportive and non-evaluative.
- [ ] Students who have not completed the check-in see a clear entry point to start.
- [ ] Disabled pilot scopes do not see the card.
- [ ] Dashboard data assembly is covered by tests.
