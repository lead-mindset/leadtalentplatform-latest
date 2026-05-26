# Issue 250: Chapter Event Pathway Metadata UX

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/250

## Objective

Let chapter event creators opt a normal event into Pathway recommendations by filling short, structured metadata without changing the default event creation flow.

## Source Context

- PRD: `.github/PRDs/lead-intelligence-event-pathway-metadata.prd.md`
- Shared taxonomy: `lib/lead-taxonomy.ts`
- Metadata service: `lib/services/event-pathway-metadata.service.ts`
- Event create/edit UI: `app/[locale]/chapter/events/_components/event-form.tsx`
- Event actions: `lib/actions/events/create-event.ts`, `lib/actions/events/update-event.ts`

## Implementation Tasks

- [x] Add a shared event Pathway metadata action schema/mapper so create/update actions stay thin and delegate validation/upsert to `EventPathwayMetadataService`.
- [x] Extend `createEvent` and `updateEvent` to accept optional `pathwayMetadata`, persist it after event writes, and roll back created events when metadata save fails.
- [x] Load existing `event_pathway_metadata` on the chapter event edit page and pass it into `EventForm`.
- [x] Add a concise Spanish-first Pathway metadata section to `EventForm` with the required fields only enforced when eligibility is enabled.
- [x] Include Pathway metadata in create/edit submit and draft autosave payloads without affecting normal events.
- [x] Update tests around event actions for metadata handoff/failure behavior.
- [x] Run validation using the available repo commands.

## Validation Checklist

- [x] `pnpm run lint`
- [x] `pnpm exec tsc --noEmit`
- [x] `pnpm test`

## Notes

- Normal event creation must still work with no Pathway metadata.
- Pathway eligibility is the only trigger for requiring OKR, pillar, audience, outcome, CTA, proof, evidence, and safety fields.
- No admin approval queue is introduced for V1.
