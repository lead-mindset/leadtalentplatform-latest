# Plan: Transactional Email Foundation and LEAD Lifecycle Audit

## Summary

Unify LEAD Talent Platform transactional email delivery around Resend. Supabase Auth Hooks remain the trigger for auth emails, but every app-controlled email should go through one internal provider, one sender API, and one Spanish-first template language.

The goal is not "more email." The goal is trust: every student, member, editor, admin, and company representative should receive the right next action at the right moment, with LEAD Americas branding and QA/prod URLs that never accidentally point to localhost.

## User Story

As a LEAD platform operator,
I want transactional emails to be reliable, Spanish-first, and aligned with LEAD Americas workflows,
so that users understand what happened, what is pending, and what to do next.

## Metadata

| Field | Value |
| --- | --- |
| Type | Refactor / Enhancement |
| Complexity | High |
| Systems | Auth, email infrastructure, onboarding, chapter membership, event registration, company access, templates, tests |
| GitHub Issue | TBD |
| Implementation Status | Completed |

## Decisions

- Organization name: `LEAD Americas`.
- Platform name: `LEAD Talent Platform`.
- Do not use `LEAD Mindset` in transactional emails.
- Default transactional language is Spanish.
- Auth emails may respect known route/user locale, but fallback is Spanish.
- Company representative emails are Spanish-first for now.
- Resend is the only transactional email provider.
- Supabase does not send auth email directly; Supabase Auth Hooks call our route, then our route sends through Resend.
- Critical email failures are visible: signup confirmation, password reset, company representative invite/login.
- Important workflow email failures do not undo the core action, but must be logged and surfaced where practical: member approval, chapter rejection, event approval/rejection.
- Nice-to-have emails are non-blocking with logging: welcome/orientation, application received, open event registration confirmation.

## Current Code Findings

| Area | File:Lines | Finding |
| --- | --- | --- |
| Auth hook | `app/api/auth/hooks/send-email/route.tsx:7`, `app/api/auth/hooks/send-email/route.tsx:47`, `app/api/auth/hooks/send-email/route.tsx:134` | Auth hook already uses Resend. Keep this path, but reuse shared provider and fix brand/URLs. |
| Auth URL generation | `app/api/auth/hooks/send-email/route.tsx:113` | Confirmation URL is built in-route. It should use canonical app URL behavior so QA links do not point to localhost. |
| Welcome webhook | `app/api/webhooks/welcome-email/route.tsx:7`, `app/api/webhooks/welcome-email/route.tsx:71` | Duplicates Resend setup and uses old brand copy. Decide whether it stays as onboarding/profile orientation. |
| Product emails | `lib/emails/config.ts:1`, `lib/emails/config.ts:6`, `lib/emails/send-email.ts:17` | Product emails still use SMTP/Nodemailer and can silently log as success when email is missing. Replace with Resend-backed delivery. |
| Member approval | `lib/actions/chapter/check-students.ts:96` | Member approval email exists. Preserve non-blocking workflow, but report/log delivery failure clearly. |
| Event emails | `lib/actions/events/register.ts:101`, `lib/actions/events/bulk-approve.ts:43`, `lib/actions/events/bulk-approve.ts:82` | Application emails are partially wired. Open-event registration confirmation is missing. |
| API application decisions | `app/api/events/[eventId]/applications/[applicationId]/approve/route.ts:50`, `app/api/events/[eventId]/applications/[applicationId]/reject/route.ts:48` | Approval/rejection routes dynamically import senders. Centralize behavior and avoid duplicate semantics. |
| Company invite | `lib/actions/admin/invite-recruiter.ts:5`, `lib/actions/admin/invite-recruiter.ts:10` | Company invite still uses Nodemailer and user-facing recruiter language. Move to Resend and company representative language. |
| Canonical URL | `lib/app-url.ts` | Existing app URL helper should be the source for transactional links. |
| Tests | `lib/actions/student/__tests__/onboarding.helpers.test.ts`, `lib/services/__tests__/*.test.ts`, `tests/architecture.test.ts` | Existing Vitest patterns are strong enough to add provider, sender, and trigger tests. |

