# Issue 204: Build President/VP E-board Assignment and Admin Correction UI

## Goal

Add the launch UI and server actions for assigning approved members into official e-board roles without writing chapter positions back into `chapter_membership`.

## Scope

- Presidents and vice presidents assign regular e-board roles only:
  - `chief_of_staff`
  - `director`
  - `coordinator`
- Admins can assign or correct protected roles:
  - `president`
  - `vice_president`
- Assignments store normalized `role_level`, `functional_area`, and human `display_title`.
- Removing an assignment deactivates `chapter_role_assignment`, revokes linked permission grants, and keeps membership approved.
- Chapter roster and admin user detail surfaces show current active role assignment.

## Required Backend/RLS Work

- Add scoped RLS for non-admin `chapter.roles.assign_eboard` users to read/insert/update regular role assignments and linked grants.
- Add audit-log insert policy for role assignment/deactivation events.
- Add audit inserts in `ChapterRoleAssignmentService`.
- Add thin server actions for chapter and admin assignment flows.

## UI Tasks

- Add chapter roster role controls for approved members when the viewer has `chapter.roles.assign_eboard`.
- Reject protected role levels in the chapter UI and action.
- Add admin correction panel on the admin user detail page for approved chapter members.
- Make empty, error, loading, and success states explicit and mobile-safe.

## Validation

- Focused service/action tests for regular assignment, protected-role rejection, admin protected assignment, deactivation, and audit behavior.
- Supabase reset and type generation.
- Typecheck, lint, full tests.
- Visual check of roster controls if a dev server can be launched cleanly.

## Completion Status

- Status: Complete
- Implemented scoped RLS, audit writes, server actions, chapter roster role controls, and admin correction UI.
- Validated with focused service tests, Supabase reset, type generation, typecheck, lint, full test suite, and desktop/mobile Playwright screenshots for the admin correction panel.

## Known Debt

- `lib/actions/admin/onboard-president.ts` performs direct DB access (reads `user`/`chapter`/`chapter_membership` and inserts/updates approved memberships inline) instead of delegating to `ChapterMembershipService`. It is allowlisted in `tests/architecture.test.ts` (`ACTION_DIRECT_DB_ALLOWLIST`) with this rationale:
  - `ChapterMembershipService.approveMembership` only approves pre-existing `pending` rows and requires `chapter.members.manage_applications`; it cannot create an approved membership from scratch, so the action's inline path is not a drop-in service replacement.
- The action then calls `ChapterRoleAssignmentService.assignChapterRole('president')` (which already issues chapter_editor identity via `LeadIdentityService.issueIdentity`) followed by `onboardPresident` (which re-issues `issueChapterEditorIdentity` with `makePrimary`). That identity issuance is intentional for the president persona but the double-issue path should be revisited when the preapproval e-board flow replaces this Phase-3 shim (see `chapter-president.service.ts` Phase-3 removal comment).
- Resolve by consolidating the "create approved membership + assign role + issue identity" sequence into a single service method, then removing the allowlist entry.
