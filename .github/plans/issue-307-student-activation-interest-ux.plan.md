# Plan: CHACT-02 Spanish-First Student Activation Interest UX

## Summary

Add a Spanish-first student dashboard card that explains LEAD concretely and lets a student submit first-conversation interest in bringing LEAD to their university. The form should use stakeholder/reviewer feedback as the UX source of truth and submit through the new service/action foundation from #306.

## User Story

As a student curious about bringing LEAD to my university
I want a guided, low-pressure form
So that I can start a conversation without needing a perfect plan or prior leadership experience.

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Student dashboard, server actions, client form |
| GitHub Issue | #307 |

---

## Patterns to Follow

### Thin Server Action

```ts
// SOURCE: lib/actions/chapter/apply.ts
const result = await ChapterMembershipService.applyToChapter(supabase, {
  userId: user.id,
  chapterId: parsed.data.chapterId,
})
```

### Dashboard Client Form

```tsx
// SOURCE: app/[locale]/student/_components/chapter-application-card.tsx
export function ChapterApplicationCard({ chapters, disabled = false }: ChapterApplicationCardProps) {
  const router = useRouter()
```

### Dashboard Composition

```tsx
// SOURCE: app/[locale]/student/page.tsx
function ParticipantApplicationCard({ dashboard, chapterOptions }: ParticipantApplicationCardProps) {
  if (dashboard.status !== 'participant') return null
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/actions/student/chapter-activation-interest.ts` | CREATE | Thin authenticated action for form submission |
| `app/[locale]/student/_components/chapter-activation-interest-card.tsx` | CREATE | Spanish-first first-conversation form |
| `app/[locale]/student/page.tsx` | UPDATE | Fetch latest interest and render the new card |

---

## Tasks

### Task 1: Add server action

- **File**: `lib/actions/student/chapter-activation-interest.ts`
- **Action**: CREATE
- **Implement**: Authenticate user, parse `FormData`, call `ChapterActivationInterestService.submitInterest`, revalidate `/student`, and return structured success/failure.
- **Mirror**: `lib/actions/chapter/apply.ts`
- **Validate**: `pnpm exec tsc --noEmit`

### Task 2: Add client form card

- **File**: `app/[locale]/student/_components/chapter-activation-interest-card.tsx`
- **Action**: CREATE
- **Implement**: Add concrete explanation, commitment note, no-prior-experience reassurance, reviewer-useful fields, submit state, error state, and post-submit next steps.
- **Mirror**: `app/[locale]/student/_components/chapter-application-card.tsx`
- **Validate**: `pnpm exec tsc --noEmit`

### Task 3: Render on student dashboard

- **File**: `app/[locale]/student/page.tsx`
- **Action**: UPDATE
- **Implement**: Fetch latest activation interest in secondary dashboard data and render card for participant/pending/member states without interfering with existing chapter membership card.
- **Mirror**: Existing `ParticipantApplicationCard` composition.
- **Validate**: `pnpm exec tsc --noEmit`

---

## Validation

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm exec vitest run lib/services/__tests__/chapter-activation-interest.service.test.ts
```

---

## Acceptance Criteria

- [ ] Student dashboard distinguishes joining an existing chapter from bringing LEAD to a new university.
- [ ] Copy is Spanish-first and avoids unexplained internal terms.
- [ ] Submitted state explains what happens next.
- [ ] No alumni, company/recruiter, or permissions scope is added.
