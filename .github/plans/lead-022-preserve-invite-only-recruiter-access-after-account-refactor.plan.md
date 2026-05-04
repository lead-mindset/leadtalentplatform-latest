# LEAD-022: Preserve Invite-Only Recruiter Access After Account Refactor

## Issue

- GitHub Issue: #23
- Type: Technical
- Priority: Medium
- Complexity: Medium
- Phase: Active PIV Loop

## Problem

Recruiter access must remain invite-only while the account model moves away from `student_profile` and chapter-first assumptions. Recruiter users should be authorized by `public.user.role='recruiter'` plus active accepted `recruiter_access`, not by `person_profile`, `chapter_membership`, or student onboarding.

## User Story

As a recruiter, I want company access to remain invite-only and separate from student onboarding, so that recruiter login does not break during the account refactor.

## Current State From Codebase

- `lib/auth.ts` has `requireRecruiter()` that loads `public.user` with `role='recruiter'`, then requires an active accepted `recruiter_access` row and redirects missing access to `/company/onboard`.
- `app/[locale]/company/(protected)/layout.tsx` wraps company pages with `requireRecruiter()`.
- `app/[locale]/auth/callback/route.ts` and `app/[locale]/auth/confirm/route.ts` route `role='recruiter'` users to `/company` before checking `person_profile`.
- `lib/actions/recruiter/access.ts` is a thin signed-in invite acceptance path over `RecruiterService`.
- `lib/services/recruiter.service.ts` validates invite tokens, matches signed-in email to invite email, accepts access, and upserts `public.user.role='recruiter'`.
- `lib/actions/company/handle-invite.ts` and `CompanyService.acceptInvite()` provide an older service-role `/company/onboard` flow that creates auth/public users and sends an OTP.
- `lib/actions/admin/invite-recruiter.ts` still generates invite links to `/company/onboard?inviteToken=...`.
- `app/[locale]/recruiter/access/page.tsx` redirects accepted recruiters to `/recruiter/browse`, while the company protected layout expects `/company/*`.

## Scope

1. Stabilize invite acceptance so accepted recruiters become or remain `role='recruiter'`.
2. Make active accepted recruiter access route to the company dashboard without requiring `person_profile` or `chapter_membership`.
3. Ensure revoked, expired, missing, or inactive access reaches an appropriate company onboarding/help state.
4. Align invite URLs and redirects around the canonical company portal path.
5. Add service tests covering invite acceptance and access guard behavior.

## Implementation Status

- [x] Choose and document the canonical invite acceptance path.
- [x] Harden invite acceptance role updates.
- [x] Make recruiter access guard explicit and testable.
- [x] Align company portal redirects.
- [x] Preserve revoked/expired/missing access states.
- [x] Document manual validation.

## Non-Goals

- Do not redesign the recruiter portal.
- Do not expand recruiter talent search behavior beyond access gating.
- Do not make recruiter access self-serve.
- Do not require recruiter `person_profile` or `chapter_membership`.
- Do not alter student visibility rules except where tests need to assert separation.

## Patterns to Follow

### Thin Server Actions

- `lib/actions/recruiter/access.ts` validates input, checks auth, calls `RecruiterService`, and revalidates paths.
- `lib/actions/company/profile.ts` uses `requireRecruiter()` and delegates profile mutations to `CompanyService`.

### Service-Layer Business Rules

- `lib/services/recruiter.service.ts` owns invite-token validation and acceptance rules.
- `lib/services/company.service.ts` owns company/recruiter profile data access.
- `lib/services/admin.service.ts` owns admin invite creation, revocation, and token regeneration helpers.

### Auth Guards

- `lib/auth.ts` keeps route authorization centralized.
- Recruiter access should remain `user.role='recruiter'` plus active accepted `recruiter_access`.

### Tests

- `lib/services/__tests__/recruiter.service.test.ts` uses fluent Supabase builder mocks for recruiter service behavior.
- `lib/services/__tests__/company.service.test.ts` already covers company-facing recruiter data access.
- `lib/services/__tests__/admin.service.test.ts` covers invite admin helpers.

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `lib/auth.ts` | UPDATE | Add a testable recruiter access resolver or tighten `requireRecruiter()` behavior without profile/membership dependencies. |
| `lib/services/recruiter.service.ts` | UPDATE | Harden invite validation/acceptance semantics and return canonical redirect expectations if needed. |
| `lib/actions/recruiter/access.ts` | UPDATE | Keep signed-in invite acceptance thin and aligned with company dashboard routing. |
| `lib/actions/company/handle-invite.ts` | UPDATE | Decide whether to keep the service-role flow as canonical or route it through the same service rules. |
| `lib/actions/admin/invite-recruiter.ts` | UPDATE | Ensure generated invite links point at the canonical recruiter/company acceptance path. |
| `app/[locale]/recruiter/access/page.tsx` | UPDATE | Redirect accepted recruiters to `/company/dashboard` or route consistently into company portal. |
| `app/[locale]/company/onboard/*` | UPDATE | Preserve onboarding/help state for invalid, revoked, expired, or missing access. |
| `lib/services/__tests__/recruiter.service.test.ts` | UPDATE | Add invite validation and acceptance tests. |
| `lib/services/__tests__/company.service.test.ts` | UPDATE | Add tests that company/recruiter profile paths do not require person profile or chapter membership. |
| `docs/handbook/TESTING.md` | UPDATE | Document recruiter seed/manual validation expectations if missing. |

## Implementation Tasks

### Task 1: Choose and Document the Canonical Invite Acceptance Path

