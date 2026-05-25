# Transactional Emails

Transactional emails help users understand important account, chapter, event, and company-access moments in LEAD Talent Platform.

## Source of Truth

- Organization brand: LEAD Americas
- Platform brand: LEAD Talent Platform
- Default language: Spanish
- Email provider: Resend
- Auth trigger: Supabase Auth Hook calls our app route, then our app sends through Resend

Supabase should not send the default auth email templates directly for QA or production. It should call:

```text
https://leadqa.vercel.app/api/auth/hooks/send-email
```

Production should use the production domain for the same route.

## Required Environment Variables

```text
RESEND_API_KEY=
EMAIL_FROM=LEAD Americas <verified-sender@example.com>
EMAIL_REPLY_TO=soporte@leadamericas.org
FRONTEND_URL=https://leadqa.vercel.app
SUPABASE_HOOK_SECRET=
SUPABASE_WEBHOOK_SECRET=
```

`FRONTEND_URL` is important. If it is missing or wrong, email buttons can point to the wrong deployment.

Use environment-specific app URLs for product links and email assets:

- QA: `https://leadqa.vercel.app`
- Production: `https://leadtalentplatform-latest.vercel.app`

Use `https://www.leadmindset.org` as the official public brand URL in email footers. QA and Vercel deployment URLs are product environments, not the canonical public brand site.

## Failure Rules

Critical emails must fail visibly:

- Signup confirmation
- Password reset
- Company representative invite

Important workflow emails should not undo the completed action, but failures must be logged:

- Chapter application submitted
- Member approval and Member ID issued
- Chapter application rejected
- Event application approved or rejected

Nice-to-have lifecycle emails are non-blocking:

- Profile/onboarding completed
- Event application received
- Open event registration confirmed

## Manual QA Checklist

Use QA with a real inbox and Resend enabled.

1. Create a new account.
   - Expected email: `Confirma tu cuenta en LEAD Talent Platform`
   - Button should open `https://leadqa.vercel.app/...`, not localhost.

2. Reset password.
   - Expected email: `Restablece tu contrasena de LEAD Talent Platform`
   - Button should open the QA password update flow.

3. Complete onboarding.
   - Expected email: profile ready / platform orientation.
   - User should land in the student dashboard or profile flow.

4. Apply to a chapter.
   - Expected email: chapter application received.
   - Dashboard should show pending review.

5. Approve a member.
   - Expected email: membership approved.
   - Email must include the Member ID.

6. Reject a chapter application.
   - Expected email: gentle chapter application update.
   - User remains able to participate in public events.

7. Register for an open event.
   - Expected email: event registration confirmed.
   - Email should link to the student events page.

8. Submit an application-based event registration.
   - Expected email: event application received.

9. Approve or reject an event application.
   - Expected email: application approved or application update.

10. Send a company representative invite.
   - Expected email: company representative invitation.
   - Button should open the QA invite acceptance flow.

## Implementation Notes

- Shared delivery lives in `lib/emails/provider.ts`.
- Named lifecycle senders live in `lib/emails/send-email.ts`.
- Templates live in `emails/templates`.
- Do not add Nodemailer or SMTP paths for live transactional email.
- Keep future newsletter campaigns separate from these transactional flows.
