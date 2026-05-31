# PRD: Dedicated Chapter Invite System

## 1. Executive Summary

LEAD Talent Platform needs a sustainable invitation system for chapter activation. The current `chapter_preapproval` model supports launch-time eligibility, but it does not fully model invitation lifecycle, explicit acceptance, existing-account activation, protected President/Vice President onboarding, resend behavior, or recipient-facing token links.

This PRD defines a dedicated `chapter_invite` system. The system separates invitation lifecycle from membership, role assignment, permission grants, and audit history. It supports one explicit recipient flow for invited chapter members, regular e-board members, and admin-created protected chapter leaders.

MVP goal: create a tokenized, email-bound chapter invitation lifecycle that lets chapter leaders invite regular e-board members and lets admins invite Presidents/Vice Presidents while requiring matching-email login and explicit acceptance before granting chapter membership, official role assignment, and scoped permissions.

## 2. Mission

Build chapter activation as a controlled, auditable product workflow:

- Invites are explicit user-facing artifacts, not hidden onboarding side effects.
- Membership, role assignment, and permissions remain separate canonical records.
- Protected leadership roles are admin-controlled.
- Existing accounts can accept invites without creating duplicate accounts.
- No leadership role is silently activated.
- Invite lifecycle is reversible before acceptance and auditable after acceptance.

## 3. Target Users

### Platform Admin

Needs to invite one President or one Vice President for a specific chapter, see current protected leadership state, block conflicts, resend expired invites, and revoke unaccepted mistakes.

### Chapter President / Vice President

Needs to invite regular e-board members for the same chapter without platform admin access, track pending invites, resend after 30 days, and cancel active mistakes.

### Invited Recipient

Needs to open a secure email link, sign in or create an account with the invited email, complete basic profile if needed, review chapter and role details, and explicitly accept.

### Platform Operator

Needs clean auditability: who created the invite, who accepted it, which user received membership/role/permissions, and why conflict cases were blocked.

## 4. MVP Scope

### In Scope

- [ ] Add dedicated `chapter_invite` database table with token hash, email, chapter, role metadata, status, expiration, acceptance, revocation, replacement, and metadata fields.
- [ ] Store only hashed invite tokens in the database.
- [ ] Add service-layer lifecycle methods for create, list, validate token, accept, revoke, and re-invite.
- [ ] Move chapter e-board invite creation/list/revoke/reinvite from `chapter_preapproval` to `chapter_invite`.
- [ ] Add recipient route `/[locale]/chapter/invites/accept?token=...`.
- [ ] Require the logged-in email to match the invited email before acceptance.
- [ ] Redirect unauthenticated users to sign in or sign up with the invite token preserved.
- [ ] Require basic profile completion before final acceptance for new users.
- [ ] Accepting an invite creates or updates approved chapter membership.
- [ ] Accepting a role invite creates or updates official chapter role assignment and grants role-template permissions.
- [ ] Admin-created President/VP invites immediately grant protected-role permissions after explicit acceptance.
- [ ] Enforce one active President and one active Vice President per chapter for MVP.
- [ ] Block accidental multi-chapter leadership/membership activation when the user already has an approved membership in another chapter.
- [ ] Update invite email copy to show chapter, role, invited email, expiration, and support contact.
- [ ] Add focused service/action tests and validation reports.

### Out of Scope

- [ ] Bulk President/VP invite import UI.
- [ ] In-app pending invite banners.
- [ ] Multi-chapter membership support.
- [ ] Automatic role activation without explicit acceptance.
- [ ] Invite analytics dashboard.
- [ ] Editing accepted invites.

## 5. User Stories

1. As an admin, I want to invite a chapter President or Vice President by email, so that protected chapter leadership can onboard without manual account correction.
2. As a chapter President, I want to invite regular e-board members by email, so that my operating team can activate without waiting for central admin.
3. As an invited recipient with an existing account, I want to accept the invite from a link, so that I do not need to create a second account.
4. As an invited recipient without a completed profile, I want to complete basic profile first and then accept, so that the platform has required user data without making me apply to a chapter manually.
5. As an admin, I want President/VP invite conflicts blocked, so that a chapter cannot accidentally have duplicate protected leaders.
6. As a chapter leader, I want expired invite re-send behavior after 30 days, so that activation can recover without stale links.
7. As a platform operator, I want acceptance and revocation to be auditable, so that support can investigate wrong-email, wrong-role, and wrong-chapter cases.

## 6. Core Architecture

The dedicated invite system separates lifecycle from activation results:

```text
chapter_invite
  -> accepted by matching authenticated user
  -> chapter_membership approved/upserted
  -> chapter_role_assignment created/replaced as needed
  -> chapter_permission_grant role template applied
  -> chapter_audit_log records sensitive transitions
```

### Directory Structure

```text
supabase/migrations/
  20260531100000_add_chapter_invite.sql

lib/services/
  chapter-invite.service.ts
  chapter-eboard-invite.service.ts
  __tests__/chapter-invite.service.test.ts

lib/actions/chapter/
  eboard-invites.ts
  invite-acceptance.ts

app/[locale]/chapter/invites/accept/
  page.tsx
  accept-invite-client.tsx

app/[locale]/admin/chapters/[id]/
  protected leadership invite UI

emails/templates/
  ChapterEboardInviteEmail.tsx
  ChapterLeadershipInviteEmail.tsx
```

