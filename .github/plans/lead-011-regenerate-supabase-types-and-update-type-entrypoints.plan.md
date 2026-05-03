# Plan: LEAD-011 Regenerate Supabase Types and Update Type Entrypoints

## Summary

Regenerate Supabase types from the fully migrated local Docker database and align the repo's type-generation entrypoints around `lib/database.generated.ts` as the canonical generated contract. This story should be intentionally small: schema-driven type output, script/docs alignment, and an inventory of broken consumers caused by renamed/moved fields. Manual service and UI refactors belong in follow-up implementation issues.

## User Story

As an engineer,
I want generated Supabase types updated after schema changes,
So that services and actions use the canonical database contract.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #12 |
| Type | Technical |
| Complexity | Small |
| Systems Affected | Supabase type generation, `lib/database.generated.ts`, package scripts, docs, typecheck drift inventory |
| Dependencies | LEAD-005, LEAD-006, LEAD-007, LEAD-008, LEAD-009, LEAD-010 |
| Blocks | LEAD-012 |

## Problem

The schema has moved through the layered account model, newsletter foundations, event application questions, and student-profile migration stabilization. The repo currently has one generated type file, `lib/database.generated.ts`, and application/services mostly import from it. However, scripts and some docs still point generation at `lib/database.types.ts`, which does not currently exist.

LEAD-011 should remove that ambiguity and make type drift obvious. The goal is not to fix every old `student_profile` consumer, but to regenerate the canonical contract and list the broken consumers that need follow-up work.

## Codebase Findings

### Canonical Entrypoint In Practice

Source: `lib/types.ts:4`

`lib/types.ts` imports and re-exports `Database`, `Json`, `Tables`, `TablesInsert`, `TablesUpdate`, `Enums`, and `CompositeTypes` from `@/lib/database.generated`.

Source: `lib/services/student.service.ts:2`

Services already import `Database` from `@/lib/database.generated`, and newer services follow the same pattern.

Source: `AGENTS.md:8`

The current agent guidance says Supabase generated types live in `lib/database.generated.ts`.

### Script Drift

Source: `package.json:13`

`types:generate` currently writes to `lib/database.types.ts`, but that file does not exist in the worktree. This conflicts with current imports and the LEAD-011 acceptance criterion that `lib/database.generated.ts` remains canonical.

Source: `.husky/post-merge`

The post-merge hook calls `npm run types:generate`, so fixing the script target will also fix post-merge generation behavior. The hook should use the package manager convention (`pnpm`) if touched, but avoid unnecessary hook churn if not needed.

### Documentation Drift

Source: `docs/adr/002-database-type-generation.md:23`

ADR 002 says `lib/database.generated.ts` is auto-generated and `lib/database.types.ts` is custom augmentation.

Source: `docs/adr/002-database-type-generation.md:64`

The same ADR later says `lib/database.types.ts` is the only source for database types. LEAD-011 should correct this contradiction so reviewers understand the current convention.

Source: `docs/handbook/CONTRIBUTING.md:114`

The handbook still says `lib/database.types.ts` is auto-generated and imports should come from `@/lib/database.types`. This should be updated to match `database.generated.ts`.

### Known Broken Consumers To Inventory

Source: `app/[locale]/admin/chapters/[id]/page.tsx:30`

`pnpm build` currently fails because this page reads `member.student_profile` on `MemberWithProfile`, which now exposes `person_profile` and `chapter_membership`.

Source: `lib/types.ts:175`

Several composite application types still expose `student_profile` shapes. LEAD-011 should inventory these as broken or legacy-compat types, not silently refactor all consumers.

Source: `app/[locale]/student/layout.tsx:22`

Some app routes still query `student_profile` directly. These are follow-up cleanup candidates after the generated contract is refreshed.

## Implementation Design

### 1. Confirm Local Database Is Current

Run `pnpm supabase db reset` before generation. This ensures Docker Supabase includes LEAD-005 through LEAD-010 migrations and seed behavior.

### 2. Fix Type Generation Target

Update package scripts so generated Supabase output lands in `lib/database.generated.ts`:

```json
"types:generate": "supabase gen types typescript --local > lib/database.generated.ts",
"types:watch": "supabase gen types typescript --local --watch > lib/database.generated.ts"
```

Do not create or promote `lib/database.types.ts` unless the implementation chooses to add a tiny manual augmentation file. The safer small-scope path is to keep generated output in the existing canonical file and update stale docs.

### 3. Regenerate Canonical Types

Run:

```bash
pnpm run types:generate
```

Then inspect the diff and confirm it is schema-driven:

- `person_profile` has the latest fields including `is_recruiter_visible`.
- `chapter_membership` has `status`, `position`, `member_id`, and relationships.
- `newsletter_subscription` has unique/index-backed schema fields from LEAD-008.
- `event_application_question` and `event_application_answer` exist with LEAD-009 fields.
- LEAD-010 should not add schema fields, so it should not create type-only surprises.

### 4. Update Documentation Entrypoints

