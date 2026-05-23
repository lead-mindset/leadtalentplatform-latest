# Chapter-Scoped Roles, Permissions, and Preapproval Issues

Source PRD: `.github/PRDs/chapter-scoped-roles-permissions-and-preapproval.prd.md`

GitHub integration status: created with `gh` CLI on branch `codex/chapter-scoped-roles-permissions`.

## Created GitHub Issues

| Local Issue | GitHub Issue | Title | URL |
| --- | --- | --- | --- |
| 1 | #193 | Align product spec and ADR with chapter-scoped permissions | https://github.com/lead-mindset/leadtalentplatform-latest/issues/193 |
| 2 | #194 | Add chapter preapproval database foundation | https://github.com/lead-mindset/leadtalentplatform-latest/issues/194 |
| 3 | #195 | Add chapter role assignment and permission grant schema | https://github.com/lead-mindset/leadtalentplatform-latest/issues/195 |
| 4 | #196 | Add chapter audit log, permission RLS helper, and generated types | https://github.com/lead-mindset/leadtalentplatform-latest/issues/196 |
| 5 | #197 | Implement chapter permission templates and service layer | https://github.com/lead-mindset/leadtalentplatform-latest/issues/197 |
| 6 | #198 | Implement preapproval claim and activation flow | https://github.com/lead-mindset/leadtalentplatform-latest/issues/198 |
| 7 | #199 | Implement chapter role assignment service rules | https://github.com/lead-mindset/leadtalentplatform-latest/issues/199 |
| 8 | #200 | Backfill legacy editor access and stop overwriting membership position | https://github.com/lead-mindset/leadtalentplatform-latest/issues/200 |
| 9 | #201 | Update auth redirects and chapter route access to permission grants | https://github.com/lead-mindset/leadtalentplatform-latest/issues/201 |
| 10 | #202 | Update member roster visibility and action authorization | https://github.com/lead-mindset/leadtalentplatform-latest/issues/202 |
| 11 | #203 | Update chapter event permission enforcement | https://github.com/lead-mindset/leadtalentplatform-latest/issues/203 |
| 12 | #204 | Build president/VP e-board assignment and admin correction UI | https://github.com/lead-mindset/leadtalentplatform-latest/issues/204 |
| 13 | #205 | Add focused permission regression coverage and Playwright validation | https://github.com/lead-mindset/leadtalentplatform-latest/issues/205 |
| 14 | #206 | Document activation runbook, training flow, and founder summary | https://github.com/lead-mindset/leadtalentplatform-latest/issues/206 |

## Proposed GitHub Issues

| Issue | Title | Type | Priority | Complexity | Dependencies |
| --- | --- | --- | --- | --- | --- |
| 1 | Align product spec and ADR with chapter-scoped permissions | Technical / Documentation | High | Small | None |
| 2 | Add chapter preapproval database foundation | Feature / Database | High | Medium | Issue 1 |
| 3 | Add chapter role assignment and permission grant schema | Feature / Database | High | Medium | Issue 1 |
| 4 | Add chapter audit log, permission RLS helper, and generated types | Technical / Database | High | Medium | Issues 2-3 |
| 5 | Implement chapter permission templates and service layer | Feature / Backend | High | Medium | Issues 3-4 |
| 6 | Implement preapproval claim and activation flow | Feature / Backend | High | Medium | Issues 2, 5 |
| 7 | Implement chapter role assignment service rules | Feature / Backend | High | Medium | Issues 3, 5 |
| 8 | Backfill legacy editor access and stop overwriting membership position | Technical / Migration | High | Medium | Issues 5, 7 |
| 9 | Update auth redirects and chapter route access to permission grants | Feature / Auth | High | Medium | Issues 5-8 |
| 10 | Update member roster visibility and action authorization | Feature / Frontend + Backend | High | Medium | Issues 7, 9 |
| 11 | Update chapter event permission enforcement | Feature / Backend | High | Medium | Issue 9 |
| 12 | Build president/VP e-board assignment and admin correction UI | Feature / Frontend | Medium | Medium | Issues 7, 10 |
| 13 | Add focused permission regression coverage and Playwright validation | Technical / Testing | High | Medium | Issues 9-12 |
| 14 | Document activation runbook, training flow, and founder summary | Documentation / Operations | Medium | Small | Issues 6-7, 12 |

