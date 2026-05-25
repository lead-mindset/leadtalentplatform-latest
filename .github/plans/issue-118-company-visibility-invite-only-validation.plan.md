# Plan: Issue #118 - Company Visibility and Invite-only Company Portal Validation

## Summary

Validate that LEAD Talent Platform protects member talent data before LEAD SPARK by proving two separate safety layers:

1. Talent visibility: only approved members who explicitly opt in can appear in company-facing talent surfaces.
2. Company portal access: only company representatives with active, accepted, non-revoked, non-expired invite access can enter protected `/company/*` routes.

This issue should produce local-only executable evidence, targeted service regression coverage, an updated/manual QA source, and a concise GitHub report. It must not touch QA or production.

## User Story

As LEAD leadership and platform owner,  
I want company visibility and company portal access validated before inviting companies or members,  
so that LEAD SPARK does not expose public participants, hidden members, alumni, or unapproved users to company representatives.

## Metadata

| Field | Value |
| --- | --- |
| Type | VALIDATION / SECURITY / COMPANY |
| Complexity | MEDIUM |
| GitHub Issue | #118 |
| GitHub URL | `https://github.com/lead-mindset/leadtalentplatform-latest/issues/118` |
| Parent Roadmap | #130 |
| Source PRD | `.github/PRDs/lead-spark-production-readiness-validation.prd.md` |
| Manual QA Source | `docs/handbook/COMPANY-PORTAL-QA.md` |
| Main Services | `lib/services/company.service.ts`, `lib/services/recruiter.service.ts`, `lib/auth.ts` |
| Report | `.github/reports/issue-118-company-visibility-invite-only-validation-report.md` |
| Evidence Directory | `tmp/company-portal-118/` |

## Current Codebase Context

- `CompanyService` uses `person_profile.is_recruiter_visible = true` plus approved `chapter_membership.status = 'approved'` to load company-visible talent.
- `CompanyService.getStudentById`, `getSavedStudents`, `toggleSaveStudent`, `getTalentResumeMetadata`, and `createResumeDownloadUrl` re-check current visibility through the shared visible-student loader.
- `RecruiterService.getTalentPool`, `getSavedStudents`, and `getStudentProfile` use explicit `is_recruiter_visible = true` and approved membership filters.
- `resolveRecruiterAccess` in `lib/auth.ts` denies missing, revoked, inactive, expired, and errored access.
- Protected company routes use `requireRecruiter`, which redirects denied access to `/company/onboard?access=<reason>`.
- `docs/handbook/COMPANY-PORTAL-QA.md` already lists the manual validation source, but #118 should add executable local evidence so we do not rely only on visual/manual checks.

## Patterns to Follow

| Category | File | Pattern |
| --- | --- | --- |
| Local validation harness | `scripts/event-ops-readiness-validation.ts` | Load `.env.local`, refuse non-local Supabase URL, use deterministic disposable rows, write JSON/Markdown evidence, clean up local rows. |
| Company visibility service | `lib/services/company.service.ts` | Centralize visible talent through filters requiring opt-in and approved membership. |
| Company visibility tests | `lib/services/__tests__/company.service.test.ts` | Mock Supabase builder and assert visibility filters/saved/profile/resume re-checks. |
| Recruiter access tests | `lib/auth.test.ts` | Validate active, missing, revoked, inactive recruiter access states. |
| Manual QA checklist | `docs/handbook/COMPANY-PORTAL-QA.md` | Outcome-based checklist for company representative flows and access states. |
| Reporting | `.github/reports/issue-132-multi-event-operations-readiness-validation-report.md` | Recommendation, scope, evidence, passed flows, known gaps. |

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `scripts/company-portal-readiness-validation.ts` | CREATE | Local-only executable validation for company visibility and invite-only access. |
| `package.json` | UPDATE | Add `company-portal:readiness` script. |
| `lib/services/__tests__/company.service.test.ts` | UPDATE | Add any missing regression coverage for default-hidden/imported members and saved/detail re-checks. |
| `lib/services/__tests__/recruiter.service.test.ts` | UPDATE | Add missing coverage for public participant/alumni/non-approved exclusion if not already explicit. |
| `lib/auth.test.ts` | UPDATE | Add missing expired/error access coverage if needed. |
| `docs/handbook/COMPANY-PORTAL-QA.md` | UPDATE | Link executable validation and clarify production vs local/staging boundaries. |
| `.github/reports/issue-118-company-visibility-invite-only-validation-report.md` | CREATE | Final validation evidence and recommendation. |
| `.github/plans/issue-118-company-visibility-invite-only-validation.plan.md` | UPDATE | Track task status during implementation. |

## Disposable Local Data Contract

Use deterministic IDs so cleanup is repeatable and safe:

