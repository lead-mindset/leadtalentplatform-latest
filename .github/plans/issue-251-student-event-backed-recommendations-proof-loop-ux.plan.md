# Issue 251: Student Event-Backed Recommendations and Proof Loop UX

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/251

## Objective

Show students event-backed Pathway recommendations with clear CTAs and connect those recommendations to Growth Reflection proof capture.

## Source Context

- PRD: `.github/PRDs/lead-intelligence-event-pathway-metadata.prd.md`
- Student dashboard: `app/[locale]/student/page.tsx`
- Recommendation status action: `lib/actions/student/pathway-recommendation.ts`
- Growth Reflection page/action/service: `app/[locale]/student/growth-reflection/page.tsx`, `lib/actions/student/growth-reflection.ts`, `lib/services/growth-reflection.service.ts`
- Recommendation traceability fields from issue #248/#249: `source_type`, `source_event_id`, `cta_type`, `evidence_signal`, `matched_reasons`

## Implementation Tasks

- [x] Add a student recommendation CTA action that marks a recommendation as started and redirects to a safe platform path.
- [x] Render metadata-aware CTAs on the Pathway dashboard for event, profile, resume, and reflection/proof recommendations.
- [x] Surface matched reasons/evidence in a concise student-safe way so recommendations explain why they appear.
- [x] Pass `eventId` and `recommendationId` into Growth Reflection from recommendation CTAs.
- [x] Update completed linked Growth Reflections to complete the related recommendation when appropriate.
- [x] Add focused service/action tests for proof-loop status updates.
- [x] Run validation using the available repo commands.

## Validation Checklist

- [x] `pnpm run lint`
- [x] `pnpm exec tsc --noEmit`
- [x] `pnpm test`

## Notes

- Event CTAs should take students to the event detail page, where existing registration/application logic remains the source of truth.
- Application events must say apply/postulate, not imply guaranteed access.
- Growth Reflection remains private by default.
