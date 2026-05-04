# Plan: LEAD-083 Admin User Detail Role Membership Identity Redesign

## Summary

Redesign the admin user detail page so account authorization, reusable person profile, chapter membership, LEAD identity, and company access are visually distinct. Preserve LEAD-017 and LEAD-021 behavior by keeping identity and role mutations routed through existing admin actions/services, while improving confirmation, feedback, and empty-state language.

## User Story

As an admin,
I want user detail data separated by account, profile, membership, identity, and company access,
So that privileged changes are clear and the canonical account model stays understandable.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #83 |
| Parent | #29 LEAD-028 Professional UI/UX Redesign Scope |
| Type | Enhancement / UI |
| Complexity | Medium |
| Systems Affected | Admin user detail, role action UI, identity manager, admin service display data |
| Behavior Scope | Preserve existing role, membership, identity, and access rules |

## Foundation Contract

Follow `docs/handbook/UI_UX.md`:

- Admin user detail is an operational authenticated page.
- Distinguish account authorization from public LEAD identity.
- Do not collapse person profile and chapter membership into one "student profile" concept.
- Use clear empty states for missing optional layers.
- Destructive or privileged actions need confirmation and feedback.

## Codebase Patterns To Follow

### User Detail

Sources:

- `app/[locale]/admin/users/[id]/page.tsx` - current detail route, loads user, profile, membership, identities, and chapters.
- `lib/actions/admin/get-data.ts` - thin data actions over `AdminService`.
- `lib/services/admin.service.ts#getUserById()` - canonical admin user detail data.

Pattern:

- Keep the server page as the data assembly point.
- Keep service-layer database access for any new joined data.
- Keep the page as a composition of clear account-model sections.

### Role Management

Sources:

- `app/[locale]/admin/users/users-management-client.tsx` - existing role mutation confirmations.
- `lib/actions/admin/users.ts#updateUserRole()` - thin action boundary.
- `lib/services/admin.service.ts#updateUserRole()` - enforces editor eligibility through `ChapterMembershipService.ensureCanBecomeEditor()`.

Pattern:

- Preserve role action service behavior.
- Add a detail-page role management component that explains editor eligibility before the action.
- Use confirmation dialog and toast feedback.

### LEAD Identity

Sources:

- `app/[locale]/admin/users/[id]/_components/lead-identity-manager.tsx` - identity issue/primary/revoke UI.
- `lib/actions/admin/identities.ts` - Zod validation + admin requirement + service calls.
- `lib/services/lead-identity.service.ts` - identity scope, primary, revoke, and issuance rules.

Pattern:

- Preserve existing identity actions.
- Make primary/revoke privileged actions explicit with confirmation.
- Keep copy clear: app role controls access; LEAD identity controls public display/status.

## Observed Issues

- Current user detail status is derived mostly from membership/profile and sits beside account role, which blurs layers.
- Chapter membership data appears inside "Academic Information" instead of its own layer.
- LEAD identity manager is functional but visually disconnected from the rest of the canonical account model.
- Identity revoke/set-primary actions happen without confirmation.
- Detail page has no role management panel, even though acceptance criteria mention role changes.
- Company access is absent from the detail view.
- Missing profile/membership empty states should be explicit and calm.
- Some copy contains corrupted separator characters or typos.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `app/[locale]/admin/users/[id]/page.tsx` | UPDATE | Redesign user detail around account model sections. |
| `app/[locale]/admin/users/[id]/_components/lead-identity-manager.tsx` | UPDATE | Add confirmation and clearer identity section language. |
| `app/[locale]/admin/users/[id]/_components/role-management-panel.tsx` | CREATE | Detail-page role mutation UI with confirmation and editor eligibility guidance. |
| `lib/services/admin.service.ts` | UPDATE | Add company access display query for one user if needed. |
| `lib/actions/admin/get-data.ts` | UPDATE | Expose company access display action if service query is added. |
| `.github/plans/lead-083-admin-user-detail-role-membership-identity-redesign.plan.md` | UPDATE | Track implementation and validation evidence. |

## Tasks

### Task 1: Add Company Access Display Data - Complete

- **Files**:
  - `lib/services/admin.service.ts`
  - `lib/actions/admin/get-data.ts`
- **Action**: UPDATE
- **Implement**:
  - Add a read-only admin service method for company access rows accepted by or emailed to the selected user.
  - Include company name, invite email, active/revoked/accepted status, and dates.
  - Keep this display-only; do not add new mutation behavior.
