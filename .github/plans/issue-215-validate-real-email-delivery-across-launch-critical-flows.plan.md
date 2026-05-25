# Plan: Issue #215 - Validate Real Email Delivery Across Launch-Critical Flows

GitHub Issue: #215
Source PRD: `.github/PRDs/production-readiness-validation.prd.md`
Type: Technical / Email QA
Complexity: Medium

## Summary

Add a repeatable email-delivery smoke harness and update the production-readiness report with what can be validated locally. The harness should prove local Supabase auth email delivery through Mailpit and provide a provider-backed SMTP smoke path that can be run only with an explicit controlled test inbox.

## Implementation Status

- [x] Task 1: Add email delivery smoke script.
- [x] Task 2: Add package script and runbook instructions.
- [x] Task 3: Run local Mailpit validation.
- [x] Task 4: Record provider-backed validation as blocked until a test inbox/provider decision is available.
- [x] Task 5: Write report and update GitHub.

## Patterns To Follow

| Category | File | Pattern |
| --- | --- | --- |
| Email transport | `lib/emails/config.ts` | SMTP delivery uses `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS`; missing config logs instead of sending. |
| Auth hook email | `app/api/auth/hooks/send-email/route.tsx` | Provider-backed auth hook uses Resend and localized auth confirm/reset routes. |
| Recruiter invite | `lib/actions/admin/invite-recruiter.ts` | Recruiter invites use SMTP and generate `/recruiter/access?token=...`. |
| Report template | `.github/reports/production-readiness-validation-report.md` | Gate sections record environment, status, evidence, blockers, and next decisions. |

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `scripts/production-readiness/email-delivery-smoke.mjs` | Create | Run local Mailpit auth email checks and optional SMTP provider smoke. |
| `package.json` | Update | Add `qa:email` script. |
| `docs/runbooks/production-readiness-validation.md` | Update | Document email commands and required environment variables. |
| `.github/reports/production-readiness-validation-report.md` | Update | Record local email evidence and external-provider blocker. |
| `.github/plans/issue-215-validate-real-email-delivery-across-launch-critical-flows.plan.md` | Create/Update | Track issue execution and validation. |

## Tasks

### Task 1: Add Email Smoke Script

- Load local Next environment.
- Support local Supabase auth email checks against Mailpit.
- Support optional SMTP smoke via `QA_EMAIL_TO`.
- Write sanitized JSON to `outputs/production-readiness/email-delivery-results.json`.

### Task 2: Document Command

- Add `pnpm run qa:email`.
- Document `MAILPIT_API_URL`, `QA_EMAIL_TO`, and SMTP variables.
- State that provider-backed delivery needs explicit test inbox approval.

### Task 3: Run Local Mailpit Validation

```bash
pnpm run qa:email -- --mode local-auth
```

### Task 4: Provider-Backed Validation Decision

- Do not send external email without a controlled test inbox.
- Mark provider-backed validation `not testable` until the inbox/environment is confirmed.

### Task 5: Validate

```bash
pnpm run qa:email -- --mode local-auth
pnpm run lint
```

## Acceptance Criteria Mapping

- [x] Controlled auth email can be triggered and found in local Mailpit.
- [x] Password reset email can be triggered and found in local Mailpit.
- [x] Provider-backed SMTP smoke has a safe command path.
- [x] Report states that provider-backed delivery is not fully passed without external evidence.
- [x] No test inbox values, auth links, or provider secrets are committed.
