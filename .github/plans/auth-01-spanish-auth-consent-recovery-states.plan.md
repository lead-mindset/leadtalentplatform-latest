# Plan: AUTH-01 Spanish Auth, Consent, And Recovery States

GitHub issue: #295

## Problem

The QA register maps observations 16-22, 25-33, and 90 to active auth polish and decision tracking. The launch-critical fixes are Spanish-visible auth metadata, app-controlled validation/error messages, accessible loading/error/success states, and clear documentation for OAuth/consent/provider decisions that cannot be safely guessed in code.

## Scope

In:

- Localize active auth page metadata for Spanish routes.
- Add app-controlled email validation so invalid email feedback can be Spanish.
- Improve network/auth error mapping for browser `Failed to fetch` cases.
- Add visible loading/error state for Google OAuth launch button.
- Make forgot-password and update-password errors accessible alerts.
- Document OAuth/consent/provider-policy decisions as pending, not silently fixed.

Out:

- Legal acceptance model changes.
- Supabase provider/rate-limit configuration.
- Federated identity linking/recovery design.
- Corporate/staff-specific login portal redesign.

## Implementation Tasks

- [x] Add localized auth metadata helper.
- [x] Update login, signup, forgot-password, and update-password metadata.
- [x] Add reusable email validation helper and tests.
- [x] Use app-controlled email validation in login/signup/forgot-password.
- [x] Harden auth error mapping for `Failed to fetch`.
- [x] Add accessible OAuth and recovery/update feedback states.
- [x] Add AUTH-01 decision notes to the register/issue set.
- [x] Run focused validation and typecheck.

## Validation

- `pnpm lint` (passes with existing warnings)
- `pnpm exec vitest run lib/auth-password-policy.test.ts lib/auth-form-validation.test.ts lib/auth-errors.test.ts`
- `pnpm exec tsc --noEmit`
- `git diff --check`

## Risks

- Over-implementing legal/OAuth behavior without approval. Mitigation: document those as leadership/provider decisions.
- Native browser validation text may still be controlled by browser/OS locale. Mitigation: use `noValidate` plus app-controlled email checks for active forms.
