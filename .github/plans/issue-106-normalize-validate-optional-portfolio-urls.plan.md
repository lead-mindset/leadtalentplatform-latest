# Issue #106 Plan: Normalize and Validate Optional Portfolio URLs

GitHub Issue: https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/106
Source PRD: `.github/PRDs/portfolio-url-first-class-profile-data.prd.md`
Source issue spec: `.github/issues/portfolio-url-first-class-profile-data-issues.md`
Type: Technical / Enhancement
Complexity: Small

## Problem

`person_profile.portfolio_url` exists and onboarding collects it, but portfolio URL handling is inconsistent. Onboarding validates the field as a strict URL, so `github.com/example` fails, while `lib/actions/person-profile.ts` reads `portfolio_url` directly from `FormData` and passes it to the service without schema validation. This creates both UX friction and data consistency risk.

## User Story

As a student,
I want portfolio URL to be optional and forgiving of common URL input,
so that I can save useful professional profile data without needing to know exact URL syntax.

## Scope Boundary

In scope:

- Keep portfolio optional.
- Normalize optional portfolio URLs by adding `https://` when the scheme is missing.
- Validate the normalized value before persistence.
- Apply the normalized portfolio value in onboarding and generic person-profile upsert paths.
- Add focused tests for empty, normalized, preserved, and invalid portfolio inputs.
- Comment validation results on #106 after implementation.

Out of scope:

- Student profile edit UI for portfolio; this belongs to #107.
- Company/recruiter/event review display; this belongs to #108.
- Broader profile redesign.
- Public profile pages or portfolio previews.
- Requiring portfolio for onboarding, chapter membership, event registration, or company visibility.

## Product Decisions From Grill

- Portfolio URL is optional.
- Missing portfolio should be hidden from read-only professional/reviewer views.
- Student-owned edit/onboarding flows can prompt users to add portfolio.
- Portfolio should be normalized before validation.
- Portfolio belongs in `person_profile`, not `public.user`.
- Portfolio follows LinkedIn/resume-style visibility rules later, but #106 only handles input correctness.

## Current Code Findings

- `lib/memberschema.ts:9` defines `optionalUrl`, but it only trims and validates the raw value with `z.string().url()`.
- `lib/memberschema.ts:57` includes `portfolio_url` only in `createBasicOnboardingSchema`; `createBasicPersonProfileSchema` currently aliases `createBaseProfileSchema` and does not validate portfolio.
- `lib/actions/student/onboarding.helpers.ts:45` parses `portfolio_url`, and `lib/actions/student/onboarding.helpers.ts:72` passes `params.data.portfolio_url || null` to `PersonProfileService`.
- `lib/actions/person-profile.ts:38` uses `createBasicPersonProfileSchema`, but `lib/actions/person-profile.ts:67` bypasses schema parsing by reading raw `formData.get('portfolio_url')`.
- `lib/services/person-profile.service.ts:120` persists whatever `portfolioUrl` value it receives. This is correct if validation/normalization happens before service calls.
- `lib/actions/student/__tests__/onboarding.helpers.test.ts:43` already includes a valid portfolio URL fixture.
- `lib/services/__tests__/person-profile.service.test.ts:78` already verifies service mapping for an already-normalized portfolio URL.

## Design

Create a small shared URL normalizer in `lib/memberschema.ts` and use it inside portfolio schema definitions.

Recommended behavior:

```ts
normalizeOptionalUrl('')
// null

normalizeOptionalUrl('github.com/example')
// 'https://github.com/example'

normalizeOptionalUrl('https://github.com/example')
// 'https://github.com/example'
```

Implementation shape:

- Export a helper such as `normalizeOptionalUrl(value: unknown): string | null`.
- Treat non-string and empty/whitespace-only input as `null`.
- Trim string values.
- Detect existing scheme with a conservative regex such as `/^[a-z][a-z\d+\-.]*:\/\//i`.
- Add `https://` when no scheme exists.
- Validate the normalized value using `URL` or Zod `.url()`.
- Keep portfolio-specific schema optional and nullable after transform.
- Extend `createBasicPersonProfileSchema` so the generic profile action validates `portfolio_url`.

Service boundary:

- Do not make `PersonProfileService` parse or normalize URLs.
- Services should receive already-normalized `portfolioUrl` or `null`.
- This keeps server actions/controllers responsible for validation and services responsible for persistence/business behavior.

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `lib/memberschema.ts` | Update | Add exported optional URL normalizer and ensure onboarding/basic person profile schemas return normalized portfolio values. |
| `lib/actions/person-profile.ts` | Update | Parse `portfolio_url` through schema and pass normalized data to `PersonProfileService`. |
| `lib/actions/student/onboarding.helpers.ts` | Update if needed | Ensure saved portfolio value uses normalized parsed schema data and null semantics. |
| `lib/actions/student/__tests__/onboarding.helpers.test.ts` | Update | Cover optional, normalized, preserved, and invalid portfolio parsing. |
| New or existing action/schema test | Create/Update | Cover generic person-profile schema/action portfolio validation if practical without heavy server-action mocking. |
| `.github/plans/issue-106-normalize-validate-optional-portfolio-urls.plan.md` | Update | Track implementation progress and validation results. |

## Tasks

- [x] Add optional URL normalization helper
  - Export `normalizeOptionalUrl`.
  - Return `null` for empty input.
  - Add `https://` for missing scheme.
  - Reject invalid normalized values through schema validation.
  - Keep the invalid URL message using `t('validation.invalidUrl')`.

- [x] Wire portfolio into both schemas
  - Keep `createBasicOnboardingSchema(t).shape.portfolio_url` optional.
  - Change `createBasicPersonProfileSchema(t)` from a direct alias to a schema that includes optional `portfolio_url`.
  - Ensure inferred data type for `portfolio_url` is `string | null | undefined` as needed by actions.

- [x] Fix generic person-profile action validation
  - Include `portfolio_url` in `rawData`.
  - Pass `data.portfolio_url ?? null` to `PersonProfileService.upsertBasicProfile`.
  - Stop reading raw `formData.get('portfolio_url')` after parsing.

- [x] Add focused parsing tests
  - Empty portfolio parses successfully and saves as `null`.
  - `github.com/example` parses as `https://github.com/example`.
  - `https://github.com/example` remains unchanged.
  - Invalid portfolio text fails with `validation.invalidUrl`.

- [x] Validate
  - `pnpm vitest run lib/actions/student/__tests__/onboarding.helpers.test.ts lib/services/__tests__/person-profile.service.test.ts`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm build`

- [x] Update GitHub
  - Comment on #106 with plan path and validation results after implementation.
  - Add or keep `has-plan`.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Normalizer accidentally accepts dangerous schemes | Only preserve existing `http://` or `https://` schemes for user-entered profile URLs, or validate final value and consider rejecting non-http schemes. |
| Generic profile action type changes break downstream forms | Keep portfolio optional and default missing values to `null`. |
| Tests over-mock server actions | Prefer schema/helper tests for normalization and existing service tests for persistence. |
| Future LinkedIn normalization becomes conflated with portfolio | Keep #106 focused on `portfolio_url`; do not change LinkedIn requirements in this task. |

## Validation Log

Completed on 2026-05-09:

- `pnpm vitest run lib/memberschema.test.ts lib/actions/student/__tests__/onboarding.helpers.test.ts lib/services/__tests__/person-profile.service.test.ts` passed: 3 files, 23 tests.
- `pnpm test` passed: 18 files, 274 tests.
- `pnpm lint` passed with existing warnings only.
- `pnpm build` passed.
