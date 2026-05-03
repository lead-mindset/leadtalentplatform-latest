# Plan: LEAD-015 Chapter Membership Application and Approval Services

## Summary

Implement chapter membership application, approval, and rejection as explicit `chapter_membership` workflows. The service layer owns business rules and database access; Server Actions stay thin around auth, validation, revalidation, and email side effects.

## Tasks

- [x] Harden `ChapterMembershipService.applyToChapter()` so users need a `person_profile`, pending applications are idempotent, rejected same-chapter rows can reapply, and approved/alumni rows are not overwritten.
- [x] Add service-owned chapter manager checks for approval and rejection.
- [x] Update `ChapterService` wrappers so approval/rejection operate on explicit membership chapter rows instead of ambiguous historical membership inference.
- [x] Update chapter Server Actions to delegate authorization/business rules to services.
- [x] Add applicant-facing chapter application action.
- [x] Preserve chapter members UI behavior with minimal changes.
- [x] Expand service tests for application, approval, rejection, and cross-chapter denial.
- [x] Run targeted tests, full tests, lint, and build.

## Validation

```bash
pnpm vitest run lib/services/__tests__/chapter-membership.service.test.ts lib/services/__tests__/chapter.service.test.ts
pnpm test
pnpm lint
pnpm build
```

Latest validation:

- `pnpm vitest run lib/services/__tests__/chapter-membership.service.test.ts lib/services/__tests__/chapter.service.test.ts` passes: 2 files, 36 tests.
- `pnpm test` passes: 12 files, 187 tests.
- `pnpm lint` passes with existing warnings.
- `pnpm build` compiles successfully, then fails during TypeScript on existing legacy schema drift in `app/[locale]/admin/chapters/[id]/page.tsx:30` (`student_profile` no longer exists on `MemberWithProfile`).

## Notes

- No migration is expected; LEAD-006 already added the membership table constraints.
- Editors approve applicants as `member`; editor promotion remains admin-only.
- Chapter membership and newsletter subscription remain separate domains.
