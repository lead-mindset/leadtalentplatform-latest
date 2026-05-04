# LEAD-085: Company Browse and Saved Talent Redesign

## Summary

Redesign the company representative browse and saved talent workflows while preserving invite-only company access and conservative talent visibility. The implementation will keep the existing company/recruiter service filters as the source of truth, improve scan density in the shared talent table, make save/unsave feedback explicit, and remove user-facing "recruiter/student" wording where the company portal should say "company representative", "profile", or "talent".

## Issue

- GitHub: #85
- Parent: #29 LEAD-028
- Type: Enhancement
- Complexity: Medium

## Acceptance Criteria

- [x] Browse talent loads visible profiles in a scannable desktop-first layout with profile, chapter, skills, and graduation year.
- [x] Saved talent preserves existing save/unsave behavior with clear feedback.
- [x] Invisible or ineligible profiles remain excluded by the existing service-layer filters.
- [x] User-facing copy uses company representative/company portal/saved talent language instead of recruiter language.
- [x] Desktop density supports repeated browsing without a marketing-style page.

## Patterns Observed

- `app/[locale]/company/(protected)/browse/page.tsx` already loads `searchStudents` plus `getSavedStudentIds` and delegates rendering to `StudentsTable`.
- `app/[locale]/company/(protected)/saved/page.tsx` already reuses `StudentsTable` after loading saved profiles.
- `lib/services/company.service.ts` filters `person_profile.is_recruiter_visible = true`; UI must not broaden this query.
- `app/[locale]/company/(protected)/_components/students-table.tsx` owns save/unsave button state and toast feedback.

## Tasks

1. [x] Update the browse page header, metrics, and empty state for company-facing profile language.
2. [x] Update the saved page to use the same container rhythm, correct browse link, and clearer saved collection language.
3. [x] Refine the shared talent table for dense scanning: profile, chapter, focus, graduation, skills, and actions.
4. [x] Improve table save/unsave button accessibility and toast copy while preserving optimistic behavior.
5. [x] Fix filter search ergonomics and user-facing copy.
6. [x] Validate with focused lint/build checks and record results.

## Validation

- `pnpm lint` - passed with existing warnings.
- `pnpm build` - passed.

## Risks

- Internal database/service names still use recruiter/student terminology. Mitigation: keep internal names where changing them would create migration risk; only adjust user-facing portal copy.
- Saved profiles may include null joins if visibility changes. Mitigation: preserve service filtering and render only returned visible `StudentForRecruiter` records.
