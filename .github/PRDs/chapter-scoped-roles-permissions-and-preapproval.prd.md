# PRD: Chapter-Scoped Roles, Permissions, and Preapproval

## 1. Executive Summary

LEAD Talent Platform needs to activate real chapter leadership without flattening the organization into a single global `editor` role. Chapter presidents, vice presidents, and official e-board members need access to chapter operations, while regular members, admins, and company representatives must keep clear and separate account behavior.

The current model already separates global account role, chapter membership, official LEAD identity, and company access. The next step is to add a chapter-scoped operating layer:

- `chapter_preapproval` for email-based activation of verified members and e-board.
- `chapter_role_assignment` for official chapter responsibilities and display titles.
- `chapter_permission_grant` for actual chapter dashboard capabilities.
- `chapter_audit_log` for sensitive membership, role, and permission changes.

This PRD replaces the old "chapter leader equals editor" approach with a more sustainable model. Global roles remain simple. Chapter access becomes scoped to a chapter and derived from verified e-board assignments.

MVP goal: let central/admin preapprove chapter members and e-board, let presidents/VPs manage regular e-board assignments after training, and enforce chapter dashboard actions through explicit permissions rather than `user.role = 'editor'`.

## 2. Mission

Build a durable chapter operating model for LEAD that gives chapters autonomy, keeps membership meaningful, and prepares the platform for LEAD Spark, Impact Metrics, LEAD Pulse, LEAD Funding, and future recognition workflows.

Core principles:

- `public.user.role` is a broad global app role, not a chapter title.
- Chapter membership says whether a person belongs to a chapter.
- Chapter role assignment says what responsibility/title the person has.
- Chapter permission grants say what the person can do in the product.
- Recruiter/company access stays separate from chapter permissions.
- Admin access stays global and explicit.
- Most e-board users should remain global `member` accounts.
- The legacy `editor` role should not be the long-term chapter access primitive.
- All sensitive access changes must be auditable.

## 3. Target Users

### Abigail / Platform Admin

Needs:

- Import or insert preapproved chapter member and e-board lists.
- Correct bad chapter, role, or permission mappings.
- Avoid granting global admin access to chapter leaders.
- Train presidents and VPs on the platform with safe defaults.
- Explain the model clearly to founders and operations stakeholders.

### Christopher / Chapter Operations

Needs:

- Collect president, VP, e-board, and member lists from chapter leaders.
- Help verify which people belong to which chapters.
- Escalate wrong chapter, missing member, or incorrect role cases.
- Support chapter leader rollout and training.

### Chapter President / Vice President

Needs:

- Create an account with a preapproved email.
- Complete onboarding/profile.
- Land in the chapter dashboard.
- View approved members, alumni, and contact info.
- Manage pending applicants and rejected/inactive member states.
- Assign regular e-board roles to approved chapter members.
- Create, edit, publish, and archive/cancel chapter events.

### Official Chapter E-board Member

Needs:

- Create an account with a preapproved email or be assigned after approval.
- Complete onboarding/profile.
- Access the chapter dashboard.
- View approved member and alumni information.
- Create, edit, publish, and operate chapter events.
- See event registrations and check people in.
- Avoid seeing sensitive applicant/rejected/inactive member workflows unless granted.

### Regular Member / Applicant

Needs:

- Sign up normally or via a preapproved member invitation.
- Complete onboarding/profile.
- Become approved if their email is on a verified member list.
- Otherwise apply to a chapter and wait for leadership approval.
- Use student/member dashboard by default.
- Keep ownership of personal profile data.

### Admin / Founder / Staff

Needs:

- Keep global admin access separate from LEAD public identity.
- Review chapter activation quality.
- Maintain override authority for president/VP assignment.
- See audit evidence for sensitive operations.

### Company Representative / Recruiter

Needs:

- Continue using invite-only company access.
- Remain authorized by `user.role = 'recruiter'` plus active `recruiter_access`.
- Avoid any dependency on chapter membership or chapter permissions.

