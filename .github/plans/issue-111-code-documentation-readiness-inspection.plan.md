# Plan: Issue 111 Code Documentation Readiness Inspection

## Summary

Complete the Layer 1 LEAD SPARK readiness inspection by auditing whether the current codebase, schema, RLS, tests, and docs support the production activation assumptions before broader QA or production smoke checks. This is an evidence-gathering and validation issue, not a runtime feature issue. The implementation should produce a clear inspection report, update the readiness checklist with evidence references, and create follow-up GitHub issues only for confirmed P0/P1 gaps.

## User Story

As the activation team,
I want the platform architecture and documentation inspected against production activation assumptions,
so that we know whether LEAD SPARK member activation can proceed into automated validation and manual QA without hidden model, permission, or privacy risks.

## Metadata

| Field | Value |
| --- | --- |
| Type | Validation / Architecture / Documentation |
| Complexity | Medium |
| GitHub Issue | #111 |
| GitHub URL | https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/111 |
| Source PRD | `.github/PRDs/lead-spark-production-readiness-validation.prd.md` |
| Source Validation Doc | `docs/proposals/lead-spark-production-readiness-validation.md` |
| Depends On | #110 |
| Systems Affected | account model, services, RLS, tests, QA docs, readiness checklist |

## Scope

In scope:

- Inspect code and documentation for the Layer 1 checklist items in `docs/proposals/lead-spark-production-readiness-validation.md`.
- Record file references, test references, migration/RLS references, and gaps.
- Update the validation checklist statuses for Layer 1 only.
- Create an implementation report for #111.
- Create GitHub follow-up issues only for confirmed P0/P1 gaps.

Out of scope:

- Running the full test/build/lint suite. That belongs to #112.
- Manual QA through the browser. That belongs to #113.
- Production auth, production data, and import smoke checks. Those belong to #114 through #118.
- Refactoring runtime code unless a tiny doc/test-reference correction is required to make the inspection truthful.

## Patterns To Follow

### Evidence Workflow

Source: `docs/proposals/lead-spark-production-readiness-validation.md`

- Use the evidence fields defined in #110: Environment, Tester, Date, Account used, Result, Evidence, Severity, Follow-up issue.
- Do not include real member PII in public GitHub comments or screenshots.
- P0 findings block real member invitations until fixed or explicitly accepted by executive go/no-go owners.

### Service Layer Pattern

Source: `docs/handbook/TESTING.md`

- Business logic should live in `lib/services/`.
- Tests should verify service behavior with mocked Supabase clients.
- Server actions should remain thin and should be inspected as adapters over services.

### Basic Profile Model

Source: `lib/services/person-profile.service.ts:4-17`, `lib/services/person-profile.service.ts:38-48`, `lib/services/person-profile.service.ts:87-134`

- `person_profile` owns reusable profile and professional fields.
- `is_recruiter_visible` defaults to false unless explicitly set.
- Basic profile upsert writes `user` and `person_profile`, not `chapter_membership`.

Related tests:

- `lib/services/__tests__/person-profile.service.test.ts:59-108`
- `lib/services/__tests__/person-profile.service.test.ts:129-165`

### Public Event Registration Without Chapter Membership

Source: `lib/actions/events/register.helpers.ts:18`

Related tests:

- `lib/actions/events/__tests__/register.helpers.test.ts:41-77`
- `lib/actions/events/__tests__/register.helpers.test.ts:79-108`

Inspection focus:

- Preflight should require an authenticated user and `person_profile`, not approved `chapter_membership`.
- Registration/application implementation should preserve the same boundary.

### Chapter Membership And Editor Eligibility

Source: `lib/services/chapter-membership.service.ts:13-22`, `lib/services/chapter-membership.service.ts:85-111`, `lib/services/chapter-membership.service.ts:113-179`, `lib/services/chapter-membership.service.ts:279-335`, `lib/services/chapter-membership.service.ts:378-430`

Related tests:

- `lib/services/__tests__/chapter-membership.service.test.ts`
- `lib/services/__tests__/admin.service.test.ts:1055-1135`

Inspection focus:

- Statuses cover pending, approved, rejected, and alumni.
- Position is separate from status.
- Editors require approved membership in the intended chapter scope.
- Alumni is a status, not a position.

