# Plan: LEAD-070 Legacy Company Invite Compatibility Help State

## Summary

Convert legacy `/company/onboard?inviteToken=...` into a non-mutating compatibility/help state that points users to the canonical signed-in invite acceptance flow. This removes the duplicate invite activation path currently backed by `CompanyService.acceptInvite()` while preserving useful messaging for missing, invalid, revoked, expired, already-accepted, and valid-looking legacy invite links.

## User Story

As a company representative with an older invite link,
I want a clear compatibility path,
So that I can reach the canonical invite flow without legacy onboarding mutating access in a second place.

## Metadata

| Field | Value |
|-------|-------|
| GitHub Issue | #70 |
| Type | Bug Fix / Stabilization |
| Complexity | Small |
| Systems Affected | Company invite route, recruiter access route, company auth guard, invite services/tests |
| Parent | LEAD-027 / #28 |
| Blocks | #69 route consolidation, #73 user-facing language cleanup |

## Decisions

- `/company/onboard` is compatibility/help only.
- `/company/onboard` must not accept invites, create users, update roles, activate `recruiter_access`, or send OTP links.
- Canonical mutation remains `/recruiter/access?token=...` via `RecruiterService.acceptInvite()` for this issue.
- User-facing copy may say "company access" or "company representative"; do not rename internal schema/routes broadly in #70.
- A read-only invite lookup is allowed if it uses existing clean service behavior.
- Company representatives with no active access should land in company access/help state, not student onboarding.
- Route consolidation and `/recruiter/*` deprecation are deferred to #69.

## Patterns To Follow

### Legacy Company Onboarding

Source: `app/[locale]/company/onboard/page.tsx:4-73` and `app/[locale]/company/onboard/onboard-content.tsx:4-38`

The current legacy page validates `inviteToken`, renders `OnboardContent`, and the client component calls `acceptInvite()` from `lib/actions/company/handle-invite.ts`. Replace this with a server-rendered compatibility state and remove the client mutation dependency.

### Canonical Signed-In Acceptance

Source: `app/[locale]/recruiter/access/page.tsx:5-97` and `lib/actions/recruiter/access.ts:32-64`

The canonical flow validates the token, requires the invited email to match the authenticated user, calls `RecruiterService.acceptInvite()`, and redirects to `/company/dashboard`.

### Duplicate Legacy Mutation

Source: `lib/actions/company/handle-invite.ts:6-17` and `lib/services/company.service.ts:657-750`

The company invite action currently delegates to `CompanyService.acceptInvite()`, which creates/updates users, activates `recruiter_access`, and sends OTP links. #70 should remove page usage of this mutation and preferably delete/deprecate it if no other callers remain.

### Company Access Guard

Source: `lib/auth.ts:350-375`

`requireRecruiter()` currently redirects missing company access to `/company/onboard`. Update this to a useful company access/help destination that does not imply student onboarding.

## Files To Change

| File | Action | Purpose |
|------|--------|---------|
| `.github/plans/lead-070-legacy-company-invite-compatibility-help-state.plan.md` | Create | Track implementation and validation |
| `app/[locale]/company/onboard/page.tsx` | Update | Render compatibility/help state and link valid legacy tokens to canonical access |
| `app/[locale]/company/onboard/onboard-content.tsx` | Delete or replace | Remove client-side legacy invite activation form |
| `lib/actions/company/handle-invite.ts` | Update | Remove/deprecate legacy mutation; keep read-only validation helper only if still needed |
| `lib/services/company.service.ts` | Update | Remove/deprecate `acceptInvite()` if no production callers remain; keep read-only invite/company helpers as needed |
| `lib/auth.ts` | Update | Redirect no-access company users to company access/help state, not student onboarding |
| `lib/services/__tests__/company.service.test.ts` | Update | Assert legacy company invite code does not activate access if service surface changes |
| `tests/architecture.test.ts` | Update if needed | Keep action/UI direct-db allowlists aligned with the new compatibility path |
| GitHub Issue #70 | Update | Add plan/evidence, keep/add `has-plan`, close when complete |

## Tasks

## Progress

- [x] Task 1: Create Plan And Confirm Callers
- [x] Task 2: Replace Legacy Onboard Mutation UI With Compatibility Help
- [x] Task 3: Remove Or Deprecate Company Invite Mutation Surface
- [x] Task 4: Route No-Access Company Users To Help State
- [x] Task 5: Add Focused Tests And Architecture Allowlist Updates
- [x] Task 6: Validate And Update GitHub

### Task 1: Create Plan And Confirm Callers

- **Files**:
  - `.github/plans/lead-070-legacy-company-invite-compatibility-help-state.plan.md`
  - `app/[locale]/company/onboard/**/*`
  - `lib/actions/company/handle-invite.ts`
  - `lib/services/company.service.ts`