## Issue 1: Align product spec and ADR with chapter-scoped permissions

Type: Technical / Documentation
Priority: High
Complexity: Small
Labels: `LEAD`, `architecture`, `documentation`, `permissions`, `chapter`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: None

### Description

Update the canonical product and architecture documentation so chapter access is no longer described as a simple `user.role = editor` model. This creates the written source of truth for membership, role assignment, permission grants, recruiter separation, and admin bypass before schema or service work begins.

### Acceptance Criteria

- [ ] Given `docs/PRODUCT-SPECIFICATION.md` is reviewed, when chapter access is described, then it references chapter-scoped permissions rather than only `user.role = editor`.
- [ ] Given an ADR is added or updated, when engineers read it, then it clearly separates `chapter_membership`, `chapter_role_assignment`, `chapter_permission_grant`, `lead_identity`, and `recruiter_access`.
- [ ] Given the permission model is documented, when MVP role templates are reviewed, then president, vice president, chief of staff, regular e-board, admin, member, and recruiter behavior are unambiguous.
- [ ] Given membership removal is documented, when the real DB status options are checked, then `inactive` is confirmed or a required migration is explicitly planned.
- [ ] Given docs are complete, when PRD, Product Spec, handbook, and ADR are compared, then there is no unresolved contradiction about chapter dashboard access.

### Implementation Notes

- Likely files: `docs/PRODUCT-SPECIFICATION.md`, `docs/adr/*`, `docs/handbook/*` where chapter access is described.
- Keep the docs concise and operational. The useful mental model is: membership says who belongs, role says what responsibility they hold, permission says what they can do.
- Do not add implementation code in this issue.

## Issue 2: Add chapter preapproval database foundation

Type: Feature / Database
Priority: High
Complexity: Medium
Labels: `LEAD`, `database`, `supabase`, `chapter`, `preapproval`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issue 1

### Description

Add the `chapter_preapproval` table so verified members and chapter e-board can be preapproved by email before creating accounts. This supports Christopher's chapter leader list workflow while keeping real email data out of committed migrations.

### Acceptance Criteria

- [ ] Given migrations run locally, when the schema is inspected, then `chapter_preapproval` exists with email, normalized email, chapter, preapproval type, optional role fields, expiration, consumption, revocation, creator, source, notes, and timestamps.
- [ ] Given active preapprovals exist, when duplicate active records are inserted for the same normalized email and chapter, then the database rejects the duplicate.
- [ ] Given a preapproval is expired, consumed, or revoked, when lookup queries run, then it is excluded from active claim paths.
- [ ] Given migrations are reviewed, when committed files are inspected, then no real chapter email list is present.
- [ ] Given client access is considered, when RLS/policies are reviewed, then broad unauthenticated or ordinary member reads of preapproval records are not allowed.

### Implementation Notes

- Likely files: `supabase/migrations/*`, possibly seed/test fixtures with fake emails only.
- Include indexes for active normalized email lookup and active email plus chapter uniqueness.
- Default expiration should support the 6 month launch decision.

## Issue 3: Add chapter role assignment and permission grant schema

Type: Feature / Database
Priority: High
Complexity: Medium
Labels: `LEAD`, `database`, `supabase`, `chapter`, `permissions`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issue 1

### Description

Add the database structures that separate official chapter responsibility from product access. `chapter_role_assignment` stores the person's chapter responsibility/title, while `chapter_permission_grant` stores the chapter-scoped actions they can perform.

### Acceptance Criteria

- [ ] Given migrations run locally, when the schema is inspected, then `chapter_role_assignment` exists with user, chapter, role level, functional area, display title, raw title, primary flag, status, assignment metadata, and timestamps.
- [ ] Given migrations run locally, when the schema is inspected, then `chapter_permission_grant` exists with user, chapter, permission key, source, source assignment, grant/revoke metadata, and timestamps.
- [ ] Given an active primary role already exists for a user/chapter, when another active primary role is inserted, then the database prevents duplicate primary assignments for launch scope.
- [ ] Given an active permission grant already exists, when the same user/chapter/permission is granted again, then the database prevents duplicate active grants.
- [ ] Given foreign keys are inspected, when role assignments and grants reference users and chapters, then they align with current table names and generated type conventions.

