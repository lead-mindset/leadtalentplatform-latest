# Issue #118 - Company Visibility and Invite-only Company Portal Validation Report

## Recommendation

Ready for controlled local/company QA.

This does not mean production company access should be opened yet. It means the local source-of-truth schema now has executable evidence that the company portal visibility and invite-only access rules behave as intended.

## Scope

Validated against local Supabase Docker only.

QA and production were not touched.

## What Changed

- Added `scripts/company-portal-readiness-validation.ts`, a local-only readiness harness for company portal safety checks.
- Added `pnpm company-portal:readiness`.
- Updated `RecruiterService` to reuse `CompanyService` visibility logic instead of duplicating embedded Supabase relationship queries.
- Strengthened regression coverage for company visibility, recruiter service parity, expired access, and access query errors.
- Updated `docs/handbook/COMPANY-PORTAL-QA.md` with automated local readiness guidance and production QA boundaries.

## Important Finding

The first local harness run exposed a real recruiter-facing schema relationship risk: `RecruiterService.getTalentPool` was relying on embedded `user -> person_profile` relationship queries that did not match the current generated/local schema behavior.

That is now fixed by routing recruiter talent list/detail/filter/saved flows through the shared `CompanyService` visibility loader. This reduces duplicated visibility logic and makes saved profiles and direct profile detail re-check current eligibility consistently.

## Evidence

- Local readiness summary: `tmp/company-portal-118/company-portal-readiness-summary.json`
- Local readiness report: `tmp/company-portal-118/company-portal-readiness-report.md`
- QA handbook: `docs/handbook/COMPANY-PORTAL-QA.md`
- Plan: `.github/plans/issue-118-company-visibility-invite-only-validation.plan.md`

## Validation Commands

```bash
pnpm company-portal:readiness -- --help
pnpm test -- lib/services/__tests__/company.service.test.ts lib/services/__tests__/recruiter.service.test.ts lib/auth.test.ts
pnpm exec eslint scripts/company-portal-readiness-validation.ts lib/services/company.service.ts lib/services/recruiter.service.ts lib/auth.ts
pnpm company-portal:readiness
pnpm lint
```

## Results

| Check | Result |
| --- | --- |
| Focused service/auth tests | Passed: 55 tests |
| Targeted eslint | Passed |
| Local readiness harness | Passed: 8/8 flows |
| Full lint | Passed with existing warnings only |
| Disposable local rows | Cleaned up |

## Acceptance Criteria Matrix

| Acceptance Criteria | Status | Evidence |
| --- | --- | --- |
| Imported or existing members are hidden from company portal by default | Passed | Hidden approved member was excluded from browse/search/detail/saved/resume flows. |
| Approved opted-in members can appear to active company representatives | Passed | Approved opted-in #118 member appeared in company and recruiter talent services. |
| Public participants do not appear | Passed | Public participant with no approved membership was excluded from search and direct detail. |
| Pending, rejected, no-membership, or alumni-only users do not appear | Passed | Pending, rejected, public/no-membership, and alumni #118 users were excluded. |
| Company representative dashboard requires active accepted invite access | Passed | `resolveRecruiterAccess` allowed only the active accepted representative. |
| Missing, inactive, revoked, or expired access is denied/routed to help | Passed | Missing, inactive, revoked, and expired access returned denied reasons. |
| Saved profiles and profile detail re-check current visibility | Passed | Saved hidden row stayed hidden; direct detail and resume download re-checked visibility. |

## Local Readiness Flows Passed

- Company visible talent eligibility.
- Hidden and ineligible company talent exclusion.
- Visible approved member direct detail.
- Saved profiles current visibility re-check.
- Save action visibility guard.
- Resume download visibility guard.
- Recruiter service visibility parity.
- Invite-only company portal access states.

## Known Gaps

- This is local service/access validation, not production smoke.
- Production auth, schema, and data-readiness blockers remain tracked separately.
- Real company access should not be opened until the broader go/no-go process clears.
- Browser QA for the visual company portal should still happen before real company demos.

