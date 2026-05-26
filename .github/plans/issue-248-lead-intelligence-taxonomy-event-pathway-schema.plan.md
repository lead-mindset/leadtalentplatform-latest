# Issue #248: Lead Intelligence Taxonomy And Event Pathway Schema

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/248

Source PRD: `.github/PRDs/lead-intelligence-event-pathway-metadata.prd.md`

## Problem

Pathway recommendations currently produce generic next moves without an auditable link to LEAD OKRs, event outcomes, proof actions, or source records. LEAD already has funding OKR/pillar constants and event operating data, but Pathway needs a neutral taxonomy and a focused event metadata layer before services or UI can recommend real event-backed actions.

## Codebase Findings

- Funding currently owns `FUNDING_OKR_KEYS` and `FUNDING_PILLAR_KEYS` in `lib/services/funding.service.ts`; Pathway should not import the funding service just to know LEAD strategy keys.
- Funding schema uses text check constraints instead of Postgres enums, which keeps migrations and generated types simpler.
- Event RLS already uses `public.is_event_editor(event_id)` for editor/collaborator access.
- Pathway tables already exist for `pathway_check_in`, `pathway_recommendation`, and `growth_reflection`.
- `pathway_recommendation` currently has one row per `check_in_id` + `category`, so traceability fields must be added without breaking existing rows.

## Design

Add a neutral taxonomy module:

- `lib/lead-taxonomy.ts`
- Re-export OKR and pillar constants from funding service to preserve existing imports.

Add migration:

- `supabase/migrations/20260525133000_add_event_pathway_metadata.sql`

The migration creates `public.event_pathway_metadata` as a 1:1 annotation for `public.event` and adds traceability columns to `public.pathway_recommendation`.

RLS:

- Admin can manage all metadata.
- Event editors can read, insert, update, and delete metadata for events they can edit.
- Authenticated users can read metadata only for published Pathway-eligible events.
- Service role can read/manage all.

## Tasks

- [x] Add shared LEAD taxonomy constants and types in `lib/lead-taxonomy.ts`.
- [x] Refactor `lib/services/funding.service.ts` to import and re-export shared OKR/pillar constants.
- [x] Add migration for `event_pathway_metadata`, constraints, indexes, comments, and RLS.
- [x] Add traceability columns to `pathway_recommendation` with backwards-compatible defaults.
- [x] Update `lib/database.generated.ts` for the new table and recommendation fields.
- [x] Add plan reference/comment and `has-plan` label to issue #248.
- [x] Run `/validate` for issue #248.

## Validation

- `bun run lint` failed because `bun` is not installed in this environment.
- `pnpm run lint` passed with existing warnings only.
- `pnpm exec tsc --noEmit` passed.
- `pnpm test` passed: 46 files, 463 tests.

## Risks

- RLS can become recursive if metadata policies query event tables too broadly; use the existing `public.is_event_editor(event_id)` helper.
- Generated types may drift if local Supabase is unavailable; if manual type updates are needed, keep them scoped to the new schema.
- Recommendation traceability columns must have safe defaults so existing check-in flows continue to insert rows before the service refactor lands.