### Implementation Notes

- Likely files: `supabase/migrations/*`.
- Do not model `pillar_lead` as a global app role. Use `role_level`, `functional_area`, `display_title`, and optional `raw_title`.
- Recommended MVP role levels: `president`, `vice_president`, `chief_of_staff`, `director`, `coordinator`, `member`.
- Recommended MVP functional areas include operations, marketing, events, finance/legal, chapter development, academic excellence, professional development, leadership, women in STEM, research, projects, partnerships, people/talent, and other.

## Issue 4: Add chapter audit log, permission RLS helper, and generated types

Type: Technical / Database
Priority: High
Complexity: Medium
Labels: `LEAD`, `database`, `supabase`, `rls`, `security`, `permissions`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issues 2-3

### Description

Add audit and database authorization foundations for the new chapter operating model. Sensitive chapter operations should leave an audit trail, and RLS helpers should move toward permission grants instead of hardcoded editor/member-position checks.

### Acceptance Criteria

- [ ] Given migrations run locally, when the schema is inspected, then `chapter_audit_log` exists and can record actor, target, chapter, action, metadata, and timestamps for sensitive operations.
- [ ] Given `public.has_chapter_permission(check_chapter_id, check_permission_key)` is called, when the user has active approved membership and an active grant, then the helper returns allowed.
- [ ] Given an admin calls the helper, when admin bypass applies, then the helper allows access without requiring chapter membership.
- [ ] Given a recruiter or regular member has no chapter grant, when the helper runs, then access is denied.
- [ ] Given all new migrations run, when Supabase types are regenerated, then `lib/database.generated.ts` includes the new tables, enums/check-backed string fields, and relationships.

### Implementation Notes

- Likely files: `supabase/migrations/*`, `lib/database.generated.ts`.
- Keep service-level checks and RLS aligned. Hiding UI buttons is not authorization.
- Audit events should cover preapproval create/consume/revoke, role assignment create/change/deactivate, grant/revoke, applicant approve/reject, active member moved inactive, and event archive/cancel/delete.

## Issue 5: Implement chapter permission templates and service layer

Type: Feature / Backend
Priority: High
Complexity: Medium
Labels: `LEAD`, `backend`, `services`, `permissions`, `chapter`, `testing`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issues 3-4

### Description

Create the service-layer permission API and launch role templates. This becomes the canonical backend path for checking, granting, listing, and revoking chapter permissions.

### Acceptance Criteria

- [ ] Given the service layer is used, when a caller checks `hasPermission(userId, chapterId, permissionKey)`, then active grants and admin bypass are handled consistently.
- [ ] Given president or vice president role templates are applied, when grants are created, then they include dashboard, member, applicant, revoke, e-board assignment, event management, registration, check-in, and archive permissions.
- [ ] Given chief of staff role templates are applied, when grants are created, then they include applicant/event archive permissions but not active member revoke or regular e-board assignment unless explicitly allowed later.
- [ ] Given regular e-board role templates are applied, when grants are created, then they include dashboard, approved/alumni/contact member view, event management, registration view, and check-in.
- [ ] Given tests run, when permission templates and grant/revoke flows are covered, then role boundaries are verified without relying on `user.role = editor`.

### Implementation Notes

- Likely files: `lib/services/chapter-permission.service.ts`, `lib/services/__tests__/*`.
- Keep templates in service code for MVP instead of adding a configurable role-template table.
- Add helpers such as `hasChapterPermission`, `requireChapterPermission`, and `getChapterPermissionSet`.

## Issue 6: Implement preapproval claim and activation flow

Type: Feature / Backend
Priority: High
Complexity: Medium
Labels: `LEAD`, `backend`, `services`, `onboarding`, `chapter`, `preapproval`, `testing`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issues 2, 5

### Description

Implement the flow that lets a user sign up with a preapproved email and become an approved member or e-board member after profile/onboarding completion. This is the core activation path for chapter leader training.

### Acceptance Criteria