## Scope

### In Scope

- Central Resend provider for all transactional email.
- Spanish-first LEAD Americas / LEAD Talent Platform templates.
- Auth hook email cleanup.
- Company representative invite email cleanup.
- Lifecycle emails for onboarding/profile completion, chapter application, member approval/member ID, chapter rejection, open event registration, event application submit/approve/reject.
- Tests for provider behavior, URL generation, sender payloads, and critical/non-critical failure semantics.
- Manual QA documentation for non-technical testers.

### Out of Scope

- Newsletter campaign architecture.
- Marketing automation.
- English company portal personalization until we store contact language.
- Full deliverability operations beyond required env/documentation.

## Implementation Tasks

### Task 1: Create the Resend provider foundation

Files:
- `lib/emails/provider.ts`
- `lib/emails/config.ts`
- `lib/emails/send-email.ts`

Implement:
- Create one shared `sendTransactionalEmail()` helper backed by Resend.
- Read `RESEND_API_KEY`, `EMAIL_FROM`, and `EMAIL_REPLY_TO`.
- Default sender copy to `LEAD Americas` while allowing the verified sender through env.
- Return typed results: `{ success: true; id?: string } | { success: false; error: string }`.
- Add explicit `critical` behavior.
- Remove silent "log as success" production behavior.

Validate:
```bash
pnpm vitest run lib/emails
pnpm lint
```

### Task 2: Normalize auth hook emails

File:
- `app/api/auth/hooks/send-email/route.tsx`

Implement:
- Keep Supabase webhook signature verification.
- Reuse the shared Resend provider.
- Use canonical app URL behavior for QA/prod links.
- Fix subjects and brand:
  - `Confirma tu cuenta en LEAD Talent Platform`
  - `Restablece tu contrasena de LEAD Talent Platform`
- Fallback locale to Spanish.
- Confirm signup links route through `/{locale}/auth/confirm`.
- Reset links route through `/{locale}/auth/update-password` after OTP verification.

Validate:
```bash
pnpm vitest run lib/emails
pnpm build
```

### Task 3: Fix template brand, encoding, and lifecycle copy

Files:
- `emails/templates/*.tsx`
- `emails/EmailLayout.tsx`

Implement:
- Replace `LEAD Mindset` with correct `LEAD Americas` / `LEAD Talent Platform` usage.
- Remove mojibake and garbled characters.
- Keep transactional copy Spanish-first.
- Remove decorative emoji from subjects and core CTAs.
- Make CTAs concrete: confirm account, reset password, view dashboard, view my events, review invite.

Validate:
```bash
pnpm vitest run lib/emails
pnpm lint
```

### Task 4: Move company representative invites to Resend

File:
- `lib/actions/admin/invite-recruiter.ts`

Implement:
- Remove direct Nodemailer transport.
- Keep the existing invite creation/rollback behavior for critical send failure.
- Add `sendCompanyRepresentativeInviteEmail()`.
- Use company representative language in user-facing copy.
- Use canonical app URL and the current invite acceptance route.

Validate:
```bash
pnpm vitest run lib/services/__tests__/admin.service.test.ts
pnpm lint
```

### Task 5: Add missing lifecycle emails

Files to inspect/update:
- `lib/actions/student/onboarding.helpers.ts`
- `lib/actions/chapter/apply.ts`
- `lib/actions/chapter/check-students.ts`
- `lib/actions/events/register.ts`
- `lib/actions/events/bulk-approve.ts`
- `app/api/events/[eventId]/applications/[applicationId]/approve/route.ts`
- `app/api/events/[eventId]/applications/[applicationId]/reject/route.ts`

Implement:
- Onboarding/profile completed: optional orientation email after onboarding completion, not raw signup.
- Chapter application submitted: confirmation email.
- Member approval + Member ID: email with chapter, Member ID, and dashboard/profile CTA.
- Chapter rejection: gentle status update email.
- Open event registration confirmed: email with event details and student events/QR path.
- Application event submitted: keep received email.
- Application approved/rejected: improve details, URLs, and Spanish copy.
- Preserve action success for non-critical email failures.

