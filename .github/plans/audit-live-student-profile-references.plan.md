# Plan: Audit Live student_profile References Before Event PIVs

## Summary

Audit every remaining `student_profile` reference and classify it before LEAD-018 resumes. The goal is not to remove all historical references. It is to separate intentional legacy/migration references from live route, action, service, and UI references that can break the new account model during event work.

## User Story

As an engineer,
I want all live `student_profile` references classified,
So that we know which are legacy-safe and which must be migrated before event PIV work continues.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #67 |
| Parent | #66 |
| Type | AUDIT / STABILIZATION |
| Complexity | MEDIUM |
| Systems Affected | Chapter pages, event editor/application pages, recruiter/company UI, shared types, service compatibility shims |

## Current Findings

### Legacy-Safe References

These should remain unless a later cleanup issue removes the deprecated table entirely:

| Area | Examples | Classification |
|------|----------|----------------|
| Generated DB contract | `lib/database.generated.ts` | legacy-safe generated type |
| Base/migration SQL | `supabase/migrations/*student_profile*`, `20260429174400_base_schema.sql` | legacy migration |
| QA migration fixture | `supabase/seed-qa.sql` | QA fixture |
| Migration docs/testing docs | `docs/migrations/MIGRATION-PLAN-LEAD-002.md`, `docs/handbook/TESTING.md` | legacy documentation |

### Live References To Classify Or Migrate

| File | Reference | Initial Classification |
|------|-----------|------------------------|
| `components/global/navigation/NavHeader.tsx` | `.from("StudentProfile")` | must migrate now or verify dead component |
| `app/[locale]/student/layout.tsx` | `.from('student_profile')` for editor sidebar stats | must migrate now |
| `app/[locale]/chapter/[id]/page.tsx` | member/team queries from `student_profile` | must migrate now |
| `app/[locale]/chapter/events/new/page.tsx` | chapter lookup from `student_profile` | must migrate now |
| `app/[locale]/chapter/events/[id]/page.tsx` | chapter lookup from `student_profile` | must migrate now |
| `app/[locale]/chapter/events/[id]/applications/_components/event-applications-client.tsx` | application display uses `application.student_profile` | likely must migrate for LEAD-018 |
| `components/events/application-review-card.tsx` | `StudentProfile` prop shape | likely must migrate for LEAD-018 |
| `lib/actions/student/generate-member-ids.ts` | reads `student_profile` | likely legacy admin utility; classify |
| `lib/types.ts` | `StudentProfileRow`, registration/application legacy shapes, recruiter `student_profile` alias | compatibility shim / follow-up |
| `lib/services/event.service.ts` | returns `student_profile: profileRecord` in application rows | likely must migrate for LEAD-018 |
| `lib/services/company.service.ts` | transitional `student_profile` alias | compatibility shim; remove later with UI migration |
| Company protected UI files | read `student.student_profile.*` | compatibility shim; migrate if touching recruiter portal |

## Canonical Mapping

| Legacy | Canonical |
|--------|-----------|
| `student_profile.major` | `person_profile.major_or_interest` |
| `student_profile.graduation_year` | `person_profile.graduation_year` |
| `student_profile.linkedin_url` | `person_profile.linkedin_url` |
| `student_profile.skills` | `person_profile.skills` |
| `student_profile.is_recruiter_visible` | `person_profile.is_recruiter_visible` |
| `student_profile.chapter_id` | `chapter_membership.chapter_id` |
| `student_profile.approval_status` | `chapter_membership.status` |
| `student_profile.member_id` | `chapter_membership.member_id` |
| `student_profile.approved_by_id` | `chapter_membership.approved_by_id` |
| `student_profile.is_filled` | `Boolean(person_profile)` where a profile row is required |

## Files To Change

This audit may produce documentation-only output first, then one or more focused follow-up fixes.

| File | Action | Purpose |
|------|--------|---------|
| `.github/plans/audit-live-student-profile-references.plan.md` | CREATE | Execution plan and audit checklist |
| `docs/handbook/TESTING.md` or new audit note | UPDATE IF NEEDED | Record intentional legacy-safe references |
| Live route/service/component files listed above | UPDATE IF NEEDED | Replace must-migrate references with canonical model |
| GitHub Issue #67 | UPDATE | Post final classification and linked follow-ups |

## Tasks

### Task 1: Build The Authoritative Reference Inventory

- **Action**: READ / DOCUMENT
- **Implement**:
  - Run:
    - `rg -n "student_profile|StudentProfileRow|StudentProfile" app components lib docs supabase`
    - `rg -n "is_filled|approval_status|\\.major\\b" app components lib`
  - Export findings into a classification table.
  - Exclude generated files and historical migrations from live-code counts.
- **Validate**: Every acceptance-criteria category in #67 has at least one explicit example or “none found”.

### Task 2: Classify References Into Four Buckets

- **Action**: DOCUMENT
- **Buckets**:
  - `legacy migration`: migrations, migration docs, validation SQL.
  - `QA fixture`: `supabase/seed-qa.sql` or explicit migration fixture data.
  - `compatibility shim`: temporary aliases that preserve old UI while service returns canonical data.
  - `must migrate now`: live route/action/service/component reads or writes that can affect LEAD-018.
- **Validate**: No live `app/`, `components/`, or `lib/actions|services` reference remains unclassified.