- [ ] Given a user signs up with an exact normalized preapproved member email, when they complete required profile/onboarding steps, then an approved `chapter_membership` is created or updated.
- [ ] Given a user signs up with an exact normalized preapproved e-board email, when activation runs, then approved membership, active role assignment, and role-template permission grants are created.
- [ ] Given a preapproval is expired, revoked, already consumed, or email-mismatched, when claim runs, then no membership or grants are created.
- [ ] Given claim runs more than once for the same user, when records already exist, then the operation is idempotent and does not duplicate active grants or assignments.
- [ ] Given service/action tests run, when member and e-board activation cases are covered, then email normalization, expiration, consumption, and permission grant behavior are verified.

### Implementation Notes

- Likely files: `lib/services/chapter-preapproval.service.ts`, onboarding/profile completion actions, service tests.
- Use service-layer orchestration. Server actions should stay thin: auth, validation, service call, revalidation/redirect.
- Real preapproval imports should remain operational scripts or admin actions, not committed seed data with real emails.

## Issue 7: Implement chapter role assignment service rules

Type: Feature / Backend
Priority: High
Complexity: Medium
Labels: `LEAD`, `backend`, `services`, `chapter`, `permissions`, `testing`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issues 3, 5

### Description

Create the service that manages official e-board role assignments. It should enforce LEAD's launch rules: admin controls president/VP assignment, president/VP can assign regular e-board roles to approved members, and role removal revokes permissions without removing membership.

### Acceptance Criteria

- [ ] Given an admin assigns president or vice president, when the service runs, then role assignment and permission grants are created for the target chapter.
- [ ] Given a president or vice president assigns a regular e-board role, when the target user is an approved member of the same chapter, then role assignment and permission grants are created.
- [ ] Given a president or vice president attempts to assign president or vice president status, when the service runs, then the operation is rejected.
- [ ] Given a regular e-board assignment is deactivated, when the service completes, then linked e-board permissions are revoked but approved membership remains unchanged.
- [ ] Given tests run, when assignment, rejection, deactivation, one-primary-role, and cross-chapter boundaries are covered, then the rules match the PRD.

### Implementation Notes

- Likely files: `lib/services/chapter-role-assignment.service.ts`, `lib/services/chapter-audit.service.ts`, related tests.
- Store `display_title` for human readability and normalized `role_level` / `functional_area` for reporting.
- President/VP cannot assign or remove president/VP status in launch scope.

## Issue 8: Backfill legacy editor access and stop overwriting membership position

Type: Technical / Migration
Priority: High
Complexity: Medium
Labels: `LEAD`, `migration`, `backend`, `admin`, `permissions`, `chapter`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issues 5, 7

### Description

Migrate existing chapter `editor` access into the new role/permission model while preserving compatibility. Also stop admin/editor assignment code from overwriting real `chapter_membership.position`, because position should not be the durable permission primitive.

### Acceptance Criteria

- [ ] Given existing approved chapter users with `user.role = editor` are backfilled, when migration/backfill completes, then they have appropriate role assignments and permission grants for their chapter.
- [ ] Given `assignEditor` or equivalent admin logic is used, when assigning chapter access, then it no longer overwrites a user's real `chapter_membership.position` as the source of truth.
- [ ] Given legacy editor users access existing flows during migration, when they navigate chapter routes, then they continue to work through compatibility logic or grants.
- [ ] Given backfill is rerun, when records already exist, then duplicate active assignments or grants are not created.
- [ ] Given tests or dry-run validation run, when legacy and new models are compared, then no current chapter operator loses access unexpectedly.

### Implementation Notes

- Likely files: `lib/services/admin.service.ts`, migrations or operational backfill scripts, `lib/auth.ts`, related tests.
- Keep `user.role = editor` as backcompat only. New chapter e-board access should be granted through chapter permissions.
- Avoid broad global role changes for chapter leaders.

## Issue 9: Update auth redirects and chapter route access to permission grants

Type: Feature / Auth
Priority: High
Complexity: Medium
Labels: `LEAD`, `auth`, `backend`, `chapter`, `permissions`, `routing`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issues 5-8

### Description

Update auth and route guards so chapter dashboard access is based on approved membership plus `chapter.dashboard.access`, with admin bypass and recruiter separation preserved. Presidents, VPs, and regular e-board should land in chapter operations; approved regular members should not.

### Acceptance Criteria

