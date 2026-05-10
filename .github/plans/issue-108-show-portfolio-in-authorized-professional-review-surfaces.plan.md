# Issue #108 Plan: Show Portfolio in Authorized Professional Review Surfaces

GitHub Issue: https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/108
Source PRD: `.github/PRDs/portfolio-url-first-class-profile-data.prd.md`
Source issue spec: `.github/issues/portfolio-url-first-class-profile-data-issues.md`
Depends on: #106
Related: #107
Type: Feature
Complexity: Medium

## Problem

Portfolio URL is now normalized and can be edited in the student-owned profile flow, but authorized professional review surfaces still omit it. Company representatives and chapter editors currently see LinkedIn/resume-style information without portfolio, even though portfolio is stored on `person_profile`.

## User Story

As a company representative or event reviewer,
I want to see a student's portfolio when it exists and I am authorized to view their professional profile,
so that I can evaluate their work with the same access rules as LinkedIn/resume data.

## Scope Boundary

In scope:

- Include `portfolio_url` in authorized company candidate data paths.
- Show portfolio on the company candidate detail page when present.
- Optionally show portfolio in the company quick view where LinkedIn is already shown.
- Include `portfolio_url` in event application review data.
- Show portfolio in event application review cards when present.
- Update service/types/tests so portfolio is included only through existing authorized paths.
- Hide portfolio UI when the value is absent.
- Comment validation results on #108.

Out of scope:

- Public profile pages.
- Portfolio previews, thumbnails, embeds, or metadata fetching.
- Changing company/recruiter eligibility rules.
- Showing participants without approved chapter membership in company discovery.
- Making portfolio required.
- Redesigning the company portal or event application review experience.
- Closing #109's broader documentation/regression scope.

## Product Decisions From Grill

- Portfolio is optional.
- Empty portfolio should be hidden on read-only review surfaces.
- Portfolio follows LinkedIn/resume-style visibility rules.
- No one without approved chapter membership appears in company portal.
- Company/recruiter terminology remains company/representative in UI, while existing code may still use recruiter domain names internally.

## Current Code Findings

- `lib/services/company.service.ts` already enforces company visibility with `person_profile.is_recruiter_visible = true` and approved `chapter_membership.status = approved`.
- `lib/services/company.service.ts` `VisibleProfileRow` and `loadVisibleStudents` select `linkedin_url` but omit `portfolio_url`.
- `lib/types.ts` `RecruiterVisibleProfile`, `StudentForRecruiterRaw`, and `StudentForRecruiter` include LinkedIn but omit portfolio.
- `app/[locale]/company/(protected)/students/[id]/page.tsx` displays LinkedIn and resume under "Links and Resume"; portfolio should fit there.
- `app/[locale]/company/(protected)/_components/student-quick-view.tsx` displays a LinkedIn button when present; portfolio can be a second optional outline link.
- `lib/services/recruiter.service.ts` has a parallel talent pool/detail service. `getStudentProfile` returns `linkedin_url` and resume but omits `portfolio_url`.
- `lib/services/recruiter.service.ts` `getTalentPool` list shape does not expose LinkedIn in `TalentPoolStudent`, so portfolio should likely be limited to detail profile unless quick/list components already need it.
- `lib/services/event.service.ts:1453` selects `user_id, major_or_interest, graduation_year, linkedin_url` for event registrations and maps applicant profile into `RegistrationWithUser`.
- `lib/types.ts` `RegistrationWithUserRaw` and `RegistrationWithUser` currently type `person_profile` as major/graduation/LinkedIn only.
- `app/[locale]/chapter/events/[id]/applications/_components/event-applications-client.tsx` maps `linkedinUrl` into `ApplicationReviewCard`.
- `components/events/application-review-card.tsx` displays LinkedIn when present and should display portfolio beside it.

## Design

Keep the implementation as a field propagation and conditional display slice:

1. Company data path:
   - Add `portfolio_url` to `RecruiterVisibleProfile`.
   - Add `portfolio_url` to `VisibleProfileRow`.
   - Add `portfolio_url` to `CompanyService.loadVisibleStudents` profile select.
   - Map `portfolio_url` into `student.person_profile`.
   - Update company service tests to assert eligible profiles include portfolio and ineligible profiles remain excluded through existing visibility/membership checks.

2. Company UI:
   - On `app/[locale]/company/(protected)/students/[id]/page.tsx`, add a portfolio external link in "Links and Resume" when `resolvedStudent.person_profile?.portfolio_url` exists.
   - Use `target="_blank"` and `rel="noopener noreferrer"`.
   - Hide entirely when absent; do not show an empty message if LinkedIn/resume already covers empty state.
   - In quick view, add an optional portfolio button next to/under LinkedIn if layout stays simple.

