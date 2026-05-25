# Issue #107 - Add Portfolio URL to Student Profile Edit Flow Report

## Recommendation

Completed.

The student-owned profile edit flow now carries `portfolio_url` end to end: read, form population, optional edit, normalized save, and clear-to-null persistence.

## Scope

This issue covers the member/student profile edit flow only.

Company/recruiter/event review display remains scoped to #108. Regression and documentation hardening remains scoped to #109.

## What Is Implemented

- Student profile page maps `PersonProfileService.getBasicProfile(...).portfolioUrl` into form initial data.
- Profile update form includes `portfolio_url` in defaults, reset state, submit `FormData`, and the professional section UI.
- Profile update schema validates optional portfolio through the #106 normalizer.
- Student profile action parses `portfolio_url` and passes `data.portfolio_url ?? null`.
- `StudentService.getProfile` selects `portfolio_url`.
- `StudentService.updateProfile` upserts `portfolio_url: params.portfolioUrl ?? null`.
- Spanish and English profile copy exists for the field label and placeholder.
- Student service tests assert read/update/clear behavior.

## Acceptance Criteria Matrix

| Acceptance Criteria | Status | Evidence |
| --- | --- | --- |
| Saved `portfolio_url` populates profile edit | Passed | `app/[locale]/student/profile/page.tsx` maps `portfolioUrl` into `ProfileData.portfolio_url`; form defaults consume it. |
| Updating portfolio saves to `person_profile.portfolio_url` | Passed | `lib/actions/student/profile.ts` and `lib/services/student.service.ts` pass/upsert portfolio URL. |
| Clearing portfolio saves `null` | Passed | `student.service.test.ts` covers cleared portfolio storing `null`; schema normalizes empty input. |
| Empty field renders without validation error | Passed | `createProfileUpdateSchema` uses optional normalized URL handling from #106. |
| Profile service tests prevent silent drops | Passed | `student.service.test.ts` asserts read select and update payload include `portfolio_url`. |

## Validation

```bash
pnpm test -- lib/memberschema.test.ts lib/services/__tests__/student.service.test.ts lib/services/__tests__/person-profile.service.test.ts
pnpm exec eslint lib/memberschema.ts lib/memberschema.test.ts lib/services/student.service.ts lib/services/__tests__/student.service.test.ts lib/actions/student/profile.ts "app/[locale]/student/profile/page.tsx" "app/[locale]/student/profile/components/profile-update-form.tsx" messages/es.json messages/en.json
pnpm lint
pnpm build
```

Results:

- Focused tests passed: 3 files, 28 tests.
- Focused eslint passed with JSON ignore warnings for `messages/*.json`.
- Full lint passed with existing warnings only.
- Production build passed.

## Notes

- No company-facing or event-review surfaces were changed in this issue.
- No public profile surface was created.
- Portfolio remains optional.