- [ ] Given an approved e-board user with `chapter.dashboard.access` signs in, when redirects resolve, then they can land in the chapter dashboard even if `user.role = member`.
- [ ] Given an approved regular member without dashboard permission signs in, when redirects resolve, then they land in the student/member dashboard instead of chapter operations.
- [ ] Given a president or vice president is preapproved and activated, when onboarding completes, then their next route is the chapter dashboard.
- [ ] Given an admin signs in, when admin bypass is used, then global admin access remains explicit and unaffected.
- [ ] Given a recruiter signs in, when company portal access is checked, then authorization still depends on `user.role = recruiter` plus active `recruiter_access`, not chapter permissions.

### Implementation Notes

- Likely files: `lib/auth.ts`, `app/[locale]/chapter/layout.tsx`, route redirect helpers, tests.
- Replace or wrap `requireChapterEditor`/`canUserAccessChapter` style checks with permission-aware helpers.
- Preserve locale routing conventions under `app/[locale]/*`.

## Issue 10: Update member roster visibility and action authorization

Type: Feature / Frontend + Backend
Priority: High
Complexity: Medium
Labels: `LEAD`, `frontend`, `backend`, `members`, `chapter`, `permissions`, `testing`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issues 7, 9

### Description

Update the chapter members page and actions so every official e-board member can see approved members, alumni, and contact info, while sensitive applicant and inactive/rejected workflows stay limited to president, VP, chief of staff, and admin.

### Acceptance Criteria

- [ ] Given a regular official e-board user opens the members page, when data loads, then approved members, alumni, and approved member contact info are visible.
- [ ] Given a regular official e-board user opens the members page, when pending, rejected, or inactive member states exist, then those states and actions are not visible or executable.
- [ ] Given a president, VP, chief of staff, or admin opens the members page, when pending applicants exist, then they can view and approve/reject them.
- [ ] Given a president, VP, or admin revokes active membership, when the action completes, then a reason is required, membership moves to the correct inactive/not-active state, and an audit record is created.
- [ ] Given buttons are hidden in the UI, when server actions are called directly without permission, then the backend rejects unauthorized approve, reject, revoke, and sensitive list operations.

### Implementation Notes

- Likely files: `app/[locale]/chapter/members/*`, `lib/actions/chapter/check-students.ts`, `lib/services/chapter-membership.service.ts`, member card/table components.
- The current UI renders some buttons based on member state; update it to consider viewer permissions.
- Members own personal profile data. E-board should not edit another member's profile.

## Issue 11: Update chapter event permission enforcement

Type: Feature / Backend
Priority: High
Complexity: Medium
Labels: `LEAD`, `backend`, `events`, `chapter`, `permissions`, `testing`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issue 9

### Description

Update chapter event operations to use explicit permission keys. All official e-board can create/edit/publish events, view registrations, and check people in, while archive/cancel/delete remains restricted to higher-trust chapter roles and admin.

### Acceptance Criteria

- [ ] Given an official e-board user has `chapter.events.manage`, when they create, edit, or publish a chapter event, then the server action allows the operation for their chapter.
- [ ] Given an official e-board user has `chapter.events.view_registrations`, when they open registrations or attendee data, then access is allowed for authorized chapter events.
- [ ] Given an official e-board user has `chapter.events.check_in`, when they check in an attendee, then access is allowed for authorized chapter events.
- [ ] Given a user lacks `chapter.events.archive`, when they attempt archive/cancel/delete, then the server action rejects the operation even if the UI is manipulated.
- [ ] Given a collaborative event has host or collaborator chapters, when access is checked, then authorization is scoped to the relevant chapter relationship and does not leak cross-chapter access.

### Implementation Notes

- Likely files: `lib/actions/chapter/events*`, `lib/services/event.service.ts`, `lib/auth.ts`, registration/check-in components and tests.
- Use existing event lifecycle semantics. Do not build full event-scoped permissions in this issue.
- Include audit records for archive/cancel/delete.

## Issue 12: Build president/VP e-board assignment and admin correction UI

Type: Feature / Frontend
Priority: Medium
Complexity: Medium
Labels: `LEAD`, `frontend`, `admin`, `chapter`, `permissions`, `ui`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issues 7, 10

### Description

Add the launch UI for managing regular e-board assignments. Presidents and VPs should be able to assign approved members into regular e-board roles, while admin retains the correction path for president/VP and broken mappings.

### Acceptance Criteria

