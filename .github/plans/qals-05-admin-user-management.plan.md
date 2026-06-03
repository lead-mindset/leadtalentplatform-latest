# QALS-05 Plan: Admin User Management Launch Recovery

GitHub issue: #287

## Objective

Restore admin user management as a reliable launch operations surface. Admin operators need to view seeded users, filter/search/paginate without false empty states, and see a clear Spanish error when the primary users query fails.

## Scope

- Admin users list service response and primary-query error handling.
- Admin users page/client rendering for load error versus true empty state.
- Spanish-first labels for the launch-critical users table surface.
- Targeted service tests for query failure and normal user visibility.

## Tasks

- [x] Inspect admin users page, server action, service, client table, and service tests.
- [x] Preserve users when optional membership lookup fails.
- [x] Return an explicit error when the primary user query fails.
- [x] Render a Spanish error state instead of `No users found` for query failures.
- [x] Spanish-first launch-visible labels for filters, empty state, pagination, and actions.
- [x] Run targeted admin service tests and type validation.
- [x] Comment validation evidence on GitHub issue #287.

## Validation

- `pnpm exec vitest run lib/services/__tests__/admin.service.test.ts`
- `pnpm exec tsc --noEmit`

## Notes

- This slice does not redefine Staff/Admin permissions. It only makes the users surface honest and usable for launch operations after QALS-02 safe authorization.