## 7. Tools and Features

### Dedicated Invite Schema

`chapter_invite` owns invitation lifecycle:

- `invite_type`: `member`, `regular_eboard`, `protected_leader`
- `status`: `pending`, `accepted`, `revoked`
- `token_hash`, never raw token
- `expires_at`, default 30 days
- `accepted_at`, `accepted_by_user_id`
- `revoked_at`, `revoked_by_user_id`
- `created_by_user_id`, `created_by_role`
- role metadata for chapter activation

### Chapter E-board Invite Flow

Chapter leaders with `chapter.roles.assign_eboard` can create only `regular_eboard` invites:

- `chief_of_staff`
- `director`
- `coordinator`

They cannot create President/VP invites.

### Admin Protected Leadership Flow

Admins can create protected leadership invites from the chapter detail page:

- President
- Vice President

Creation is blocked if that chapter already has an active accepted role or pending invite for the same protected role.

### Recipient Acceptance Flow

The recipient opens `/chapter/invites/accept?token=...`.

States:

- Signed out: prompt sign in/sign up with return path.
- Signed in with mismatched email: block.
- Signed in with matching email but missing profile: route to onboarding and preserve invite token.
- Signed in with matching email and profile complete: show role/chapter summary and `Accept invite`.
- Expired/revoked/accepted by another user: show recovery state.
- Already accepted by same user: show success and link to chapter dashboard.

## 8. Technology Stack

- Next.js 15 App Router
- React 19
- Supabase Postgres and Auth
- Service layer in `lib/services`
- Thin server actions in `lib/actions`
- Tailwind CSS 4 and existing UI components
- Vitest for service/action coverage
- Existing transactional email provider

## 9. Security and Configuration

- Raw invite tokens are generated server-side and sent only through email links.
- Only SHA-256 token hashes are stored.
- Acceptance requires authenticated matching email.
- Admin-only protected role invite creation is enforced in services.
- Chapter leader invite creation is enforced through `chapter.roles.assign_eboard`.
- Role conflicts are checked before protected invite creation and again at acceptance.
- All sensitive mutations write audit log entries or preserve lifecycle fields sufficient for audit.

## 10. API and Action Specification

### Server Actions

```ts
createChapterEboardInvite(input)
cancelChapterEboardInvite(input)
reinviteExpiredChapterEboardInvite(input)
validateChapterInviteToken(input)
acceptChapterInvite(input)
createAdminProtectedChapterInvite(input)
revokeAdminProtectedChapterInvite(input)
reinviteAdminProtectedChapterInvite(input)
```

### Service Methods

```ts
ChapterInviteService.createInvite(...)
ChapterInviteService.listChapterInvites(...)
ChapterInviteService.validateToken(...)
ChapterInviteService.acceptInvite(...)
ChapterInviteService.revokeInvite(...)
ChapterInviteService.reinviteExpiredInvite(...)
```

## 11. Success Criteria

- Existing-account invite acceptance works without duplicate accounts.
- New-account invite acceptance preserves token through onboarding and requires explicit acceptance.
- Chapter e-board invites no longer depend on `chapter_preapproval`.
- Admin President/VP invites are supported from chapter context.
- One active President and one active VP per chapter are enforced.
- Expired invites can be re-sent after 30 days.
- Wrong-email acceptance is blocked.
- Targeted invite tests, TypeScript, lint, and relevant service tests pass.

## 12. Implementation Phases

### Phase 1: Schema and Core Service

Add `chapter_invite`, update generated types, and implement lifecycle service with token hashing and role conflict checks.

### Phase 2: Migrate Chapter E-board Invites

Move existing chapter e-board invite workflow from `chapter_preapproval` to `chapter_invite`, update emails to tokenized accept links, and keep UI behavior stable.

### Phase 3: Recipient Acceptance Flow

Add token validation and explicit accept page for existing and new users, with matching-email and profile-required gates.

### Phase 4: Admin Protected Leadership Invites

Add chapter detail admin UI for President/VP invites, conflict states, revoke, and re-invite.

### Phase 5: Validation and Documentation

Add regression tests, update runbooks, and capture validation evidence.

## 13. Future Considerations

- Bulk CSV admin invite import after single-invite flow is stable.
- In-app pending invite banner.
- Multi-chapter membership policy.
- Invite delivery status and analytics.
- Migration/deprecation plan for legacy `chapter_preapproval`.

## 14. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Duplicate protected leaders | Enforce one active accepted role and one pending protected invite per chapter/role. |
| Wrong user accepts invite | Require authenticated email to match normalized invited email. |
| Existing-account activation is missed | Use explicit accept route instead of relying only on onboarding activation. |
| Token leakage | Store token hashes only, expire in 30 days, and require matching-email auth. |
| Large migration complexity | Ship in vertical issues with targeted service tests before UI expansion. |
