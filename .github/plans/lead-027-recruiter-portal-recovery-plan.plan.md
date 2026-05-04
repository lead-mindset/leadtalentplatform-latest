# Plan: LEAD-027 Recruiter Portal Recovery Plan

## Summary

Create a recovery plan for the company representative portal after the account-model refactor. This is a spike, not an implementation slice: the output should be a durable audit document that maps invite, accept, login, dashboard, browse, save, profile, and resume download flows; identifies duplicate or confusing paths; confirms company representative access remains independent from `person_profile` and `chapter_membership`; and generates small follow-up issues for independently shippable recovery work.

## User Story

As the engineering team,
I want a recovery plan for recruiter/company flows,
So that unstable invite and login behavior can be fixed after the student/editor/event milestone.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #28 |
| Type | Spike |
| Complexity | Small |
| Systems Affected | Recruiter/company docs, GitHub planning, recruiter routes/actions/services |
| Dependencies | LEAD-022 |
| Blocks | None |

## Problem

LEAD-022 stabilized invite-only company representative access around `public.user.role='recruiter'` plus active accepted `recruiter_access`, but the codebase still contains both `/company/*` and `/recruiter/*` portal surfaces, plus both `/recruiter/access?token=...` and legacy `/company/onboard?inviteToken=...` invite paths. Before implementing more company representative features or redesign work, we need a written recovery map that names the current flows, identifies duplicate/confusing routes, and splits the follow-up work into small issues.

## Decisions From Plan Review

- User-facing language should say "company representative" or "company portal"; internal code/schema names can remain `recruiter_*`.
- `/company/*` is the canonical V1 company representative portal.
- `/recruiter/access?token=...` remains the invite acceptance entrypoint only.
- Other `/recruiter/*` pages should be deprecated, redirected, or removed by follow-up work.
- Legacy `/company/onboard?inviteToken=...` should become compatibility/help state, not a long-term independent mutation flow.
- Company login with missing, inactive, revoked, or expired access should land in a company access/help state, never student onboarding.
- Talent visibility requires active accepted `recruiter_access`, `person_profile.is_recruiter_visible = true`, and approved `chapter_membership`.
- Public participants without approved chapter membership never appear in the company portal.
- Alumni are hidden by default until explicit alumni visibility rules exist.
- `saved_student` stays as the internal table name; user-facing copy should prefer saved talent/profiles.
- Saved rows may persist, but all display and resume-download access must re-check current access and talent visibility.
- LEAD-027 closes after the recovery document and follow-up issues are created.

## Patterns To Follow

### Canonical Recruiter Access

Source: `.github/plans/lead-022-preserve-invite-only-recruiter-access-after-account-refactor.plan.md`

Company representative access remains invite-only. Authorization must use `public.user.role='recruiter'` plus active accepted `recruiter_access`, not `person_profile`, `student_profile`, or `chapter_membership`.

### Invite Creation

Source: `lib/actions/admin/invite-recruiter.ts`

New admin invites currently generate `/recruiter/access?token=...`, send email, and delegate invite record creation to `AdminService`. The recovery plan should preserve this as the canonical new-invite path unless implementation evidence says otherwise.

### Signed-In Invite Acceptance

Source: `app/[locale]/recruiter/access/page.tsx` and `lib/actions/recruiter/access.ts`

The newer invite path validates the token, requires the signed-in email to match the invited email, calls `RecruiterService.acceptInvite()`, and redirects to `/company/dashboard`.

### Legacy Company Onboarding

Source: `app/[locale]/company/onboard/page.tsx` and `lib/actions/company/handle-invite.ts`

The legacy path validates `inviteToken` with a service-role flow and renders `OnboardContent`. The recovery plan should decide whether this remains compatibility/help state or becomes a redirect to the canonical signed-in acceptance path.

### Protected Company Portal

Source: `lib/auth.ts` and `app/[locale]/company/(protected)/dashboard/page.tsx`

Protected company routes use `requireRecruiter()`, which checks app role and active recruiter access. This should remain the authorization center for company dashboard, browse, saved students, profile, and settings.

### Recruiter Talent Portal

Source: `app/[locale]/recruiter/browse/page.tsx` and `lib/services/recruiter.service.ts`

The recruiter route family has talent-pool browse and saved/profile surfaces that overlap with company protected pages. Recovery should document `/company/*` as canonical for V1 and mark non-access `/recruiter/*` pages as compatibility/deprecation targets.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `docs/handbook/RECRUITER-PORTAL-RECOVERY.md` | Create | Audit current recruiter/company flows, duplicate paths, canonical decisions, and follow-up issue breakdown |
| `.github/plans/lead-027-recruiter-portal-recovery-plan.plan.md` | Create | Track execution plan and validation evidence |
| GitHub Issue #28 | Update | Add plan/evidence comments, add `has-plan`, and create follow-up issues if warranted |

## Dependency Order

1. Audit source files and route families.
2. Draft the recovery document with current-state maps and canonical decisions.
3. Create small follow-up issues for recovery tasks.
4. Validate docs and update #28.

## Tasks

## Progress