Validate:
```bash
pnpm test
pnpm lint
```

### Task 6: Add reliability and regression tests

Files:
- `lib/emails/__tests__/provider.test.ts`
- `lib/emails/__tests__/send-email.test.ts`
- Existing action tests as needed
- Optional: `tests/architecture.test.ts`

Implement:
- Missing Resend key behavior.
- Critical email failure returns failure to caller.
- Non-critical email failure logs and does not throw.
- Canonical URL generation uses configured frontend URL.
- Sender functions pass expected subject, recipient, and CTA URL.
- Encoding guard for templates: fail if live templates include known mojibake markers such as `Ã`, `Â`, or garbled emoji artifacts.
- No live app email path imports `nodemailer`.

Validate:
```bash
pnpm vitest run lib/emails tests/architecture.test.ts
pnpm test
```

### Task 7: Document QA email behavior

File:
- `docs/handbook/EMAILS.md`

Implement:
- Explain Supabase Auth Hook -> app route -> Resend.
- List required env vars.
- Document critical vs non-critical behavior.
- Provide a non-technical QA checklist:
  - create account
  - reset password
  - complete onboarding/profile
  - apply to chapter
  - approve member and receive Member ID
  - reject chapter application
  - register for open event
  - apply to application event
  - approve/reject event application
  - send company representative invite
- Include expected sender, subject intent, and destination page.

Validate:
```bash
pnpm lint
```

## Final Validation

```bash
pnpm vitest run lib/emails tests/architecture.test.ts
pnpm test
pnpm lint
pnpm build
```

Manual QA:

1. Configure QA env with `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `FRONTEND_URL`, `SUPABASE_HOOK_SECRET`, and `SUPABASE_WEBHOOK_SECRET`.
2. Confirm Supabase QA Auth Hook points to `https://leadqa.vercel.app/api/auth/hooks/send-email`.
3. Create a new QA account and verify confirmation email opens QA, not localhost.
4. Trigger password reset and verify reset URL opens QA.
5. Send company representative invite and verify invite URL opens QA company flow.
6. Complete onboarding and verify only the appropriate lifecycle email sends.
7. Apply to a chapter and verify the submitted email.
8. Approve a member and verify the Member ID email.
9. Register for an open event and verify confirmation email.
10. Submit, approve, and reject application-based event registrations.

## Acceptance Criteria

- [x] All transactional email delivery goes through Resend.
- [x] Supabase Auth Hook remains the auth email trigger.
- [x] No live product email path depends on SMTP/Nodemailer.
- [x] Critical email failures are visible to the caller.
- [x] Non-critical email failures are logged with context.
- [x] Templates use `LEAD Americas` and `LEAD Talent Platform` correctly.
- [x] Templates are Spanish-first by default.
- [x] Garbled encoding is removed from live email copy.
- [x] Open event registrations send confirmation email.
- [x] Application-based events send submitted/approved/rejected emails.
- [x] Chapter application submitted/approved/rejected lifecycle is covered.
- [x] Member approval email includes Member ID.
- [x] Company representative invite uses correct language and route.
- [x] Tests, lint, and build pass.

## Implementation Notes

- Completed the Resend provider and removed live Nodemailer/SMTP paths.
- Added email architecture tests for provider drift and template mojibake.
- Added `docs/handbook/EMAILS.md` for QA and operations.
- Validation completed with focused email tests, full Vitest, lint, and production build.

## Risks

- QA/prod URL drift can break auth links. Mitigation: canonical URL helper and manual QA against `leadqa.vercel.app`.
- Resend sender domain may differ between QA and prod. Mitigation: env-driven sender and documented env checklist.
- Duplicate event decision emails may fire from action and API routes. Mitigation: central sender helpers and tests around the paths used by UI.
- Email should not become hidden business logic. Mitigation: services/actions still own state changes; email layer only reports lifecycle outcomes.
