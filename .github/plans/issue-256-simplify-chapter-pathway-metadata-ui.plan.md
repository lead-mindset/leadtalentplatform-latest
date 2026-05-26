# Issue 256: Simplify Chapter-Facing Pathway Event Metadata UI

## Issue

GitHub: https://github.com/lead-mindset/leadtalentplatform-latest/issues/256

## Context

The event-backed Pathway V1 implementation exposes the correct underlying metadata, but the chapter event form currently shows internal intelligence language directly to chapter creators. The confusing parts are most visible in the Pathway step:

- "Pathway recommendation fit"
- "Accion, evidencia y seguridad"
- "Seguridad de recomendacion"
- "Senales de evidencia"
- "Riesgo operativo"
- "Estado de metadata"
- "Notas internas"

The underlying data remains useful for matching, safety, and traceability. The UI should instead ask plain chapter-facing questions and derive internal values where possible.

## Current Code

- Main form component: `app/[locale]/chapter/events/_components/event-form.tsx`
- Metadata service: `lib/services/event-pathway-metadata.service.ts`
- Pathway taxonomy: `lib/lead-taxonomy.ts`
- Browser QA: `tests/e2e/lead-intelligence-auth-qa.spec.ts`
- Service tests: `lib/services/__tests__/event-pathway-metadata.service.test.ts`

The database constraint still requires eligible events to have `evidence_signals`, `audience`, `cta_type`, `proof_outcome`, and other core metadata. Therefore the UI can hide internal fields only if the form/service provide deterministic defaults.

## Decisions

- Keep the database shape unchanged.
- Keep OKR, pillar, student goal, growth stage, outcome, audience, CTA, and proof outcome as visible fields.
- Hide `recommendation_safety`, `coordination_risk`, `metadata_status`, and raw `evidence_signals` from the chapter-facing main form.
- Derive default hidden values:
  - `recommendationSafety`: `recommend_only_if_event_active` for eligible events.
  - `metadataStatus`: `ready` for eligible events, `draft` otherwise.
  - `coordinationRisk`: preserve existing value or default `low`.
  - `evidenceSignals`: derive from access model, CTA type, and proof outcome.
- Rename the UI around the user mental model: "Should this event be recommended to students?"

## Implementation Tasks

- [x] Update Pathway intro/toggle copy to explain Pathway lightly and frame the decision as student recommendation.
- [x] Rename visible labels:
  - "Audiencia" -> "Para quien es este evento"
  - "CTA recomendado" -> "Boton que vera el estudiante"
  - "Evidencia posterior" -> "Que puede capturar despues"
  - "Accion, evidencia y seguridad" -> "Como se recomendara este evento"
- [x] Remove visible raw evidence signals, recommendation safety, coordination risk, metadata status, and internal notes from the main Pathway form.
- [x] Add deterministic helper functions in `event-form.tsx` for hidden evidence signals, status, and safety defaults.
- [x] Update validation so hidden fields are no longer required from the chapter creator.
- [x] Update review/checklist copy to match the simplified UI.
- [x] Update service validation/tests if recommendation safety should default rather than be required from UI.
- [x] Update Playwright copy assertions.

## Validation

- [x] `pnpm run lint` - passed with existing repo warnings only.
- [x] `pnpm exec tsc --noEmit` - passed.
- [x] `pnpm exec vitest run lib/services/__tests__/event-pathway-metadata.service.test.ts lib/actions/events/__tests__/create-event.test.ts lib/actions/events/__tests__/update-event.test.ts` - 3 files / 11 tests passed.
- [x] `pnpm exec playwright test tests/e2e/lead-intelligence-auth-qa.spec.ts --project=desktop-chromium --project=mobile-chromium --reporter=line` - 8 tests passed.
- [x] Screenshots recorded in `outputs/issue-256-pathway-metadata-ui/`.

## Rollback

If hidden defaults cause service or database failures, keep the copy improvements but temporarily move the hidden fields into a collapsed "Opciones avanzadas" panel until downstream defaults are proven.
