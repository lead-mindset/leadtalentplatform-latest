# Plan: Chapter E-board Invite Email Delivery

## Summary

Add a Spanish-first React Email template and transactional sender for chapter e-board invites. Wire email delivery into invite creation/re-invite actions so successful actions send immediately and failed delivery does not leave a usable active invite.

## User Story

As an invited e-board member
I want a clear email with my role, chapter, and exact sign-in email
So that I can activate the correct account on the first try

## Metadata

| Field | Value |
| --- | --- |
| Type | NEW_CAPABILITY |
| Complexity | LOW |
| Systems Affected | Transactional email, chapter invite actions |
| GitHub Issue | #259 |

## Patterns to Follow

### Email Template

`emails/templates/CompanyInviteEmail.tsx` uses `EmailLayout`, support email, CTA button, and locale-specific copy.

### Email Sender

`lib/emails/send-email.ts` renders templates with `@react-email/render`, builds app URLs with `getConfiguredAppUrl`, and calls `sendTransactionalEmail`.

### Email Tests

`lib/emails/__tests__/send-email.test.ts` mocks `sendTransactionalEmail`, sets `FRONTEND_URL`, and asserts subject/html payloads.

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `emails/templates/ChapterEboardInviteEmail.tsx` | CREATE | Email template |
| `lib/emails/send-email.ts` | UPDATE | Add sender helper |
| `lib/emails/__tests__/send-email.test.ts` | UPDATE | Add email helper coverage |
| `lib/actions/chapter/eboard-invites.ts` | UPDATE | Send email and roll back/revoke active invite on send failure |

## Tasks

### Task 1: Add email template and sender
- **Files**: `emails/templates/ChapterEboardInviteEmail.tsx`, `lib/emails/send-email.ts`
- **Action**: CREATE/UPDATE
- **Implement**: Spanish-first invite email with role/chapter/exact email/onboarding/support copy.
- **Validate**: `pnpm exec tsc --noEmit`

### Task 2: Add sender tests
- **File**: `lib/emails/__tests__/send-email.test.ts`
- **Action**: UPDATE
- **Implement**: subject, recipient, critical flag, URL, role/chapter content assertions.
- **Validate**: `pnpm exec vitest run lib/emails/__tests__/send-email.test.ts`

### Task 3: Wire email into actions
- **File**: `lib/actions/chapter/eboard-invites.ts`
- **Action**: UPDATE
- **Implement**: send email after create/re-invite; cancel/revoke created invite on send failure.
- **Validate**: `pnpm exec tsc --noEmit`

## Validation

```bash
pnpm exec vitest run lib/emails/__tests__/send-email.test.ts
pnpm exec tsc --noEmit
```

## Acceptance Criteria

- [x] Invite email includes role, chapter, exact email, platform link, onboarding steps, and `abriones@leadmindset.org`.
- [x] Sender uses the configured app URL and critical transactional delivery.
- [x] Email delivery failure returns a clear action error and prevents usable active invite drift.