### Company Visibility And Invite-Only Access

Source: `lib/services/company.service.ts:111-220`, `lib/services/company.service.ts:222-243`, `lib/services/company.service.ts:519-595`

Related tests:

- `lib/services/__tests__/company.service.test.ts`
- `lib/services/__tests__/company.service.test.ts:456-513`
- `lib/services/__tests__/company.service.test.ts:553-578`

Inspection focus:

- Visible talent requires `person_profile.is_recruiter_visible = true`.
- Visible talent also requires approved `chapter_membership`.
- Company representatives authorize through active, accepted, non-revoked `recruiter_access`.
- Recruiter/company portal access is separate from member/chapter membership.

### LEAD Identity Separation

Source: `lib/services/lead-identity.service.ts:6-8`, `lib/services/lead-identity.service.ts:30-66`, `lib/services/lead-identity.service.ts:74-180`

Related tests:

- `lib/services/__tests__/lead-identity.service.test.ts`
- `lib/services/__tests__/admin.service.test.ts:1055-1135`

Inspection focus:

- `admin` is an app role, not a public LEAD identity type.
- Founder/staff identities are global and should not require chapter scope.
- Chapter member/editor/alumni identities should remain chapter scoped.

### Schema And RLS References

Inspect these migrations directly:

- `supabase/migrations/20260502061800_add_person_profile.sql`
- `supabase/migrations/20260502062200_add_chapter_membership.sql`
- `supabase/migrations/20260502062202_add_lead_identity.sql`
- `supabase/migrations/20260502062800_add_recruiter_visible_to_person_profile.sql`
- `supabase/migrations/20260503000000_define_rls_new_account_model.sql`
- `supabase/migrations/20260503002000_chapter_membership_foundation.sql`
- `supabase/migrations/20260503005000_stabilize_student_profile_migration.sql`
- `supabase/migrations/20260503006000_lead_identity_multi_identity_primary.sql`
- `supabase/migrations/20260507123000_update_event_editor_rls_helpers.sql`
- `supabase/migrations/20260507125000_allow_company_visible_memberships.sql`
- `supabase/migrations/20260507180000_fix_admin_rls_app_role.sql`

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `docs/proposals/lead-spark-production-readiness-validation.md` | Update | Fill Layer 1 statuses/evidence summaries based on inspection. |
| `.github/reports/issue-111-code-documentation-readiness-inspection-report.md` | Create | Source-of-truth implementation report for #111 evidence, findings, gaps, and follow-ups. |
| `.github/plans/issue-111-code-documentation-readiness-inspection.plan.md` | Update | Mark tasks and done criteria complete during implementation. |

Do not edit runtime application files for this issue unless the inspection finds a tiny documentation mismatch that must be corrected to avoid misleading readiness claims.

## Tasks

### Task 1: Establish Inspection Baseline

Status: Completed.

- **Files**: issue #111, PRD, validation doc, #110 report.
- **Action**: Read.
- **Implement**:
  - Confirm #110 is complete or at least review-ready.
  - Confirm Layer 1 checklist items in the validation doc are the inspection scope.
  - Capture current branch, untracked files, and local status in the report.
- **Validate**: `git status --short`.

### Task 2: Inspect Basic Profile Readiness

Status: Completed.

- **Files**:
  - `lib/services/person-profile.service.ts`
  - `lib/actions/person-profile.ts`
  - `lib/actions/student/onboarding.helpers.ts`
  - `lib/actions/student/profile.ts`
  - `lib/services/__tests__/person-profile.service.test.ts`
  - `lib/actions/student/__tests__/onboarding.helpers.test.ts`
  - relevant `person_profile` migrations.
- **Action**: Inspect and document.
- **Implement**:
  - Confirm reusable fields: name/email/phone through `user`, professional fields through `person_profile`.
  - Confirm `is_recruiter_visible` defaults false unless explicitly set.
  - Confirm basic profile writes do not create `chapter_membership`.
  - Record file references and test references.
  - Note any missing privacy copy or profile-field mapping gaps.
- **Validate**: Evidence recorded in report and Layer 1 checklist.

### Task 3: Inspect Public Participant Event Readiness

Status: Completed.