- [ ] Given a president or VP opens the chapter roster, when they select an approved member, then they can assign a regular e-board role level, functional area, and display title.
- [ ] Given a president or VP tries to assign president or vice president status, when the form is submitted, then the UI and server action reject it.
- [ ] Given an admin opens the correction path, when they assign or correct president/VP or chapter mappings, then the action is available with audit logging.
- [ ] Given an e-board assignment is removed, when the operation completes, then role assignment is deactivated and permissions are revoked while membership remains approved.
- [ ] Given the UI renders on mobile and desktop, when empty, loading, error, and success states appear, then they are clear and do not overflow.

### Implementation Notes

- Likely files: chapter member roster components, admin user detail or chapter management components, `lib/actions/chapter/*`, messages.
- Keep launch UI structured around the normalized taxonomy and `display_title`.
- Follow the service layer pattern. UI calls thin actions; actions call services.

## Issue 13: Add focused permission regression coverage and Playwright validation

Type: Technical / Testing
Priority: High
Complexity: Medium
Labels: `LEAD`, `testing`, `playwright`, `auth`, `permissions`, `chapter`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issues 9-12

### Description

Add a focused validation pass that proves the new permission model works end to end and does not break admin or recruiter behavior. This should cover service logic, server action authorization, and representative browser flows.

### Acceptance Criteria

- [ ] Given Vitest runs, when permission templates, preapproval claim, role assignment, grant revoke, and legacy editor compatibility are tested, then all tests pass.
- [ ] Given server action tests run, when unauthorized users call member and event actions directly, then sensitive operations are rejected.
- [ ] Given Playwright runs against seeded personas, when president, VP, regular e-board, approved member, admin, and recruiter paths are exercised, then each persona reaches only the expected dashboard/actions.
- [ ] Given mobile and desktop screenshots are reviewed, when chapter roster and e-board assignment UI render, then there is no obvious overflow, overlap, or broken state.
- [ ] Given final validation runs, when `pnpm lint`, `pnpm test`, and a build/typecheck command are executed, then passing output or documented blockers are attached.

### Implementation Notes

- Likely files: `lib/services/__tests__/*`, action tests, `tests/e2e/*`, Playwright config/fixtures if present.
- Use seeded or fake personas only. Do not commit real chapter leader emails.
- Keep this issue focused on validation and regression coverage, not feature expansion.

## Issue 14: Document activation runbook, training flow, and founder summary

Type: Documentation / Operations
Priority: Medium
Complexity: Small
Labels: `LEAD`, `documentation`, `operations`, `training`, `chapter`, `phase:active-piv-loop`, `piv-status:plan-ready`
Dependencies: Issues 6-7, 12

### Description

Create the operational materials needed to launch with chapter leaders. Christopher will collect chapter leader/member lists, Abigail will train chapter leaders, and founders need a concise explanation of why this model supports LEAD's broader operating system vision.

### Acceptance Criteria

- [ ] Given Christopher provides chapter lists, when Abigail follows the runbook, then member and e-board preapprovals can be loaded or inserted without committing real emails.
- [ ] Given chapter leaders attend training, when the training flow is used, then they understand signup, preapproval activation, dashboard access, member list visibility, applicant approval, event creation, and e-board assignment.
- [ ] Given a wrong chapter, wrong role, missing member, duplicate email, or extra access case occurs, when support docs are followed, then there is a clear correction or rollback path.
- [ ] Given founders review the summary, when they read it, then they understand how this prepares LEAD Talent Platform for LEAD Spark, Impact Metrics, LEAD Pulse, LEAD Funding, and chapter recognition.
- [ ] Given rollout readiness is reviewed, when one pilot chapter is activated end to end, then the runbook captures evidence, blockers, and next steps.

### Implementation Notes

- Likely files: `docs/handbook/*`, `.github/reports/*`, or a concise `docs/runbooks/*` file if that pattern exists.
- Keep the founder summary concise and grounded in the product architecture.
- Do not include real email lists in repository docs.

## Validation Checklist

- [ ] Every in-scope PRD requirement maps to at least one issue.
- [ ] Issues are ordered by dependency and implementation phase.
- [ ] Each issue has testable acceptance criteria.
- [ ] Dependencies form a directed acyclic graph.
- [ ] The plan covers docs, database, services, auth/routing, UI, testing, and operations.
- [ ] No issue requires committing real chapter member emails.
