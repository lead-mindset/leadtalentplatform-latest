# Portfolio URL First-Class Profile Data Issues

Source PRD: `.github/PRDs/portfolio-url-first-class-profile-data.prd.md`

## Created GitHub Issues

| Issue | Title | URL |
| --- | --- | --- |
| #106 | Normalize and validate optional portfolio URLs | https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/106 |
| #107 | Add portfolio URL to student profile edit flow | https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/107 |
| #108 | Show portfolio in authorized professional review surfaces | https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/108 |
| #109 | Add portfolio URL regression coverage and documentation | https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/109 |

## Issue 1: Normalize and validate optional portfolio URLs

Type: Technical / Enhancement
Complexity: Small
Labels: `LEAD`, `profile`, `backend`, `testing`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: None

### Description

Portfolio URL is already part of `person_profile`, but URL handling is strict and inconsistent. Add a reusable normalization path so optional portfolio input can be empty, can omit `https://`, and is validated before persistence.

### Acceptance Criteria

- [ ] Given portfolio input is empty, when profile data is saved, then `portfolio_url` is stored as `null`.
- [ ] Given portfolio input is `github.com/example`, when profile data is saved, then it is stored as `https://github.com/example`.
- [ ] Given portfolio input already has `https://`, when profile data is saved, then it is preserved.
- [ ] Given portfolio input is invalid text, when validation runs, then a user-friendly validation error is returned.
- [ ] Given service/action tests run, when portfolio cases are covered, then optional, normalized, and invalid inputs are verified.

### Implementation Notes

- Likely files: `lib/memberschema.ts`, `lib/actions/person-profile.ts`, `lib/actions/student/onboarding.helpers.ts`, relevant tests.
- Keep the helper generic enough for LinkedIn/portfolio style optional URLs if useful.
- Do not require portfolio in onboarding or profile edit.

## Issue 2: Add portfolio URL to student profile edit flow

Type: Feature
Complexity: Medium
Labels: `LEAD`, `profile`, `student`, `frontend`, `backend`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issue 1

### Description

Students can currently enter a portfolio during onboarding, but the profile edit flow does not expose or update the field. Add portfolio URL to the student-owned profile read/update path so returning users can maintain it.

### Acceptance Criteria

- [ ] Given a student has a saved `portfolio_url`, when they open profile edit, then the field is populated.
- [ ] Given a student updates portfolio URL, when they save profile changes, then `person_profile.portfolio_url` is updated.
- [ ] Given a student clears portfolio URL, when they save profile changes, then the value is stored as `null`.
- [ ] Given the field is empty, when the form renders, then no validation error is shown.
- [ ] Given profile service tests run, when profile read/update is covered, then portfolio is not silently dropped.

### Implementation Notes

- Likely files: `lib/services/student.service.ts`, `lib/actions/student/profile.ts`, `app/[locale]/student/profile/page.tsx`, `app/[locale]/student/profile/components/profile-update-form.tsx`, messages.
- Preserve existing profile fields and avoid resetting unrelated columns.
- Keep copy Spanish-first where the current profile UI is Spanish.

## Issue 3: Show portfolio in authorized professional review surfaces

Type: Feature
Complexity: Medium
Labels: `LEAD`, `company`, `events`, `profile`, `frontend`, `backend`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issue 1

### Description

Portfolio URL should be visible where LinkedIn/resume-style professional context already appears: company candidate review and event application review. It should remain hidden when absent and should follow existing authorization rules.

### Acceptance Criteria

- [ ] Given an eligible company-visible member has a portfolio URL, when a company representative views their profile, then the portfolio link is visible.
- [ ] Given a profile has no portfolio URL, when company or review surfaces render, then no empty portfolio row is shown.
- [ ] Given an event applicant has a portfolio URL, when an authorized chapter editor reviews the application, then the portfolio link is visible near other professional links.
- [ ] Given a participant lacks approved chapter membership, when company discovery runs, then portfolio visibility does not cause them to appear.
- [ ] Given service tests run, when company/recruiter/event profile mappings are covered, then portfolio is included only in authorized data paths.

### Implementation Notes

- Likely files: `lib/services/company.service.ts`, `lib/services/recruiter.service.ts`, `lib/services/event.service.ts`, company profile components, `components/events/application-review-card.tsx`.
- Use `target="_blank"` and `rel="noopener noreferrer"` for portfolio links.
- Do not create public profile pages or portfolio previews.

## Issue 4: Add portfolio URL regression coverage and documentation

Type: Technical
Complexity: Small
Labels: `LEAD`, `testing`, `documentation`, `profile`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issues 1-3

### Description

Add regression coverage and light documentation so portfolio remains part of the canonical `person_profile` contract and does not drift out of service mappings again.

### Acceptance Criteria

- [ ] Given profile-related tests run, when portfolio fields are mapped, then tests fail if the field is dropped.
- [ ] Given company/reviewer mapping tests run, when portfolio is present, then the link is included in authorized outputs.
- [ ] Given invalid portfolio data is submitted, when validation runs, then the error path is covered.
- [ ] Given documentation is reviewed, when profile data ownership is described, then portfolio is listed under `person_profile` professional profile data.

### Implementation Notes

- Likely files: service tests under `lib/services/__tests__/`, action/helper tests, `docs/handbook/TESTING.md` or relevant profile/account docs.
- Keep documentation concise and avoid duplicating the whole account model.
