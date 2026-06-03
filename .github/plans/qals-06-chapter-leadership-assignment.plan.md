# QALS-06 Plan: Chapter Leadership Assignment

GitHub issue: #288

## Objective

Replace legacy broad editor behavior with chapter-scoped leadership assignment. Admin chapter assignment should create scoped role assignments, grant scoped permissions through the role template, and remove those permissions by deactivating the scoped assignment rather than changing global app role.

## Scope

- Admin chapter editor assignment/removal service wrapper.
- Assign Editors modal copy and empty/pending feedback.
- Targeted admin service regression tests.

## Tasks

- [x] Inspect existing chapter role assignment and permission template services.
- [x] Confirm assignment already delegates to `ChapterRoleAssignmentService.assignChapterRole`.
- [x] Remove legacy global role downgrade from editor removal.
- [x] Deactivate active scoped chapter role assignment and revoke permission grants through the role service.
- [x] Improve Assign Editors modal Spanish copy, pending state, and empty candidate state.
- [x] Run targeted service tests and type validation.
- [x] Comment validation evidence on GitHub issue #288.

## Validation

- `pnpm exec vitest run lib/services/__tests__/admin.service.test.ts`
- `pnpm exec tsc --noEmit`

## Notes

- This slice keeps the current launch default assignment role as `chief_of_staff` for compatibility. A later product slice can expose President/VP/Director selection once leadership rules are finalized.