- **Files**:
  - `lib/actions/admin/invite-recruiter.ts`
  - `lib/actions/company/handle-invite.ts`
  - `lib/actions/recruiter/access.ts`
  - `app/[locale]/company/onboard/page.tsx`
  - `app/[locale]/recruiter/access/page.tsx`
- **Implement**:
  - Pick one canonical invite URL path for new invites.
  - Preferred path: `/recruiter/access?token=...` because it requires a signed-in user and delegates to `RecruiterService.acceptInvite()`.
  - Keep `/company/onboard?inviteToken=...` as a backward-compatible help/onboarding path if existing links may exist.
  - Ensure both paths use the same invite validity rules: invalid, expired, revoked, already accepted.
- **Mirror**:
  - `app/[locale]/recruiter/access/page.tsx` for signed-in email matching.
  - `lib/services/recruiter.service.ts` for invite validation.
- **Validate**:
  - `pnpm vitest run lib/services/__tests__/recruiter.service.test.ts`

### Task 2: Harden Invite Acceptance Role Updates

- **Files**:
  - `lib/services/recruiter.service.ts`
  - `lib/services/__tests__/recruiter.service.test.ts`
- **Implement**:
  - Confirm a valid invite sets `recruiter_access.accepted_at`, `accepted_by_user_id`, and `is_active=true`.
  - Confirm existing `public.user` rows are updated to `role='recruiter'`.
  - Confirm missing `public.user` rows are inserted with `role='recruiter'`.
  - Confirm already accepted invites are idempotent only for the same accepted user/email; avoid letting a different signed-in account claim already accepted access.
  - Confirm email mismatch fails before access activation.
- **Mirror**:
  - Current `RecruiterService.acceptInvite()` role upsert pattern.
- **Validate**:
  - `pnpm vitest run lib/services/__tests__/recruiter.service.test.ts`

### Task 3: Make Recruiter Access Guard Explicit and Testable

- **Files**:
  - `lib/auth.ts`
  - New or existing auth tests, likely `lib/auth.test.ts`
- **Implement**:
  - Extract a pure-ish helper around recruiter access lookup if needed, for example `resolveRecruiterAccess()`.
  - Keep `requireRecruiter()` free of `person_profile`, `student_profile`, and `chapter_membership` reads.
  - Ensure active accepted access resolves `RecruiterUser` with company.
  - Ensure missing, inactive, revoked, or wrong-role users redirect to company onboarding/login state.
  - Prefer explicit inactive/revoked handling over falling through to ambiguous onboarding.
- **Mirror**:
  - Existing `requireRecruiter()` return shape and `RecruiterUser` type in `lib/types.ts`.
  - Existing auth tests in `lib/auth.test.ts`.
- **Validate**:
  - `pnpm vitest run lib/auth.test.ts`

### Task 4: Align Company Portal Redirects

- **Files**:
  - `app/[locale]/auth/callback/route.ts`
  - `app/[locale]/auth/confirm/route.ts`
  - `app/[locale]/recruiter/access/page.tsx`
  - `app/[locale]/company/login/page.tsx`
- **Implement**:
  - Keep recruiter auth callbacks bypassing person profile checks.
  - Route accepted recruiters to `/company/dashboard`, not student onboarding.
  - Ensure company login magic links land in the company portal and not the member onboarding flow.
  - Preserve locale-safe redirects.
- **Mirror**:
  - Existing role branch order in auth callback/confirm routes.
- **Validate**:
  - `pnpm build`

### Task 5: Preserve Revoked/Expired/Missing Access States

- **Files**:
  - `lib/services/recruiter.service.ts`
  - `app/[locale]/company/onboard/page.tsx`
  - `app/[locale]/recruiter/access/page.tsx`
- **Implement**:
  - Keep expired invite messaging distinct from invalid/revoked where already modeled.
  - Ensure revoked or expired access never activates recruiter access.
  - Ensure a recruiter with no active access sees a company onboarding/help state instead of student onboarding.
- **Mirror**:
  - `RecruiterService.validateInviteToken()` code/result shape.
- **Validate**:
  - `pnpm vitest run lib/services/__tests__/recruiter.service.test.ts`

### Task 6: Document Manual Validation

- **File**: `docs/handbook/TESTING.md`
- **Implement**:
  - Add recruiter validation notes:
    - invited email acceptance sets `public.user.role='recruiter'`;
    - active access reaches `/company/dashboard`;
    - no `person_profile` or `chapter_membership` required;
    - revoked/expired access shows onboarding/help state.
- **Validate**:
  - `pnpm test`

## Full Validation

Run before closing #23:

```bash
pnpm vitest run lib/services/__tests__/recruiter.service.test.ts lib/services/__tests__/company.service.test.ts lib/auth.test.ts
pnpm vitest run tests/architecture.test.ts
pnpm test
pnpm lint
pnpm build
```

## Risks

| Risk | Mitigation |
|------|------------|
| Two invite paths drift further apart | Choose one canonical path and keep the other as a compatibility wrapper/help state. |
| Existing invite emails point to `/company/onboard` | Keep `/company/onboard` functional while new invite generation moves to the canonical path. |
| Already accepted invite can be claimed by another user | Add explicit same-user/email idempotency tests before changing behavior. |
| Recruiter login redirects to onboarding before role is created | Keep recruiter invite acceptance responsible for public user role creation/upsert. |
| Company protected pages accidentally depend on profile tables | Add tests and keep `requireRecruiter()` focused on `user` + `recruiter_access`. |

## GitHub Updates

- Comment on Issue #23 with this plan path.
- Add `has-plan`.
- Create follow-up issues only if the implementation reveals larger recruiter portal redesign work.
