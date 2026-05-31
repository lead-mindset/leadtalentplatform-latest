# Issue Set: Dedicated Chapter Invite System

Source PRD: `.github/PRDs/chapter-invite-system.prd.md`

## CHINV-01: Add dedicated chapter invite schema and service foundation

GitHub: #263

Labels: `enhancement`, `database`, `backend`, `services`, `chapter`, `security`, `phase:active-piv-loop`

Complexity: Large

Dependencies: None

### Description

Add a dedicated `chapter_invite` lifecycle model and service foundation for tokenized chapter invitations. This issue separates invitation lifecycle from legacy `chapter_preapproval` while preserving the existing canonical membership, role assignment, permission grant, and audit boundaries.

### Acceptance Criteria

- [ ] `chapter_invite` exists with email, normalized email, token hash, chapter, invite type, role metadata, status, expiration, acceptance, revocation, replacement, and metadata fields.
- [ ] Raw invite tokens are never stored; only a deterministic hash is persisted.
- [ ] Generated database types include `chapter_invite` and role assignment source invite linkage.
- [ ] `ChapterInviteService` supports create, list, validate token, revoke, re-invite, and accept contracts.
- [ ] Service tests cover token hashing, duplicate pending invites, protected role conflicts, expired/revoked validation, wrong-email rejection, and acceptance idempotency.

## CHINV-02: Migrate chapter e-board invites onto chapter_invite

GitHub: #264

Labels: `enhancement`, `backend`, `server-actions`, `chapter`, `email`, `frontend`, `phase:active-piv-loop`

Complexity: Medium

Dependencies: CHINV-01 / #263

### Description

Move the existing President/VP-managed regular e-board invite flow from `chapter_preapproval` to `chapter_invite`. Preserve the current chapter members UI while changing the backing lifecycle to tokenized invites and explicit acceptance.

### Acceptance Criteria

- [ ] Chapter e-board invite service creates `regular_eboard` invites only for `chief_of_staff`, `director`, and `coordinator`.
- [ ] Chapter leaders with `chapter.roles.assign_eboard` can list, revoke, and re-invite their own chapter invites.
- [ ] Invite emails include a tokenized `/chapter/invites/accept?token=...` link, chapter, role, invited email, expiration, and support contact.
- [ ] Existing chapter members invite UI continues to show pending and expired invites with cancel/reinvite behavior.
- [ ] Targeted e-board invite action/service/email tests pass.

## CHINV-03: Add explicit recipient invite acceptance flow

GitHub: #265

Labels: `enhancement`, `auth`, `onboarding`, `frontend`, `server-actions`, `security`, `chapter`, `phase:active-piv-loop`

Complexity: Large

Dependencies: CHINV-01, CHINV-02 / #263, #264

### Description

Add a recipient-facing invite acceptance route that works for existing accounts and new accounts. The route must require matching-email authentication and explicit acceptance before granting membership, role assignment, and permissions.

### Acceptance Criteria

- [ ] `/[locale]/chapter/invites/accept?token=...` validates token state and shows signed-out, mismatch, expired, revoked, already-accepted, profile-required, and ready-to-accept states.
- [ ] Unauthenticated users are routed to sign in or sign up with the invite token return path preserved.
- [ ] Users with matching email but missing profile are routed through onboarding before returning to final acceptance.
- [ ] Accepting an invite creates or updates approved chapter membership, creates/replaces the appropriate role assignment when applicable, grants role-template permissions, and consumes the invite.
- [ ] Wrong-email, expired, revoked, and accepted-by-other-user cases cannot mutate membership, roles, or permissions.

## CHINV-04: Add admin protected leadership invites from chapter detail

GitHub: #266

Labels: `enhancement`, `admin`, `chapter`, `permissions`, `frontend`, `backend`, `phase:active-piv-loop`

Complexity: Medium

Dependencies: CHINV-01, CHINV-03 / #263, #265

### Description

Add admin-created protected leadership invites for chapter Presidents and Vice Presidents from the admin chapter detail page. The UI should show current protected leaders, pending protected invites, conflict states, and revoke/reinvite actions.

### Acceptance Criteria

- [ ] Admin chapter detail page shows current active President and Vice President for the chapter.
- [ ] Admin can invite one President or one Vice President by email with suggested display titles.
- [ ] Invite creation is blocked when an active accepted role or pending invite already exists for that protected role in the chapter.
- [ ] Admin can revoke active unaccepted protected invites and re-invite expired protected invites.
- [ ] Accepted protected leadership invites grant the relevant protected role permissions immediately after explicit acceptance.

## CHINV-05: Validate, document, and prepare rollout

GitHub: #267

Labels: `documentation`, `testing`, `qa`, `operations`, `chapter`, `phase:active-piv-loop`

Complexity: Medium

Dependencies: CHINV-01, CHINV-02, CHINV-03, CHINV-04 / #263, #264, #265, #266

### Description

Validate the dedicated chapter invite system end to end and update operational documentation so the team can use the new model safely for launch.

### Acceptance Criteria

- [ ] Targeted service/action/email tests pass for the invite lifecycle.
- [ ] TypeScript and lint pass, with any existing warnings categorized.
- [ ] Browser screenshots or documented smoke checks cover chapter leader invite creation UI, recipient acceptance states, and admin protected invite UI.
- [ ] Runbooks explain the difference between `chapter_invite`, legacy `chapter_preapproval`, membership, role assignment, and permission grants.
- [ ] GitHub issues are updated with implementation and validation evidence.