## 4. MVP Scope

### In Scope

- [ ] Add `chapter_preapproval` for member and e-board activation.
- [ ] Add `chapter_role_assignment` for structured e-board roles.
- [ ] Add `chapter_permission_grant` for chapter-scoped capabilities.
- [ ] Add `chapter_audit_log` for role, permission, membership, and preapproval events.
- [ ] Keep `admin`, `member`, and `recruiter` as global roles.
- [ ] Treat `editor` as legacy/backcompat during migration.
- [ ] Stop requiring `user.role = 'editor'` for chapter dashboard access.
- [ ] Keep regular e-board users as `user.role = 'member'`.
- [ ] Support central/admin preapproval of full member and e-board lists.
- [ ] Require basic onboarding/profile before dashboard access is usable.
- [ ] Auto-approve preapproved regular members after signup/profile completion.
- [ ] Auto-create role assignments and permission grants for preapproved e-board.
- [ ] Let president/VP assign regular e-board roles to approved members.
- [ ] Prevent president/VP from assigning president or vice president roles.
- [ ] Let all official e-board view approved members, alumni, and full approved member info.
- [ ] Restrict pending, rejected, and inactive/removed member visibility to president/VP/chief of staff/admin.
- [ ] Let all official e-board create, edit, publish, view registrations, and check in attendees for chapter events.
- [ ] Restrict event archive/cancel/delete to president/VP/chief of staff/admin.
- [ ] Restrict applicant approval/rejection to president/VP/chief of staff/admin.
- [ ] Restrict active member revocation to president/VP/admin with reason and audit.
- [ ] Revoke e-board permissions when e-board role assignment is deactivated.
- [ ] Use existing `membership_status = 'inactive'` for removed/not-active members unless the real DB requires a new status.
- [ ] Add service-layer tests for role templates, grants, preapproval claim, and permission checks.
- [ ] Update Product Spec/ADR to supersede the simple `user.role = editor` chapter access model.

### Out of Scope

- [ ] Full event-scoped permissions.
- [ ] LEAD Funding UI or approval workflow.
- [ ] LEAD Pulse implementation.
- [ ] Impact Metrics dashboards.
- [ ] Public e-board directory redesign.
- [ ] Automated email delivery from the preapproval table.
- [ ] Self-service reactivation or appeal flow for inactive/removed members.
- [ ] Company permission granularity beyond existing `recruiter_access`.
- [ ] Full custom permission toggle UI for presidents/VPs.
- [ ] Multiple active primary e-board roles per person.
- [ ] Allowing president/VP to assign or remove president/VP status.

## 5. User Stories

1. As Abigail, I want to preapprove chapter members and e-board by email, so that verified people can create their own accounts without manual approval bottlenecks.

2. As a chapter president, I want to complete onboarding and land in the chapter dashboard, so that I can start operating my chapter.

3. As a chapter vice president, I want the same launch access as the president, so that chapter activation is not blocked by one person.

4. As a president or VP, I want to assign approved members to e-board roles using structured fields, so that our chapter roster reflects real responsibilities without losing clean reporting data.

5. As an official e-board member, I want to see approved members and alumni, create events, see registrations, and check people in, so that I can help operate the chapter.

6. As a president, VP, or chief of staff, I want to approve/reject applicants and see sensitive applicant states, so that membership decisions remain controlled.

7. As a regular member, I want to own my personal profile and avoid chapter leaders editing my personal data, so that my information remains accurate and controlled by me.

8. As an admin, I want global roles, chapter permissions, and company access to stay separate, so that the platform can scale without accidental over-permissioning.

## 6. Core Architecture

### Current Model To Preserve

```text
public.user
  Auth-linked account, global app role, universal contact data.

person_profile
  Reusable basic profile for onboarding, event registration, and profile data.

chapter_membership
  Chapter application, approval status, member ID, and membership lifecycle.

lead_identity
  Official LEAD identity/status/display record.

recruiter_access
  Invite-only company access.
```

