# Issue #109 Plan: Portfolio URL Regression Coverage and Documentation

GitHub Issue: https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/109
Source PRD: `.github/PRDs/portfolio-url-first-class-profile-data.prd.md`
Source issue spec: `.github/issues/portfolio-url-first-class-profile-data-issues.md`
Depends on: #106, #107, #108
Type: Testing / Documentation
Complexity: Small

## Problem

Portfolio URL is now normalized, editable, persisted, and shown in authorized professional review surfaces. The remaining risk is drift: future edits could drop `portfolio_url` from one of the canonical `person_profile` mappings or leave docs ambiguous about ownership.

## User Story

As the engineering team,
I want regression coverage and concise documentation for portfolio URL,
so that portfolio remains part of the canonical `person_profile` professional data contract.

## Scope Boundary

In scope:

- Audit existing #106, #107, and #108 tests to avoid duplicate coverage.
- Add only missing regression assertions where a portfolio field could silently drift out of service/action mappings.
- Update the testing/account documentation so `portfolio_url` is clearly owned by `person_profile`.
- Mention privacy/visibility expectations: optional, hidden when absent, and shown only in authorized professional/review contexts.
- Comment validation results on #109.

Out of scope:

- New UI surfaces.
- Public portfolio/profile pages.
- Portfolio previews, metadata fetching, screenshots, or embeds.
- Making portfolio required.
- Changing company eligibility, event reviewer access, or recruiter visibility rules.
- Refactoring unrelated lint warnings.

## Current Code Findings

- `lib/memberschema.test.ts` already covers optional URL normalization, empty-to-null behavior, invalid URL rejection, and non-http scheme rejection.
- `lib/actions/student/__tests__/onboarding.helpers.test.ts` already covers onboarding parsing/normalization for portfolio.
- `lib/services/__tests__/person-profile.service.test.ts` already asserts `PersonProfileService.getBasicProfile()` returns `portfolioUrl` and `upsertBasicProfile()` writes `portfolio_url` without `chapter_membership`.
- `lib/services/__tests__/student.service.test.ts` already asserts student profile read/update includes `portfolio_url`.
- `lib/services/__tests__/company.service.test.ts` now asserts an eligible company-visible profile includes `portfolio_url` and non-approved membership remains excluded.
- `lib/services/__tests__/recruiter.service.test.ts` now asserts recruiter detail includes `portfolio_url`.
- `lib/services/__tests__/event.service.test.ts` now asserts event registration/application review profile mapping includes `portfolio_url`.
- `docs/handbook/TESTING.md` documents the layered account model and flow-specific service tests, but it does not yet explicitly name portfolio as `person_profile` professional data.
- `docs/PRODUCT-SPECIFICATION.md` describes `person_profile` at a high level but its basic onboarding field list mentions LinkedIn and omits portfolio.
- `lib/legal/privacy.ts` lists professional information as LinkedIn and skills, omitting portfolio.

## Patterns to Follow

### Documentation Pattern

Source: `docs/handbook/TESTING.md`

- Uses short flow-specific sections.
- Lists concrete table ownership and test expectations.
- Avoids duplicating the entire account model in each issue section.

### Service Test Pattern

Source: `lib/services/__tests__/person-profile.service.test.ts`

- Mock Supabase clients directly.
- Assert service outputs and database write payloads.
- Assert the service does not touch unrelated tables when the account model boundary matters.

### Validation Pattern

Source: prior issue plans under `.github/plans/issue-106*`, `issue-107*`, and `issue-108*`

- Focused tests first.
- Then `pnpm test`, `pnpm lint`, and `pnpm build`.
- Record validation results in the plan and GitHub issue comment.

## Design

Treat #109 as a stabilization pass, not another feature implementation:

1. Confirm existing tests already satisfy most acceptance criteria.
2. Add any missing high-signal assertions:
   - Ensure canonical profile documentation/test coverage clearly mentions `portfolio_url`.
   - If a service has exact select-string coverage near portfolio paths, keep it explicit so dropping the field fails.
3. Update documentation in the smallest durable places:
   - `docs/handbook/TESTING.md`: add portfolio to the basic person profile/professional profile contract.
   - `docs/PRODUCT-SPECIFICATION.md`: add portfolio URL to reusable basic profile/professional data.
   - `lib/legal/privacy.ts`: include portfolio in professional information disclosures if this copy is shown to users.
