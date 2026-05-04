# Plan: LEAD-071 Centralize Company Talent Access Authorization

## Summary

Centralize company talent visibility rules in `CompanyService` so company browse, saved profiles, profile detail, save/unsave, and resume access use one V1 authorization model. The scope is service-layer hardening with tests; route consolidation, user-facing copy changes, RLS migrations, and UI redesign are out of scope.

## User Story

As the engineering team,
I want company talent authorization centralized,
So that company representatives cannot access hidden, unapproved, alumni, or public-participant profiles through inconsistent service paths.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #71 |
| Type | Technical |
| Complexity | Medium |
| Systems Affected | Company service, recruiter/company tests, company actions |
| Dependencies | LEAD-027 |
| Blocks | #69, #70, #72 |

## Decisions

- V1 company-visible talent requires `person_profile.is_recruiter_visible = true` and an approved `chapter_membership`.
- App role is not the candidate eligibility source; members, editors, admins, or staff can appear only if they also meet the visibility + approved membership rule.
- Public participants without approved chapter membership are hidden.
- Alumni-only, pending, rejected, and no-membership users are hidden.
- Saved lists only return currently visible candidates, while `saved_student` rows may remain in the database.
- Creating a save requires current visibility.
- Removing an owned saved row can succeed even if the candidate is no longer visible.
- Resume access must require current company representative access and candidate visibility before returning a URL or logging download.
- Keep implementation inside `CompanyService` for this issue.
- Do not expand `RecruiterService`; non-access `/recruiter/*` routes are handled by follow-up #69.

## Patterns To Follow

### Company Service

Source: `lib/services/company.service.ts`

Company browse, saved profile, profile detail, and save/unsave already live in `CompanyService`. Add shared helpers here instead of spreading eligibility conditions across actions/pages.

### Company Actions

Source: `lib/actions/company/get-data.ts` and `lib/actions/company/toggle-save.ts`

Actions should stay thin and delegate to `CompanyService`.

### Existing Tests

Source: `lib/services/__tests__/company.service.test.ts`

Use the existing fluent Supabase builder mock pattern and extend coverage around visibility, saved profiles, and save/unsave.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `.github/plans/lead-071-centralize-company-talent-access-authorization.plan.md` | Create | Track implementation and validation |
| `lib/services/company.service.ts` | Update | Centralize V1 talent visibility rules and save/unsave behavior |
| `lib/services/__tests__/company.service.test.ts` | Update | Cover eligibility rules, saved visibility, and save/unsave edge cases |
| GitHub Issue #71 | Update | Add evidence and close when validation passes |

## Tasks

## Progress

- [x] Task 1: Add Service Tests For V1 Visibility Rules
- [x] Task 2: Centralize Company Candidate Visibility In CompanyService
- [x] Task 3: Harden Saved Profile And Save/Unsave Behavior
- [x] Task 4: Validate And Update GitHub

### Task 1: Add Service Tests For V1 Visibility Rules

- **File**: `lib/services/__tests__/company.service.test.ts`
- **Action**: Update
- **Implement**:
  - Visible approved candidate is returned.
  - Hidden candidate is excluded.
  - Pending/rejected/alumni/no-membership candidate is excluded by query.
  - App role is not used as the eligibility source.
  - Saved list only returns currently visible candidates.
  - Saving hidden/unavailable candidate fails.
  - Unsave owned saved row can succeed without candidate visibility.
- **Validate**: `pnpm vitest run lib/services/__tests__/company.service.test.ts`

### Task 2: Centralize Company Candidate Visibility In CompanyService

- **File**: `lib/services/company.service.ts`
- **Action**: Update
- **Implement**:
  - Add shared constants/helpers for the V1 visible talent select and query filters.
  - Use `person_profile.is_recruiter_visible = true`.
  - Use `person_profile.chapter_membership.status = approved`.
  - Remove app-role eligibility filters from company talent queries.
  - Keep user-facing unavailable errors generic.
- **Validate**: `pnpm vitest run lib/services/__tests__/company.service.test.ts`

### Task 3: Harden Saved Profile And Save/Unsave Behavior

- **File**: `lib/services/company.service.ts`
- **Action**: Update
- **Implement**:
  - Ensure saved-list query only joins currently visible students.
  - Check existing save ownership before candidate visibility inside `toggleSaveStudent()`.
  - Allow owned unsave even if the candidate is no longer visible.
  - Require current visibility before inserting a new save.
  - Keep `saved_student` rows intact unless explicitly unsaved by owner.
- **Validate**: `pnpm vitest run lib/services/__tests__/company.service.test.ts`

### Task 4: Validate And Update GitHub

- **Files**: all changed files
- **Action**: Validate and update issue
- **Implement**:
  - Run targeted and broader validation.
  - Comment evidence on #71.
  - Add/keep `has-plan`.
  - Close #71 if acceptance criteria are satisfied.
- **Validate**:

```bash
pnpm vitest run lib/services/__tests__/company.service.test.ts
pnpm test
git diff --check
```

## Acceptance Criteria Mapping

- [x] Public participants without approved chapter membership do not appear in company browse/search.
- [x] Saved profile loading re-checks current recruiter visibility and approved membership.
- [x] Resume download now routes through `CompanyService` and requires current service authorization before signed URL/logging.
- [x] Existing `saved_student` rows are not blindly deleted when visibility changes.

## Out Of Scope

- Route consolidation for `/recruiter/*`.
- Legacy invite onboarding compatibility.
- User-facing copy rename.
- RLS migrations unless a tiny obvious gap is found.
- UI redesign.