### New Chapter Operating Layer

```text
chapter_preapproval
  Email-bound activation record before or during signup.

chapter_role_assignment
  Official chapter responsibility/title for an approved member.

chapter_permission_grant
  Chapter-scoped permission keys that control dashboard actions.

chapter_audit_log
  Immutable-ish history of sensitive chapter operations.
```

### Global Role Strategy

```ts
type Role = 'member' | 'editor' | 'admin' | 'recruiter'
```

Recommended meaning after this PRD:

| Global Role | Meaning |
| --- | --- |
| `member` | Default for students, approved members, and most chapter e-board. |
| `admin` | Central/platform operator with global override. |
| `recruiter` | Company representative, still controlled by `recruiter_access`. |
| `editor` | Legacy/backcompat only until chapter code is migrated to permission grants. |

### Canonical Access Rule

Chapter dashboard/action access should use:

```text
approved chapter_membership
+ active chapter_permission_grant
+ not revoked
= allowed
```

Admin bypass remains global:

```text
user.role = 'admin' -> allowed for admin/global contexts
```

Recruiter access remains separate:

```text
user.role = 'recruiter'
+ active accepted recruiter_access
= company portal access
```

## 7. Tools / Features

### 7.1 Chapter Preapproval

Purpose: allow central/admin to load verified emails from Christopher/chapter leaders before users create accounts.

Recommended table:

```sql
chapter_preapproval (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  normalized_email text not null,
  chapter_id text not null references public.chapter(id),
  preapproval_type text not null check (preapproval_type in ('member', 'eboard')),
  role_level text null,
  functional_area text null,
  display_title text null,
  raw_title text null,
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  consumed_by_user_id uuid null references public."user"(id),
  revoked_at timestamptz null,
  revoked_by_id uuid null references public."user"(id),
  created_by_id uuid null references public."user"(id),
  source text not null default 'manual_admin',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

Required indexes:

```sql
create index idx_chapter_preapproval_normalized_email_active
  on public.chapter_preapproval(normalized_email)
  where consumed_at is null and revoked_at is null;

create unique index idx_chapter_preapproval_active_email_chapter
  on public.chapter_preapproval(normalized_email, chapter_id)
  where consumed_at is null and revoked_at is null;
```

Rules:

- Default expiration is 6 months.
- Real email data must not be committed in migrations.
- Claim only after exact normalized email match.
- A consumed preapproval is not reused for another account.
- Revoked or expired preapproval does not grant access.
- Preapproval can create approved membership.
- E-board preapproval can create role assignment and permissions.

### 7.2 Chapter Role Assignment

Purpose: represent a person's official responsibility in a chapter without overloading `chapter_membership.position`.

Recommended table:

```sql
chapter_role_assignment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public."user"(id),
  chapter_id text not null references public.chapter(id),
  role_level text not null,
  functional_area text not null,
  display_title text not null,
  raw_title text null,
  is_primary boolean not null default true,
  status text not null default 'active' check (status in ('active', 'inactive')),
  assigned_by_id uuid null references public."user"(id),
  source text not null default 'manual',
  source_preapproval_id uuid null references public.chapter_preapproval(id),
  starts_at timestamptz not null default now(),
  ends_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

Recommended role levels for MVP:

```text
president
vice_president
chief_of_staff
director
coordinator
member
```

Recommended functional areas for MVP:

```text
general_leadership
strategy_operations
marketing_communications
events_experience
finance_legal
chapter_development
academic_excellence
professional_development
leadership
women_in_stem
research
projects
partnerships_external_relations
people_talent
other
```

Rules:

- One primary active e-board assignment per user/chapter for launch.
- Multiple secondary roles can be future scope.
- President/VP assignments are admin/central controlled.
- President/VP can assign regular e-board roles only to approved members.
- Removing an e-board role deactivates permissions but keeps membership approved unless separately changed.

### 7.3 Chapter Permission Grants

Purpose: control actual product actions without encoding every decision into global role or chapter title.

