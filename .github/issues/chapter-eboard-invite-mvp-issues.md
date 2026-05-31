# Chapter E-board Invite MVP Issues

Source PRD: `.github/PRDs/chapter-eboard-invite-mvp.prd.md`

GitHub integration status: created with `gh` CLI on branch `feat/chapter-eboard-invites`.

## Created GitHub Issues

| Local Issue | GitHub Issue | Title | URL |
| --- | --- | --- | --- |
| 1 | #258 | Build chapter e-board invite lifecycle service and actions | https://github.com/lead-mindset/leadtalentplatform-latest/issues/258 |
| 2 | #259 | Add chapter e-board invite email delivery | https://github.com/lead-mindset/leadtalentplatform-latest/issues/259 |
| 3 | #262 | Add chapter members invite management UI | https://github.com/lead-mindset/leadtalentplatform-latest/issues/262 |
| 4 | #260 | Document chapter onboarding guion and invite rollout language | https://github.com/lead-mindset/leadtalentplatform-latest/issues/260 |
| 5 | #261 | Validate chapter e-board invite MVP end to end | https://github.com/lead-mindset/leadtalentplatform-latest/issues/261 |

## Proposed GitHub Issues

| Issue | Title | Type | Priority | Complexity | Dependencies |
| --- | --- | --- | --- | --- | --- |
| 1 | Build chapter e-board invite lifecycle service and actions | Feature / Backend | High | Medium | None |
| 2 | Add chapter e-board invite email delivery | Feature / Email | High | Small | Issue 1 |
| 3 | Add chapter members invite management UI | Feature / Frontend | High | Medium | Issues 1-2 |
| 4 | Document chapter onboarding guion and invite rollout language | Documentation / Operations | Medium | Small | Issues 1-3 |
| 5 | Validate chapter e-board invite MVP end to end | Technical / Testing | High | Medium | Issues 1-4 |

## Issue 1: Build chapter e-board invite lifecycle service and actions

Type: Feature / Backend
Priority: High
Complexity: Medium
Labels: `enhancement`, `LEAD`, `chapter`, `services`, `database`, `phase:activation-readiness`, `operations`

### Description

Create the service-layer and server-action foundation for president/VP-managed e-board invitations. The MVP should reuse `chapter_preapproval` instead of adding a tokenized invite table, and it must preserve the existing preapproval activation path after onboarding.

### Acceptance Criteria

- [ ] Given a president/VP has `chapter.roles.assign_eboard`, when they invite an email for their own chapter, then a `chapter_preapproval` row is created with `preapproval_type = 'eboard'`, `source = 'chapter_leader_invite'`, and a 30-day expiration.
- [ ] Given the selected role is `president` or `vice_president`, when the action is submitted from the chapter dashboard, then the service rejects it.
- [ ] Given the email already has an active unaccepted invite for the same chapter, when a new invite is attempted, then the service rejects the duplicate.
- [ ] Given an active unaccepted invite exists, when an authorized president/VP cancels it, then `revoked_at`, `revoked_by_id`, and `updated_at` are recorded.
- [ ] Given an expired unaccepted invite exists, when an authorized president/VP re-invites it, then the expired invite is revoked and a fresh 30-day preapproval is created.
- [ ] Given a user lacks `chapter.roles.assign_eboard`, when they create, cancel, or re-invite, then the service denies the operation.
- [ ] Service tests cover creation, authorization, duplicate rejection, protected role rejection, cancel, and re-invite behavior.

### Technical Notes

- Likely files:
  - `lib/services/chapter-eboard-invite.service.ts`
  - `lib/services/__tests__/chapter-eboard-invite.service.test.ts`
  - `lib/actions/chapter/eboard-invites.ts`
- Follow existing service-layer patterns from `chapter-role-assignment.service.ts` and preapproval behavior from `chapter-preapproval.service.ts`.
- Server actions should handle auth, Zod validation, service calls, and revalidation only.

### Dependencies

None.

## Issue 2: Add chapter e-board invite email delivery

Type: Feature / Email
Priority: High
Complexity: Small
Labels: `enhancement`, `LEAD`, `chapter`, `services`, `operations`

### Description

Add a Spanish-first transactional email for chapter e-board invitations. The email should be action-oriented and tell invitees to sign up or sign in with the exact invited email.

### Acceptance Criteria

- [ ] Given a chapter e-board invite is created, when email sending succeeds, then the invitee receives a message with role, chapter, platform link, exact email requirement, onboarding steps, and support contact.
- [ ] Given email sending fails, when invite creation is attempted, then the action returns a clear error and does not leave a usable active invite behind.
- [ ] Given the invite email is rendered, when locale is Spanish, then the copy is clear, professional, and action-first.
- [ ] Given support is needed, when the user reads the email, then `abriones@leadmindset.org` is the contact path.
- [ ] Email helper tests cover subject, recipient, critical flag, platform link, and rendered role/chapter data where practical.

