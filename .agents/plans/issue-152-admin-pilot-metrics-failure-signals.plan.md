# Plan: Admin Pilot Metrics And Failure Signals

## Summary

Add admin-facing pilot metrics for the Personalized Growth layer: pathway check-in completion, next-move completion within 14 days, Growth Reflection completion, and simple risk signals. The first version will aggregate across the active platform and display on the admin overview without exposing student-level data.

## User Story

As a LEAD admin
I want pilot metrics and risk signals
So that I can tell whether the pathway system is actually helping students move forward.

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | admin dashboard, pathway check-ins, recommendations, growth reflections |
| Jira Issue | N/A |

---

## Patterns to Follow

### Aggregation
Keep calculations in a service method and return safe fallbacks on query errors.

### UI
Use the existing admin overview card/tile style. Do not add a new route for the MVP.

### Privacy
Return counts and percentages only. No individual student names, answers, or reflection text.

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/services/pathway-check-in.service.ts` | UPDATE | Add admin pilot metrics and risk signal aggregation |
| `lib/services/__tests__/pathway-check-in.service.test.ts` | UPDATE | Cover metric calculations and failure signal thresholds |
| `lib/actions/admin/get-data.ts` | UPDATE | Expose an admin data helper |
| `app/[locale]/admin/page.tsx` | UPDATE | Render pilot metrics on admin overview |

---

## Tasks

### Task 1: Add pilot metrics service

- **File**: `lib/services/pathway-check-in.service.ts`
- **Action**: UPDATE
- **Implement**: Add `getAdminPilotMetrics` with completion rates and risk signals.
- **Validate**: `pnpm vitest run lib/services/__tests__/pathway-check-in.service.test.ts`

### Task 2: Wire admin overview

- **File**: `lib/actions/admin/get-data.ts`, `app/[locale]/admin/page.tsx`
- **Action**: UPDATE
- **Implement**: Fetch and display the metrics in a compact admin card.
- **Validate**: `pnpm lint`

### Task 3: Commit

- **Validate**: focused tests and lint
- **Commit**: `feat(pathway): add admin pilot metrics`