- [x] Task 1: Map Current Recruiter Flow Surface
- [x] Task 2: Create Recovery Plan Document
- [x] Task 3: Split Follow-Up Issues
- [x] Task 4: Validate And Update GitHub

### Task 1: Map Current Recruiter Flow Surface

- **Files**:
  - `lib/actions/admin/invite-recruiter.ts`
  - `lib/actions/recruiter/access.ts`
  - `lib/actions/company/handle-invite.ts`
  - `lib/actions/company/get-data.ts`
  - `lib/actions/company/toggle-save.ts`
  - `lib/actions/recruiter/talent-pool.ts`
  - `lib/actions/recruiter/student-profile.ts`
  - `lib/services/company.service.ts`
  - `lib/services/recruiter.service.ts`
  - `lib/auth.ts`
  - `app/[locale]/company/**/*`
  - `app/[locale]/recruiter/**/*`
- **Action**: Audit only
- **Implement**:
  - Map invite creation, invite acceptance, login, protected dashboard, browse, saved students, profile view, resume download, and save/unsave flows.
  - Identify which flows use `company` routes and which use `recruiter` routes.
  - Record service/action ownership for each flow.
  - Confirm where `requireRecruiter()` is used.
- **Mirror**: LEAD-022 current-state section.
- **Validate**: `rg -n "requireRecruiter|acceptInvite|validateInviteToken|getTalentPool|getSavedStudents|toggleSave|resume" lib app`

### Task 2: Create Recovery Plan Document

- **File**: `docs/handbook/RECRUITER-PORTAL-RECOVERY.md`
- **Action**: Create
- **Implement**:
  - Add a current-state flow map.
  - Add a duplicate/confusing-flow table.
  - Document canonical V1 decisions:
    - new invites use `/recruiter/access?token=...`;
    - protected company representative work happens under `/company/*`;
    - non-access `/recruiter/*` pages are deprecation/redirect candidates;
    - legacy `/company/onboard?inviteToken=...` is compatibility/help state;
    - company representative access remains independent from `person_profile` and `chapter_membership`;
    - company portal talent visibility requires `is_recruiter_visible = true` and approved `chapter_membership`;
    - alumni and public participants without approved membership are not visible by default;
    - saved rows persist, but saved/profile/resume display access must re-check current visibility.
  - Add recovery priorities for invite/login, dashboard/browse parity, save/profile/resume flows, and future UI redesign handoff.
  - Keep this as documentation only; do not modify runtime behavior.
- **Mirror**: `docs/handbook/TESTING.md` recruiter validation notes and LEAD-022 plan decisions.
- **Validate**: `rg -n "recruiter_access|person_profile|chapter_membership|/recruiter/access|/company/onboard|/company/dashboard" docs/handbook/RECRUITER-PORTAL-RECOVERY.md`

### Task 3: Split Follow-Up Issues

- **GitHub**: Issue #28 and new child/follow-up issues
- **Action**: Create GitHub issues if the audit confirms separately shippable recovery tasks
- **Implement**:
  - Create a small issue for consolidating company representative portal routes.
  - Create a small issue for converting legacy company invite onboarding into compatibility/help state.
  - Create a small issue for centralizing company talent access authorization.
  - Create a small issue for company representative manual QA.
  - Create a small issue for renaming user-facing recruiter language to company representative.
  - Link created issues from #28 and the recovery document.
- **Mirror**: previous task issue style under LEAD-013 and LEAD-004.
- **Validate**: `gh issue view 28 --repo abigailbrionesa/leadtalentplatform-latest --comments`

### Task 4: Validate And Update GitHub

- **Files**: all changed docs
- **Action**: Validate and update issue
- **Implement**:
  - Run docs-safe validation.
  - Comment on #28 with plan path, recovery doc path, created follow-up issues, and validation results.
  - Add or keep `has-plan`.
  - Close #28 when the recovery plan and follow-up issue split are complete.
- **Validate**:

```bash
git diff --check
rg -n "recruiter_access|person_profile|chapter_membership|/recruiter/access|/company/onboard|/company/dashboard" docs/handbook/RECRUITER-PORTAL-RECOVERY.md
```

## Acceptance Criteria Mapping

- [x] Invite, accept, login, dashboard, save, and resume download flows are mapped.
- [x] Confusing or duplicate flows are listed.
- [x] Recruiter flows remain separate from `person_profile` and `chapter_membership`.
- [x] Follow-up recruiter recovery issues are small and independently shippable.

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Recovery doc becomes implementation work | Keep this issue docs-only and generate follow-up issues for runtime changes |
| Route consolidation disrupts working company portal | Mark canonical route decisions as future implementation, not immediate redirects |
| Recruiter access drifts back into student onboarding | Repeat the `user.role='recruiter'` plus `recruiter_access` rule in the recovery document |
| Follow-up issues are too broad | Split by flow: invite/login, route consolidation, browse/saved/profile/resume, manual QA |
| Existing uncommitted docs get mixed in | Stage/commit LEAD-027 separately from LEAD-026 docs when committing |

## Out Of Scope

- Runtime changes to invite acceptance.
- Recruiter UI redesign.
- Database migrations.
- Talent search feature expansion.
- Self-serve recruiter signup.
- Changes to recruiter visibility rules.