- **Mirror**: `getPendingRecruiterRequests()` in `lib/services/admin.service.ts`.
- **Validate**: `pnpm vitest run lib/services/__tests__/admin.service.test.ts`

### Task 2: Add Detail Role Management Panel - Complete

- **File**: `app/[locale]/admin/users/[id]/_components/role-management-panel.tsx`
- **Action**: CREATE
- **Implement**:
  - Use `updateUserRole()` from `lib/actions/admin/users`.
  - Explain that editor role requires approved chapter membership.
  - Require confirmation before changing the role.
  - Show toast feedback and refresh on success.
- **Mirror**: role confirmation pattern in `app/[locale]/admin/users/users-management-client.tsx`.
- **Validate**: `pnpm build`

### Task 3: Clarify LEAD Identity Manager - Complete

- **File**: `app/[locale]/admin/users/[id]/_components/lead-identity-manager.tsx`
- **Action**: UPDATE
- **Implement**:
  - Keep existing issue, set primary, and revoke actions.
  - Add confirmation for revoke and set-primary.
  - Improve empty state and identity-scope copy.
  - Keep global vs chapter-scoped identity behavior unchanged.
- **Mirror**: existing identity action wiring and admin dialog patterns.
- **Validate**: `pnpm build`

### Task 4: Redesign Admin User Detail Page - Complete

- **File**: `app/[locale]/admin/users/[id]/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Separate sections: Account, Person profile, Chapter membership, LEAD identity, Company access.
  - Preserve member approval/rejection actions and current auth checks.
  - Make missing profile and missing membership explicit and non-alarming.
  - Keep privileged action panel visually separate from data display.
  - Remove corrupted copy and typos.
- **Mirror**: `app/[locale]/admin/page.tsx` operational density and admin shell style.
- **Validate**: `pnpm build`

### Task 5: Validate And Close GitHub Issue - Complete

- **Files**:
  - `.github/plans/lead-083-admin-user-detail-role-membership-identity-redesign.plan.md`
  - GitHub issue #83
- **Action**: UPDATE
- **Implement**:
  - Run validation and record results.
  - Comment on #83 with plan path, changed files, and validation evidence.
  - Add/keep `has-plan`.
  - Close #83 if acceptance criteria are met.
- **Validate**:
  - `gh issue view 83 --repo abigailbrionesa/leadtalentplatform-latest --json state,labels`

## Validation

Primary validation:

```bash
pnpm vitest run lib/services/__tests__/admin.service.test.ts lib/services/__tests__/lead-identity.service.test.ts
pnpm lint
pnpm build
```

Results:

- `pnpm vitest run lib/services/__tests__/admin.service.test.ts lib/services/__tests__/lead-identity.service.test.ts` - passed, 2 files / 47 tests.
- `pnpm lint` - passed with existing warnings only.
- `pnpm build` - passed.

Route checks:

```bash
http://127.0.0.1:3000/en/admin/users/{id}
http://127.0.0.1:3000/en/admin/users
```

## Acceptance Criteria Mapping

- [x] Account role, person profile, chapter membership, and LEAD identity are clearly separated.
- [x] Identity issuance, revocation, and primary selection preserve service behavior.
- [x] Role changes make editor eligibility clear and remain enforced.
- [x] Missing person_profile or chapter_membership empty states are explicit and non-alarming.
- [x] Destructive or privileged actions have clear confirmation and feedback.

## Implementation Notes

- Redesigned `app/[locale]/admin/users/[id]/page.tsx` into explicit Account, Person Profile, Chapter Membership, LEAD Identity, Company Access, and Membership Review sections.
- Added `RoleManagementPanel` for detail-page role updates with confirmation, toast feedback, refresh, and editor eligibility guidance.
- Updated `LeadIdentityManager` so set-primary and revoke actions require confirmation and refresh after successful changes.
- Added read-only `AdminService.getCompanyAccessForUser()` and a thin action wrapper for company access display.
- Preserved existing role, chapter membership, and LEAD identity service behavior.

## Out Of Scope

- Rewriting admin user list tables.
- Changing role eligibility rules.
- Changing LEAD identity service rules.
- Adding new company access mutation flows.
- Redesigning chapter member approval internals.

## Recommended Next Step

Implement #83, validate user detail and identity/role behavior, then continue the admin redesign sequence.
