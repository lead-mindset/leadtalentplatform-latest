# Plan: Issue #136 - Refresh Public Event Cards

## Summary

Refresh the public Events page cards so each published event is easier for students to scan and act on. This is a contained UI slice: reuse the existing `getPublishedEvents` data, preserve routing to `/events/[id]`, keep published/unpublished behavior unchanged, and improve the card presentation with image/fallback visuals, description preview, richer metadata, and a context-aware action label.

## User Story

As a student or public participant, I want each event card to clearly show what the opportunity is, where/when it happens, who hosts it, whether it is open or application-based, and what action is expected, so that I can confidently open the right event detail page.

## Metadata

| Field | Value |
| --- | --- |
| GitHub Issue | #136 |
| Type | Enhancement |
| Complexity | Medium |
| Systems Affected | Public Events page, localized Events copy, visual presentation |
| Out of Scope | Timeline grouping, search/filters, LEAD SPARK featured block, direct registration from cards, event detail redesign, schema changes |

## Codebase Patterns To Follow

| Category | File:Lines | Pattern |
| --- | --- | --- |
| Events page structure | `app/[locale]/events/page.tsx:193` | Local `EventCard` component renders from `EventWithDetails` and links the whole card to `/events/${event.id}`. |
| Current metadata | `app/[locale]/events/page.tsx:237` | Cards already show chapter, location, event type, availability, registrations, and capacity using badges and lucide icons. |
| Discover visual pattern | `app/[locale]/discover/discover-client.tsx:185` | Public discovery rows use image/fallback areas, title hierarchy, line-clamped descriptions, and compact metadata. |
| Event detail image pattern | `app/[locale]/events/[id]/_components/EventContent.tsx:296` | Event cover images are rendered with `next/image` when `cover_image` exists. |
| Data source | `lib/services/event.service.ts:852` | `getPublishedEvents` already selects `cover_image`, `description`, `capacity`, `access_model`, chapter, location, and registration count. |
| Type source | `lib/types.ts:198` | `EventWithDetails` is the page-level type for event rows with chapter/collaborator/count metadata. |

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `app/[locale]/events/page.tsx` | Update | Add image/fallback card visuals, description preview, context-aware action labels, and clearer card hierarchy. |

No new service, action, route, migration, or database change is needed for this issue.

## Implementation Tasks

### Task 1: Extend localized card copy

- **File**: `app/[locale]/events/page.tsx`
- **Action**: Update `EVENT_COPY`
- **Implement**:
  - Add action labels for open registration, application-required events, full events, and past/detail states.
  - Add small fallback visual labels if needed, such as `LEAD event` / `Evento LEAD`.
  - Keep Spanish-first copy simple and consistent with the current ASCII style in this file.
- **Validate**:
  - TypeScript infers both `en` and `es` objects with matching keys.

### Task 2: Add action-label helper

- **File**: `app/[locale]/events/page.tsx`
- **Action**: Update local helper section near `getAvailabilityVariant`
- **Implement**:
  - Add a pure helper that receives the event, locale/copy, and timing/availability context.
  - Return:
    - `Registrarme` / `Register` for upcoming open-registration events with capacity available or unlimited capacity.
    - `Postular` / `Apply` for upcoming application-based events.
    - `Ver detalle` / `View details` for past events or fallback states.
    - A non-misleading label for full events, likely still routing to detail.
  - Do not trigger registration or application directly from the card.
- **Validate**:
  - Labels only change display text; card href remains `/events/${event.id}`.

### Task 3: Add polished visual area to `EventCard`

- **File**: `app/[locale]/events/page.tsx`
- **Action**: Update imports and `EventCard`
- **Implement**:
  - Import `Image` from `next/image`.
  - If `event.cover_image` exists, render it with `Image`, `fill`, `sizes`, `alt`, and `object-cover`.
  - If no cover exists, render an intentional LEAD-branded fallback visual using existing Tailwind classes and lucide icons; do not show generic `No image` text.
  - Keep dimensions stable with an aspect ratio or fixed responsive media column so cards do not jump.
- **Validate**:
  - Event cards still render when `cover_image` is null.
  - No layout overlap on narrow widths from the code structure.

### Task 4: Add description preview and richer metadata hierarchy

- **File**: `app/[locale]/events/page.tsx`
- **Action**: Update `EventCard`
- **Implement**:
  - Add a `line-clamp-2` short description preview when `event.description` exists.
  - Keep title, event type, access model/timing, availability, chapter, location, and registrations/capacity visible.
  - Place the context-aware action label near the title/action area.
  - Preserve existing badge semantics and availability variants.
- **Validate**:
  - Cards show the issue-required fields where data exists: title, short description, date/time, chapter, location, registrations/capacity, event type, access model, availability.

### Task 5: Preserve behavior boundaries

- **File**: `app/[locale]/events/page.tsx`
- **Action**: Review final diff
- **Implement**:
  - Ensure `EventsContent` still calls `getPublishedEvents()` and still splits upcoming/past events.
  - Ensure unpublished events remain excluded by the service.
  - Ensure card click behavior still routes to existing event detail pages.
  - Avoid changing registration, application, check-in, admin, or event detail logic.
- **Validate**:
  - Diff is limited to the Events page UI.

### Task 6: Run validation

- **Commands**:
  - `pnpm build`
  - `pnpm lint`
- **Expected Result**:
  - Build passes.
  - Lint passes or reports only unrelated pre-existing warnings.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Action label could imply direct registration from the card | Keep card link to detail page and use labels as “next action” copy only. |
| Cover images could create layout shift | Use stable media dimensions, `fill`, `sizes`, and `object-cover`. |
| Fallback visuals could feel generic | Use LEAD-specific copy, restrained gradient, iconography, and event/chapter metadata. |
| Scope could drift into #137/#138/#139 | Do not group events, redesign the full mobile system, or create screenshot artifacts in this issue unless needed for basic manual review. |
| Remote images may fail if domains are not configured | Reuse the existing event detail `next/image` pattern, which already renders event cover images. |

## Acceptance Criteria Mapping

- [x] Public event cards show title, short description preview, date/time, chapter, location, registrations/capacity, event type, access model, and availability where data exists.
- [x] Each event has a context-aware action label such as `Registrarme`, `Postular`, or `Ver detalle` without changing the actual registration/application flow.
- [x] Cards still route to the existing event detail page.
- [x] Events with `cover_image` render the image with `next/image`.
- [x] Events without cover images render an intentional LEAD-branded fallback visual, not generic `No image` text.
- [x] Existing published/unpublished behavior remains unchanged.
- [x] `pnpm build` passes.
- [x] `pnpm lint` passes or only reports unrelated pre-existing warnings.

## Notes For Implementation

This should stay as a single-file UI enhancement unless implementation reveals a strong reason to extract a helper. If helper logic grows beyond simple display decisions, keep it pure and local to the page for now; this issue does not need a new service because it does not change business logic or database behavior.

## Implementation Result

Completed in `app/[locale]/events/page.tsx`.

- Added localized action labels and LEAD fallback visual copy.
- Added a local action-label helper that keeps cards as links to the existing event detail flow.
- Added `next/image` cover rendering for event cards.
- Added an intentional LEAD-branded fallback visual for events without covers.
- Added short description previews and clearer metadata grouping.
- Preserved `getPublishedEvents()`, upcoming/past splitting, and published/unpublished behavior.

Validation:

- `pnpm build` passed.
- `pnpm lint` passed with pre-existing warnings only.
