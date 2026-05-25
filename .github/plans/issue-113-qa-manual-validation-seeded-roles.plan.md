# Plan: Issue 113 QA Manual Validation Seeded Roles

## Summary

Complete Layer 3 manual QA validation across the seeded platform roles in the hosted QA environment before any real production member activation. This issue should validate the user-visible flows for Public Participant, Member, Chapter Editor, Admin, Staff/Founder, Company Representative, and Alumni using the QA seed accounts, record evidence by role, update the Layer 3 validation checklist, and create follow-up issues only for confirmed P0/P1 blockers.

This is a manual QA execution issue. It should not change runtime code by default.

## User Story

As Abigail and the activation team,
I want each seeded role to be tested in QA with evidence,
so that we know the platform behaves correctly for real LEAD members, leaders, admins, and company representatives before production activation.

## Metadata

| Field | Value |
| --- | --- |
| Type | QA / Manual Validation |
| Complexity | Medium |
| GitHub Issue | #113 |
| GitHub URL | https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/113 |
| Source PRD | `.github/PRDs/lead-spark-production-readiness-validation.prd.md` |
| Source Validation Doc | `docs/proposals/lead-spark-production-readiness-validation.md` |
| Depends On | #112 |
| Systems Affected | QA environment, seeded roles, onboarding, events, chapter dashboard, admin dashboard, company portal |

## Current State

- #111 Layer 1 code/documentation inspection passed.
- #112 Layer 2 automated validation passed:
  - targeted readiness Vitest: 11 files / 200 tests
  - `pnpm test`: 23 files / 293 tests
  - `pnpm lint`: 0 errors / 77 warnings
  - `pnpm build`: passed
- Layer 3 in `docs/proposals/lead-spark-production-readiness-validation.md` was updated with evidence-backed statuses by this issue.

## Implementation Result

Completed on 2026-05-10.

- Hosted QA was validated at `https://leadqa.vercel.app/es`.
- All seven seed accounts authenticated successfully after using slower, reliable Playwright typing against the hosted login form.
- Route and screenshot evidence was captured under `tmp/qa-113/`.
- Canonical evidence JSON was written to `tmp/qa-113/route-results.json`.
- Layer 3 checklist statuses were updated in `docs/proposals/lead-spark-production-readiness-validation.md`.
- QA report was created at `.github/reports/issue-113-qa-manual-validation-seeded-roles-report.md`.
- No confirmed P0/P1 blockers were found, so no new follow-up GitHub issues were required.
- P2 observations were recorded for recruiter/staff direct access to the participant-style student surface and for deferred mutation testing in shared QA.

## QA Environment

| Field | Value |
| --- | --- |
| QA URL | `https://leadqa.vercel.app/es` |
| Seed password | `password123` |
| Google OAuth | May not be enabled in QA; use email/password |
| Data policy | QA seed/test data only; do not use real member activation data |

## Seed Accounts

| Persona | Email | Purpose |
| --- | --- | --- |
| Public Participant | `participant@test.com` | Onboarding and public event registration |
| Member | `member@test.com` | Member dashboard and profile |
| Chapter Editor | `editor@test.com` | Chapter dashboard, events, applications, roster, check-in |
| Admin | `admin@test.com` | Admin dashboard, users, chapters, roles, identities |
| Staff | `staff@test.com` | Staff/founder identity separation |
| Company Representative | `recruiter@test.com` | Company portal and talent visibility |
| Alumni | `alumni@test.com` | Alumni state |

## Scope

In scope:

- Manual QA against `https://leadqa.vercel.app/es`.
- Validate role-specific flows listed in Layer 3 of the readiness doc.
- Capture evidence using screenshots, short notes, and exact seed account used.
- Update only Layer 3 checklist statuses/evidence in the validation doc.
- Create `.github/reports/issue-113-qa-manual-validation-seeded-roles-report.md`.
- Create GitHub follow-up issues for confirmed P0/P1 blockers.

Out of scope:

- Production auth checks. Those belong to #114.
- Production data cleanliness and chapter canonical checks. Those belong to #115.
- Member import validation. That belongs to #116.
- Privacy/support/rollback finalization. That belongs to #117.
- Company production access smoke checks. That belongs to #118.
- Broad code fixes. Use follow-up issues unless the user explicitly asks to repair immediately.

## Patterns To Follow

### Evidence Format

Use the #110 evidence format:

| Field | Required | Notes |
| --- | --- | --- |
| Environment | Yes | QA |
| Tester | Yes | Name of validator |
| Date | Yes | Date of validation |
| Account used | Yes | Seed account email |
| Result | Yes | Passed, Failed, Blocked, N/A |
| Evidence | Yes | Screenshot path/link, short note, or issue link |
| Severity | If failed/blocked | P0, P1, P2, or P3 |
| Follow-up issue | If needed | Link the GitHub issue |

Do not include real member personal data in public issue comments or screenshots.

### Severity Rules

