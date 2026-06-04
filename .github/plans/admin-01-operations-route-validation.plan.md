# Plan: ADMIN-01 Operations Route Validation

GitHub issue: #299

## Problem

The QA register maps observations 78-89 to admin operations polish, table states, destructive semantics, company access copy, and Staff/Admin boundaries. Prior QALS slices implemented the critical admin fixes; this slice validates active admin operations routes and records destructive/company decisions explicitly.

## Scope

In:

- Validate Admin and Staff-admin routes on desktop/mobile.
- Validate admin dashboard, users, user detail, companies, invites, chapters, events, and settings.
- Confirm admin/staff direct student route boundary.
- Update QA register for validated active admin observations.
- Keep destructive semantics and deferred company/recruiter behavior as explicit product/operations decisions.

Out:

- New deactivate/archive/delete semantics.
- New company/recruiter product scope.
- Separate Staff UI tier beyond documented shared admin shell.

## Implementation Tasks

- [x] Run admin-recruiter launch QA on desktop and mobile.
- [x] Review generated findings report.
- [x] Update register states for observations 78-89.
- [x] Document Staff/Admin and destructive-operation decisions.

## Validation

- `LAUNCH_QA_SCOPE=admin-recruiter pnpm exec playwright test tests/e2e/launch-qa-report.spec.ts --reporter=line`

## Risks

- Closing deferred company/recruiter work accidentally. Mitigation: only close admin launch-route readiness and leave company/recruiter product scope in #301.
- Treating destructive-operation absence as a bug. Mitigation: document deactivate/archive/delete as operations decisions.
