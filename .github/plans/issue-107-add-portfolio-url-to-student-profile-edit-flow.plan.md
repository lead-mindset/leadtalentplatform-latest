# Issue #107 Plan: Add Portfolio URL to Student Profile Edit Flow

GitHub Issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/107
Source PRD: `.github/PRDs/portfolio-url-first-class-profile-data.prd.md`
Source issue spec: `.github/issues/portfolio-url-first-class-profile-data-issues.md`
Depends on: #106
Type: Feature
Complexity: Medium

## Problem

Students can enter `portfolio_url` during onboarding, and #106 adds normalization/validation for optional portfolio URLs, but the student profile edit flow still drops the field. The profile page reads from `PersonProfileService.getBasicProfile`, yet `ProfileData`, `ProfileUpdateForm`, `lib/actions/student/profile.ts`, and `StudentService` do not carry `portfolio_url` through read/update.

## User Story

As a returning student,
I want to edit or clear my portfolio URL from my profile,
so that my reusable professional profile stays current after onboarding.

## Scope Boundary

In scope:

- Load `portfolio_url` into the student profile edit form.
- Add an optional portfolio field near LinkedIn in the professional section.
- Submit portfolio through the existing profile update action.
- Normalize/validate portfolio using the #106 schema behavior.
- Save `portfolio_url` to `person_profile`.
- Store cleared portfolio values as `null`.
- Add focused tests so StudentService read/update does not drop portfolio.
- Comment validation results on #107.

Out of scope:

- Company/recruiter/event review display; this belongs to #108.
- Public profile pages or portfolio previews.
- Broad redesign of the student profile form.
- Changing chapter membership behavior in the current profile update flow.
- Making portfolio required.
- Reworking the older `StudentService.updateProfile` chapter-required design beyond the portfolio field.

## Product Decisions From Grill

- Portfolio is optional.
- Empty portfolio should be allowed and stored as `null`.
- Portfolio should be visible/editable in the user's own profile.
- Read-only surfaces should hide empty portfolio fields; #107 only touches the student-owned edit path.
- Portfolio follows LinkedIn/resume-style professional data rules later, but #107 is only edit/read persistence.

## Current Code Findings

Current re-check on 2026-05-10:

- The student profile page already maps `profileData?.portfolioUrl || ''` into `ProfileData.portfolio_url`.
- The profile update form already includes `portfolio_url` in default values, reset values, `FormData`, and the professional section UI.
- `createProfileUpdateSchema(t)` already includes optional normalized `portfolio_url` from #106.
- `lib/actions/student/profile.ts` already parses and passes `data.portfolio_url ?? null`.
- `StudentService.getProfile` already selects `portfolio_url`.
- `StudentService.updateProfile` already upserts `portfolio_url: params.portfolioUrl ?? null`.
- `student.service.test.ts` already asserts read/update/clear behavior for `portfolio_url`.

Historical findings from the original plan:

- `app/[locale]/student/profile/page.tsx:8` fetches `PersonProfileService.getBasicProfile`, which already returns `portfolioUrl`.
- `app/[locale]/student/profile/page.tsx:23` builds `ProfileData` but currently omits `portfolio_url`.
- `lib/memberschema.ts:169` defines `ProfileData` but currently lacks `portfolio_url`.
- `lib/memberschema.ts:145` defines `createProfileUpdateSchema` from `createMemberProfileSchema` and currently does not add optional `portfolio_url`.
- `app/[locale]/student/profile/components/profile-update-form.tsx:51` builds the update form from `createProfileUpdateSchema`.
- `app/[locale]/student/profile/components/profile-update-form.tsx:65` and `:89` set LinkedIn defaults but no portfolio default.
- `app/[locale]/student/profile/components/profile-update-form.tsx:108` appends `linkedin_url` to `FormData` but no portfolio.
- `app/[locale]/student/profile/components/profile-update-form.tsx:366` renders the LinkedIn input in the professional section.
- `lib/actions/student/profile.ts:73` parses `linkedin_url` but no `portfolio_url`.
- `lib/services/student.service.ts:43` selects `person_profile` fields but omits `portfolio_url`.
- `lib/services/student.service.ts:83` upserts `linkedin_url` but omits `portfolio_url`.
- `lib/services/__tests__/student.service.test.ts:115` asserts the exact select string, so tests should be updated alongside the service.

## Design

Keep this as a narrow field propagation slice:

1. Schema/type layer:
   - Add `portfolio_url?: string | null` to `ProfileData`.
   - Extend `createProfileUpdateSchema(t)` with `portfolio_url: optionalUrl(t).optional()`.
   - Reuse the #106 normalizer; do not create a second validation path.

2. Read path:
   - In `StudentService.getProfile`, include `portfolio_url` in the select string.
   - In `app/[locale]/student/profile/page.tsx`, map `profileData?.portfolioUrl` or service result `portfolio_url` into `combinedData.portfolio_url`.
   - Prefer the existing `PersonProfileService.getBasicProfile` read already used by the page; only keep `StudentService.getProfile` aligned because `getProfileData()` still uses it.

