# QALS-08 Plan: Auth and Contact Conversion Hardening

GitHub issue: #290

## Objective

Harden launch auth and organization contact flows with Spanish-first feedback, stronger signup/recovery password policy, and real required contact fields for partnership conversations.

## Scope

- Signup password validation.
- Update-password validation.
- Public organization/company band contact form.
- Targeted password policy unit tests.

## Tasks

- [x] Inspect signup, update password, and public organization contact form.
- [x] Add reusable password policy requiring at least 8 characters, one letter, one number, and one symbol.
- [x] Apply policy to signup and update-password flows.
- [x] Add required reply email plus optional phone/WhatsApp to the organization contact form.
- [x] Add visible loading, success, and error states for the contact form.
- [x] Run targeted tests and type validation.
- [x] Comment validation evidence on GitHub issue #290.

## Validation

- `pnpm exec vitest run lib/auth-password-policy.test.ts`
- `pnpm exec tsc --noEmit`

## Notes

- This slice keeps contact submission client-side until a dedicated CRM/email integration is defined.
