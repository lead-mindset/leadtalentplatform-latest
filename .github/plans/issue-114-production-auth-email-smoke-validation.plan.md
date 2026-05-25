# Plan: Issue 114 Production Auth And Email Smoke Validation

## Summary

Run a production-only smoke validation for LEAD Talent Platform auth and email flows before any real member invitations. This issue should verify that the production URL loads, Google OAuth works end-to-end, email/password or magic-link login works where supported, password reset email delivery works, and post-auth redirects land users in the correct role destination. The output is evidence, a Layer 4 checklist update, a report, and any follow-up issues for P0/P1 blockers.

This is a validation issue, not a runtime code-change issue by default.

## User Story

As Abigail and the activation team,
I want production auth and email flows validated with evidence,
so that real LEAD members are not invited into a broken login, callback, or password reset experience.

## Metadata

| Field | Value |
| --- | --- |
| Type | Production Smoke Validation |
| Complexity | Medium |
| GitHub Issue | #114 |
| GitHub URL | `https://github.com/abigailbrionesa/leadtalentplatform-latest/issues/114` |
| Source PRD | `.github/PRDs/lead-spark-production-readiness-validation.prd.md` |
| Source Validation Doc | `docs/proposals/lead-spark-production-readiness-validation.md` |
| Depends On | #113 |
| Systems Affected | Production Vercel deployment, Supabase Auth, Google OAuth, transactional email, auth callback routing |

## Current State

- #111 Layer 1 code/documentation inspection passed.
- #112 Layer 2 automated local validation passed.
- #113 Layer 3 QA seeded-role validation passed with no confirmed P0/P1 blockers.
- Layer 4 production auth rows in `docs/proposals/lead-spark-production-readiness-validation.md` were updated by this issue.
- Production URL from `docs/handbook/EMAILS.md`: `https://leadtalentplatform-latest.vercel.app`.

## Implementation Result

Completed on 2026-05-10 with blockers.

- Production `/es` and auth surfaces returned 200 and screenshots were captured under `tmp/production-smoke-114/`.
- Google OAuth start was tested and failed with `redirect_uri_mismatch`.
- Follow-up #119 was created for the P0 Google OAuth blocker.
- Email/password, password reset, company magic-link, and role-destination checks were blocked because no controlled production accounts/inboxes were available in this session.
- Follow-up #120 was created to provision controlled production smoke accounts and inboxes.
- Production smoke report was created at `.github/reports/issue-114-production-auth-email-smoke-validation-report.md`.
- Recommendation: no-go for real member invitations until #119 is fixed and #114 is revalidated.

## Production Environment

| Item | Expected |
| --- | --- |
| Production app | `https://leadtalentplatform-latest.vercel.app` |
| Locale route | `/es` should load as the Spanish-first operational surface |
| Main login | `/es/auth/login` |
| Auth callback | `/es/auth/callback` |
| Password reset request | `/es/auth/forgot-password` |
| Password update | `/es/auth/update-password` |
| Company login | `/es/company/login` |
| Company dashboard | `/es/company/dashboard` |

## Prerequisites

Before implementation, confirm or prepare:

- A controlled internal production test account for Google OAuth.
- A controlled internal production test email inbox for password reset.
- If email/password production login is supported, a controlled internal production account with known password.
- If company magic-link production smoke is in scope for #114, a controlled company/recruiter test email with active accepted or pending access.
- No real member invitations should be sent as part of this issue.
- Screenshots must not expose private inbox content, real member data, or OAuth secrets.

If any prerequisite is missing, mark the affected row `Blocked`, classify severity, and create a follow-up issue for P0/P1 blockers.

## Patterns To Follow

### Auth Entry Points

Source: `components/auth/login.tsx`

```ts
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

Main email/password login fetches `user.role` and `person_profile`, then uses `getPostAuthRedirectPath`.

Source: `components/auth/google-button.tsx`

```ts
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/${locale}/auth/callback`
  },
})
```

