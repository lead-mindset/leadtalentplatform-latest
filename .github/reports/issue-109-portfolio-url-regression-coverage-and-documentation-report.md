# Issue #109 - Portfolio URL Regression Coverage and Documentation Report

## Recommendation

Completed.

Portfolio URL is now covered as part of the canonical `person_profile` professional data contract across schema/action/service tests and lightweight account/privacy documentation.

## Scope

This issue is a stabilization pass for #106, #107, and #108.

It does not add new UI surfaces, public profile pages, portfolio previews, or new visibility rules.

## What Is Covered

- Optional portfolio URL normalization and validation.
- Empty/cleared portfolio stored as `null`.
- Invalid and non-http portfolio input rejected.
- Basic onboarding portfolio parsing.
- Basic person profile read/write mapping.
- Student profile read/update/clear mapping.
- Company-visible talent mapping and approved-membership exclusion.
- Recruiter/company detail mapping.
- Event application review mapping.
- Account/testing documentation for `person_profile.portfolio_url`.
- Product specification mention of Portfolio URL.
- Privacy copy mention of portfolio/portafolio as professional information.

## Documentation Evidence

- `docs/handbook/TESTING.md` documents `portfolio_url` as reusable `person_profile` professional data.
- `docs/handbook/TESTING.md` states portfolio is optional, normalized through schemas/actions, stored as `null` when cleared, hidden when absent, and only shown in self-owned or authorized review surfaces.
- `docs/handbook/TESTING.md` states regression tests should fail if service/action mappings drop `portfolio_url`.
- `docs/PRODUCT-SPECIFICATION.md` lists Portfolio URL as an optional basic onboarding/profile field.
- `lib/legal/privacy.ts` lists portfolio/portafolio under professional information in English and Spanish.

## Acceptance Criteria Matrix

| Acceptance Criteria | Status | Evidence |
| --- | --- | --- |
| Profile-related tests fail if portfolio mapping is dropped | Passed | Memberschema, onboarding, person-profile, and student service tests assert portfolio behavior. |
| Company/reviewer mapping tests include portfolio in authorized outputs | Passed | Company, recruiter, and event service tests assert `portfolio_url` mapping. |
| Invalid portfolio validation path is covered | Passed | Schema/onboarding tests cover invalid text and non-http scheme rejection. |
| Documentation lists portfolio under `person_profile` professional data | Passed | Testing handbook and product specification include portfolio; privacy copy includes portfolio/portafolio. |

## Validation

```bash
pnpm test -- lib/memberschema.test.ts lib/actions/student/__tests__/onboarding.helpers.test.ts lib/services/__tests__/person-profile.service.test.ts lib/services/__tests__/student.service.test.ts lib/services/__tests__/company.service.test.ts lib/services/__tests__/recruiter.service.test.ts lib/services/__tests__/event.service.test.ts
pnpm exec eslint lib/memberschema.ts lib/memberschema.test.ts lib/actions/student/onboarding.helpers.ts lib/actions/student/__tests__/onboarding.helpers.test.ts lib/services/person-profile.service.ts lib/services/student.service.ts lib/services/company.service.ts lib/services/recruiter.service.ts lib/services/event.service.ts lib/services/__tests__/person-profile.service.test.ts lib/services/__tests__/student.service.test.ts lib/services/__tests__/company.service.test.ts lib/services/__tests__/recruiter.service.test.ts lib/services/__tests__/event.service.test.ts lib/legal/privacy.ts
rg -n "portfolio_url|Portfolio URL|portfolio|portafolio" docs/handbook/TESTING.md docs/PRODUCT-SPECIFICATION.md lib/legal/privacy.ts
pnpm lint
pnpm build
```

Results:

- Focused portfolio tests passed: 7 files, 143 tests.
- Focused eslint passed.
- Documentation text check confirmed portfolio references.
- Full lint passed with existing warnings only.
- Production build passed.

