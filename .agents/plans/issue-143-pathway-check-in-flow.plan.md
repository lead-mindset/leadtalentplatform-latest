# Plan: Issue 143 - 3-Minute Pathway Check-In Flow

## Summary

Build the first student-facing Pathway Check-In flow behind the rollout flag from issue #142. The slice stores the V1 answers and completion state, but does not generate growth stages, recommendations, dashboard cards, or reflections yet. Students with an enabled chapter can open a focused route, answer five questions, and submit the check-in.

## User Story

As a LEAD student
I want to complete a short pathway check-in
So that LEAD can understand what I need next without overwhelming me

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | Supabase schema, student route, server action, service tests |
| GitHub Issue | #143 |

---

## Patterns to Follow

### Server Actions
```ts
// SOURCE: lib/actions/student/onboarding.ts
const supabase = await createClient()
const {
  data: { user },
} = await supabase.auth.getUser()

if (!user?.id || !user?.email) {
  return { error: 'Unauthorized' }
}
```

### Form Parsing Helpers
```ts
// SOURCE: lib/actions/student/onboarding.helpers.ts
export function parseBasicOnboardingFormData(
  formData: FormData,
  t: Parameters<typeof createBasicOnboardingSchema>[0]
) {
  return createBasicOnboardingSchema(t).safeParse({
    full_name: formData.get('full_name')?.toString() ?? '',
  })
}
```

### Feature Flag Resolution
```ts
// SOURCE: lib/services/pathway-rollout.service.ts
const flags = await PathwayRolloutService.getFlagsForChapter(supabase, chapterId)
```

### Student UI
```tsx
// SOURCE: app/[locale]/student/page.tsx
<MainContainer maxWidth="7xl" className="space-y-6 py-6 pb-24 sm:py-8">
  <PageHeader eyebrow="Mi LEAD" title="..." description="..." />
  <Card className="rounded-lg">
    <CardContent className="space-y-4">...</CardContent>
  </Card>
</MainContainer>
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260511121000_add_pathway_check_ins.sql` | CREATE | Persist one V1 pathway check-in per student with status support |
| `lib/database.generated.ts` | UPDATE | Add generated table type for `pathway_check_in` |
| `lib/types.ts` | UPDATE | Export pathway check-in row/insert/update aliases |
| `lib/services/pathway-check-in.service.ts` | CREATE | Encapsulate retrieval and completed submission persistence |
| `lib/actions/student/pathway-check-in.helpers.ts` | CREATE | Parse and validate the five V1 form answers |
| `lib/actions/student/pathway-check-in.ts` | CREATE | Server action: auth, feature gate, parse, persist, revalidate/redirect |
| `app/[locale]/student/pathway-check-in/page.tsx` | CREATE | Focused student check-in experience |
| `lib/services/__tests__/pathway-check-in.service.test.ts` | CREATE | Cover status defaults and submission upsert behavior |
| `lib/actions/student/__tests__/pathway-check-in.helpers.test.ts` | CREATE | Cover form parsing/validation behavior |

---

## Tasks

### Task 1: Add the check-in data contract

- **File**: `supabase/migrations/20260511121000_add_pathway_check_ins.sql`
- **Action**: CREATE
- **Implement**: Create `pathway_check_in` with `not_started`, `in_progress`, and `completed` statuses, one row per user, five nullable V1 answer fields, timestamps, RLS for own-row access plus admin access.
- **Mirror**: `supabase/migrations/20260511120000_add_pathway_feature_flags.sql`
- **Validate**: Type definitions compile after generated type update.

### Task 2: Add type aliases and service

- **Files**: `lib/database.generated.ts`, `lib/types.ts`, `lib/services/pathway-check-in.service.ts`
- **Action**: UPDATE/CREATE
- **Implement**: Add table typing and service methods to get a user's check-in status and upsert completed answers.
- **Mirror**: `lib/services/pathway-rollout.service.ts`
- **Validate**: Unit tests for service pass.

### Task 3: Add form validation and action

- **Files**: `lib/actions/student/pathway-check-in.helpers.ts`, `lib/actions/student/pathway-check-in.ts`
- **Action**: CREATE
- **Implement**: Validate the five V1 answers, resolve the student's active/pending chapter through dashboard service, check `enable_check_in`, persist completed check-in, then redirect back to the flow.
- **Mirror**: `lib/actions/student/onboarding.ts`, `lib/actions/student/onboarding.helpers.ts`
- **Validate**: Helper tests pass.

### Task 4: Add focused route

- **File**: `app/[locale]/student/pathway-check-in/page.tsx`
- **Action**: CREATE
- **Implement**: Render disabled state when flag is off, completed state when already submitted, and a low-friction five-question form when enabled.
- **Mirror**: `app/[locale]/student/page.tsx`
- **Validate**: `pnpm lint`, focused tests.

---

## Validation

```bash
pnpm vitest run lib/services/__tests__/pathway-check-in.service.test.ts lib/actions/student/__tests__/pathway-check-in.helpers.test.ts
pnpm test
pnpm lint
```

---

## Acceptance Criteria

- [ ] Student can start and complete the check-in when `enable_check_in` is true for their chapter/global rollout.
- [ ] Flow asks the five V1 questions.
- [ ] Data model supports `not_started`, `in_progress`, and `completed` states.
- [ ] Experience is focused and low-friction.
- [ ] Submission behavior is covered by tests.