Google OAuth must redirect back to the production origin, not QA or localhost.

### Password Reset

Source: `components/auth/forgot-password.tsx`

```ts
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/${locale}/auth/update-password`,
});
```

Production reset email should point to the production `/es/auth/update-password` flow.

Source: `components/auth/update-password.tsx`

```ts
const { error } = await supabase.auth.updateUser({ password });
```

Reset link must establish a session that can update the password.

### Auth Callback And Role Routing

Source: `app/[locale]/auth/callback/route.ts`

```ts
const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
```

Callback exchanges the code, fetches the user, and redirects by role/profile.

Source: `lib/auth-redirects.ts`

```ts
if (role === 'member' || role === 'editor') {
  return hasProfile ? '/student' : '/onboarding'
}

if (role === 'recruiter') return '/company'
if (role === 'admin') return '/admin'
```

Validate that production users land in the expected role destination after auth.

### Company Magic Link

Source: `app/[locale]/company/login/page.tsx`

```ts
emailRedirectTo: `${window.location.origin}/${locale}/company/dashboard`,
```

Company magic links should return to the production company dashboard and remain gated by `recruiter_access`.

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `docs/proposals/lead-spark-production-readiness-validation.md` | Update | Fill Layer 4 production auth rows with evidence-backed statuses. |
| `.github/reports/issue-114-production-auth-email-smoke-validation-report.md` | Create | Record production smoke results, evidence, blockers, and go/no-go notes. |
| `.github/plans/issue-114-production-auth-email-smoke-validation.plan.md` | Update | Mark implementation tasks complete as validation progresses. |
| `tmp/production-smoke-114/` | Create during implementation | Store local screenshots/logs if used. Do not commit sensitive raw inbox/OAuth artifacts. |

Runtime source files are out of scope unless a production smoke blocker is confirmed and the user explicitly asks to fix it in this issue.

## Tasks

### Task 1: Establish Production Smoke Baseline

- **Status**: Complete.
- **System**: Production app, GitHub issue #114, validation doc.
- **Action**: Inspect and record.
- **Implement**:
  - Confirm `https://leadtalentplatform-latest.vercel.app/es` loads.
  - Capture date, tester, production URL, browser/device, and account category.
  - Confirm #113 report exists and Layer 3 passed.
  - Create `tmp/production-smoke-114/` for screenshots/logs if needed.
  - Capture baseline `git status --short`.
- **Validate**: Baseline appears in report.

### Task 2: Validate Production Login Page And Public Auth Surfaces

- **Status**: Complete.
- **Routes**:
  - `/es/auth/login`
  - `/es/auth/forgot-password`
  - `/es/auth/update-password`
  - `/es/company/login`
- **Action**: Browser smoke.
- **Implement**:
  - Verify pages load without server errors.
  - Verify Google button exists on main login.
  - Verify email/password fields exist on main login.
  - Verify reset request field exists.
  - Verify company magic-link field exists.
- **Validate**: Screenshots or notes captured for each route.

### Task 3: Validate Google OAuth End-To-End

- **Status**: Complete with P0 failure. Follow-up #119 created.
- **Account**: Controlled internal Google test account.
- **Action**: Manual or browser-assisted production OAuth.
- **Implement**:
  - Start at `/es/auth/login`.
  - Click `Continuar con Google`.
  - Confirm redirect goes to Google OAuth.
  - Complete sign-in with the controlled account.
  - Confirm callback returns to production origin.
  - Confirm final destination matches role/profile state:
    - member/editor with profile -> `/es/student`
    - member/editor without profile -> `/es/onboarding`
    - admin -> `/es/admin`
    - recruiter -> `/es/company` or `/es/company/dashboard` depending current routing.
  - Record any callback error route or wrong-origin redirect.
- **Validate**: Screenshot/note of final production route and account used.
- **Severity**: P0 if Google OAuth cannot complete for the controlled account.

### Task 4: Validate Production Email/Password Login If Supported

