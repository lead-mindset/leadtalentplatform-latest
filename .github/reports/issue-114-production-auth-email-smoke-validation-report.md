# Issue #114 Report: Production Auth And Email Smoke Validation

## Summary

Production auth smoke validation was run against LEAD Talent Platform production on 2026-05-10.

| Field | Value |
| --- | --- |
| GitHub issue | #114 |
| Environment | Production |
| Production URL | `https://leadtalentplatform-latest.vercel.app/es` |
| Tester | Abigail / Codex-assisted validation |
| Date | 2026-05-10 |
| Evidence folder | `tmp/production-smoke-114/` |
| Canonical evidence JSON | `tmp/production-smoke-114/surface-results.json` |
| Result | Completed with P0/P1 blockers |
| Go/no-go impact | No-go for real member invitations until #119 is fixed and #114 is revalidated |

## Results

| Check | Result | Evidence | Severity | Follow-up |
| --- | --- | --- | --- | --- |
| Production URL loads | Passed | `tmp/production-smoke-114/es.png`; `/es` returned 200 | P0 | None |
| Main login loads | Passed | `tmp/production-smoke-114/es-auth-login.png`; Google button, email field, and password field present | P1 | None |
| Forgot password loads | Passed | `tmp/production-smoke-114/es-auth-forgot-password.png`; email field present | P1 | None |
| Update password page loads | Passed | `tmp/production-smoke-114/es-auth-update-password.png`; password field present | P1 | None |
| Company login loads | Passed | `tmp/production-smoke-114/es-company-login.png`; company magic-link email field present | P1 | None |
| Google OAuth starts | Failed | `tmp/production-smoke-114/google-oauth-start.png`; Google returns `redirect_uri_mismatch` | P0 | #119 |
| Google OAuth completes end-to-end | Failed | Could not complete because Google blocks the configured redirect URI | P0 | #119 |
| Email/password production login | Blocked | No controlled production account with known password was available in this session | P1 | #120 |
| Password reset email delivery/update | Blocked | No controlled production inbox/account was available in this session | P1 | #120 |
| Company magic-link login | Blocked | Company login surface loads, but no controlled production company/recruiter inbox was available | P1 | #120 / #118 |
| Auth callback role destinations | Blocked | No production account could complete auth because Google OAuth failed and no controlled fallback account was available | P1 | #119 / #120 |

## Confirmed P0

### #119: Production Google OAuth redirect URI mismatch

Production Google OAuth does not complete. Clicking `Continuar con Google` redirects to Google, but Google returns an OAuth error with `redirect_uri_mismatch`.

The error references this redirect URI:

```text
https://bvwocfwfthgpqrokbbyn.supabase.co/auth/v1/callback
```

This is a no-go condition for real member invitations because Google OAuth is the primary production login path.

## Blocked Validation

The following checks could not be completed because no controlled production accounts/inboxes were available during this run:

- Email/password fallback login.
- Password reset delivery and password update.
- Company magic-link delivery.
- Role destination checks after successful production auth.

Follow-up #120 was created to provision controlled production smoke accounts and inboxes.

## Evidence Details

| Route | HTTP Status | Final URL | Notes |
| --- | --- | --- | --- |
| `/es` | 200 | `https://leadtalentplatform-latest.vercel.app/es` | Production app loads |
| `/es/auth/login` | 200 | `https://leadtalentplatform-latest.vercel.app/es/auth/login` | Google, email, and password controls present |
| `/es/auth/forgot-password` | 200 | `https://leadtalentplatform-latest.vercel.app/es/auth/forgot-password` | Reset email field present |
| `/es/auth/update-password` | 200 | `https://leadtalentplatform-latest.vercel.app/es/auth/update-password` | Password update form loads |
| `/es/company/login` | 200 | `https://leadtalentplatform-latest.vercel.app/es/company/login` | Company magic-link field present |

## Follow-Up Issues

| Issue | Severity | Purpose |
| --- | --- | --- |
| #119 | P0 | Fix production Google OAuth `redirect_uri_mismatch` |
| #120 | P1 | Provision controlled production auth smoke accounts and inboxes |

## Recommendation

Do not invite real members yet.

Next steps:

1. Fix #119 by updating Google Cloud OAuth authorized redirect URIs and confirming the production Supabase Google provider configuration.
2. Prepare #120 controlled production smoke accounts/inboxes.
3. Re-run #114 after #119 and #120 are ready.
4. Only proceed with production member activation after Google OAuth and at least one fallback/reset path are verified with evidence.

## Files Updated

- `docs/proposals/lead-spark-production-readiness-validation.md`
- `.github/reports/issue-114-production-auth-email-smoke-validation-report.md`
- `.github/plans/issue-114-production-auth-email-smoke-validation.plan.md`