Recommended table:

```sql
chapter_permission_grant (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public."user"(id),
  chapter_id text not null references public.chapter(id),
  permission_key text not null,
  source text not null check (source in ('role_template', 'manual_admin', 'preapproval', 'migration')),
  source_role_assignment_id uuid null references public.chapter_role_assignment(id),
  granted_by_id uuid null references public."user"(id),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz null,
  revoked_by_id uuid null references public."user"(id),
  revoke_reason text null,
  created_at timestamptz not null default now()
)
```

Required unique index:

```sql
create unique index idx_chapter_permission_active_unique
  on public.chapter_permission_grant(user_id, chapter_id, permission_key)
  where revoked_at is null;
```

MVP permission keys:

```text
chapter.dashboard.access
chapter.members.view_approved
chapter.members.view_alumni
chapter.members.view_member_contact
chapter.members.view_applicants
chapter.members.view_rejected
chapter.members.view_inactive
chapter.members.manage_applications
chapter.members.revoke
chapter.roles.assign_eboard
chapter.events.manage
chapter.events.view_registrations
chapter.events.check_in
chapter.events.archive
```

Future permission keys:

```text
chapter.funding.view
chapter.funding.submit
chapter.funding.review
chapter.pulse.view
chapter.pulse.manage_action_plan
chapter.impact_metrics.view
chapter.impact_metrics.edit
```

### 7.4 Role Templates

Role templates should be implemented in service code first, not necessarily as a table in MVP.

President and vice president:

```text
chapter.dashboard.access
chapter.members.view_approved
chapter.members.view_alumni
chapter.members.view_member_contact
chapter.members.view_applicants
chapter.members.view_rejected
chapter.members.view_inactive
chapter.members.manage_applications
chapter.members.revoke
chapter.roles.assign_eboard
chapter.events.manage
chapter.events.view_registrations
chapter.events.check_in
chapter.events.archive
```

Chief of staff:

```text
chapter.dashboard.access
chapter.members.view_approved
chapter.members.view_alumni
chapter.members.view_member_contact
chapter.members.view_applicants
chapter.members.view_rejected
chapter.members.view_inactive
chapter.members.manage_applications
chapter.events.manage
chapter.events.view_registrations
chapter.events.check_in
chapter.events.archive
```

Regular official e-board:

```text
chapter.dashboard.access
chapter.members.view_approved
chapter.members.view_alumni
chapter.members.view_member_contact
chapter.events.manage
chapter.events.view_registrations
chapter.events.check_in
```

### 7.5 Member Visibility And Actions

All official e-board can see:

- Approved members.
- Alumni.
- Full approved member information visible in the member page, including contact information.

President, VP, chief of staff, and admin additionally can see:

- Pending applicants.
- Rejected applicants.
- Inactive/removed members.

Only president, VP, chief of staff, and admin can:

- Approve applicants.
- Reject applicants.
- Bulk approve applicants.

Only president, VP, and admin can:

- Revoke active membership.
- Remove/deactivate regular e-board assignments.

Members own their own personal profile data. E-board should not edit another member's profile.

### 7.6 Event Permissions

All official e-board can:

- Create events.
- Edit events.
- Publish events.
- View registrations and attendee data.
- Check people in.

President, VP, chief of staff, and admin can:

- Archive/cancel/delete events, depending on final event lifecycle semantics.

For collaborative events, access must stay scoped to host/collaborator chapters.

### 7.7 Admin And Recruiter Behavior

Admin:

- Keeps `user.role = 'admin'`.
- Has global admin access and can override chapter role/permission data.
- May also have `lead_identity = founder` or `staff`.
- Does not need chapter membership.

Recruiter/company representative:

- Keeps `user.role = 'recruiter'`.
- Uses `recruiter_access` for authorization.
- Does not require `person_profile` or `chapter_membership`.
- Does not use `chapter_permission_grant`.

Regular member:

