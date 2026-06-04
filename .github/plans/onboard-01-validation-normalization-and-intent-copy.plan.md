# Plan: ONBOARD-01 Validation, Normalization, And Intent Copy

GitHub issue: #296

## Problem

The QA register maps observations 34-38 to onboarding validation, phone normalization, form clarity, and completion-state polish. The active launch flow must collect a reusable `person_profile`, optionally create a pending chapter application, and avoid implying that a public participant is already a member or that deferred company/alumni behavior is live.

## Scope

In:

- Normalize phone input before persistence using a conservative, country-neutral rule.
- Strengthen phone validation with clear Spanish-first messages.
- Clarify chapter intent copy for public participant, applicant, and existing-member review states.
- Add visible submit error feedback instead of console-only failure handling.
- Update the QA register and grouped issue tracker for observations 34-38.
- Add focused tests for phone normalization and invalid phone rejection.

Out:

- Country-specific phone validation or E.164 country inference.
- Alumni onboarding.
- Recruiter/company activation beyond storing the existing visibility preference.
- New database columns or membership approval workflows.

## Implementation Tasks

- [x] Add reusable phone normalization/validation in the onboarding schema.
- [x] Cover normalized and invalid phone inputs in onboarding helper tests.
- [x] Update Spanish-first onboarding copy for chapter intent and visibility preference.
- [x] Add accessible submit error feedback in the onboarding UI.
- [x] Update the QA observation register and grouped issue notes.
- [ ] Run focused validation, typecheck, lint, and diff checks.

## Validation

- `pnpm exec vitest run lib/actions/student/__tests__/onboarding.helpers.test.ts`
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `git diff --check`

## Risks

- Over-constraining international phone numbers. Mitigation: keep the rule country-neutral and document that country-specific E.164 enforcement is deferred.
- Confusing applicants with approved members. Mitigation: use explicit "review pending" copy and keep approval in chapter operations.
