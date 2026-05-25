# Issue #229: Impact-Aware Event Creation Workflow

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/229

Recovered from branch-cleanup evidence for `codex/integrated-chapter-pathway-ux`.

## Problem

Chapter event creation currently captures logistics, access model, application questions, collaborators, publishing state, location, and check-in support. It does not capture why an event exists, which LEAD impact pillars it supports, what student growth outcome it targets, or what proof/evidence should be collected after the event.

The stranded branch appears to have explored this feature, but it should not be merged wholesale because `dev` now contains newer chapter permissions, funding, registration, and check-in architecture. The feature needs to be rebuilt deliberately as a clean vertical slice.

## Current Codebase Findings

- Event create/update validation lives in `lib/actions/events/create-event.ts` and `lib/actions/events/update-event.ts`.
- Chapter event authorization is now permission based:
  - create uses `ChapterPermissionService.requireChapterPermission(..., 'chapter.events.manage')`
  - update uses `assertCanManageEvent`
- `app/[locale]/chapter/events/_components/event-form.tsx` already has a multi-step client form for logistics, location, access model, application questions, collaborators, publish/save, and archive behavior.
- `app/[locale]/chapter/events/_components/events-table.tsx` is the chapter management surface where internal impact context could be summarized.
- Event application questions are stored separately through `EventApplicationService.upsertQuestionsForEvent`; impact metadata should stay separate from application questions and not leak to applicants by default.
- No current `.github/PRDs/impact-aware-event-creation-for-chapter-editors.prd.md` exists on `dev`.
- The old impact commit objects were not available locally after stale branch cleanup, so implementation should rely on the cleaned issue evidence and current architecture rather than cherry-picking.

## Product Shape

Add internal impact metadata for chapter-managed events:

- Impact purpose: short internal statement of why the event matters.
- Primary impact pillar: one required official LEAD pillar.
- Secondary impact pillars: optional additional pillars.
- Expected outcome: operational outcome for the event.
- Student growth outcome: what participants should be able to do, understand, or access after the event.
- Expected proof type: what evidence the chapter expects to collect after the event.

Keep this metadata internal to chapter/admin management in v1. Do not add public event-page claims until proof collection and review rules exist.

## Architecture

### Database

Add event impact fields or a one-to-one `event_impact_metadata` table. Prefer a separate table if proof/evidence fields are likely to grow; prefer nullable columns on `event` only if the field set is stable and simple.

Required decisions before migration:

- Canonical LEAD impact pillars and IDs.
- Whether OKR mapping is a fixed taxonomy or stored as freeform text for v1.
- Whether expected proof type is a constrained enum/check constraint.
- Whether impact metadata is required only when publishing or also for drafts.

### Service Layer

Add `lib/services/impact-framework.service.ts` to own:

- Official pillar taxonomy.
- OKR/outcome mapping helpers.
- Validation rules for primary/secondary pillar combinations.
- Normalization helpers used by actions and tests.

Keep create/update event actions thin:

- Authenticate/authorize.
- Zod-validate event and impact input.
- Call event service and impact-framework helpers.
- Revalidate affected paths.

### UI

Add one focused impact step/card to the chapter event form:

- Purpose textarea.
- Primary pillar select.
- Secondary pillars multi-select/checkbox group.
- Expected outcome textarea.
- Student growth outcome textarea.
- Expected proof type select.

Show internal impact context in chapter management only:

- Event table/detail badge for primary pillar.
- Internal detail block on edit/detail surfaces.
- No public event-page exposure in v1.

### Tests

Add focused service/action coverage:

- Valid taxonomy accepts one primary pillar.
- Reject duplicate primary/secondary pillar selection.
- Reject invalid proof type.
- Draft save allows partial impact fields if product decision says drafts can be incomplete.
- Publish requires required impact fields if product decision says impact is mandatory for published chapter events.
- Admin and chapter editor update paths preserve current permission behavior.

## Tasks

- [ ] Define official v1 impact pillars, OKR mapping source, and proof types with product owner approval.
- [ ] Add or restore an impact PRD under `.github/PRDs/`.
- [ ] Add database migration for impact metadata.
- [ ] Regenerate `lib/database.generated.ts`.
- [ ] Add `lib/services/impact-framework.service.ts`.
- [ ] Add service tests for taxonomy and validation behavior.
- [ ] Extend create/update event action schemas with impact metadata.
- [ ] Add focused action/service tests for create and update validation.
- [ ] Add impact metadata controls to `event-form.tsx` without disrupting the existing event flow.
- [ ] Show internal impact context in chapter event management surfaces.
- [ ] Run visual QA for create, edit, mobile, validation errors, draft save, and publish.
- [ ] Run `pnpm lint`, `pnpm test`, and `pnpm build`.

## Suggested Implementation Order

1. Product taxonomy and PRD.
2. Database migration and generated types.
3. Service-layer taxonomy/validation.
4. Action schema integration.
5. Chapter editor UI.
6. Internal management display.
7. Tests, build, and browser QA.

## Risks

- Making fields required too early may block chapters from publishing routine events. Decide draft-vs-publish requirements explicitly.
- If public pages display impact claims before proof exists, the product may overpromise. Keep v1 internal.
- Reusing application-question storage would mix applicant-facing questions with internal planning metadata. Keep the models separate.
- Old branch UI may not match the current permission and funding architecture. Rebuild rather than cherry-pick.