- **Action**: Create / audit
- **Implement**:
  - Confirm `CompanyService.acceptInvite()` and `lib/actions/company/handle-invite.acceptInvite()` have no production callers outside legacy `/company/onboard`.
  - Keep `.agents/` and `.codex/` unstaged.
- **Validate**: `rg -n "CompanyService.acceptInvite|from '@/lib/actions/company/handle-invite'|acceptInvite\\(" app lib tests`

### Task 2: Replace Legacy Onboard Mutation UI With Compatibility Help

- **File**: `app/[locale]/company/onboard/page.tsx`
- **Action**: Update
- **Implement**:
  - Remove the client onboarding form dependency.
  - If `inviteToken` is missing, show a company access help state with a login/access CTA instead of redirecting to generic auth unexpectedly.
  - For a valid token, show company/invite context and a CTA to `/recruiter/access?token=...`.
  - For invalid, revoked, expired, or already-accepted tokens, show non-mutating status and a company login/support CTA.
  - Keep copy concise and company-facing.
- **Mirror**: `app/[locale]/recruiter/access/page.tsx:14-97`
- **Validate**: `pnpm build`

### Task 3: Remove Or Deprecate Company Invite Mutation Surface

- **Files**:
  - `lib/actions/company/handle-invite.ts`
  - `lib/services/company.service.ts`
- **Action**: Update
- **Implement**:
  - Remove `acceptInvite()` from `lib/actions/company/handle-invite.ts` if unused.
  - Remove `CompanyService.acceptInvite()` if no tests/production callers require it.
  - Keep `validateInviteToken()` read-only, or rename to a read-only compatibility helper only if doing so improves clarity without churn.
  - Ensure no service-role flow can activate legacy company invite links.
- **Mirror**: `lib/actions/recruiter/access.ts:32-64`
- **Validate**: `rg -n "CompanyService.acceptInvite|handle-invite.*acceptInvite|auth.admin.createUser|signInWithOtp" app lib`

### Task 4: Route No-Access Company Users To Help State

- **File**: `lib/auth.ts`
- **Action**: Update
- **Implement**:
  - Change `requireRecruiter()` no-access redirect from `/company/onboard` to a non-mutating company access/help destination.
  - Prefer a destination that exists after Task 2 and works with no token.
  - Preserve `/auth/login` redirects for unauthenticated or non-company users.
- **Mirror**: `lib/auth.ts:350-375`
- **Validate**: `pnpm vitest run lib/auth.test.ts`

### Task 5: Add Focused Tests And Architecture Allowlist Updates

- **Files**:
  - `lib/services/__tests__/company.service.test.ts`
  - `lib/auth.test.ts`
  - `tests/architecture.test.ts`
- **Action**: Update as needed
- **Implement**:
  - Update/remove tests that expected `CompanyService.acceptInvite()` mutation behavior.
  - Add coverage that company access failure redirects to the compatibility/help state.
  - Add or adjust architecture allowlist only if the new page/action path changes direct DB usage.
  - Do not expand this into #69 route consolidation.
- **Validate**: `pnpm vitest run lib/services/__tests__/company.service.test.ts lib/auth.test.ts tests/architecture.test.ts`

### Task 6: Validate And Update GitHub

- **Files**: all changed files
- **Action**: Validate and update issue
- **Implement**:
  - Run targeted tests and broader validation.
  - Comment on #70 with plan path, behavior summary, and validation evidence.
  - Add/keep `has-plan`.
  - Close #70 once acceptance criteria are satisfied.
- **Validate**:

```bash
pnpm vitest run lib/services/__tests__/company.service.test.ts lib/auth.test.ts tests/architecture.test.ts
pnpm test
pnpm lint
pnpm build
git diff --check
```

## Acceptance Criteria Mapping

- [x] Legacy company onboard invite links render a useful compatibility/help state.
- [x] Valid invites are routed toward canonical signed-in invite acceptance.
- [x] Revoked, expired, invalid, or already-accepted invites do not activate access from `/company/onboard`.
- [x] Company login without active access lands in company access/help state, not student onboarding.

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Accidentally breaking valid invite acceptance | Leave `/recruiter/access?token=...` as the only canonical mutation path |
| Reintroducing duplicate mutation logic | Remove page/action usage of `CompanyService.acceptInvite()` and validate with `rg` |
| Mixing this with route rename cleanup | Keep `/recruiter/access` unchanged; defer route consolidation to #69 |
| Confusing no-token users | Render help/login/support state from `/company/onboard` without mutation |
| Existing tests expect legacy behavior | Update tests to encode the new non-mutating compatibility contract |

## Out Of Scope

- Renaming all recruiter routes or internal schema names.
- Consolidating non-access `/recruiter/*` pages.
- Redesigning company portal UX.
- Changing invite email generation.
- Adding self-serve company signup.