### Technical Notes

- Likely files:
  - `emails/templates/ChapterEboardInviteEmail.tsx`
  - `lib/emails/send-email.ts`
  - `lib/emails/__tests__/send-email.test.ts`
- Mirror `CompanyInviteEmail.tsx` and `sendCompanyRepresentativeInviteEmail`.

### Dependencies

Blocked by Issue 1.

## Issue 3: Add chapter members invite management UI

Type: Feature / Frontend
Priority: High
Complexity: Medium
Labels: `enhancement`, `LEAD`, `chapter`, `frontend`, `ui`, `phase:activation-readiness`

### Description

Expose the invite workflow on `/chapter/members` for authorized presidents/VPs. Leaders should be able to invite regular e-board members, see active and expired invites, cancel active invites, and re-invite expired invites.

### Acceptance Criteria

- [ ] Given an authorized president/VP opens `/chapter/members`, when they have invite permission, then an "Invite e-board member" action is visible.
- [ ] Given the invite form opens, when role options are shown, then only `chief_of_staff`, `director`, and `coordinator` are available.
- [ ] Given active and expired unaccepted invites exist, when the page loads, then leaders can see email, display title, role level, functional area, created date, expiration date, and status.
- [ ] Given an active invite is shown, when the leader cancels it, then the UI refreshes and shows the updated state.
- [ ] Given an expired invite is shown, when the leader re-invites it, then a fresh email is sent and the UI refreshes.
- [ ] Given a user without invite permission opens the page, when the page renders, then invite management controls are hidden.
- [ ] Loading, empty, error, and success states are handled without layout overflow on mobile.

### Technical Notes

- Likely files:
  - `app/[locale]/chapter/members/page.tsx`
  - `app/[locale]/chapter/members/components/*`
  - `lib/actions/chapter/get-data.ts`
- Use existing Radix/Shadcn-like components and lucide icons.
- Keep this as a dense operational tool, not a marketing surface.

### Dependencies

Blocked by Issues 1 and 2.

## Issue 4: Document chapter onboarding guion and invite rollout language

Type: Documentation / Operations
Priority: Medium
Complexity: Small
Labels: `documentation`, `LEAD`, `chapter`, `operations`, `phase:activation-readiness`

### Description

Update the chapter activation guidance so presidents/VPs understand the platform purpose, first actions, e-board invite flow, and support path. Include the launch email draft for presidents/VPs.

### Acceptance Criteria

- [ ] Given the chapter activation runbook is reviewed, when leaders ask what the platform is for, then the guion explains membership, roles, permissions, events, and chapter evidence.
- [ ] Given presidents/VPs receive training, when they ask what to do first, then the guidance says to sign up with the exact invited email, complete onboarding, and confirm chapter dashboard access.
- [ ] Given leaders need to onboard e-board members, when they read the guide, then it explains invite creation, exact-email activation, cancel, expiration, and re-invite behavior.
- [ ] Given something looks wrong, when leaders need support, then the documented contact is `abriones@leadmindset.org`.
- [ ] Given the president/VP launch email draft is reviewed, when sent manually or adapted later, then it is professional, action-first, and does not promise unsupported tokenized invite behavior.

### Technical Notes

- Likely files:
  - `docs/runbooks/chapter-activation-runbook.md`
  - `docs/runbooks/chapter-leader-training-dry-run.md`
  - optional `.github/reports/*` if validation notes are needed

### Dependencies

Blocked by Issues 1-3.

## Issue 5: Validate chapter e-board invite MVP end to end

Type: Technical / Testing
Priority: High
Complexity: Medium
Labels: `testing`, `LEAD`, `chapter`, `validation`, `qa`, `phase:activation-readiness`

### Description

Add focused validation for the chapter e-board invite MVP across service rules, email behavior, UI interaction, and existing preapproval activation.

### Acceptance Criteria

- [ ] Given service tests run, when invite lifecycle cases execute, then create/cancel/re-invite/protected-role/authorization behavior passes.
- [ ] Given email tests run, when the invite helper is exercised, then rendered email and send-provider payloads are verified.
- [ ] Given the chapter members page is tested, when authorized and unauthorized users are represented, then invite controls appear only for allowed users.
- [ ] Given an invited user completes onboarding with the exact email, when the existing preapproval flow runs, then membership, role assignment, and permissions activate.
- [ ] Given local validation runs, when `pnpm run lint`, `pnpm exec tsc --noEmit`, and targeted Vitest complete, then results are recorded.
- [ ] Given visual/product validation is needed, when the local app is runnable, then the invite UI is reviewed in desktop and mobile viewports.

### Technical Notes

- Likely files:
  - service tests under `lib/services/__tests__`
  - action/component tests if existing patterns support them
  - possibly a focused Playwright smoke after UI is built
- If Docker/Supabase is unavailable locally, record the blocker honestly and run non-Docker validation.

### Dependencies

Blocked by Issues 1-4.
