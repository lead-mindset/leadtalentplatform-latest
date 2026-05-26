# Issue #249: Lead Intelligence Services And Pathway Matching Tests

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/249

Source PRD: `.github/PRDs/lead-intelligence-event-pathway-metadata.prd.md`

Depends on: #248

## Problem

Pathway currently generates three generic recommendations directly inside `PathwayCheckInService`. The connect recommendation asks students to contact chapter leaders/mentors, which the product decision explicitly removed for V1. The service layer needs deterministic event-backed matching, fixed support actions, and traceable recommendation records.

## Codebase Findings

- `PathwayCheckInService.saveCompletedCheckIn` currently writes generic recommendations immediately after saving a completed check-in.
- `generatePathwayRecommendations` is synchronous and UI-agnostic; tests already cover classification and recommendation creation.
- Existing service tests mock Supabase builders directly; new services should follow that style.
- `pathway_recommendation` now supports traceability fields from #248: `source_type`, `source_event_id`, `cta_type`, `evidence_signal`, and `matched_reasons`.
- Growth reflections are private by default and already link to `recommendation_id` and `event_id` in the database.

## Design

Add two services:

1. `EventPathwayMetadataService`
   - Validate metadata input before create/update.
   - Read/upsert metadata rows by event.
   - Keep validation deterministic and shared with future chapter event UI.

2. `PathwayIntelligenceService`
   - Load eligible event metadata and active published events.
   - Score events against check-in classification.
   - Return one event-backed recommendation when there is a safe match.
   - Return fixed support/fallback actions for profile, LinkedIn/resume, and Growth Reflection.

Refactor `PathwayCheckInService`:

- Keep check-in classification behavior.
- Delegate recommendation generation to `PathwayIntelligenceService`.
- Preserve exported `generatePathwayRecommendations` as the fixed fallback generator for tests/backwards compatibility.
- Remove the chapter-leader touchpoint action.

## Tasks

- [x] Add `EventPathwayMetadataService` with validation helpers and CRUD methods.
- [x] Add `PathwayIntelligenceService` with deterministic event scoring and fallback action generation.
- [x] Extend recommendation generation types and insert payloads with traceability fields.
- [x] Refactor `PathwayCheckInService.saveCompletedCheckIn` and dashboard select fields.
- [x] Update existing Pathway tests for the removed chapter touchpoint action.
- [x] Add service tests for metadata validation, event matching priority, fallback actions, and traceability.
- [x] Add plan reference/comment and `has-plan` label to issue #249.
- [x] Run `/validate` for issue #249.

## Validation

- `bun run lint` is unavailable because `bun` is not installed in this environment.
- `pnpm run lint` passed with existing warnings only.
- `pnpm exec tsc --noEmit` passed.
- `pnpm test` passed: 48 files, 471 tests.

## Risks

- Matching must stay explainable and deterministic; do not add AI/ranking complexity in V1.
- Application events must use apply/postulate language, never guaranteed access.
- New recommendation fields must not break existing student dashboard rendering.