| Object | ID / Email |
| --- | --- |
| Company | `11800000-0000-4000-8000-000000000001` |
| Active company rep user | `11800000-0000-4000-8000-000000000010`, `company-active-118@test.com` |
| Missing-access company rep user | `11800000-0000-4000-8000-000000000011`, `company-missing-118@test.com` |
| Inactive-access company rep user | `11800000-0000-4000-8000-000000000012`, `company-inactive-118@test.com` |
| Revoked-access company rep user | `11800000-0000-4000-8000-000000000013`, `company-revoked-118@test.com` |
| Expired-access company rep user | `11800000-0000-4000-8000-000000000014`, `company-expired-118@test.com` |
| Visible approved member | `11800000-0000-4000-8000-000000000101`, `visible-member-118@test.com` |
| Hidden approved member | `11800000-0000-4000-8000-000000000102`, `hidden-member-118@test.com` |
| Public participant | `11800000-0000-4000-8000-000000000103`, `public-participant-118@test.com` |
| Pending member | `11800000-0000-4000-8000-000000000104`, `pending-member-118@test.com` |
| Rejected member | `11800000-0000-4000-8000-000000000105`, `rejected-member-118@test.com` |
| Alumni member | `11800000-0000-4000-8000-000000000106`, `alumni-member-118@test.com` |

Before each run, delete disposable #118 rows from:

- `resume_download_log`
- `saved_student`
- `recruiter_access`
- `resume`
- `chapter_membership`
- `person_profile`
- `user`
- `company`

Only delete rows matching deterministic #118 IDs/emails.

## Validation Strategy

Create a local-only script that:

1. Loads `.env.local`.
2. Refuses to run unless `NEXT_PUBLIC_SUPABASE_URL` points to `localhost` or `127.0.0.1`.
3. Uses `SUPABASE_SERVICE_ROLE_KEY` only for local validation setup and cleanup.
4. Confirms canonical chapter `leaduni` exists.
5. Deletes prior #118 disposable rows.
6. Creates one disposable company and representative users/access rows for active, missing, inactive, revoked, and expired states.
7. Creates disposable talent users:
   - visible approved opted-in member,
   - hidden approved member,
   - public participant/no membership,
   - pending member,
   - rejected member,
   - alumni member.
8. Validates company-visible talent:
   - `CompanyService.getVisibleStudents` returns only the visible approved member.
   - `CompanyService.searchStudents` cannot surface hidden/no-membership/pending/rejected/alumni rows.
   - `CompanyService.getStudentById` returns visible member and returns null for hidden/ineligible users.
   - `CompanyService.getSavedStudents` filters out a saved row after current visibility is removed or absent.
   - `CompanyService.toggleSaveStudent` cannot save hidden/ineligible users.
   - `CompanyService.createResumeDownloadUrl` denies hidden/ineligible users before storage signing/logging.
9. Validates recruiter-facing service parity where applicable:
   - `RecruiterService.getTalentPool` and `getStudentProfile` only return visible approved member.
10. Validates company portal access:
   - `resolveRecruiterAccess` allows active accepted access.
   - `resolveRecruiterAccess` denies missing, inactive, revoked, expired, and query-error states with expected reason codes.
11. Writes:
   - `company-portal-readiness-summary.json`
   - `company-portal-readiness-report.md`
12. Cleans up disposable local rows unless `--keep-data` is passed.

## Tasks

### Task 1: Add Local Company Portal Readiness Harness

Status: Completed

- **File**: `scripts/company-portal-readiness-validation.ts`
- **Action**: CREATE
- **Implement**:
  - Parse flags:
    - `--out`, default `tmp/company-portal-118`
    - `--keep-data`, default false
    - `--help`
  - Load `.env.local` without printing secrets.
  - Refuse non-local Supabase URL.
  - Create service-role local client.
  - Cleanup prior #118 rows.
  - Seed deterministic company, company representatives, access rows, members/profiles/memberships/saved rows/resume row.
  - Validate talent visibility and access states through real services.
  - Write JSON and Markdown evidence.
  - Cleanup unless `--keep-data`.
- **Validate**:
  - `pnpm company-portal:readiness -- --help`
  - `pnpm company-portal:readiness`

### Task 2: Add Package Script

Status: Completed

- **File**: `package.json`
- **Action**: UPDATE
- **Implement**:

```json
"company-portal:readiness": "tsx scripts/company-portal-readiness-validation.ts"
```

- **Validate**:
  - `pnpm company-portal:readiness -- --help`

### Task 3: Strengthen Company Service Regression Coverage

Status: Completed

- **File**: `lib/services/__tests__/company.service.test.ts`
- **Action**: UPDATE
- **Implement**:
  - Add/confirm test that default-hidden approved members do not appear.
  - Add/confirm test that no-membership/public participants do not appear.
  - Add/confirm test that pending/rejected/alumni memberships do not appear.
  - Add/confirm saved profile, direct profile detail, save action, and resume download re-check current visibility.
