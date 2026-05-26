# Pathway Comprehensive Userflow Review And Testing

## Goal

Prove that the current Pathway userflow works end-to-end for students and chapter event creators before merge or rollout expansion. The review must cover product clarity, service correctness, RLS/auth boundaries, browser behavior, mobile layout, and evidence artifacts.

This plan is intentionally a review and validation plan first. Implementation should only happen after the first decision gate is answered.

## Current Grounding

- Branch: `codex/simplify-pathway-event-metadata-ui`
- Existing PR: #257, "Simplify chapter-facing Pathway event metadata UI"
- Current branch status at plan creation: clean
- Existing Pathway implementation includes:
  - Chapter event Pathway metadata UI
  - `event_pathway_metadata`
  - `pathway_feature_flag`
  - `pathway_check_in`
  - `pathway_recommendation`
  - student dashboard "Tus Next Three Moves"
  - recommendation CTA actions
  - Growth Reflection proof capture
  - chapter/admin Pathway aggregate metric services
- Recent hardening already completed:
  - Check-In redirect control-flow fix
  - student-owned recommendation insert/delete RLS migration
  - desktop/mobile Playwright coverage for Check-In -> recommendations -> dashboard CTA -> Growth Reflection

## Product Boundaries To Preserve

- Pathway is chapter-flagged and should stay invisible/off unless the chapter flag enables it.
- Pulse/survey data must not feed individual recommendations in this V1 flow.
- Growth Reflection stays private by default.
- Recruiters do not receive Pathway stage, private reflections, Pulse answers, or internal readiness signals.
- Chapter creators should not see internal intelligence fields such as raw evidence signals, recommendation safety, coordination risk, metadata status, or internal notes.
- Application events must use apply/postular language and must not imply guaranteed access.
- V1 recommendations should stay deterministic and explainable; no AI recommender or broad resource catalog in this validation pass.

## Current Coverage Confirmed From Repo

- Unit/service:
  - Check-In form parsing and redirect/error paths
  - Check-In classification and recommendation creation
  - event metadata validation/defaulting/upsert
  - event-backed matching priority
  - safe recommendation-start redirect
  - Growth Reflection linked recommendation completion
  - chapter aggregate/admin pilot metric service logic
- Browser:
  - seeded e-board and member login
  - Check-In form completion generates 3 recommendations
  - Pathway metadata required-field validation only when eligible
  - internal chapter-facing metadata controls hidden
  - all visible Pathway event metadata options selectable
  - draft event saves derived metadata
  - application access forces Pathway CTA to `Postular`
  - student dashboard renders event/profile/proof CTAs
  - event recommendation CTA marks recommendation `started`
  - Growth Reflection carries event/recommendation context and marks recommendation `completed`

## Gaps To Review

### Student Flow Gaps

- Disabled rollout state:
  - dashboard should not show Pathway recommendations when `enable_recommendation_card=false`
  - direct `/student/pathway-check-in` should show disabled state when `enable_check_in=false`
- Incomplete/no Check-In state:
  - student dashboard should show the "Empezar Check-In" prompt when recommendations are enabled but no completed Check-In exists
- Completed state:
  - returning to Check-In after completion should not show the form again
- Dismissal:
  - `No aplica` should mark a recommendation `dismissed`
  - dismissed recommendations should disappear from dashboard guidance and update progress consistently
- CTA routing:
  - profile recommendation should route to `/student/profile` and mark `started`
  - proof-only recommendation should route to Growth Reflection and mark `started`
  - event recommendation should route to event detail and preserve event registration/application as source of truth
- Event detail continuation:
  - open event recommendation should allow registration and produce normal event registration state
  - application event recommendation should land on application-oriented event detail copy/action, not registration framing

### Chapter Creator Flow Gaps

- Edit existing event:
  - existing Pathway metadata should load back into the event edit form
  - toggling eligibility off should preserve safe non-eligible behavior without stale required validation
  - toggling eligibility on again should restore/default required metadata predictably
- Publish flow:
  - draft and publish paths should both persist derived metadata correctly
- Non-Pathway events:
  - normal event creation must remain low-friction and not require Pathway metadata
- Copy clarity:
  - chapter-facing labels should stay plain-language and avoid internal terms

### Service/Auth/RLS Gaps

- Confirm authenticated student can:
  - upsert own Check-In
  - refresh own generated recommendations
  - update own recommendation status
  - create own private Growth Reflection
- Confirm authenticated student cannot:
  - update another student's recommendations
  - create recommendations for another student's Check-In
  - see another student's Check-In/recommendations/reflections
- Confirm chapter/member roles:
  - non-admin chapter creators can create/edit event metadata only for permitted chapter events
  - member-only users cannot access chapter event creation
- Confirm service failure states:
  - recommendation generation failure produces user-safe error state
  - Growth Reflection save failure produces user-safe error state

### Visual, Accessibility, And Browser QA Gaps

- Desktop and mobile screenshots for:
  - dashboard no-check-in prompt
  - Check-In disabled
  - Check-In form
  - Check-In completed
  - recommendation dashboard active/started/completed/dismissed states
  - Growth Reflection invalid/missing required fields
  - event metadata edit form
- Keyboard:
  - tab through Check-In form
  - radio groups/selects are reachable and operable
  - recommendation CTAs and `No aplica` are reachable
- Accessibility:
  - labels are associated with inputs
  - focus states are visible
  - no critical axe violations on student Pathway pages and chapter metadata step
- Browser console/network:
  - no critical console errors
  - no unexpected 4xx/5xx on tested flows