- **Files**:
  - `lib/actions/events/register.helpers.ts`
  - `lib/actions/events/register.ts`
  - `lib/services/event.service.ts`
  - `lib/services/event-application.service.ts`
  - `lib/actions/events/__tests__/register.helpers.test.ts`
  - `lib/services/__tests__/event.service.test.ts`
  - `lib/services/__tests__/event-application.service.test.ts`
- **Action**: Inspect and document.
- **Implement**:
  - Confirm public participant registration/application requires `person_profile`, not approved chapter membership.
  - Confirm authenticated users without profile are routed to onboarding.
  - Confirm no hidden dependency on `chapter_membership` for open event registration.
  - Record test names and references.
- **Validate**: Evidence recorded in report and Layer 1 checklist.

### Task 4: Inspect Chapter Membership And Editor Scope

Status: Completed.

- **Files**:
  - `lib/services/chapter-membership.service.ts`
  - `lib/services/admin.service.ts`
  - `lib/actions/chapter/*`
  - `app/[locale]/chapter/layout.tsx`
  - `app/[locale]/chapter/members/*`
  - `app/[locale]/admin/users/[id]/*`
  - `lib/services/__tests__/chapter-membership.service.test.ts`
  - `lib/services/__tests__/admin.service.test.ts`
  - relevant `chapter_membership` and editor RLS migrations.
- **Action**: Inspect and document.
- **Implement**:
  - Confirm `chapter_membership` supports pending, approved, rejected, alumni.
  - Confirm position is separate from status.
  - Confirm editor assignment requires approved membership in the intended chapter.
  - Confirm editor layout/actions/RLS scope to approved chapter membership or admin bypass.
  - Record gaps as P0 if wrong-chapter access is possible.
- **Validate**: Evidence recorded in report and Layer 1 checklist.

### Task 5: Inspect Company Representative Access And Talent Visibility

Status: Completed.

- **Files**:
  - `lib/services/company.service.ts`
  - `lib/services/recruiter.service.ts`
  - `lib/actions/company/*`
  - `lib/actions/recruiter/*`
  - `app/[locale]/company/*`
  - `app/[locale]/recruiter/access/*`
  - `docs/handbook/COMPANY-PORTAL-QA.md`
  - `docs/handbook/RECRUITER-PORTAL-RECOVERY.md`
  - `lib/services/__tests__/company.service.test.ts`
  - `lib/services/__tests__/recruiter.service.test.ts`
  - relevant company/recruiter RLS migrations.
- **Action**: Inspect and document.
- **Implement**:
  - Confirm company portal access is invite-only through active accepted non-revoked `recruiter_access`.
  - Confirm company representatives do not need `person_profile` or `chapter_membership`.
  - Confirm visible talent requires both approved membership and explicit `is_recruiter_visible`.
  - Confirm public participants, unapproved members, and alumni are hidden unless policy explicitly allows them.
  - Record any missing tests as gaps with severity.
- **Validate**: Evidence recorded in report and Layer 1 checklist.

### Task 6: Inspect Staff/Founder Identity Separation

Status: Completed.

- **Files**:
  - `lib/services/lead-identity.service.ts`
  - `lib/actions/admin/identities.ts`
  - `app/[locale]/admin/users/[id]/_components/lead-identity-manager.tsx`
  - `docs/handbook/TESTING.md`
  - `docs/PRODUCT-SPECIFICATION.md`
  - `lib/services/__tests__/lead-identity.service.test.ts`
  - relevant `lead_identity` and admin RLS migrations.
- **Action**: Inspect and document.
- **Implement**:
  - Confirm founder/staff identities are public identity records, not app authorization.
  - Confirm app admin authorization comes from `user.role`.
  - Confirm an `admin` identity type is rejected/not available.
  - Confirm staff/founder are not forced into chapter membership.
- **Validate**: Evidence recorded in report and Layer 1 checklist.

### Task 7: Summarize Readiness Findings

Status: Completed.

- **File**: `.github/reports/issue-111-code-documentation-readiness-inspection-report.md`
- **Action**: Create.
- **Implement**:
  - Include a table for each Layer 1 checklist item.
  - For each item include Result, Severity, Evidence, Gap, and Follow-up issue.
  - Use result values: Passed, Failed, Blocked, N/A.
  - Keep evidence references specific enough for a reviewer to verify.
  - Do not include real member PII.
