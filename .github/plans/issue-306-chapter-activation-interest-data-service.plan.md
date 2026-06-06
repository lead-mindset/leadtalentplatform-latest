# Plan: CHACT-01 Chapter Activation Interest Data and Service Foundation

## Summary

Add a separate activation-interest intake model for students who want to bring LEAD to their university. This keeps first-conversation signals out of `chapter_membership`, preserving the canonical account model and avoiding accidental membership or permission semantics.

## User Story

As a student exploring LEAD for my university  
I want to submit activation interest without becoming a chapter member  
So that LEAD can review my context and guide the next step.

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | Supabase schema, service layer, generated types |
| GitHub Issue | #306 |

---

## Patterns to Follow

### Service Layer

```ts
// SOURCE: lib/services/chapter-membership.service.ts
export const ChapterMembershipService = {
  async applyToChapter(
    supabase: SupabaseClient<Database>,
    params: ApplyToChapterParams
  ): Promise<ActionResult> {
```

### Service Tests

```ts
// SOURCE: lib/services/__tests__/chapter-membership.service.test.ts
function buildMockSupabase(overrides: Record<string, TableMock> = {}) {
  const tableMocks: Record<string, TableMock> = {
```

### Migration Invariant

```sql
-- SOURCE: supabase/migrations/20260503002000_chapter_membership_foundation.sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_membership_user_chapter_unique
  ON public.chapter_membership(user_id, chapter_id);
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260606120000_add_chapter_activation_interest.sql` | CREATE | Add intake table, status constraint, RLS, and active duplicate guard |
| `lib/database.generated.ts` | UPDATE | Add generated table shape for local type safety |
| `lib/types.ts` | UPDATE | Export row/insert/update aliases |
| `lib/services/chapter-activation-interest.service.ts` | CREATE | Encapsulate submit/read business logic |
| `lib/services/__tests__/chapter-activation-interest.service.test.ts` | CREATE | Cover success, duplicate, validation failure |

---

## Tasks

### Task 1: Create schema migration

- **File**: `supabase/migrations/20260606120000_add_chapter_activation_interest.sql`
- **Action**: CREATE
- **Implement**: Add `chapter_activation_interest` with user FK, required text fields, status check, timestamps, RLS for own rows, admin access, and a partial unique index for active submitted interest.
- **Validate**: Review SQL for idempotent constraints where practical.

### Task 2: Update TypeScript database types

- **File**: `lib/database.generated.ts`
- **Action**: UPDATE
- **Implement**: Add `chapter_activation_interest` table shape under `public.Tables`.
- **Validate**: `pnpm exec tsc --noEmit`

### Task 3: Add shared type aliases

- **File**: `lib/types.ts`
- **Action**: UPDATE
- **Implement**: Export `ChapterActivationInterestRow`, `ChapterActivationInterestInsert`, and `ChapterActivationInterestUpdate`.
- **Validate**: `pnpm exec tsc --noEmit`

### Task 4: Add service

- **File**: `lib/services/chapter-activation-interest.service.ts`
- **Action**: CREATE
- **Implement**: Validate trimmed required fields, reject active duplicate submitted interest, insert submitted row, and fetch latest user interest.
- **Validate**: Focused Vitest.

### Task 5: Add service tests

- **File**: `lib/services/__tests__/chapter-activation-interest.service.test.ts`
- **Action**: CREATE
- **Implement**: Mock Supabase chain and cover success, duplicate submitted interest, and validation failure.
- **Validate**: `pnpm exec vitest run lib/services/__tests__/chapter-activation-interest.service.test.ts`

---

## Validation

```bash
pnpm exec vitest run lib/services/__tests__/chapter-activation-interest.service.test.ts
pnpm exec tsc --noEmit
pnpm lint
```

---

## Acceptance Criteria

- [ ] Activation interest is stored outside `chapter_membership`.
- [ ] One active submitted interest per user is enforced.
- [ ] Service tests cover business rules.
- [ ] Type check and lint pass.
