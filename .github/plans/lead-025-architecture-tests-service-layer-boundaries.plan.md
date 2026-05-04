# Plan: LEAD-025 Architecture Tests for Service-Layer Boundaries

## Summary

Create architecture tests that enforce the service-layer boundary without turning the test suite into brittle import policing. The repo currently has no `tests/architecture.test.ts`, so this issue should create it and encode practical guardrails: services cannot depend on app/actions/components, new direct DB access outside services must be blocked or explicitly allowlisted, foundation services must exist with tests, and failure messages must point to the relevant architecture rule.

## User Story

As the engineering team,
I want architecture tests to enforce service-layer boundaries,
So that database and business logic do not drift into UI or server actions.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #26 |
| Parent | #66 |
| Type | TECHNICAL / SYSTEM_EVOLUTION |
| Complexity | MEDIUM |
| Systems Affected | Vitest architecture tests, service/action boundaries, foundation service coverage |

## Codebase Findings

| Source | Finding |
|--------|---------|
| `tests/architecture.test.ts` | Does not exist yet despite the issue note. Create it. |
| `vitest.config.ts` | Includes `**/*.test.{ts,tsx}`, so `tests/architecture.test.ts` will run without config changes. |
| `AGENTS.md` / `CLAUDE.md` | Service layer is mandatory; actions are thin; canonical account model is now documented by #25. |
| `lib/services/` | Foundation services exist: `person-profile`, `chapter-membership`, `lead-identity`, `newsletter-subscription`, `event-application`, plus existing domain services. |
| `lib/services/__tests__/` | Service test coverage exists for major service files. Architecture tests should require this for new foundation domains. |
| `lib/actions/` | Mostly thin wrappers, but some current direct DB access exists and must be handled with an explicit baseline allowlist rather than a surprise global failure. |

## Architecture Rules To Encode

| Rule | Test Strategy | Failure Message |
|------|---------------|-----------------|
| Services are the only home for business/database logic | Scan `lib/services/**/*.ts` imports; reject imports from `app/`, `components/`, and `lib/actions/`; reject Next route/cache/navigation imports in services unless explicitly allowlisted. | "Architecture rule: services must stay framework-agnostic and cannot import UI/actions/routes." |
| Server actions stay thin | Scan `lib/actions/**/*.ts` for direct `.from(` / `supabase.storage.from(` usage. Allow only an explicit baseline list for current known exceptions. | "Architecture rule: server actions should delegate DB/business logic to services. Move this query into `lib/services/` or add a documented allowlist entry." |
| UI/routes should not grow new direct DB logic | Scan `app/` and `components/` for `@/lib/supabase/*`, `createClient`, and `.from(`. Use an explicit baseline for existing direct route/page reads so new drift fails. | "Architecture rule: UI/routes should call actions/services instead of adding direct DB queries." |
| Foundation services remain present and tested | Assert required service files and matching `lib/services/__tests__/*.test.ts` files exist. | "Architecture rule: foundation domain services must have service tests." |
| Canonical account model stays protected | Assert live app/action/service code has no `.from('student_profile')`, `.from("StudentProfile")`, or `student_profile:` compatibility alias outside generated/migration docs. | "Architecture rule: `student_profile` is legacy/migration-only." |

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `tests/architecture.test.ts` | CREATE | Architecture boundary tests using Node filesystem scans and Vitest assertions. |
| `.github/plans/lead-025-architecture-tests-service-layer-boundaries.plan.md` | CREATE / UPDATE | Execution plan and validation results. |
| `AGENTS.md` / `CLAUDE.md` | UPDATE ONLY IF NEEDED | Add a pointer to the architecture test if implementation reveals a missing rule. |
| GitHub Issue #26 | UPDATE | Comment with plan path, test coverage, validation results. |

## Baseline Allowlist Policy

The first implementation should avoid failing on historical direct DB access that is already present. Instead:

- Create named allowlists inside `tests/architecture.test.ts`.
- Each allowlist entry must include a short reason comment.
- Tests fail for new paths not in the allowlist.
- If an allowlist is too large or unclear, create a follow-up `phase:system-evolution` issue rather than silently expanding it.

Initial direct-action candidates discovered by scan:

| File | Reason To Allow Initially |
|------|---------------------------|
| `lib/actions/student/generate-member-ids.ts` | Legacy admin utility; should likely move to service later. |
| `lib/actions/events/event-chapter.ts` | Existing collaborator query path; candidate for event service migration. |
| `lib/actions/events/register.ts` | Existing registration preflight/event lookup path; candidate for event service consolidation. |

The implementation should run the scan while writing the test and add any app/component baseline entries only when they are truly existing, documented, and not in scope for #26.

## Tasks

- [x] Create `tests/architecture.test.ts`.
  - Use `node:fs/promises` and `node:path` to recursively read `.ts` / `.tsx` files.
  - Ignore generated files, tests, `.next`, `node_modules`, coverage, migrations, and plan/docs unless a rule explicitly targets docs.
  - Keep helpers small and deterministic.

- [x] Add service import-boundary tests.
  - Services may import other services, types, logger, utils, Supabase types, and Node/runtime helpers.
  - Services must not import `app/`, `components/`, `lib/actions/`, or Next route/cache/navigation modules.

- [x] Add thin-action DB boundary tests.
  - Scan `lib/actions/**/*.ts` excluding tests/helpers where appropriate.
  - Fail on direct `.from(` or `storage.from(` unless the file is in a named allowlist with a reason.
  - Failure message must explain the fix: move DB/business logic into `lib/services/`.

- [x] Add UI/route direct DB drift tests.
  - Scan `app/` and `components/` for direct Supabase imports or `.from(`.
  - Establish a current baseline allowlist only for existing paths.
  - Fail new unlisted paths with an action-oriented message.

- [x] Add foundation service coverage tests.
  - Require service files and service tests for:
    - `person-profile.service.ts`
    - `chapter-membership.service.ts`
    - `lead-identity.service.ts`
    - `newsletter-subscription.service.ts`
    - `event-application.service.ts`
  - Include other active domain services if already covered.

- [x] Add canonical account model drift tests.
  - Assert live `app/`, `components/`, and `lib/` files do not add live `student_profile` table access or compatibility aliases.
  - Keep generated DB types and migrations out of scope.

- [x] Validate architecture tests.
  - Run `pnpm vitest run tests/architecture.test.ts`.
  - Run `pnpm test`.
  - Run `pnpm lint`.
  - Run `pnpm build` only if implementation touches executable app code beyond tests.

- [x] Update plan and GitHub #26.
  - Mark tasks complete.
  - Comment with test rules added and validation results.
  - Add/keep `has-plan`.
  - Close #26 only after validation passes.

## Risks

| Risk | Mitigation |
|------|------------|
| Tests are too brittle and block valid framework code | Use path/category scans, focused forbidden patterns, and explicit allowlists with reasons. |
| Allowlists normalize bad architecture forever | Require reason comments and create follow-up issues for large or suspicious baselines. |
| Direct DB access exists in routes/pages and causes immediate failure | Baseline existing paths first; fail only new drift. |
| Regex scanning misses complex imports | Keep patterns simple and documented; architecture tests are guardrails, not a compiler. |
| Tests duplicate lint rules | Focus on project-specific architecture boundaries lint cannot know. |

## Validation Commands

```bash
pnpm vitest run tests/architecture.test.ts
pnpm test
pnpm lint
```

Optional if non-test executable code changes:

```bash
pnpm build
```

## Implementation Result

Created `tests/architecture.test.ts` with five Vitest architecture rules:

- Services must remain framework-agnostic and cannot import UI, actions, app routes, or Next route/cache/navigation modules.
- Server actions cannot add new direct `.from(...)` / `storage.from(...)` DB access unless explicitly allowlisted with a reason.
- UI/routes/components cannot add new direct Supabase boundary access unless explicitly allowlisted with a reason.
- Foundation services must exist and have matching service tests.
- Live app/action/service/component code cannot reintroduce `student_profile` table access or compatibility aliases.

Baseline allowlists are intentionally documented in the test file. They freeze current historical direct DB access while causing new unlisted drift to fail with action-oriented messages.

Validation:

| Command | Result |
|---------|--------|
| `pnpm vitest run tests/architecture.test.ts` | Passed: 1 file, 5 tests |
| `pnpm test` | Passed: 15 files, 206 tests |
| `pnpm lint` | Passed with 99 existing warnings, 0 errors |
| `pnpm build` | Not run; implementation touched only tests/docs |

## Output

Tasks completed: 8/8.