- Usually `user.role = 'member'`.
- May have approved `chapter_membership`.
- Does not access chapter dashboard unless granted e-board permissions.

Legacy editor:

- Existing `user.role = 'editor'` accounts should be backfilled into role assignments and permission grants.
- New e-board access should not require setting `user.role = 'editor'`.
- Later, chapter-only editors can be demoted to `member` once all guards use permissions.

## 8. Technology Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 App Router |
| UI Runtime | React 19 |
| Database/Auth | Supabase |
| Styling | Tailwind CSS 4 |
| UI Components | Radix UI primitives and local Shadcn-like components |
| i18n | `next-intl` with locale routing |
| Package Manager | pnpm |
| Tests | Vitest, Playwright for critical flows |
| Email | Existing email infrastructure / Resend where already used |
| Hosting | Vercel |

Existing conventions:

- Business logic in `lib/services/`.
- Thin actions in `lib/actions/`.
- Supabase clients in `lib/supabase/*`.
- Generated DB types in `lib/database.generated.ts`.
- Locale routes in `app/[locale]/*`.

## 9. Security & Configuration

### Authentication

Supabase Auth remains the source of authenticated identity.

### Authorization

Authorization must be checked in services/server actions, not only in UI rendering.

New canonical helpers:

```ts
hasChapterPermission(userId, chapterId, permissionKey)
requireChapterPermission(permissionKey)
getChapterPermissionSet(userId, chapterId)
```

Admin bypass:

```text
user.role = 'admin'
```

Company portal access:

```text
user.role = 'recruiter'
+ active accepted recruiter_access
```

### RLS

RLS helpers should move from hardcoded manager positions toward permission grants:

```sql
public.has_chapter_permission(check_chapter_id text, check_permission_key text)
```

Initial helper logic:

- Admin is allowed through existing admin helper.
- Active permission grant is required for chapter-scoped actions.
- Approved membership should be required for chapter permission to be effective.
- Recruiters do not receive chapter permissions.

### Audit Requirements

Audit records are required for:

- Preapproval created, consumed, expired, or revoked.
- Role assignment created, changed, or deactivated.
- Permission grant created or revoked.
- Applicant approved or rejected.
- Active member moved to inactive.
- Event archive/cancel/delete.

### Data Protection

- Real chapter email lists must not be committed to repo migrations.
- Use operational scripts/runbooks or admin tools for real data loads.
- Hiding buttons is not security. Server actions must enforce permissions.
- Avoid broad client-side table access for preapproval and permission tables.

## 10. API Specification

The platform should use services and server actions rather than broad public API routes.

### Services

```ts
ChapterPreapprovalService
  claimForAuthenticatedUser(userId, email)
  createPreapprovals(input)
  revokePreapproval(id, actorId)

ChapterRoleAssignmentService
  assignEboardRole(actorId, targetUserId, chapterId, input)
  deactivateEboardRole(actorId, assignmentId, reason)
  listChapterEboard(chapterId)

ChapterPermissionService
  grantFromRoleTemplate(roleAssignmentId)
  revokeForRoleAssignment(roleAssignmentId)
  hasPermission(userId, chapterId, permissionKey)
  getPermissionSet(userId, chapterId)

ChapterAuditService
  record(action, actorUserId, targetUserId, chapterId, metadata)
```

### Server Actions

```ts
claimChapterPreapproval()
assignChapterEboardRole(input)
removeChapterEboardRole(input)
approveChapterApplicant(userId)
rejectChapterApplicant(userId, reason)
moveMemberToInactive(userId, reason)
createChapterEvent(input)
updateChapterEvent(input)
publishChapterEvent(eventId)
archiveChapterEvent(eventId, reason)
checkInEventAttendee(input)
```

### Example Role Assignment Input

```json
{
  "targetUserId": "user-123",
  "chapterId": "leadpucp",
  "roleLevel": "director",
  "functionalArea": "academic_excellence",
  "displayTitle": "Directora de Excelencia Academica"
}
```

### Example Preapproval Input

