# Plan: Implement Preapproval Claim And Activation Flow

## Summary

Add the service-layer activation flow for email-bound preapprovals. After onboarding saves a `person_profile`, the server action will use a service-role Supabase client to claim matching `chapter_preapproval` rows, approve membership, create e-board role assignments when needed, grant role-template permissions, and consume the preapproval without creating duplicate records on retry.

## User Story

As a preapproved chapter member or e-board leader  
I want to sign up with my invited email and become active after onboarding  
So that chapter activation can start without manual dashboard approval for each verified person.

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY / BACKEND |
| Complexity | MEDIUM |
| Systems Affected | Services, onboarding action helper, Supabase RLS boundary, tests |
| GitHub Issue | #198 |

---

## Patterns to Follow

### Onboarding Helper Orchestration

```ts
// SOURCE: lib/actions/student/onboarding.helpers.ts:55
export async function saveBasicOnboarding(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string
    email: string
    data: BasicOnboardingData
  }
): Promise<ActionResult> {
```

### Service-Role Boundary

```ts
// SOURCE: lib/actions/company/handle-invite.ts:7
const serviceSupabase = createServiceClient()
const inviteResult = await CompanyService.getValidatedRecruiterInvite(serviceSupabase, inviteToken)
```

### Invite/Claim Validation

```ts
// SOURCE: lib/services/recruiter.service.ts:586
if (validation.access.accepted_at && validation.access.accepted_by_user_id !== userId) {
  return {
    success: false,
    error: 'This invite has already been accepted by another account.',
  }
}
```

### Permission Grant Integration

```ts
// SOURCE: lib/services/chapter-permission.service.ts:246
const templatePermissions = this.getTemplatePermissions(params.roleLevel)
if (templatePermissions.length === 0) return { success: true, grantedPermissions: [] }
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/services/chapter-preapproval.service.ts` | CREATE | Add email normalization, preapproval validation, membership approval/upsert, role assignment, permission grants, and consumption. |
| `lib/services/__tests__/chapter-preapproval.service.test.ts` | CREATE | Cover member activation, e-board activation, invalid preapprovals, email matching, expiration/revocation/consumption, and idempotency. |
| `lib/actions/student/onboarding.helpers.ts` | UPDATE | Call preapproval activation after profile save and skip normal pending application when preapproval activates. |
| `lib/actions/student/onboarding.ts` | UPDATE | Create service-role client for activation and pass it to the helper. |
| `lib/actions/student/__tests__/onboarding.helpers.test.ts` | UPDATE | Cover activation integration and skip behavior. |
| `.github/reports/issue-198-implement-preapproval-claim-and-activation-flow-report.md` | CREATE | Capture implementation and validation evidence. |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Add Preapproval Service Contract

Status: Completed

- **File**: `lib/services/chapter-preapproval.service.ts`
- **Action**: CREATE
- **Implement**: Add `normalizePreapprovalEmail` and `activatePreapprovalForUser(supabase, params)` with explicit result types. The service should return successful non-activation for missing, expired, revoked, consumed, or email-mismatched preapprovals so normal signups continue.
- **Mirror**: Recruiter invite validation style in `lib/services/recruiter.service.ts`.
- **Validate**: Unit tests cover normalization and invalid/no-op outcomes.

### Task 2: Approve Or Create Membership

Status: Completed

- **File**: `lib/services/chapter-preapproval.service.ts`
- **Action**: UPDATE
- **Implement**: For valid preapproved member or e-board email, create or update `chapter_membership` to approved with `position = 'member'`, `joined_at`, `approved_by_id`, and a member ID. Preserve existing member ID and avoid duplicate membership rows.
- **Mirror**: `ChapterMembershipService.approveMembership` for approved membership semantics.
- **Validate**: Tests cover insert, update, and already-approved idempotency.

### Task 3: Activate E-Board Role And Permissions

Status: Completed

- **File**: `lib/services/chapter-preapproval.service.ts`
- **Action**: UPDATE
- **Implement**: For `preapproval_type = 'eboard'`, create or reuse an active `chapter_role_assignment`, then call `ChapterPermissionService.grantRoleTemplatePermissions` with `source = 'preapproval'` and `sourceRoleAssignmentId`.
- **Mirror**: `lib/services/chapter-permission.service.ts`.
- **Validate**: Tests assert role assignment payload and permission service call.

### Task 4: Consume The Preapproval

Status: Completed

- **File**: `lib/services/chapter-preapproval.service.ts`
- **Action**: UPDATE
- **Implement**: Mark the preapproval consumed by the activating user after membership and role/grant steps succeed. Re-running after consumption must not duplicate grants or assignments.
- **Mirror**: recruiter invite accepted-at update pattern.
- **Validate**: Tests cover consumed preapproval no-op and same-flow idempotency.

### Task 5: Integrate Onboarding

Status: Completed

- **File**: `lib/actions/student/onboarding.helpers.ts`, `lib/actions/student/onboarding.ts`
- **Action**: UPDATE
- **Implement**: Run preapproval activation after profile save using a service-role client from the server action. Skip normal `applyToChapter` when activation succeeds; keep normal chapter application behavior when no preapproval matches.
- **Mirror**: helper orchestration and service-role boundary patterns.
- **Validate**: Helper tests cover activation, skip behavior, and normal fallback.

### Task 6: Update GitHub Issue

Status: Completed

- **File**: GitHub issue #198
- **Action**: UPDATE
- **Implement**: Add plan link, implementation report link, validation results, and move issue to review.
- **Validate**: `gh issue view 198 --json labels,comments,title`

---

## Validation

```bash
pnpm test -- lib/services/__tests__/chapter-preapproval.service.test.ts lib/actions/student/__tests__/onboarding.helpers.test.ts
pnpm lint
pnpm exec tsc --noEmit
pnpm test
```

---

## Acceptance Criteria

- [x] Preapproved member email creates or updates an approved `chapter_membership` after onboarding/profile completion.
- [x] Preapproved e-board email creates approved membership, active role assignment, and role-template permission grants.
- [x] Expired, revoked, consumed, and email-mismatched preapprovals do not create membership, role assignments, or grants.
- [x] Re-running activation is idempotent and does not duplicate active grants or assignments.
- [x] Service/action tests cover email normalization, expiration, consumption, and permission grant behavior.