- **Status**: Blocked. No controlled production account with known password was available; follow-up #120 created.
- **Account**: Controlled internal production account with known password.
- **Action**: Browser smoke.
- **Implement**:
  - Start at `/es/auth/login`.
  - Sign in with email/password.
  - Confirm no QA/test environment redirect.
  - Confirm post-auth role destination via `getPostAuthRedirectPath` expectations.
  - Sign out or isolate session before next test.
- **Validate**: Screenshot/note of final route.
- **Severity**: P1 if email/password is a supported activation fallback and fails; N/A if production policy is Google-only for member activation.

### Task 5: Validate Password Reset Email Delivery And Update Flow

- **Status**: Blocked. No controlled production inbox/account was available; follow-up #120 created.
- **Account**: Controlled internal production account with inbox access.
- **Action**: Manual email smoke.
- **Implement**:
  - Start at `/es/auth/forgot-password`.
  - Submit the controlled email.
  - Confirm success state appears.
  - Confirm email arrives.
  - Confirm email link points to production, not QA or localhost.
  - Open link and confirm `/es/auth/update-password` loads with a valid session.
  - Set a temporary new password if safe for the controlled test account.
  - Confirm the account can log in after reset, if email/password is supported.
- **Validate**: Redacted screenshot/note of success state, production reset URL domain, and final route.
- **Severity**: P1 if reset is a required fallback; P0 if no alternate production login path exists and Google OAuth also fails.

### Task 6: Validate Company Magic Link If Included In #114 Scope

- **Status**: Blocked. Company login surface loads, but no controlled production company/recruiter inbox was available; follow-up #120 and #118 cover remaining validation.
- **Account**: Controlled production company/recruiter test email.
- **Action**: Manual email smoke.
- **Implement**:
  - Start at `/es/company/login`.
  - Submit controlled company email.
  - Confirm magic-link sent state appears.
  - Confirm email arrives and link points to production `/es/company/dashboard`.
  - Open link.
  - Confirm active accepted access reaches company dashboard, or missing access reaches the correct denied/help state.
- **Validate**: Screenshot/note.
- **Severity**: P0 if active invited company access cannot authenticate and LEAD SPARK company portal smoke depends on it; otherwise defer full company access production check to #118.

### Task 7: Validate Auth Callback Role Destinations

- **Status**: Blocked. Google OAuth failed and no controlled fallback account was available.
- **Accounts**: Any controlled production accounts available by role.
- **Action**: Route outcome check.
- **Implement**:
  - For each available controlled account, record role/profile state and final route after login/OAuth/reset.
  - Check that final route matches `lib/auth-redirects.ts`:
    - member/editor with profile -> `/student`
    - member/editor without profile -> `/onboarding`
    - admin -> `/admin`
    - recruiter -> `/company`
  - If production has only one controlled account, document untested roles and carry full role coverage to #115/#116/#118 where production data/accounts are prepared.
- **Validate**: Role destination table in report.

### Task 8: Update Layer 4 Checklist

- **Status**: Complete.
- **File**: `docs/proposals/lead-spark-production-readiness-validation.md`
- **Action**: Update.
- **Implement**:
  - Update only Layer 4 rows owned by #114:
    - Production URL loads.
    - Google OAuth works.
    - Email/password or magic link works.
    - Password reset works.
  - Add evidence pointer, tester, status, and severity.
  - Leave #115 through #118 Layer 4 rows unchanged unless directly verified as part of #114.
- **Validate**: No #114-owned rows remain `Not Started` unless explicitly `Blocked` with reason.

### Task 9: Create Follow-Up Issues For Confirmed P0/P1 Blockers

- **Status**: Complete. Created #119 and #120.
- **System**: GitHub.
- **Action**: Create issues only for confirmed blockers.
- **Implement**:
  - Create focused issues with environment, account type, route, expected, actual, severity, and evidence.
  - Use labels such as `LEAD`, `auth`, `security`, `validation`, `vercel`, `supabase`.
  - Link follow-ups in the report and validation doc.