```json
{
  "email": "leader@example.com",
  "chapterId": "leaduni",
  "preapprovalType": "eboard",
  "roleLevel": "director",
  "functionalArea": "events_experience",
  "displayTitle": "Coordinador de Eventos e Imagen Institucional",
  "expiresAt": "2026-11-22T00:00:00.000Z",
  "source": "christopher_chapter_list"
}
```

## 11. Success Criteria

### Functional Success

- [ ] Preapproved regular members become approved members after signup/profile completion.
- [ ] Preapproved e-board become approved members with role assignments and permissions.
- [ ] President/VP accounts land in the chapter dashboard after onboarding.
- [ ] Regular approved members land in the student/member dashboard.
- [ ] All official e-board can access the chapter dashboard.
- [ ] All official e-board can see approved members, alumni, and member contact info.
- [ ] Only president/VP/chief of staff/admin can see pending, rejected, and inactive member states.
- [ ] Only president/VP/chief of staff/admin can approve/reject applicants.
- [ ] Only president/VP/admin can revoke active membership.
- [ ] Only president/VP can assign regular e-board roles.
- [ ] Only admin/central can assign president/VP.
- [ ] All official e-board can create, edit, publish, view registrations, and check in attendees for chapter events.
- [ ] Event archive/cancel/delete is restricted.
- [ ] Recruiter/company access remains unchanged and does not depend on chapter tables.
- [ ] Admin access remains global and explicit.

### Technical Success

- [ ] No new chapter feature depends on `student_profile`.
- [ ] No new e-board assignment requires `user.role = 'editor'`.
- [ ] Current editor users are backfilled into the new permission model.
- [ ] Generated database types are updated.
- [ ] Service-layer tests cover permission templates and boundaries.
- [ ] Server actions enforce permissions even when UI buttons are hidden.
- [ ] RLS helpers align with service-level permission checks.
- [ ] Audit log records sensitive transitions.

### Operational Success

- [ ] Christopher/chapter leader lists can be loaded safely.
- [ ] Chapter training can explain the model in simple language.
- [ ] Founders can see how this supports LEAD as an operating system.
- [ ] Incorrect role/chapter access can be corrected without global role hacks.

## 12. Implementation Phases

### Phase 1: Product Spec And Permission Model Alignment

Deliverables:

- [ ] Update Product Spec language so chapter access is not described as only `user.role = editor`.
- [ ] Add ADR for chapter-scoped role assignments and permission grants.
- [ ] Confirm permission keys and role templates.
- [ ] Confirm `inactive` is the correct membership status for removed/not-active members.

Validation:

- [ ] Docs use consistent vocabulary.
- [ ] No unresolved contradiction between Product Spec, handbook, and PRD.

### Phase 2: Database Foundation

Deliverables:

- [ ] Add `chapter_preapproval` migration.
- [ ] Add `chapter_role_assignment` migration.
- [ ] Add `chapter_permission_grant` migration.
- [ ] Add `chapter_audit_log` migration.
- [ ] Add indexes, constraints, and RLS helpers.
- [ ] Regenerate `lib/database.generated.ts`.

Validation:

- [ ] Migration runs locally.
- [ ] Constraints prevent duplicate active preapprovals and duplicate active permission grants.
- [ ] RLS policies do not grant broad access accidentally.

### Phase 3: Services And Backfill

Deliverables:

- [ ] Build preapproval claim service.
- [ ] Build role assignment service.
- [ ] Build permission service.
- [ ] Build audit service.
- [ ] Backfill existing chapter `editor` users into assignments and grants.
- [ ] Stop `assignEditor` from overwriting real chapter position.

Validation:

- [ ] Existing editor flows still work.
- [ ] New permission flows work for member-role e-board.
- [ ] Tests cover old editor compatibility and new grant behavior.

### Phase 4: Auth, Routing, And UI Gating

Deliverables:

