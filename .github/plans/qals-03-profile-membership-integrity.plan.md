# QALS-03 Plan: Profile and Chapter Membership Integrity

GitHub issue: #285

## Objective

Keep normal profile editing limited to personal, contact, academic, professional, recruiter-visibility, newsletter, and resume fields. Official chapter affiliation must remain read-only profile context backed by `chapter_membership` and managed through onboarding/application or operations workflows.

## Scope

- Student/member profile update action and service boundaries.
- Read-only membership display on `/es/student/profile`.
- Regression tests proving hostile or stale form fields cannot mutate chapter affiliation.

## Tasks

- [x] Inspect profile UI, action, service, and existing service tests for chapter membership writes.
- [x] Remove misleading service documentation that implies profile edits create chapter membership rows.
- [x] Add action-level regression coverage for submitted `lead_chapter` / `chapter_id` fields.
- [x] Keep profile UI chapter display read-only with Spanish support copy.
- [x] Run targeted tests and type validation.
- [x] Comment validation evidence on GitHub issue #285.

## Validation

- `pnpm exec vitest run lib/actions/student/profile.test.ts lib/services/__tests__/student.service.test.ts lib/services/__tests__/person-profile.service.test.ts`
- `pnpm exec tsc --noEmit`

## Notes

- This slice intentionally does not create transfer workflows. Corrections and transfers remain operational workflows until a separate vertical slice defines them.
- Alumni and recruiter/company launch behavior remains deferred by the controlled rollout PRD.