3. Update path:
   - Add `portfolioUrl?: string | null` to `UpdateProfileParams`.
   - Include `portfolio_url` in `StudentService.updateProfile` upsert.
   - Parse `portfolio_url` in `lib/actions/student/profile.ts` and pass `data.portfolio_url ?? null`.
   - In `ProfileUpdateForm`, add default/reset/form submission wiring.

4. UI:
   - Add a `FormInput` under LinkedIn in the professional section.
   - Label from `profile.professional.portfolio`.
   - Placeholder can be `https://mi-portafolio.com` in Spanish and `https://your-site.com` in English.
   - Keep it optional; no helper-heavy UX.

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `lib/memberschema.ts` | Update | Add portfolio to profile update schema and `ProfileData`. |
| `lib/services/student.service.ts` | Update | Select and upsert `portfolio_url`; add params field. |
| `lib/actions/student/profile.ts` | Update | Parse and pass normalized portfolio URL to `StudentService.updateProfile`; return it from `getProfileData`. |
| `app/[locale]/student/profile/page.tsx` | Update | Map existing `PersonProfileService` portfolio into form initial data. |
| `app/[locale]/student/profile/components/profile-update-form.tsx` | Update | Add default/reset/submit wiring and optional field UI. |
| `messages/es.json` | Update | Add Spanish profile portfolio label/placeholder. |
| `messages/en.json` | Update | Add English fallback profile portfolio label/placeholder. |
| `lib/services/__tests__/student.service.test.ts` | Update | Assert service read/update preserves portfolio. |
| `.github/plans/issue-107-add-portfolio-url-to-student-profile-edit-flow.plan.md` | Update | Track implementation progress and validation results. |

## Tasks

- [x] Update schema and types
  - Add `portfolio_url?: string | null` to `ProfileData`.
  - Extend `createProfileUpdateSchema(t)` with optional normalized `portfolio_url`.
  - Ensure clearing the field parses to `null`.

- [x] Update service read/write mapping
  - Add `portfolio_url` to `StudentService.getProfile` select.
  - Add `portfolioUrl?: string | null` to `UpdateProfileParams`.
  - Include `portfolio_url: params.portfolioUrl ?? null` in the `person_profile` upsert.

- [x] Update student profile action
  - Include `portfolio_url` in `rawData`.
  - Return `portfolio_url` from `getProfileData`.
  - Pass `data.portfolio_url ?? null` into `StudentService.updateProfile`.

- [x] Update profile page and form UI
  - Map `profileData?.portfolioUrl || ''` into initial `ProfileData`.
  - Add default/reset values for `portfolio_url`.
  - Append `portfolio_url` to `FormData`.
  - Render optional portfolio input directly below LinkedIn.
  - Add profile copy in `messages/es.json` and `messages/en.json`.

- [x] Update tests
  - Update exact select-string expectation in `student.service.test.ts`.
  - Add/read assert that `getProfile` returns `portfolio_url`.
  - Add/update assert that `updateProfile` writes `portfolio_url`.
  - Add case for cleared portfolio storing `null` if practical.

- [x] Validate
  - `pnpm vitest run lib/memberschema.test.ts lib/services/__tests__/student.service.test.ts`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm build`

- [x] Update GitHub
  - Comment on #107 with plan path and validation results after implementation.
  - Add or keep `has-plan`.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Profile edit action continues legacy chapter-required behavior | Do not refactor that behavior in #107; only add portfolio field propagation. |
| Portfolio value gets lost because page and action use different services | Update both `PersonProfileService` page mapping and `StudentService` action path. |
| Empty string stored instead of `null` | Use #106 schema normalization and pass `data.portfolio_url ?? null`. |
| UI copy becomes inconsistent with Spanish-first policy | Add Spanish labels first and keep English fallback simple. |
| Exact select-string test becomes brittle | Update the current assertion because it already exists; do not create broader brittle architecture tests here. |

## Validation Log

Completed on 2026-05-09:

- `pnpm vitest run lib/memberschema.test.ts lib/services/__tests__/student.service.test.ts` passed: 2 files, 22 tests.
- `pnpm test` passed: 18 files, 276 tests.
- `pnpm lint` passed with existing warnings only.
- `pnpm build` passed.

Planning re-check on 2026-05-10:

- Code inspection confirms #107 appears implemented in the current branch.
- Next `/implement #107` should be a close-out pass: run focused tests, targeted lint, full lint/build, create report, comment on GitHub, and close #107 if validation passes.

Close-out validation on 2026-05-10:

- `pnpm test -- lib/memberschema.test.ts lib/services/__tests__/student.service.test.ts lib/services/__tests__/person-profile.service.test.ts` passed: 3 files, 28 tests.
- `pnpm exec eslint lib/memberschema.ts lib/memberschema.test.ts lib/services/student.service.ts lib/services/__tests__/student.service.test.ts lib/actions/student/profile.ts "app/[locale]/student/profile/page.tsx" "app/[locale]/student/profile/components/profile-update-form.tsx" messages/es.json messages/en.json` passed with JSON ignore warnings for `messages/*.json`.
- `pnpm lint` passed with existing warnings only.
- `pnpm build` passed.
- Report created at `.github/reports/issue-107-add-portfolio-url-to-student-profile-edit-flow-report.md`.
