# Issue #318 - Service Empty Vs Error Semantics

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/318

Source PRD: `.github/PRDs/full-platform-qa-ux-logic-remediation.prd.md`

Source QA report: `docs/runbooks/full-platform-qa-ux-logic-audit-2026-06-07.md`

## Problem

Several data-loading services turn backend errors into ordinary empty states. That keeps authorization fail-closed, but it also makes outages look like "no membership", "no students", or "no saved talent" in user-facing UI.

## Scope

In scope:

- Preserve fail-closed authorization behavior.
- Add explicit load metadata for student activation dashboard data.
- Add explicit result variants for chapter application options.
- Add safe company data-load result methods for visible talent, saved talent, stats, and saved status.
- Wire user-facing student/company surfaces to friendly unavailable states where the audit identified false empty states.
- Add service tests for changed behavior.

Out of scope:

- Rewriting chapter permission authorization decisions.
- Full recruiter search pagination redesign (#311 / QA-011 follow-up).
- Database schema changes.

## Tasks

### Task 1 - Student Dashboard Load Metadata

- **Files**: `lib/services/student-dashboard.service.ts`, `lib/services/__tests__/student-dashboard.service.test.ts`, `app/[locale]/student/page.tsx`, `lib/actions/student/dashboard.ts`
- **Action**: Preserve current dashboard shape while adding `loadState` and friendly UI warnings for unavailable profile/membership/chapter-option loads.
- **Status**: Completed.

### Task 2 - Company Safe Data Load Results

- **Files**: `lib/services/company.service.ts`, `lib/services/__tests__/company.service.test.ts`, `lib/actions/company/get-data.ts`
- **Action**: Add result-returning methods that distinguish success/empty from unavailable backend failures.
- **Status**: Completed.

### Task 3 - Company Friendly Error States

- **Files**: `app/[locale]/company/(protected)/dashboard/page.tsx`, `app/[locale]/company/(protected)/saved/page.tsx`
- **Action**: Use safe company result methods so users see a friendly unavailable state instead of a false empty list/count.
- **Status**: Completed.

### Task 4 - Validate

- **Action**:
  - Run targeted service tests.
  - Run typecheck, lint, and full tests.
  - Capture screenshots for UI-visible unavailable states if feasible; otherwise document manual/fixture limitations.
- **Status**: Completed.

## Validation

- `pnpm exec vitest run lib/services/__tests__/student-dashboard.service.test.ts lib/services/__tests__/company.service.test.ts` - passed, 2 files and 37 tests.
- `pnpm exec tsc --noEmit --pretty false` - passed.
- `pnpm run lint` - passed with 0 errors and existing warnings.
- `pnpm test` - passed, 59 files and 533 tests.
- 390px regression screenshots:
  - `outputs/issue-318-service-empty-vs-error/member-student-390.png`
  - `outputs/issue-318-service-empty-vs-error/recruiter-company-dashboard-390.png`
  - `outputs/issue-318-service-empty-vs-error/recruiter-company-saved-390.png`

## Definition Of Done

- [x] Student dashboard does not silently treat profile/membership backend errors as ordinary participant state.
- [x] Company dashboard/saved talent does not silently treat backend errors as zero students.
- [x] Authorization checks still fail closed.
- [x] Changed services have tests.
- [x] Validation evidence is captured in the issue/report.
