# PRD: Chapter E-board Invite MVP

## 1. Executive Summary

LEAD Talent Platform already supports email-bound chapter preapproval: when a user completes onboarding with a matching preapproved email, the platform can approve their chapter membership, create an e-board role assignment, grant chapter permissions, and redirect them to the chapter dashboard.

The remaining activation bottleneck is operational. Presidents and vice presidents still depend on central admins to preapprove every regular e-board member. This MVP gives trained president/VP users a chapter-scoped invite workflow so they can activate their own regular e-board team without receiving global admin access.

MVP goal: let presidents and VPs invite regular e-board members by email, send the invite immediately, track active and expired invites, cancel unaccepted invites, and re-invite after expiration while preserving the existing exact-email preapproval activation model.

## 2. Mission

Make chapter activation faster while preserving the platform's layered account model:

- Membership says who belongs to a chapter.
- Role assignment says what official chapter responsibility someone holds.
- Permission grants say what the person can do in the product.
- President/VP users can operate their chapter, but they are not platform admins.
- Central admin still controls president and vice president assignment.
- Real chapter emails must not be committed to git.

## 3. Target Users

### Chapter President / Vice President

Needs to invite regular e-board members, choose role context, see who has not accepted yet, cancel mistakes, and re-invite expired invites without waiting for Abigail.

### Invited E-board Member

Needs a clear email explaining the role, chapter, exact email requirement, onboarding steps, and support path.

### Abigail / LEAD Platform Team

Needs a reversible, auditable process that reduces manual preapproval work without giving chapter leaders unsafe privileges.

## 4. MVP Scope

### In Scope

- [ ] Add chapter-leader e-board invite service methods backed by `chapter_preapproval`.
- [ ] Allow only users with `chapter.roles.assign_eboard` to create, cancel, and re-invite regular e-board invites for their own chapter.
- [ ] Allow invited roles: `chief_of_staff`, `director`, `coordinator`.
- [ ] Reject president/VP invites from the chapter dashboard.
- [ ] Accept any valid email address.
- [ ] Set chapter-sent invite expiration to 30 days.
- [ ] Send an invite email immediately after a successful invite.
- [ ] Show active and expired unaccepted invites on `/chapter/members`.
- [ ] Let leaders cancel active unaccepted invites.
- [ ] Let leaders re-invite expired unaccepted invites.
- [ ] Keep correction flow explicit: cancel and create a new invite, no active invite editing.
- [ ] Use `abriones@leadmindset.org` as the support contact.
- [ ] Update the chapter onboarding guion and leader email draft.
- [ ] Add service/action/UI tests for the invite lifecycle.

### Out of Scope

- [ ] Tokenized invite acceptance page.
- [ ] Invite editing.
- [ ] Inviting regular chapter members from this flow.
- [ ] President/VP assignment by chapter leaders.
- [ ] Bulk CSV invite UI.
- [ ] Public e-board directory changes.
- [ ] Full email analytics or delivery dashboard.

## 5. User Stories

1. As a chapter president, I want to invite a regular e-board member by email, so that my chapter team can activate platform access without waiting for a central admin.
2. As a chapter vice president, I want to select a display title, role level, and functional area for the invite, so that the invite creates clean role data when accepted.
3. As an invited e-board member, I want a clear email with the platform link and exact email requirement, so that I can activate the right account on the first try.
4. As a chapter president, I want to see active and expired invites, so that I know who still needs to onboard.
5. As a chapter VP, I want to cancel an unaccepted invite, so that wrong emails or roles can be corrected safely.
6. As a chapter president, I want to re-invite an expired invite, so that stale activation attempts can be restarted without admin intervention.
7. As Abigail, I want all invite changes to remain scoped, auditable, and reversible, so that chapter autonomy does not create unsafe access.

## 6. Core Architecture & Patterns

The MVP reuses the existing chapter preapproval activation pipeline:

```text
chapter_preapproval
  -> onboarding saveBasicOnboarding()
  -> ChapterPreapprovalService.activatePreapprovalForUser()
  -> approved chapter_membership
  -> active chapter_role_assignment
  -> chapter_permission_grant
```

New work should add an invitation management layer around `chapter_preapproval`, not replace preapproval activation.

Recommended service boundary:

```text
lib/services/chapter-eboard-invite.service.ts
lib/actions/chapter/eboard-invites.ts
emails/templates/ChapterEboardInviteEmail.tsx
```

Server actions stay thin:

- Authenticate current user.
- Resolve approved chapter membership.
- Validate Zod input.
- Call service and email helper.
- Revalidate `/chapter/members`.

## 7. Tools / Features

### Invite Creation

Input:

- Email
- Role level: `chief_of_staff`, `director`, or `coordinator`
- Functional area
- Display title