Update only docs that directly contradict the canonical entrypoint:

- `docs/adr/002-database-type-generation.md`
- `docs/handbook/CONTRIBUTING.md`
- README snippets only if they instruct writing to `database.types.ts` or importing from it.

Keep documentation changes narrow. This is a type generation story, not a rewrite of project docs.

### 5. Run Typecheck And Inventory Broken Consumers

Run `pnpm build` after regeneration. If it fails on renamed/moved schema fields, create a short drift inventory in the plan results and GitHub issue comment.

Expected known failure:

- `app/[locale]/admin/chapters/[id]/page.tsx` reads `member.student_profile`.

Likely follow-up buckets:

- Admin/chapter screens still using `student_profile`.
- Recruiter/company screens still rendering `student_profile.major`, `graduation_year`, `skills`, `linkedin_url`.
- Student/layout and auth confirm routes still querying `student_profile`.
- Legacy type aliases in `lib/types.ts` that still model `student_profile` for UI consumers.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Update | Point `types:generate` and `types:watch` to `lib/database.generated.ts`. |
| `lib/database.generated.ts` | Regenerate | Refresh canonical Supabase contract from Docker Supabase. |
| `docs/adr/002-database-type-generation.md` | Update | Resolve contradiction and document `database.generated.ts` as generated source. |
| `docs/handbook/CONTRIBUTING.md` | Update | Align developer commands/import guidance with canonical entrypoint. |
| `README.md` | Update if needed | Fix stale snippets that direct generation/imports to old files. |
| `.github/plans/lead-011-regenerate-supabase-types-and-update-type-entrypoints.plan.md` | Update | Track completion and drift inventory during implementation. |

## Tasks

- [x] Run `pnpm supabase db reset` to confirm latest migrations are applied.
- [x] Update `package.json` type generation scripts to write `lib/database.generated.ts`.
- [x] Run `pnpm run types:generate`.
- [x] Inspect `lib/database.generated.ts` diff for schema-driven changes only.
- [x] Update ADR/handbook/README references that contradict `database.generated.ts`.
- [x] Run `pnpm build` and capture broken consumers caused by renamed/moved fields.
- [x] Run `pnpm test`.
- [x] Run `pnpm lint`.
- [x] Comment results and follow-up inventory on GitHub issue #12.

## Validation

```bash
pnpm supabase db reset
pnpm run types:generate
pnpm build
pnpm test
pnpm lint
```

If `pnpm build` fails on legacy `student_profile` consumers, do not broaden this story into the refactor. Record exact file/line failures and create follow-up implementation issues.

## Acceptance Criteria

- [x] `lib/database.generated.ts` is regenerated from local Docker Supabase.
- [x] Type generation scripts write to `lib/database.generated.ts`.
- [x] No generated `lib/database.types.ts` drift is introduced.
- [x] Docs no longer contradict the canonical generated entrypoint.
- [x] Broken consumers are identified for follow-up implementation issues.
- [x] Generated-file diff is schema-driven and reviewable.

## Implementation Results

- `pnpm supabase db reset` passed.
- `pnpm run types:generate` passed and wrote to `lib/database.generated.ts`.
- No `lib/database.types.ts` file was created.
- `lib/database.generated.ts` diff is schema-driven: it adds `answer_json` to `event_application_answer`, matching the LEAD-009 migration.
- `pnpm test` passed: 10 files, 172 tests.
- `pnpm lint` passed with warnings only.
- `pnpm build` compiled successfully, then failed type checking on the known legacy consumer `app/[locale]/admin/chapters/[id]/page.tsx`.

## Type Drift Inventory

Follow-up work should stay outside LEAD-011 and be handled as implementation cleanup:

- Legacy `student_profile` UI consumers: `app/[locale]/admin/chapters/[id]/page.tsx`, `app/[locale]/chapter/page.tsx`, company/recruiter student views, student layout/profile actions.
- New account-model relationship typing: Supabase generated types cannot infer nested joins from `public.user` to `person_profile` or `chapter_membership` because the new FKs point to `auth.users`.
- Service/action type gaps: missing exported admin/recruiter/check-in action types, event detail shape mismatches, and stricter nullable fields such as `person_profile.is_recruiter_visible`.
- Test mock typing: several service tests pass at runtime but fail raw `tsc` because table mocks are inferred as `unknown` or optional chain helpers may be undefined.

## Risks

- The current worktree is dirty from LEAD-009 and LEAD-010. Implementation must not revert or stage unrelated files.
- Regenerating types may reorder or normalize large parts of `lib/database.generated.ts`; reviewers need a clear note that this file is generated.
- `database.types.ts` documentation drift can confuse future contributors if only scripts are fixed.
- Build failures are expected because legacy UI still reads `student_profile`; those should become follow-up work, not hidden manual edits in LEAD-011.

## GitHub Follow-Up

Create sub-issues for:

1. Align Supabase type generation scripts and docs.
2. Regenerate canonical database types from Docker Supabase.
3. Inventory and ticket broken legacy type consumers.