- **Validate**:
  - `pnpm test -- lib/services/__tests__/company.service.test.ts`

### Task 4: Strengthen Recruiter Service Regression Coverage

Status: Completed

- **File**: `lib/services/__tests__/recruiter.service.test.ts`
- **Action**: UPDATE
- **Implement**:
  - Add/confirm tests that talent pool and direct student profile require:
    - `role = member`,
    - `person_profile.is_recruiter_visible = true`,
    - approved chapter membership.
  - Add/confirm saved students still re-check current visibility and approved membership.
- **Validate**:
  - `pnpm test -- lib/services/__tests__/recruiter.service.test.ts`

### Task 5: Strengthen Access-State Regression Coverage

Status: Completed

- **File**: `lib/auth.test.ts`
- **Action**: UPDATE
- **Implement**:
  - Add missing tests for expired access and query-error access state in `resolveRecruiterAccess`.
  - Confirm access helper does not depend on profile or chapter membership tables.
- **Validate**:
  - `pnpm test -- lib/auth.test.ts`

### Task 6: Update Manual QA Handbook

Status: Completed

- **File**: `docs/handbook/COMPANY-PORTAL-QA.md`
- **Action**: UPDATE
- **Implement**:
  - Add a short “Automated local readiness” section referencing `pnpm company-portal:readiness`.
  - Clarify destructive access-state checks should remain local/staging only.
  - Clarify production validation should use dedicated production QA company/access only, not real candidates.
- **Validate**:
  - Checklist remains outcome-based and does not include real PII.

### Task 7: Run Validation

Status: Completed

- **Action**: VALIDATE
- **Commands**:

```bash
pnpm company-portal:readiness -- --help
pnpm test -- lib/services/__tests__/company.service.test.ts lib/services/__tests__/recruiter.service.test.ts lib/auth.test.ts
pnpm exec eslint scripts/company-portal-readiness-validation.ts lib/services/company.service.ts lib/services/recruiter.service.ts lib/auth.ts
pnpm company-portal:readiness
pnpm lint
```

- **Validate**:
  - Local readiness harness passes.
  - Focused tests pass.
  - Lint has no blocking errors.
  - Disposable local rows are cleaned up.

### Task 8: Create GitHub Report

Status: Completed

- **File**: `.github/reports/issue-118-company-visibility-invite-only-validation-report.md`
- **Action**: CREATE
- **Implement**:
  - Summarize local validation results.
  - Include evidence paths under `tmp/company-portal-118/`.
  - Include exact pass/fail matrix against #118 acceptance criteria.
  - Include known gaps:
    - local validation is not production smoke,
    - production schema/auth blockers still tracked separately,
    - real company access should not be opened until go/no-go clears.
  - Recommendation:
    - `Ready for controlled local/company QA`,
    - `Ready with caveats`,
    - or `Not ready`.
- **Validate**:
  - Report does not expose secrets or unnecessary PII.

### Task 9: Update GitHub Issue

Status: Completed

- **Action**: UPDATE
- **Implement**:
  - Comment on #118 with:
    - plan path,
    - report path,
    - QA handbook path,
    - validation summary,
    - recommendation,
    - blockers/follow-ups.
  - Close #118 only if acceptance criteria pass locally.

## Acceptance Criteria Mapping

- [x] Imported or existing members are hidden from company portal by default.
- [x] Approved opted-in members can appear to active company representatives.
- [x] Public participants do not appear in company talent browse/search/profile surfaces.
- [x] Pending, rejected, no-membership, or alumni-only users do not appear unless policy changes.
- [x] Company representative dashboard requires active accepted invite access.
- [x] Missing, inactive, revoked, or expired access is denied or routed to a help state.
- [x] Saved profiles and profile detail re-check current visibility.

## Out of Scope

- Production company portal smoke with real companies.
- Creating real partner/company accounts.
- Opening company access for LEAD SPARK.
- Importing real members.
- Legal/privacy rewrite.
- Full browser QA or screenshot capture unless a blocker requires visual verification.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Service-level visibility passes but protected routes are misconfigured | Validate `resolveRecruiterAccess` and confirm protected routes use `requireRecruiter`; leave browser route screenshots to manual QA if needed. |
| Direct service methods do not receive recruiter ID | Validate service visibility independently and portal access independently; report this architecture clearly. |
| Local schema differs from production | Mark evidence as local-only and keep production blockers in #119, #120, #121, #123. |
| Disposable rows collide with real data | Use deterministic #118 IDs/emails and local-only URL guard. |
| Hidden saved rows remain in DB | Validate saved profile listing re-checks visibility and hides them; DB rows can remain but should not render. |

## Implementation Notes

- Keep user-facing language as “company representative” and “company portal”; internal table names can remain `recruiter_access`.
- Do not change legal policy text.
- Do not mutate QA or production.
- If the harness reveals a real blocker, document it and fix only if tightly scoped to #118 acceptance.