- **Validate**: Report covers every #111 acceptance criterion.

### Task 8: Update Validation Checklist

Status: Completed.

- **File**: `docs/proposals/lead-spark-production-readiness-validation.md`
- **Action**: Update.
- **Implement**:
  - Update only the Layer 1 table.
  - Replace `Not Started` with inspection results.
  - Put concise evidence pointers in the Evidence column.
  - If an item needs follow-up, link or name the GitHub issue.
- **Validate**: Layer 1 no longer has ambiguous `Not Started` rows unless a row is genuinely Blocked.

### Task 9: Create Follow-Up Issues For P0/P1 Gaps

Status: Completed. No new confirmed P0/P1 gaps were found, so no new follow-up issues were created.

- **System**: GitHub.
- **Action**: Create issues if needed.
- **Implement**:
  - Only create follow-ups for confirmed P0/P1 failures or blockers.
  - Use labels aligned with the gap, such as `security`, `validation`, `bug`, `docs`, `company`, or `architecture`.
  - Link each follow-up from the report and the validation checklist.
  - Do not create noisy issues for P2/P3 observations; capture those in the report.
- **Validate**: `gh issue view` confirms links/labels.

### Task 10: Update GitHub Issue #111

Status: Completed.

- **System**: GitHub.
- **Action**: Comment and label.
- **Implement**:
  - Add a completion comment with report path, checklist update summary, P0/P1 status, and validation note.
  - Change status label from `piv-status:plan-ready` to `piv-status:review` when the inspection is complete.
  - Keep the issue open for review unless the user asks to close it.
- **Validate**: `gh issue view 111 --json labels,state,url`.

## Validation Commands

This issue is primarily an inspection issue. Use targeted commands to support evidence, but leave full automated validation for #112.

```bash
git status --short
rg -n "person_profile|chapter_membership|lead_identity|recruiter_access|is_recruiter_visible" lib supabase docs app components
pnpm vitest --run lib/services/__tests__/person-profile.service.test.ts lib/actions/events/__tests__/register.helpers.test.ts lib/services/__tests__/chapter-membership.service.test.ts lib/services/__tests__/company.service.test.ts lib/services/__tests__/lead-identity.service.test.ts
```

If the targeted Vitest command is too slow or fails because of environment setup, record the failure as validation evidence and leave full remediation to #112 unless it uncovers a P0/P1 architecture issue.

## Acceptance Criteria

- [x] `person_profile` reusable profile and professional fields are inspected and evidenced.
- [x] Public participant onboarding/event registration independence from chapter membership is inspected and evidenced.
- [x] `chapter_membership` statuses and chapter position model are inspected and evidenced.
- [x] Editor access dependency on approved chapter membership and chapter scope is inspected and evidenced.
- [x] Company representative invite-only access is inspected and evidenced.
- [x] Company talent visibility requiring approved membership plus explicit opt-in is inspected and evidenced.
- [x] Staff/founder identity separation from app authorization is inspected and evidenced.
- [x] File references, test references, gaps, and P0/P1 follow-ups are recorded.
- [x] Layer 1 validation checklist is updated.
- [x] GitHub issue #111 receives a completion comment and moves to review.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Inspection turns into broad refactor | Keep runtime code out of scope; create follow-up issues for fixes. |
| Evidence is too vague for leadership | Use specific file/test/migration references and status/severity language from #110. |
| Existing untracked docs obscure what changed | Record `git status --short` in the report and only claim files touched for #111. |
| Full tests fail and block inspection | Record targeted test output; full test/lint/build belongs to #112. |
| P0/P1 gaps are found but not actionable | Create focused GitHub issues with blocker severity and exact evidence. |

## Done Criteria

- [x] The inspection report exists and covers all #111 acceptance criteria.
- [x] The Layer 1 checklist in the validation doc has been updated with evidence.
- [x] Any confirmed P0/P1 gaps have linked GitHub follow-up issues. No new confirmed P0/P1 gaps were found.
- [x] The local plan has been updated to reflect completed tasks.
- [x] GitHub issue #111 has a completion comment.
- [x] GitHub issue #111 has `piv-status:review`.