- **Validate**: `gh issue view` confirms issue URLs if created.

### Task 10: Create Production Smoke Report

- **Status**: Complete.
- **File**: `.github/reports/issue-114-production-auth-email-smoke-validation-report.md`
- **Action**: Create.
- **Implement**:
  - Include metadata, production URL, date, tester, account types used, and evidence policy.
  - Include result tables for URL load, auth surfaces, Google OAuth, email/password/magic link, password reset, callback redirects.
  - Include blocker table and follow-up issue table.
  - Include go/no-go impact for pilot invitations.
- **Validate**: Report covers every #114 acceptance criterion.

### Task 11: Update Local Plan

- **Status**: Complete.
- **File**: `.github/plans/issue-114-production-auth-email-smoke-validation.plan.md`
- **Action**: Update during implementation.
- **Implement**:
  - Mark tasks complete as validation progresses.
  - Mark acceptance criteria complete when evidence exists.
  - Leave GitHub status criteria unchecked until after issue comment/label update.
- **Validate**: Plan reflects actual state.

### Task 12: Update GitHub Issue #114

- **Status**: Complete.
- **System**: GitHub.
- **Action**: Comment and label.
- **Implement**:
  - Add completion comment with report path, status summary, P0/P1 blockers, and follow-up issue links.
  - Change label from `piv-status:plan-ready` to `piv-status:review` when complete.
  - Keep issue open for review unless user asks to close.
- **Validate**:

```bash
gh issue view 114 --json labels,state,url
```

## Validation Commands

Most #114 validation is browser/manual production smoke, not local code validation. Use local commands only to inspect patterns or verify no accidental runtime edits:

```bash
git status --short
```

If runtime code changes become necessary, stop and either create a follow-up fix issue or explicitly expand scope before implementing.

## Acceptance Criteria

- [x] Production URL loads successfully.
- [x] Main login, forgot password, update password, and company login surfaces load.
- [x] Google OAuth redirects and completes successfully in production, or is marked Failed/Blocked with P0 follow-up.
- [x] Email/password or magic-link path works if supported for production activation, or is marked N/A with policy rationale.
- [x] Password reset sends email and allows password update, or is marked Failed/Blocked with severity and follow-up.
- [x] Auth callback routes users to the correct role destination for available controlled accounts.
- [x] Evidence is captured with date, tester, account used/account type, and screenshots or notes.
- [x] Layer 4 #114-owned rows are updated.
- [x] Production smoke report is created.
- [x] Confirmed P0/P1 blockers have follow-up GitHub issues.
- [x] GitHub issue #114 receives completion comment.
- [x] GitHub issue #114 has `piv-status:review`.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Real member data or inbox content appears in evidence | Use controlled accounts only; redact emails/screenshots; avoid posting private inbox screenshots publicly. |
| OAuth requires interactive human login | Use manual-assisted evidence and record final route; do not automate private credentials. |
| Password reset changes a shared account unexpectedly | Use a disposable controlled account or coordinate password reset owner before testing. |
| Production email provider is misconfigured | Mark reset/magic-link rows Failed/Blocked, create P0/P1 issue depending activation fallback requirements. |
| Callback points to QA/localhost/wrong domain | Record as P0 for Google OAuth or reset flow and create auth configuration follow-up. |
| Company magic-link access overlaps with #118 | Validate only login/email mechanics here; leave full company production access matrix to #118 unless a P0 is obvious. |
| No controlled production accounts are available | Mark affected rows Blocked, create setup issue, and do not recommend member invitations. |

## Done Criteria

- [x] Production auth/email smoke report exists.
- [x] Layer 4 production auth rows have evidence-backed statuses.
- [x] Any auth/email no-go condition is clearly identified.
- [x] P0/P1 blockers are linked to follow-up issues or explicitly recorded as none.
- [x] Local plan is updated.
- [x] GitHub issue #114 is updated and labeled for review.
