# Pilot Role And Permission Matrix

Status: Controlled rollout decision
Applies to: QA Launch Readiness Controlled Rollout

This matrix records the pilot decision for Staff/Admin boundaries and chapter leadership taxonomy. It should be used by PRDs, issues, QA validation, and implementation plans when deciding whether a route, action, or UI label is launch-ready.

## Layered Sources Of Truth

| Concept | Source of truth | Launch rule |
|---|---|---|
| Account authorization | `public.user.role` | Controls broad app lanes such as `member`, `editor`, `admin`, and `recruiter`. Do not store chapter positions here. |
| Official LEAD identity | `lead_identity` | Controls public/official LEAD status such as founder, staff, chapter member, chapter editor, or alumni. It is not the same as system authority. |
| Chapter affiliation | `chapter_membership` | Controls chapter relationship, approval status, active/alumni state, and member lifecycle. |
| Chapter responsibility | `chapter_role_assignment` | Controls official chapter leadership title and responsibility, such as president, vice president, director, or coordinator. |
| Chapter capability | `chapter_permission_grant` | Controls what a user can do inside one chapter. Permissions stay chapter-scoped. |
| Company access | `recruiter_access` plus `public.user.role = 'recruiter'` | Deferred from first launch except for safe route handling. Recruiters are not chapter members by default. |

## Pilot Role Matrix

| Role / persona | Global app role | Identity layer | Chapter layer | Pilot permissions | Explicit limits |
|---|---|---|---|---|---|
| Admin | `admin` | Optional founder/staff identity, but admin itself is not a public identity type | Admin bypass where product rules allow it | System operations across users, roles, chapters, events, companies, identities, and launch support | Admin authority must not be inferred from staff identity alone. |
| Staff | Usually `member`; may also be explicitly `admin` for central operations | `lead_identity.identity_type = 'staff'` | Optional; not required | Official staff display and support participation. Admin console access only when the account is explicitly granted admin authority or a future staff permission tier. | Staff identity alone does not grant unrestricted system authority. |
| President | Usually `member` | Usually chapter editor/member identity | Approved `chapter_membership` plus active `chapter_role_assignment.role_level = 'president'` | Full operations for own chapter in pilot: dashboard, events, registrations, check-in, applicants, approved members, regular e-board assignment when granted | Cannot administer other chapters or global system data unless also admin. Protected President/VP assignment remains central/admin controlled for launch. |
| Vice President | Usually `member` | Usually chapter editor/member identity | Approved membership plus active `vice_president` role assignment | Same operational permissions as President for the pilot unless a later leadership decision narrows scope | Same limits as President. |
| Chapter Editor | `editor` for legacy/backcompat, or `member` with explicit chapter grants | Chapter editor/member identity | Approved membership plus scoped permission grants | Content and event operations for the assigned chapter; dashboard access; registrations/check-in when granted | Not a synonym for President. Does not assign protected roles, revoke active members, or approve sensitive flows unless explicit grants allow it. |
| Regular e-board | `member` | Chapter member/editor identity as appropriate | Approved membership plus active role such as `chief_of_staff`, `director`, or `coordinator` | Scoped helper access based on grants: events, registrations, check-in, roster visibility, or area-specific work | Cannot assign roles, revoke membership, or approve/reject sensitive flows unless explicitly granted. |
| Member | `member` | Chapter member identity when approved | Optional approved membership | Profile, event registration, member dashboard, own ticket/QR, read-only official chapter context | No chapter operations without explicit chapter permission grants. |
| Public participant | `member` after signup | None required | None required | Basic onboarding and public/open event registration | Must not be forced into chapter membership. |
| Alumni | `member` unless future scope changes it | `alumni` identity where issued | `chapter_membership.status = 'alumni'` | Deferred. Keep history/status visible where safe. | No active-member-only registration or active chapter operations during first launch. |
| Company representative | `recruiter` | None required | None | Deferred. Invite-only company access remains separate. | No chapter membership, chapter operations, or member-only privileges by default. |

## Chapter Permission Keys For Pilot

The exact implementation names may evolve, but launch issues should map capabilities to explicit chapter-scoped permission grants instead of broad account roles.

| Permission key | Meaning | Launch owner |
|---|---|---|
| `chapter.dashboard.view` | Open the chapter workspace for one chapter | President, Vice President, Chapter Editor, selected e-board |
| `chapter.events.manage` | Create, edit, publish, and manage normal chapter events | President, Vice President, Chapter Editor, selected e-board |
| `chapter.events.archive` | Archive, cancel, or otherwise remove event availability | President, Vice President, Chief of Staff, Admin |
| `chapter.registrations.view` | View event registrations and participant status | President, Vice President, Chapter Editor, selected e-board |
| `chapter.checkin.manage` | Check in attendees and manage QR/ticket operational flow | President, Vice President, Chapter Editor, selected e-board |
| `chapter.members.view` | View approved member roster and member context | Official e-board and Admin |
| `chapter.members.view_applicants` | View pending chapter applicants | President, Vice President, Chief of Staff, Admin |
| `chapter.members.approve` | Approve or reject membership applicants | President, Vice President, Chief of Staff, Admin |
| `chapter.members.revoke` | Move active members to inactive/revoked state | President, Vice President, Admin |
| `chapter.roles.assign_eboard` | Assign regular e-board roles for own chapter | President, Vice President, Admin |
| `chapter.roles.assign_protected` | Assign President or Vice President | Admin only for launch |

## Product Decisions

- Staff and Admin are different concepts.
- Admin is system authority; Staff is official LEAD identity/support status.
- Staff can receive admin access only through an explicit app role or future scoped staff permission tier.
- President and Vice President are chapter leadership authorities for their own chapter in the pilot.
- Chapter Editor is an operator role, not automatically chapter leadership authority.
- Regular e-board roles are scoped helpers unless grants explicitly expand their authority.
- Alumni and company representative workflows remain deferred from first launch.
