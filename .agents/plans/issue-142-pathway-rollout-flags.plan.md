# Plan: Issue 142 - Pathway Rollout Flags

## Summary

Add the foundation for New Student Pathway Check-In pilot rollout controls. This slice should create a small chapter-scoped feature flag capability so future UI can safely ask whether the check-in, recommendation card, Growth Reflection, and chapter aggregate insights are enabled for a given chapter. The first implementation should be additive and should not surface unfinished pathway UI.

## User Story

As an admin  
I want to enable pathway check-in features for selected pilot chapters  
So that LEAD can pilot the workflow without forcing unfinished UI across all chapters

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | Supabase schema, generated DB types, rollout service, tests |
| GitHub Issue | #142 |

---

## Patterns to Follow

### Service-Layer Pattern

Business logic should live in `lib/services/*` and server/UI consumers should call the service rather than duplicate database rules.

Examples:

- `lib/services/student-dashboard.service.ts`
- `lib/services/company.service.ts`
- `lib/services/chapter-membership.service.ts`

### Test Pattern

Existing service tests use Vitest and mocked Supabase query builders. Follow the style in:

- `lib/auth.test.ts`
- `lib/actions/student/__tests__/onboarding.helpers.test.ts`
- `lib/services/__tests__/event.service.test.ts`

### Database Pattern

Schema changes are added as timestamped SQL files in `supabase/migrations/`. Generated types live in `lib/database.generated.ts`.

### Admin Configuration Reality

`app/[locale]/admin/settings/page.tsx` is currently a placeholder. For this slice, "admin/config can enable" should mean the database and service layer support admin-controlled configuration. A full admin UI belongs in a later issue unless explicitly requested.

---

## Implementation Design

### 1. Add Database Table

Create a migration for `pathway_feature_flag`.

Recommended columns:

- `id uuid primary key default gen_random_uuid()`
- `chapter_id text null references chapter(id) on delete cascade`
- `enable_check_in boolean not null default false`
- `enable_recommendation_card boolean not null default false`
- `enable_growth_reflection boolean not null default false`
- `enable_chapter_insights boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `updated_by_id uuid null references public.user(id)`

Rules:

- `chapter_id = null` is the optional global default row.
- A chapter-specific row overrides the global row.
- Only one global row is allowed.
- Only one row per chapter is allowed.
- Public users should not read this table directly.
- Admins should manage all rows.
- Service-role/server code can read flags for rendering decisions.

### 2. Add Generated Types

Update `lib/database.generated.ts` with the new table shape.

### 3. Add Rollout Service

Create `lib/services/pathway-rollout.service.ts`.

Suggested interface:

```ts
export type PathwayFeatureFlags = {
  enable_check_in: boolean
  enable_recommendation_card: boolean
  enable_growth_reflection: boolean
  enable_chapter_insights: boolean
}

export const DEFAULT_PATHWAY_FEATURE_FLAGS: PathwayFeatureFlags = {
  enable_check_in: false,
  enable_recommendation_card: false,
  enable_growth_reflection: false,
  enable_chapter_insights: false,
}

export const PathwayRolloutService = {
  async getFlagsForChapter(supabase, chapterId): Promise<PathwayFeatureFlags>
}
```

Resolution rules:

1. Start with all flags false.
2. Load global row where `chapter_id` is null.
3. Load chapter row where `chapter_id` equals the given chapter.
4. Return chapter row if present, otherwise global row, otherwise defaults.
5. On query errors, fail closed by returning all false.

### 4. Add Tests

Create `lib/services/__tests__/pathway-rollout.service.test.ts`.

Test cases:

- returns defaults when no rows exist
- returns global row when no chapter row exists
- returns chapter row over global row
- returns defaults on query error
- never enables flags accidentally when chapter id is missing

### 5. Verification

Run focused tests first:

```bash
pnpm vitest run lib/services/__tests__/pathway-rollout.service.test.ts
```

Then run broader checks if feasible:

```bash
pnpm test
```

---

## Risks

| Risk | Mitigation |
|------|------------|
| Feature flags accidentally expose unfinished UI | Fail closed to all false and require explicit enablement |
| Confusing global and chapter-specific scope | Use chapter row override semantics and test them |
| RLS blocks server-side reads unexpectedly | Keep read usage through server/service role where needed; RLS should protect direct client access |
| Generated types drift from schema | Update `lib/database.generated.ts` in the same slice |

---

## Done Criteria

- Migration exists for rollout flags.
- Service exists for resolving flags by chapter.
- Tests cover default, global, chapter override, and error behavior.
- Disabled chapters resolve all flags as false unless explicitly enabled.
- Issue #142 acceptance criteria can be checked off at the service/config level.