### Task 3: Identify LEAD-018 Critical Fixes

- **Action**: DOCUMENT / CREATE FOLLOW-UPS IF NEEDED
- **Implement**:
  - Prioritize event application and event editor paths:
    - `app/[locale]/chapter/events/[id]/applications/_components/event-applications-client.tsx`
    - `components/events/application-review-card.tsx`
    - `lib/services/event.service.ts`
    - `app/[locale]/chapter/events/new/page.tsx`
    - `app/[locale]/chapter/events/[id]/page.tsx`
  - Decide whether each must be fixed inside #67 or split into a child issue.
- **Validate**: LEAD-018 has a clear unblock list.

### Task 4: Identify Non-Event Follow-Ups

- **Action**: DOCUMENT / CREATE FOLLOW-UPS IF NEEDED
- **Implement**:
  - Classify company/recruiter portal transitional alias usage.
  - Classify chapter public page/team usage.
  - Classify student layout/editor sidebar usage.
  - Classify `generate-member-ids` as either legacy utility or migration candidate.
- **Validate**: Each non-event item has one of: direct fix, follow-up issue, or documented safe reason.

### Task 5: Apply Small Must-Migrate Fixes Only If Low Risk

- **Action**: UPDATE IF NEEDED
- **Rule**: Fix in #67 only when a replacement is obvious and narrow.
- **Likely direct fixes**:
  - Replace chapter lookup through `student_profile` with `requireChapterMember()` or `chapter_membership`.
  - Replace display fields with `person_profile.major_or_interest`.
- **Defer**:
  - Larger event application data shape changes if they overlap LEAD-018 implementation.
  - Recruiter portal UI cleanup if it belongs under #27 / LEAD-027.
- **Validate**:
  - `pnpm build`
  - `pnpm test`
  - `pnpm lint`

### Task 6: Publish Audit Result

- **Action**: GitHub update
- **Implement**:
  - Comment on #67 with:
    - classified table
    - direct fixes made, if any
    - follow-up issues created or linked
    - validation results
  - Mark #67 complete only when every reference is classified.
- **Validate**: #67 acceptance criteria can be checked off.

## Checkpoints

### Checkpoint A: After Tasks 1-2

- [x] Inventory complete.
- [x] Generated/migration/doc references separated from live references.
- [x] No code changed before the initial classification pass.

### Checkpoint B: After Tasks 3-4

- [x] LEAD-018-critical references identified.
- [x] Non-event references routed to either direct fix or follow-up.

### Checkpoint C: After Task 5

- [x] `pnpm build` passes.
- [x] `pnpm test` passes.
- [x] `pnpm lint` passes with pre-existing warnings.

## Audit Result

Completed in #67.

### Final Classification

| Bucket | Result |
|--------|--------|
| `must migrate now` | Migrated all live table reads/writes from `student_profile` to `person_profile` and/or `chapter_membership`. |
| `compatibility shim` | Removed the recruiter/company `student_profile` alias from `StudentForRecruiter` and `CompanyService`. |
| `legacy migration` | Left historical migrations and `lib/database.generated.ts` intact because Docker Supabase still exposes the deprecated table. |
| `QA fixture` | Left `supabase/seed-qa.sql` intact because it intentionally exercises legacy migration paths. |
| `documentation` | Left migration/testing docs intact because they describe the historical mapping and validation queries. |

### Direct Fixes Applied

- Replaced `NavHeader` member ID lookup from `StudentProfile` with approved `chapter_membership`.
- Replaced student dashboard/editor sidebar membership checks with `chapter_membership`.
- Replaced public chapter page member/team reads with `chapter_membership` plus `person_profile`.
- Replaced chapter event editor/new-event chapter lookup with `requireChapterEditor()` plus `chapter`.
- Replaced event application review data shape from `student_profile` to `person_profile`.
- Replaced recruiter/company UI reads from `student_profile` alias to `person_profile`.
- Updated member ID generation to check `chapter_membership.member_id`.
- Updated bulk chapter approval to require canonical `person_profile` rows before approval.

### Remaining Matches

`rg -n "student_profile|StudentProfile" app components lib` now reports only:

- `lib/database.generated.ts`: generated legacy schema contract.
- `lib/services/student.service.ts`: explanatory migration comment.
- Recruiter page/action/service names such as `getStudentProfileForRecruiter`: product-language names, not table access.
- Company/recruiter page component names such as `StudentProfilePage`: product-language names, not table access.

`rg -n 'from\(("|'')StudentProfile|from\(("|'')student_profile|student_profile:' app components lib` reports only `lib/database.generated.ts`.

### Validation

| Command | Result |
|---------|--------|
| `pnpm build` | Passed |
| `pnpm test` | Passed: 14 files, 201 tests |
| `pnpm lint` | Passed with 99 existing warnings |

## Risks

| Risk | Mitigation |
|------|------------|
| Audit becomes a broad refactor | Classify first, fix only narrow obvious items, create follow-ups for larger migrations. |
| Compatibility aliases hide real debt | Mark every alias explicitly as `compatibility shim` with an owner/follow-up. |
| LEAD-018 work starts with event application shape still legacy | Prioritize event application references in Task 3. |
| Generated and migration files inflate the count | Track them separately as legacy-safe and do not rewrite historical migrations. |

## Output

Tasks completed: 6/6.
