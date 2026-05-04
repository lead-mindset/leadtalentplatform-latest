# LEAD-087: Company Access and Invite Help States

## Summary

Redesign company access, invite acceptance, and legacy onboarding compatibility states so company representatives understand invite-only access without being routed into member onboarding. Preserve existing `/recruiter/access?token=...` acceptance behavior and protected `/company/*` route gating, but make denied access reasons clear and company-facing.

## Issue

- GitHub: #87
- Parent: #29 LEAD-028
- Type: Enhancement
- Complexity: Small

## Acceptance Criteria

- [x] Missing, inactive, revoked, expired, or errored access routes to a clear company access help state.
- [x] Invite acceptance copy says company access and preserves `/recruiter/access?token=...` behavior.
- [x] Legacy `/company/onboard` remains a compatibility/help state, not a duplicate mutation path.
- [x] User-facing copy consistently says company representative/company access/company portal.
- [x] Help states remain readable on mobile widths.

## Patterns Observed

- `lib/auth.ts` already centralizes company route protection in `requireRecruiter()` and `resolveRecruiterAccess()`.
- `app/[locale]/company/onboard/page.tsx` is already a non-mutating compatibility/help page.
- `app/[locale]/recruiter/access/page.tsx` owns invite token validation and acceptance redirect.
- `lib/actions/recruiter/access.ts` preserves existing invite acceptance service behavior.

## Tasks

1. [x] Preserve the company route guard while passing specific denied access reasons to `/company/onboard`.
2. [x] Expand company onboarding/help copy for missing, inactive, revoked, expired, and error states.
3. [x] Redesign `/recruiter/access?token=...` invite states with company-facing copy and mobile-readable support actions.
4. [x] Lightly polish company login and access error copy for consistency.
5. [x] Validate with lint/build and update #87.

## Validation

- `pnpm lint` - passed with existing warnings.
- `pnpm build` - passed.

## Risks

- Expired accepted access may not currently be enforced. Mitigation: treat `invite_expires_at` as a denied access reason only when present and in the past for accepted company access.
- Route names still include `recruiter` for compatibility. Mitigation: preserve routes, fix visible copy.