4. Validate the same slices affected by #106-#108 plus the full suite.

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `docs/handbook/TESTING.md` | Update | Document `portfolio_url` as optional `person_profile` professional data and regression-test expectation. |
| `docs/PRODUCT-SPECIFICATION.md` | Update | Keep product/account model docs aligned with portfolio as reusable profile data. |
| `lib/legal/privacy.ts` | Update | Keep privacy copy aligned with collected professional profile data. |
| `lib/memberschema.test.ts` | Review / maybe update | Only add coverage if profile update invalid portfolio path is missing or unclear. |
| `lib/services/__tests__/person-profile.service.test.ts` | Review / maybe update | Ensure service read/write assertions fail if portfolio is dropped. |
| `lib/services/__tests__/student.service.test.ts` | Review / maybe update | Ensure student-owned edit flow assertions fail if portfolio is dropped. |
| `lib/services/__tests__/company.service.test.ts` | Review / maybe update | Ensure authorized company mapping assertions fail if portfolio is dropped. |
| `lib/services/__tests__/recruiter.service.test.ts` | Review / maybe update | Ensure recruiter detail mapping assertions fail if portfolio is dropped. |
| `lib/services/__tests__/event.service.test.ts` | Review / maybe update | Ensure application review mapping assertions fail if portfolio is dropped. |
| `.github/plans/issue-109-portfolio-url-regression-coverage-and-documentation.plan.md` | Update | Track implementation and validation results. |

## Tasks

- [x] Audit existing portfolio regression coverage
  - Confirm #106 tests cover normalizing, rejecting invalid data, rejecting non-http schemes, and clearing optional values.
  - Confirm #107 tests cover student-owned read/update persistence.
  - Confirm #108 tests cover company, recruiter detail, and event application review mappings.
  - Do not add duplicate tests if the existing assertion already fails on field removal.

- [x] Add missing regression assertions only where useful
  - If profile update invalid portfolio coverage is missing, add a focused test in `lib/memberschema.test.ts`.
  - If any service mapping still only checks output loosely, add an explicit `portfolio_url` expectation.
  - Keep tests service/action-level, not browser-level.

- [x] Update account/testing documentation
  - In `docs/handbook/TESTING.md`, add a concise `person_profile` professional data note under Basic Person Profile or a small dedicated profile data contract subsection.
  - State that `portfolio_url` is optional, normalized through schemas/actions, stored on `person_profile`, hidden when absent, and only shown in authorized professional/review surfaces.
  - Mention that tests should fail if service mappings drop `portfolio_url`.

- [x] Update product/privacy documentation
  - In `docs/PRODUCT-SPECIFICATION.md`, add portfolio URL to the reusable profile/professional data field list.
  - In `lib/legal/privacy.ts`, include portfolio in professional information alongside LinkedIn and skills.

- [x] Validate
  - Run focused portfolio-related tests:
    - `pnpm vitest run lib/memberschema.test.ts lib/actions/student/__tests__/onboarding.helpers.test.ts lib/services/__tests__/person-profile.service.test.ts lib/services/__tests__/student.service.test.ts lib/services/__tests__/company.service.test.ts lib/services/__tests__/recruiter.service.test.ts lib/services/__tests__/event.service.test.ts`
  - Run `pnpm test`.
  - Run `pnpm lint`.
  - Run `pnpm build`.

- [x] Update GitHub
  - Comment on #109 with plan path, implementation summary, and validation results.
  - Add or keep `has-plan`.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Over-testing duplicates #106-#108 | Start with an audit and only add assertions where a drop would not already fail. |
| Documentation becomes too broad | Add concise bullets to existing account/testing docs rather than a new long document. |
| Privacy docs drift from collected profile fields | Update `lib/legal/privacy.ts` in the same pass. |
| Company/event visibility rules accidentally change | Do not touch eligibility queries except test assertions if needed. |

## Validation Log

Passed:

- `pnpm vitest run lib/memberschema.test.ts lib/actions/student/__tests__/onboarding.helpers.test.ts lib/services/__tests__/person-profile.service.test.ts lib/services/__tests__/student.service.test.ts lib/services/__tests__/company.service.test.ts lib/services/__tests__/recruiter.service.test.ts lib/services/__tests__/event.service.test.ts` - 7 files, 142 tests.
- `pnpm test` - 18 files, 279 tests.
- `pnpm lint` - passed with existing warnings only.
- `pnpm build` - passed.