| Severity | Use For |
| --- | --- |
| P0 | Security/data exposure, wrong role access, company talent exposure, public participant forced into member flow, editor wrong-chapter scope, or production activation blocker |
| P1 | Blocks pilot success for a role but can be contained |
| P2 | Confusing or incomplete flow with workaround |
| P3 | Polish or non-blocking UX issue |

### Browser QA Method

- Use a fresh session or sign out between accounts.
- Prefer screenshots for role landing pages, forms, permission boundaries, and blocker states.
- A short note is acceptable for negative checks where a screenshot is not useful.
- Keep evidence outcome-based: what account, what route, what happened.

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `docs/proposals/lead-spark-production-readiness-validation.md` | Update | Fill Layer 3 role checklist statuses/evidence. |
| `.github/reports/issue-113-qa-manual-validation-seeded-roles-report.md` | Create | Record role-by-role QA results, evidence, blockers, and follow-ups. |
| `.github/plans/issue-113-qa-manual-validation-seeded-roles.plan.md` | Update | Mark tasks/done criteria complete during implementation. |

Do not edit runtime source files for the default #113 implementation.

## Tasks

### Task 1: Establish QA Baseline

- **Status**: Complete.
- **System**: QA URL, issue #113, validation doc.
- **Action**: Inspect.
- **Implement**:
  - Confirm QA URL loads.
  - Confirm seed account list and password.
  - Confirm #112 report exists and automated validation passed.
  - Capture baseline `git status --short`.
  - Prepare evidence folder or screenshot naming convention if screenshots are taken.
- **Validate**: Baseline included in report.

### Task 2: Validate Public Participant Flow

- **Status**: Complete.
- **Account**: `participant@test.com`
- **Checklist**:
  - Login succeeds.
  - Complete or view onboarding/profile.
  - View public events.
  - Register for open event.
  - Apply to application event.
  - View registration/application status.
  - Confirm no approved chapter membership is required for participation.
- **Key Risk**: Public participants must not be forced into chapter membership before event participation.
- **Validate**: Evidence recorded by checklist row.

### Task 3: Validate Member Flow

- **Status**: Complete.
- **Account**: `member@test.com`
- **Checklist**:
  - Login succeeds.
  - Member dashboard loads without admin/editor controls.
  - Membership status is represented correctly.
  - Events are accessible.
  - Profile update saves professional fields.
  - Company visibility opt-in/out is clear and saves if UI exists.
  - No unauthorized admin/editor tools are visible.
- **Key Risk**: Member experience must be separate from editor/admin permissions.
- **Validate**: Evidence recorded by checklist row.

### Task 4: Validate Chapter Editor Flow

- **Status**: Complete.
- **Account**: `editor@test.com`
- **Checklist**:
  - Login succeeds.
  - Chapter dashboard loads for editor's chapter.
  - Create event.
  - Edit event.
  - Configure open event.
  - Configure application event.
  - Add application questions.
  - Review applications.
  - Approve/reject applications.
  - Manage roster by chapter scope.
  - Use check-in for valid attendee, if seeded event/attendee supports it.
  - Confirm editor cannot manage unrelated chapter data, if testable.
- **Key Risk**: Editor must be scoped to approved same-chapter membership.
- **Validate**: Evidence recorded by checklist row.

### Task 5: Validate Admin Flow

- **Status**: Complete.
- **Account**: `admin@test.com`
- **Checklist**:
  - Login succeeds.
  - Admin overview loads.
  - User list/detail loads.
  - Profile data is accessible to admin.
  - Role updates are guarded and understandable.
  - Chapters can be viewed/managed.
  - Membership state is visible.
  - LEAD identities can be viewed/issued/updated if safe in QA.
  - Admin event surfaces load.
  - Admin can correct common wrong role/chapter/profile paths, or gap is logged.
- **Key Risk**: Admin must be able to inspect and correct activation mistakes before production rollout.
- **Validate**: Evidence recorded by checklist row.

### Task 6: Validate Staff / Founder Flow

- **Status**: Complete.
- **Account**: `staff@test.com`
- **Checklist**:
  - Login succeeds.
  - Staff/founder identity does not depend on chapter membership.
  - Admin access source is app role, not public identity alone.
  - Staff/founder is not forced into member/chapter onboarding.
- **Key Risk**: LEAD identity and platform authorization must remain separate.
- **Validate**: Evidence recorded by checklist row.

### Task 7: Validate Company Representative Flow

- **Status**: Complete.
- **Account**: `recruiter@test.com`
- **Checklist**:
  - Login succeeds.
  - Company dashboard loads only with active access.
  - Authorized talent appears.
  - Public participant is hidden.
  - Save profile succeeds.
  - Saved profiles appear.
  - Visible student profile detail loads.
  - Invite-only access assumptions are confirmed where testable.
  - Company flow does not require chapter membership.
- **Reference**: `docs/handbook/COMPANY-PORTAL-QA.md`.
- **Key Risk**: Company portal must expose only approved opted-in talent to active accepted company representatives.
- **Validate**: Evidence recorded by checklist row.

### Task 8: Validate Alumni Flow