Behavior:

- Validate actor has `chapter.roles.assign_eboard`.
- Validate email format.
- Reject protected role levels.
- Reject duplicate active unaccepted invite for same normalized email/chapter.
- Insert `chapter_preapproval`:
  - `preapproval_type = 'eboard'`
  - `expires_at = now() + 30 days`
  - `source = 'chapter_leader_invite'`
  - `created_by_id = actorUserId`

### Pending Invite Visibility

Show active and expired unaccepted invites for the current chapter:

- Email
- Display title
- Role level
- Functional area
- Invited date
- Expiration date
- Status: active or expired

### Cancel Invite

Allowed only for active unaccepted invites in the actor's chapter. Sets:

- `revoked_at`
- `revoked_by_id`
- `updated_at`
- Notes/reason indicating chapter leader cancellation

### Re-invite Expired Invite

Allowed only for expired, unaccepted, unrevoked invites in the actor's chapter. MVP behavior:

- Revoke the expired invite with actor metadata.
- Insert a fresh 30-day invite with the same role fields.
- Send a fresh email.

### Email

Spanish-first, action-oriented, professional. Required content:

- Invited role and chapter.
- Exact email requirement.
- Platform link.
- Onboarding steps.
- Support contact: `abriones@leadmindset.org`.

## 8. Technology Stack

- Next.js 15 App Router
- React 19
- Supabase
- Service layer in `lib/services`
- Server actions in `lib/actions/chapter`
- React Email templates in `emails/templates`
- Existing `sendTransactionalEmail` provider
- Tailwind CSS 4 and existing UI primitives
- Vitest for service/action logic

## 9. Security & Configuration

- Do not expose invite lists to unauthenticated users.
- Do not allow ordinary members or regular e-board users without `chapter.roles.assign_eboard` to manage invites.
- Do not allow president/VP invitation from chapter dashboard.
- Do not create global `admin` or `editor` users through this flow.
- Keep exact-email activation as the claim boundary for MVP.
- Avoid committing real email lists or private roster data.

No new environment variables are required if the existing transactional email provider is configured.

## 10. API / Action Specification

Server actions:

```ts
createChapterEboardInvite(input): Promise<ActionResult>
cancelChapterEboardInvite(input): Promise<ActionResult>
reinviteExpiredChapterEboardInvite(input): Promise<ActionResult>
```

Read action or server data function:

```ts
getChapterEboardInvites(chapterId): Promise<ChapterEboardInvite[]>
```

## 11. Success Criteria

- President/VP can invite a regular e-board member from `/chapter/members`.
- Invite email is sent immediately.
- Active and expired invites are visible to authorized chapter leaders.
- Active invite can be canceled before acceptance.
- Expired invite can be re-invited with a fresh 30-day expiration.
- Invited user who signs up with the exact email and completes onboarding lands in the existing preapproval activation path.
- Regular e-board users and ordinary members cannot manage invites.
- Service tests cover creation, duplicate rejection, protected role rejection, cancel, re-invite, and authorization.

## 12. Implementation Phases

### Phase 1: Service and Actions

Create the invite lifecycle service and thin server actions around `chapter_preapproval`.

### Phase 2: Email Delivery

Add the chapter e-board invite email template and send helper.

### Phase 3: Chapter Members UI

Add invite creation, pending/expired invite visibility, cancel, and re-invite controls to `/chapter/members`.

### Phase 4: Documentation and Validation

Update the chapter onboarding guion, launch email language, and validation coverage.

## 13. Future Considerations

- Tokenized invite acceptance page with invite preview.
- Bulk e-board invites from approved review artifacts.
- Reminder emails before expiration.
- Copy-paste fallback message.
- Admin invite dashboard across chapters.
- Member-only invite flow after chapter pilot stabilizes.

## 14. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Wrong email gets invited | Allow cancel before acceptance and keep exact-email activation. |
| Leaders try to invite presidents/VPs | Restrict chapter dashboard roles to regular e-board levels. |
| Stale invites accumulate | Use 30-day expiration and explicit re-invite flow. |
| Email delivery fails after DB insert | Return a clear error and avoid leaving an active invite when send fails, or revoke the new invite on send failure. |
| Existing preapproval uniqueness blocks re-invite | Revoke expired invite before inserting the new invite. |

## 15. Appendix

- `docs/runbooks/chapter-activation-runbook.md`
- `docs/runbooks/chapter-leader-training-dry-run.md`
- `docs/adr/004-chapter-scoped-roles-permissions.md`
- `lib/services/chapter-preapproval.service.ts`
- `lib/services/chapter-role-assignment.service.ts`
- `lib/services/chapter-permission.service.ts`
