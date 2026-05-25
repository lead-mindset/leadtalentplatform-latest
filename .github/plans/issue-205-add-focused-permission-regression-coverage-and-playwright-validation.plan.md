# Issue 205: Add Focused Permission Regression Coverage and Playwright Validation

## Goal

Prove the chapter-scoped permission model works across service logic, server actions, seeded personas, and representative browser flows.

## Scope

- Add deterministic seed personas for:
  - president
  - vice president
  - regular e-board member
- Keep all persona data fake and local-test only.
- Add server action tests that prove unauthorized users cannot call sensitive member/event actions directly.
- Add Playwright config and a focused permission-matrix spec for seeded personas.
- Save validation artifacts and screenshots for desktop/mobile review.

## Existing Coverage To Preserve

- `lib/services/__tests__/chapter-permission.service.test.ts`
- `lib/services/__tests__/chapter-preapproval.service.test.ts`
- `lib/services/__tests__/chapter-role-assignment.service.test.ts`
- `lib/services/__tests__/chapter-membership.service.test.ts`
- `lib/auth.test.ts`
- `lib/auth-redirects.test.ts`
- Event service tests updated in issue #203.

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `supabase/seed.sql` | Update | Add seeded president, VP, and regular e-board personas with role assignments and grants. |
| `docs/handbook/TESTING.md` | Update | Document new seeded personas and Playwright validation target. |
| `lib/actions/chapter/__tests__/check-students.test.ts` | Create | Direct-call server action authorization regression tests for member workflows. |
| `lib/actions/events/__tests__/delete-event.test.ts` | Create | Direct-call event archive authorization regression test. |
| `playwright.config.ts` | Create | Standard local Playwright config using the app dev server. |
| `tests/e2e/chapter-permissions.spec.ts` | Create | Browser permission matrix for chapter/admin/recruiter/member personas. |
| `.github/reports/issue-205-add-focused-permission-regression-coverage-and-playwright-validation-report.md` | Create | Record validation commands and artifacts. |

## Tasks

1. Update local seed personas and docs.
2. Add direct server action tests for sensitive member and event actions.
3. Add Playwright config/spec for seeded persona route/action boundaries.
4. Run Supabase reset and type generation if seed/schema validation needs it.
5. Run focused Vitest action tests and existing permission suites.
6. Run Playwright permission matrix against local seeded data.
7. Run final diff check, typecheck, lint, and full test suite.

## Risks

- Playwright depends on local Supabase and seed data. Mitigation: document this clearly in the spec/report and keep config local-dev oriented.
- Auth redirects can be timing-sensitive. Mitigation: assert stable page content after navigation and keep waits targeted.
- Seed data can bloat. Mitigation: add only three fake personas and reuse existing LEAD UNI chapter.

## Validation

- `pnpm run supabase:reset`
- `pnpm run types:generate`
- Focused permission/action Vitest commands.
- `pnpm exec playwright test tests/e2e/chapter-permissions.spec.ts`
- `git diff --check`
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test`

## Completion Status

- Status: Complete
- Added seeded president, vice president, and regular e-board personas with active chapter assignments and permission grants.
- Added direct server-action regression tests for member approval/revocation and event archive authorization.
- Added a local Playwright permission matrix for chapter, member, admin, and recruiter flows with desktop/mobile screenshots.
- Playwright exposed a real RLS gap for permissioned member-roster reads; fixed with `20260522164400_add_permissioned_member_roster_rls.sql`.
- Validated with Supabase reset, generated types, focused tests, Playwright, diff check, typecheck, lint, and full Vitest suite.