- **Status**: Complete.
- **Account**: `alumni@test.com`
- **Checklist**:
  - Login succeeds.
  - Alumni state is represented historically.
  - Alumni is not treated as active approved member unless policy says so.
  - Alumni is hidden from company portal unless future policy says otherwise.
- **Key Risk**: Alumni must not be treated as active member/company-visible talent by accident.
- **Validate**: Evidence recorded by checklist row.

### Task 9: Update Layer 3 Checklist

- **Status**: Complete.
- **File**: `docs/proposals/lead-spark-production-readiness-validation.md`
- **Action**: Update.
- **Implement**:
  - Update only Layer 3 tables.
  - Replace `Not Started` with Passed, Failed, Blocked, or N/A.
  - Add concise evidence pointer for each row.
  - Link follow-up issue for failed/blocked P0/P1 rows.
- **Validate**: Layer 3 reflects actual QA evidence.

### Task 10: Create Follow-Up Issues If Needed

- **Status**: Complete. No confirmed P0/P1 blockers required follow-up issues.
- **System**: GitHub.
- **Action**: Create only for confirmed P0/P1 blockers.
- **Implement**:
  - Create one focused issue per blocker.
  - Include role, account, route, expected result, actual result, severity, and evidence.
  - Add relevant labels such as `bug`, `testing`, `validation`, `onboarding`, `chapter`, `admin`, `events`, or `recruiter`.
  - Link follow-ups in the report and validation doc.
- **Validate**: `gh issue view` confirms created issues if any.

### Task 11: Create QA Report

- **Status**: Complete.
- **File**: `.github/reports/issue-113-qa-manual-validation-seeded-roles-report.md`
- **Action**: Create.
- **Implement**:
  - Include metadata, QA URL, tester, date, and seed accounts.
  - Include role-by-role result tables.
  - Include blocker/failure classification table.
  - Include follow-up issue table, even if empty.
  - Include notes for N/A or untestable rows.
- **Validate**: Report covers every #113 acceptance criterion.

### Task 12: Update Local Plan

- **Status**: Complete.
- **File**: `.github/plans/issue-113-qa-manual-validation-seeded-roles.plan.md`
- **Action**: Update during implementation.
- **Implement**:
  - Mark tasks complete as QA progresses.
  - Mark acceptance criteria complete when each role has evidence.
  - Leave GitHub status criteria unchecked until after comment/label update.
- **Validate**: Plan reflects actual QA status.

### Task 13: Update GitHub Issue #113

- **Status**: Complete.
- **System**: GitHub.
- **Action**: Comment and label.
- **Implement**:
  - Add completion comment with report path, per-role summary, P0/P1 status, and follow-up issues.
  - Change label from `piv-status:plan-ready` to `piv-status:review` when complete.
  - Keep issue open for review unless user asks to close.
- **Validate**:

```bash
gh issue view 113 --json labels,state,url
```

## Optional Browser Execution Notes

If using Codex Browser/plugin:

- Open `https://leadqa.vercel.app/es`.
- Use email/password login for each seed account.
- Sign out between accounts.
- Capture screenshots only where useful; redact or avoid sensitive details.
- If a destructive admin/company test could change shared QA state, prefer a non-destructive view-only confirmation or mark the row Blocked/N/A with rationale.

## Acceptance Criteria

- [x] Public Participant flow is tested and evidenced.
- [x] Member flow is tested and evidenced.
- [x] Chapter Editor flow is tested and evidenced.
- [x] Admin flow is tested and evidenced.
- [x] Staff/Founder flow is tested and evidenced.
- [x] Company Representative flow is tested and evidenced.
- [x] Alumni flow is tested and evidenced.
- [x] Evidence and blockers are recorded by role.
- [x] Layer 3 validation checklist is updated.
- [x] QA report is created.
- [x] Confirmed P0/P1 blockers have follow-up GitHub issues.
- [x] GitHub issue #113 receives completion comment.
- [x] GitHub issue #113 has `piv-status:review`.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| QA seed data has drifted | Mark affected rows Blocked, record account/route, and create P0/P1 issue if it blocks role validation. |
| Shared QA state is changed destructively | Prefer view-only checks; avoid destructive role/company changes unless they are safe in QA. |
| Google OAuth does not work in QA | Use email/password as documented; production OAuth belongs to #114. |
| Screenshots expose personal data | Use seed accounts only and avoid real member data. |
| A role has no suitable seeded event/profile for a sub-flow | Mark the exact row Blocked or N/A with rationale and create follow-up if it blocks pilot confidence. |
| Company access edge states are not safely testable in hosted QA | Validate active accepted access and visible/hidden talent; leave destructive revoked/inactive checks to local/staging or #118 if needed. |

## Done Criteria

- [x] All role checklists in Layer 3 have evidence-backed statuses.
- [x] QA report exists and summarizes all roles.
- [x] P0/P1 blockers are linked to follow-up issues or explicitly recorded as none.
- [x] Local plan is updated.
- [x] GitHub issue #113 is updated and labeled for review.
