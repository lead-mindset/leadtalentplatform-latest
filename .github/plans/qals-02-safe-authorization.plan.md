# Plan: QALS-02 Safe Restricted-Route Authorization

Issue: #284
PRD: `.github/PRDs/qa-launch-readiness-controlled-rollout.prd.md`

## Problem

Several route guards collapse unauthenticated, missing-user, wrong-role, and missing-permission states into the same login redirect. A valid signed-in user who visits an unauthorized route can appear to lose the session instead of receiving a safe access boundary.

## Scope

- Add a safe unauthorized route for signed-in wrong-role or missing-permission states.
- Update auth guard helpers to redirect anonymous users to login but signed-in unauthorized users to a recovery state.
- Preserve chapter-operator post-auth redirect to `/chapter` when dashboard permission exists.
- Add focused unit tests for redirect helper behavior.

## Implementation Tasks

- [x] Add a route helper for signed-in access-denied fallback paths.
- [x] Add a Spanish-first unauthorized page under the locale auth routes.
- [x] Update `requireAdmin`, `requireUserWithRole`, `requireChapterMember`, `requireChapterEditor`, and `requireRecruiter` to avoid login redirects for signed-in unauthorized users.
- [x] Add or update tests for safe fallback path behavior.
- [x] Update issue #284 with plan and validation evidence.

## Validation

- Run targeted tests for auth redirect helpers.
- Run targeted tests for auth access helpers if the changed guard logic is covered there.
- Report broader validation as deferred if this slice does not touch runtime UI beyond the unauthorized page.

## Risks

- Server actions that call `requireAdmin` may redirect to an unauthorized page instead of returning structured action errors. This matches the existing guard style and is acceptable for this route-safety slice.
- Some old tests may expect `/auth/login` for wrong-role users. Update expectations to the launch contract.