- [ ] Update auth redirects to use chapter permission grants.
- [ ] Update chapter layout route guard.
- [ ] Update members page visibility and action buttons.
- [ ] Update event action guards.
- [ ] Add president/VP e-board assignment UI.
- [ ] Add admin override/admin correction path where needed.

Validation:

- [ ] Playwright validates president, VP, e-board, regular member, admin, and recruiter paths.
- [ ] Hidden buttons match actual server authorization.
- [ ] Mobile chapter dashboard remains usable.

### Phase 5: Activation Runbook And Training

Deliverables:

- [ ] Document import/preapproval runbook.
- [ ] Document chapter leader training flow.
- [ ] Document support/rollback cases for wrong chapter, wrong role, missing member, and extra access.
- [ ] Prepare founder-facing summary.

Validation:

- [ ] One chapter can be activated end to end in local/staging.
- [ ] President/VP can verify e-board roster.
- [ ] Regular member and e-board account creation flows are clear.

## 13. Future Considerations

- Event-scoped permissions for event owners, check-in volunteers, and collaborators.
- LEAD Funding permissions for treasurer, president, VP, and central reviewers.
- LEAD Pulse permissions for anonymous survey insights and action-plan management.
- Impact Metrics permissions for editing chapter reflections and reviewing evidence.
- Role template table if templates need admin configuration.
- Multi-role assignments when chapters need secondary responsibilities.
- Public chapter leadership directory based on verified role assignments.
- Recognition and LEAD GALA eligibility based on activity, role, impact, and Pulse data.
- Company permission grants if recruiters need tiered access beyond `recruiter_access`.

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Overbuilding delays launch | High | Keep permission keys simple, implement role templates in service code first, defer custom toggles. |
| E-board receives too much sensitive access | High | Split dashboard access from applicant, inactive, revoke, and role-assignment permissions. |
| Existing editor flows break | High | Backfill current editors and keep legacy `editor` compatibility during migration. |
| Recruiter/company access gets mixed with chapter permissions | High | Keep `recruiter_access` separate and exclude recruiters from chapter grants. |
| Global `admin` is accidentally granted to chapter leaders | High | Never grant admin from chapter/e-board imports; admin remains central only. |
| Real emails leak into repo | High | Migrations create schema only; operational imports happen outside committed files. |
| RLS and service checks drift | High | Create shared permission helpers and targeted tests for RLS/service alignment. |
| Presidents/VPs accidentally remove too many members | Medium | Require reason, confirmation, audit log, and restrict revoke to president/VP/admin. |
| Role taxonomy becomes too rigid | Medium | Store `display_title` and `raw_title` alongside normalized `role_level` and `functional_area`. |
| Training becomes confusing | Medium | Explain "membership, role, permission" with simple UI labels and chapter leader training. |

## Appendix: Recommended Launch Permission Matrix

| Capability | President | VP | Chief of Staff | Other E-board | Regular Member | Admin | Recruiter |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Chapter dashboard access | Yes | Yes | Yes | Yes | No | Global | No |
| View approved members/contact | Yes | Yes | Yes | Yes | No | Global | No |
| View alumni | Yes | Yes | Yes | Yes | No | Global | No |
| View pending applicants | Yes | Yes | Yes | No | No | Global | No |
| View rejected/inactive | Yes | Yes | Yes | No | No | Global | No |
| Approve/reject applicants | Yes | Yes | Yes | No | No | Global | No |
| Revoke active membership | Yes | Yes | No | No | No | Global | No |
| Assign regular e-board | Yes | Yes | No | No | No | Global | No |
| Assign president/VP | No | No | No | No | No | Global only | No |
| Create/edit/publish events | Yes | Yes | Yes | Yes | No | Global | No |
| View registrations | Yes | Yes | Yes | Yes | No | Global | No |
| Check in attendees | Yes | Yes | Yes | Yes | No | Global | No |
| Archive/cancel/delete events | Yes | Yes | Yes | No | No | Global | No |
| Company portal access | No | No | No | No | No | Admin only if built | Yes with `recruiter_access` |

