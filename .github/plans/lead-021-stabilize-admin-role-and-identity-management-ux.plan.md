# LEAD-021: Stabilize Admin Role and Identity Management UX

## Issue

- GitHub Issue: #22
- Type: Feature
- Priority: Medium
- Complexity: Medium
- Phase: Active PIV Loop

## Problem

Admins need a reliable user-management surface for the new account model. The current service foundation has role and identity concepts separated, but the admin user detail query still assumes users have `person_profile` and `chapter_membership` rows. That can hide founders, staff, recruiters, and newly authenticated users from admin detail views.

## User Story

As an admin, I want to manage roles and LEAD identities clearly, so that founders, staff, editors, chapter members, and alumni are represented correctly.

## Current State From Codebase

- `LeadIdentityService` already supports issuing, revoking, listing, and setting primary identities in `lib/services/lead-identity.service.ts`.
- `LeadIdentityService` correctly treats `admin` as an authorization role, not a public LEAD identity.
- `AdminService.assignEditor` already requires approved chapter membership, updates chapter membership position, updates `user.role`, and issues a primary `chapter_editor` identity.
- `AdminService.updateUserRole` and bulk role updates call `ChapterMembershipService.ensureCanBecomeEditor` before editor promotion.
- `lib/actions/admin/identities.ts` already exposes thin admin-only identity actions.
- `app/[locale]/admin/users/[id]/page.tsx` conditionally renders missing profile UI, but `AdminService.getUserById` uses `person_profile!inner` and `chapter_membership!inner`, so users without those rows can still fail before rendering.

## Scope

1. Make admin user detail pages render for every authenticated user row, even without `person_profile` or `chapter_membership`.
2. Add a minimal admin identity management surface on the user detail page.
3. Preserve strict separation between authorization roles and public LEAD identities.
4. Strengthen tests around editor promotion, missing profile rendering data, and primary identity behavior.
5. Document the operational admin/founder rule: `user.role = admin` grants authorization; `lead_identity.identity_type = founder` or `staff` controls public display.

## Implementation Status

- [x] Fix admin user detail data loading.
- [x] Keep editor promotion membership-gated.
- [x] Add minimal identity management UI.
- [x] Clarify founder/admin operational rule.
- [x] Verify identity service coverage.
- [x] Run validation.

## Non-Goals

- Do not build ID card UI.
- Do not redesign the admin users area.
- Do not create an `admin` LEAD identity type.
- Do not let chapter editors promote users to editor.
- Do not solve every legacy admin UX issue outside role/identity stabilization.

## Implementation Tasks

### 1. Fix Admin User Detail Data Loading

Target files:

- `lib/services/admin.service.ts`
- `lib/services/__tests__/admin.service.test.ts`

Steps:

- Update `AdminService.getUserById` so `person_profile` and `chapter_membership` are optional relationships.
- Prefer the existing `getUsers` pattern if Supabase embedded optional joins remain awkward: load `user`, `person_profile`, and latest/relevant `chapter_membership` separately, then normalize into `UserWithFullProfile`.
- Preserve `UserWithFullProfile` shape: `person_profile: null` and `chapter_membership: null` when missing.
- Add tests proving:
  - A user with no `person_profile` returns a user object, not `null`.
  - A user with no `chapter_membership` returns a user object, not `null`.
  - Query errors still return `null` and log the failure.

Validation:

```bash
pnpm vitest run lib/services/__tests__/admin.service.test.ts
```

### 2. Keep Editor Promotion Membership-Gated

Target files:

- `lib/services/admin.service.ts`
- `lib/services/__tests__/admin.service.test.ts`

Steps:

- Verify direct role promotion to `editor` cannot bypass approved membership.
- Keep `assignEditor` chapter-scoped and admin-only through action boundaries.
- Add or strengthen tests proving:
  - `updateUserRole(..., 'editor')` fails when approved membership is missing.
  - `assignEditor` fails when the target lacks approved membership for the chosen chapter.
  - Successful `assignEditor` keeps role update, membership position update, and `chapter_editor` identity issuance together.

Validation:

```bash
pnpm vitest run lib/services/__tests__/admin.service.test.ts lib/services/__tests__/chapter-membership.service.test.ts
```

### 3. Add Minimal Identity Management UI

Target files:

- `app/[locale]/admin/users/[id]/page.tsx`
- New component, likely `app/[locale]/admin/users/[id]/_components/lead-identity-manager.tsx`
- `lib/actions/admin/identities.ts` only if action return shape needs small UX-friendly normalization

Steps:

- Fetch active LEAD identities for the viewed user through existing admin identity action or direct server-side service call.
- Display identities separately from `user.role`.
- Show identity type, chapter scope, primary status, and active/revoked state if present.
- Provide minimal controls for:
  - setting primary identity,
  - revoking an active identity,
  - issuing founder/staff identities without chapter,
  - issuing chapter_member/chapter_editor/alumni identities with chapter scope.
- Keep controls modest and consistent with existing admin card/table patterns.
- Surface service errors directly enough for admin correction, especially approved membership requirements.

Validation:

```bash
pnpm lint
pnpm build
```

### 4. Clarify Founder/Admin Operational Rule

Target files:

- `docs/handbook/TESTING.md` or a small admin operations note if one already exists

Steps:

- Document that `user.role = admin` is the authorization source for admin access.
- Document that founder/staff public display is represented by `lead_identity`, not `user.role`.
- Document local seed expectations for `admin@test.com` and `staff@test.com`.

Validation:

```bash
pnpm test
```

### 5. Verify Identity Service Coverage

Target files:

- `lib/services/__tests__/lead-identity.service.test.ts`

Steps:

- Keep existing tests for:
  - rejecting `admin` as identity,
  - founder/staff global identities,
  - chapter-scoped identity requiring chapter,
  - setting primary identity.
- Add tests only if implementation exposes a new service behavior.

Validation:

```bash
pnpm vitest run lib/services/__tests__/lead-identity.service.test.ts
```

## Full Validation

Run before closing #22:

```bash
pnpm vitest run lib/services/__tests__/admin.service.test.ts lib/services/__tests__/lead-identity.service.test.ts lib/services/__tests__/chapter-membership.service.test.ts
pnpm vitest run tests/architecture.test.ts
pnpm test
pnpm lint
pnpm build
```

## Risks

- Supabase embedded joins may still behave like inner joins depending on relationship syntax; split queries are safer if optional rows are critical.
- Admin identity UI can sprawl. Keep it V1-minimal and service-backed.
- Role and identity language can confuse admins. Labels should make authorization role and public LEAD identity visibly separate.
- The existing admin user detail page still has old copy such as "Student Profile"; update wording only where it prevents confusion.

## GitHub Updates

- Comment on Issue #22 with this plan path.
- Add or keep `has-plan`.
- Create follow-up issues only if larger admin UX redesign or ID card display work appears during implementation.