3. Event application review data:
   - Add `portfolio_url` to `RegistrationWithUserRaw` / `RegistrationWithUser` person_profile types.
   - Add `portfolio_url` to `EventService.getEventRegistrations` person_profile select and mapping.
   - Map `portfolioUrl` in `EventApplicationsClient.mapApplication`.
   - Add optional `portfolioUrl` to `ApplicationReviewCard` props and render an external link near LinkedIn.

4. RecruiterService alignment:
   - Add `portfolio_url` to `TalentPoolProfileRow` and `getStudentProfile` detail select/return.
   - Avoid adding portfolio to list-level `TalentPoolStudent` unless existing UI needs it. The acceptance criteria mentions profile/review surfaces, not list cards.
   - Update recruiter service tests around detail mapping if they assert selected fields.

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `lib/types.ts` | Update | Add `portfolio_url` to professional profile/result types used by company and event review. |
| `lib/services/company.service.ts` | Update | Include portfolio in existing authorized company-visible talent mapping. |
| `lib/services/recruiter.service.ts` | Update | Include portfolio in existing authorized student detail mapping. |
| `lib/services/event.service.ts` | Update | Include portfolio in event registration applicant profile mapping. |
| `app/[locale]/company/(protected)/students/[id]/page.tsx` | Update | Show portfolio link when present in company candidate detail. |
| `app/[locale]/company/(protected)/_components/student-quick-view.tsx` | Update | Show portfolio link when present in quick view if layout remains clean. |
| `app/[locale]/chapter/events/[id]/applications/_components/event-applications-client.tsx` | Update | Pass portfolio URL into review card data. |
| `components/events/application-review-card.tsx` | Update | Render optional portfolio link near LinkedIn. |
| `lib/services/__tests__/company.service.test.ts` | Update | Assert company mapping includes portfolio and existing eligibility filter remains unchanged. |
| `lib/services/__tests__/recruiter.service.test.ts` | Update | Assert recruiter detail mapping includes portfolio where applicable. |
| `lib/services/__tests__/event.service.test.ts` | Update | Assert event registration/application review mapping includes portfolio. |
| `.github/plans/issue-108-show-portfolio-in-authorized-professional-review-surfaces.plan.md` | Update | Track implementation progress and validation results. |

## Tasks

- [x] Update shared types
  - Add `portfolio_url` to `RecruiterVisibleProfile`.
  - Add `portfolio_url` to `RegistrationWithUserRaw` and `RegistrationWithUser` profile picks.
  - Add return shape support in recruiter detail types.

- [x] Update company service mapping
  - Select `portfolio_url` from `person_profile`.
  - Map `portfolio_url` into `StudentForRecruiter.person_profile`.
  - Preserve existing `is_recruiter_visible = true` and approved chapter membership filters.

- [x] Update recruiter detail mapping
  - Select `portfolio_url` in `getStudentProfile`.
  - Return `portfolio_url` in detail result.
  - Keep list-level talent pool unchanged unless needed by types.

- [x] Update event application review mapping
  - Select `portfolio_url` in `getEventRegistrations`.
  - Map it onto `RegistrationWithUser.person_profile`.
  - Pass it through `EventApplicationsClient.mapApplication`.

- [x] Update UI surfaces
  - Add company candidate detail portfolio link in "Links and Resume".
  - Add optional quick-view portfolio link only when present.
  - Add event application review portfolio link near LinkedIn.
  - Use `target="_blank"` and `rel="noopener noreferrer"` everywhere.
  - Hide portfolio UI entirely when absent.

- [x] Update tests
  - Company service: visible eligible student includes `portfolio_url`.
  - Company service: non-approved membership still returns `null` / excludes profile even if portfolio exists.
  - Recruiter service: detail profile includes `portfolio_url`.
  - Event service: registration/application mapping includes `portfolio_url`.

- [x] Validate
  - `pnpm vitest run lib/services/__tests__/company.service.test.ts lib/services/__tests__/recruiter.service.test.ts lib/services/__tests__/event.service.test.ts`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm build`

- [x] Update GitHub
  - Comment on #108 with plan path and validation results after implementation.
  - Add or keep `has-plan`.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Portfolio causes ineligible participants to appear in company portal | Do not add new queries; only add the field to existing visibility-filtered queries. |
| UI shows empty rows/buttons | Render portfolio link only when `portfolio_url` is truthy. |
| Company and recruiter services drift | Update both service paths because both still exist in the app. |
| Event review exposes portfolio outside editor access | Only add field to existing `getEventRegistrations` path used behind event access checks. |
| Test mocks become brittle | Update existing assertions only where they already check exact select strings or output mappings. |

## Validation Log

Passed:

- `pnpm vitest run lib/services/__tests__/company.service.test.ts lib/services/__tests__/recruiter.service.test.ts lib/services/__tests__/event.service.test.ts` - 3 files, 101 tests.
- `pnpm test` - 18 files, 278 tests.
- `pnpm lint` - passed with existing warnings.
- `pnpm build` - passed.