## Decision Gate 1: What Does "Everything Works" Mean For This Pass?

Recommended answer: treat this pass as "merge-readiness for Pathway V1", not "rollout-readiness for every future Pathway idea."

That means we must prove:

- feature-flagged visibility works
- student Check-In works
- recommendations are generated and safe
- event-backed CTAs work
- profile/proof CTAs work
- dismissal works
- Growth Reflection proof loop works
- chapter metadata create/edit works without exposing internal fields
- RLS prevents cross-student data access
- desktop/mobile UI has no obvious layout or keyboard blockers

We should not include:

- broad resource catalog
- AI recommendations
- Pulse individualization
- recruiter-facing Pathway insights
- SharePoint runtime ingestion
- Professionals/HER/Ambassadors/past-event recommendation routing

## Planned Tasks

### Phase 1: Static Review

- [ ] Review all changed and Pathway-owned files using correctness, readability, architecture, security, and performance axes.
- [ ] Review existing tests first and mark which behaviors are already proven.
- [ ] Inspect RLS policies for Pathway tables and verify ownership constraints.
- [ ] Inspect event creation/edit actions for metadata persistence and permission boundaries.
- [ ] Inspect student dashboard and Growth Reflection actions for safe redirects and error behavior.

### Phase 2: Add Missing Unit/Service Tests

- [ ] Add action/service tests for recommendation dismissal behavior.
- [ ] Add action/service tests for profile/proof CTA status transitions if not already covered.
- [ ] Add RLS-oriented migration or policy tests where feasible; otherwise document SQL verification queries.
- [ ] Add service tests for edit/toggle metadata edge cases if existing coverage is insufficient.
- [ ] Add Growth Reflection invalid/save-error action coverage if missing.

### Phase 3: Expand Browser Userflow QA

- [ ] Extend `tests/e2e/lead-intelligence-auth-qa.spec.ts` or split into a focused Pathway spec if the file becomes too large.
- [ ] Test no-check-in dashboard prompt.
- [ ] Test disabled rollout state.
- [ ] Test completed Check-In return state.
- [ ] Test event recommendation CTA plus event registration/application continuation.
- [ ] Test profile CTA status transition.
- [ ] Test proof CTA status transition into Growth Reflection.
- [ ] Test `No aplica` dismissal.
- [ ] Test chapter event edit Pathway metadata reload/toggle behavior.
- [ ] Record desktop and mobile screenshots in a dedicated output directory.

### Phase 4: Accessibility And Visual Review

- [ ] Run Playwright desktop and mobile.
- [ ] Add focused keyboard navigation checks for Check-In and recommendation cards.
- [ ] Run or add axe checks for student dashboard, Check-In, Growth Reflection, and chapter event Pathway step.
- [ ] Review generated screenshots manually for overflow, clipped text, confusing labels, and mobile spacing issues.

### Phase 5: Full Validation

- [ ] `pnpm supabase migration up`
- [ ] focused Vitest for Pathway services/actions
- [ ] `pnpm test`
- [ ] `pnpm lint`
- [ ] `pnpm exec tsc --noEmit`
- [ ] full Pathway Playwright suite on desktop and mobile
- [ ] GitHub checks after push

### Phase 6: Evidence And Merge Readiness

- [ ] Update PR #257 with findings, fixes, commands, and screenshots.
- [ ] If issues are found, commit in clear stages:
  - service/auth/RLS fix
  - student flow tests/fixes
  - chapter creator tests/fixes
  - accessibility/visual polish
- [ ] Keep unrelated generated artifacts out of commits unless explicitly requested.
- [ ] Mark remaining non-blocking future ideas as follow-up issues, not hidden TODOs.

## Acceptance Criteria

- No P0/P1 findings remain.
- Any P2 finding has either a fix or a clear follow-up issue with rationale.
- Full local validation passes.
- Desktop and mobile browser QA passes.
- RLS/auth ownership is explicitly verified.
- Screenshots or Playwright artifacts exist for the key states.
- PR #257 has an evidence comment with exact commands and outcomes.

## Execution Results - 2026-05-26

Completed for merge-readiness:

- Expanded authenticated Playwright coverage for rollout-off state, no-Check-In prompt, completed Check-In return state, recommendation dismissal, profile/proof/event/application CTAs, event registration/application continuation, Growth Reflection context handoff, chapter metadata create/edit/toggle, RLS negative checks, and critical accessibility smoke.
- Fixed one accessibility issue found during QA: disabled chapter Pathway select controls now have explicit accessible names.
- Captured desktop and mobile screenshot evidence under `outputs/pathway-comprehensive-userflow-qa/`.
- Verified local Supabase migrations are up to date.

Validation:

- `pnpm supabase migration up` - passed, local database up to date.
- `pnpm exec playwright test tests/e2e/lead-intelligence-auth-qa.spec.ts --reporter=list` - passed, 31 passed and 1 intentional mobile skip for the DB-only RLS check.
- `pnpm exec tsc --noEmit --pretty false` - passed.
- `pnpm lint` - passed with existing warnings only.
- `pnpm test` - passed, 51 files and 485 tests.

Deferred beyond this merge-readiness pass:

- Broad chapter rollout readiness with real chapter operators.
- AI/resource-catalog recommendations.
- Pulse individualized recommendation inputs.
- Recruiter-facing Pathway insights.

## First Grill Question

Question: For this pass, are we proving Pathway V1 is safe to merge, or proving it is ready to activate broadly for chapters?

Recommended answer: merge-readiness for Pathway V1. Broad activation needs a later pilot/readiness pass with real chapter operators and student content quality review.
