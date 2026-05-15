# Plan: Luma-Inspired Events Page Phase 1

## Summary

Redesign the public LEAD events page into a more student-oriented, Luma-inspired event discovery surface without changing registration/application business logic. Phase 1 focuses on four improvements: make events feel alive, organize upcoming events as a timeline, keep the primary action close to each event, and add polished event imagery/fallback visuals so event rows stop feeling like plain database records.

## User Story

As a student or public participant
I want to quickly scan LEAD events, understand what is happening, and know whether to register/apply/view details
So that I can take action without needing to understand LEAD's internal operating model first.

## Metadata

| Field | Value |
| --- | --- |
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Public events page, event card UI, public event data presentation |
| GitHub Issue | N/A |
| Design Inspiration | Luma calendar/event discovery patterns, adapted to LEAD brand |
| Scope | Phase 1 only: items 1, 2, 3, 4 from UX discussion |

---

## Current Codebase Findings

### Existing Public Events Page

The public events page already has a single-file server implementation with locale copy, event grouping, and an internal `EventCard` component.

```tsx
// SOURCE: app/[locale]/events/page.tsx:193-204
function EventCard({ event, locale }: { event: EventWithDetails; locale: PublicEventsLocale }) {
  const copy = EVENT_COPY[locale]
  const timing = getEventTiming(event, locale)
  const ownerChapter = event.chapter?.name ?? event.owner_chapter?.name ?? 'LEAD'
  const availability = getAvailabilityLabel(event, locale)
  const availabilityVariant = getAvailabilityVariant(event)

  return (
    <Card className={cn('overflow-hidden transition-colors hover:border-primary/40', timing.label === copy.past && 'opacity-80')}>
```

The page currently separates upcoming and past events, but upcoming events render as one long list instead of a timeline.

```tsx
// SOURCE: app/[locale]/events/page.tsx:268-278
const events: EventWithDetails[] = await getPublishedEvents()
const now = Date.now()
const upcomingEvents = events
  .filter((event) => new Date(event.end_at).getTime() >= now)
  .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
const pastEvents = events
  .filter((event) => new Date(event.end_at).getTime() < now)
  .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())
```

### Existing Event Metadata Helpers

Date/time, event type, timing, availability, and location helpers already exist in the public events page. Reuse them instead of introducing a separate data layer.

```tsx
// SOURCE: app/[locale]/events/page.tsx:151-171
function getEventTiming(event: EventWithDetails, locale: PublicEventsLocale) {
  const copy = EVENT_COPY[locale]
  const now = Date.now()
  const start = new Date(event.start_at).getTime()
  const end = new Date(event.end_at).getTime()

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return { label: copy.pendingDate, variant: 'outline' as const }
  }

  if (now >= start && now <= end) {
    return { label: copy.live, variant: 'live' as const }
  }

  if (now > end) {
    return { label: copy.past, variant: 'outline' as const }
  }

  return event.access_model === 'application'
    ? { label: copy.application, variant: 'info' as const }
    : { label: copy.open, variant: 'success' as const }
}
```

### Event Data Source

`getPublishedEvents()` delegates to `EventService.getPublishedEvents`, which already returns cover images and registered counts from `event_with_chapter` plus `event_registration`.

```ts
// SOURCE: lib/services/event.service.ts:855-881
const { data, error } = await supabase
  .from('event_with_chapter')
  .select(`
    id,
    title,
    description,
    cover_image,
    start_at,
    end_at,
    location,
    meeting_url,
    event_type,
    capacity,
    is_published,
    access_model,
    application_form_url,
    chapter_id,
    created_by_id,
    created_at,
    updated_at,
    chapter_name,
    chapter_university,
    chapter_city,
    chapter_region
  `)
  .eq('is_published', true)
  .order('start_at', { ascending: true })
```

```ts
// SOURCE: lib/services/event.service.ts:952-955
_count: {
  registrations: event.id ? countsByEventId.get(event.id) ?? 0 : 0,
  chapters: 0,
},
```

### Reusable Visual Pattern From Discover

The newly redesigned Discover page already has the LEAD/Luma-inspired card direction: student-first copy, event rows with image/fallback, stronger section hierarchy, and search surface. Mirror its visual discipline, but keep `/events` focused on registration/action.

```tsx
// SOURCE: app/[locale]/discover/discover-client.tsx:185-225
function EventRow({ event, locale }: { event: Event; locale: string }) {
  return (
    <Link
      href={`/${locale}/events/${event.id}`}
      className="group grid gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 md:grid-cols-[8.5rem_minmax(0,1fr)_8rem]"
    >
      <div className="flex flex-row gap-3 md:flex-col md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{formatDate(event.start_at)}</p>
          <p className="mt-1 text-lg font-semibold">{formatTime(event.start_at)}</p>
        </div>
        <Badge variant="outline" className="w-fit">
          {getEventTypeLabel(event.event_type)}
        </Badge>
      </div>
```

### Existing Generic Event Card Pattern

There is also a reusable `components/events/event-card.tsx`, but the public events route currently uses its local `EventCard`. Do not refactor shared cards in Phase 1 unless the local implementation becomes too duplicated.

```tsx
// SOURCE: components/events/event-card.tsx:81-90
return (
  <div className="group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg">
    <div className="relative aspect-video bg-muted">
      {coverImage ? (
        <Image src={coverImage} alt={title} fill className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
          <span className="text-muted-foreground">No image</span>
        </div>
      )}
```

---

## Design Direction

### What We Are Borrowing From Luma

- Event cards should feel like public community opportunities, not admin rows.
- Dates should create a timeline rhythm.
- Event images or fallback visuals should make scanning easier.
- Each event should expose a clear next action close to the event content.
- Mobile should be stacked, legible, and action-oriented.

### What We Are Not Borrowing Yet

- Full search/filter system.
- Attendee avatar stacks.
- Map/sidebar calendar view.
- Host profiles and contact host actions.
- Impact Metrics fields.

Those are Phase 2/3 items and should not block this pass.

---

## Files to Change

| File | Action | Purpose |
| --- | --- | --- |
| `app/[locale]/events/page.tsx` | UPDATE | Main implementation: timeline grouping, richer event rows, CTA labels, image/fallback visual treatment, updated copy. |
| `tmp/visual-audit/events-page-luma-phase-1/*` | CREATE | Local-only screenshots for desktop/mobile visual verification. |

No database migration is required. No service-layer change is required unless implementation reveals missing fields.

---

## Implementation Tasks

### Task 1: Expand Events Copy For Action-Oriented UI

- **File**: `app/[locale]/events/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Add copy keys for direct CTAs: `register`, `apply`, `viewDetails`, `closed`, `pastAction`.
  - Add copy keys for timeline grouping labels if needed: `today`, `tomorrow`, `thisWeek`, or month labels.
  - Keep Spanish-first wording aligned with current public events copy.
- **Mirror**: `app/[locale]/events/page.tsx:27-100` existing `EVENT_COPY` object.
- **Validate**: `pnpm build`.

### Task 2: Add Timeline Grouping Helper

- **File**: `app/[locale]/events/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Create a pure helper such as `groupEventsByDate(events, locale)` or `getDateGroupLabel(event.start_at, locale)`.
  - Group upcoming events by calendar day or by month. Recommendation: group by month for long LEAD calendars, with day/date inside each card.
  - Keep deterministic sorting by `start_at`.
- **Mirror**: `app/[locale]/events/page.tsx:111-132` date/time formatting helpers.
- **Validate**: `pnpm build`.

### Task 3: Replace Public Event Card Layout With Image-Aware Event Row

- **File**: `app/[locale]/events/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Update the local `EventCard` component to include a right-side thumbnail on desktop and a stacked image/fallback on mobile.
  - Show title, short description preview, chapter, location, registered count/capacity, access model, and availability.
  - Keep the full card link behavior.
  - Use `next/image` for real `event.cover_image`.
- **Mirror**:
  - `app/[locale]/discover/discover-client.tsx:185-225` for image-aware row structure.
  - `components/events/event-card.tsx:81-90` for cover image/fallback handling.
- **Validate**: `pnpm build` and Playwright screenshots.

### Task 4: Add Polished LEAD Fallback Visuals

- **File**: `app/[locale]/events/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Add a helper like `getEventVisualTone(event)` or `getFallbackGradient(event)`.
  - Return subtle LEAD-branded gradient classes based on event type/access model/chapter title.
  - Render a calendar/spark icon and short label instead of `No image`.
  - Do not use loud red placeholder blocks or generic empty states.
- **Mirror**: `app/[locale]/discover/discover-client.tsx:151-181` opportunity gradient treatment.
- **Validate**: Browser screenshot confirms missing images still look intentional.

### Task 5: Put The Main Action Close To Each Event

- **File**: `app/[locale]/events/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Replace passive `Ver detalle` treatment with context-aware action label:
    - open event: `Registrarme` / `Register`
    - application event: `Postular` / `Apply`
    - full/past: `Ver detalle` or disabled-looking non-interactive label only if the whole card remains clickable.
  - Keep the card as a link to detail page; do not attempt direct registration from list in Phase 1.
  - Place CTA near title/meta and ensure it remains visible on mobile.
- **Mirror**: `app/[locale]/events/page.tsx:227-236` current link-style CTA.
- **Validate**: Playwright desktop/mobile screenshots.

### Task 6: Render Upcoming Events In Timeline Sections

- **File**: `app/[locale]/events/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Replace the single `upcomingEvents.map(...)` block with grouped rendering.
  - Each group should have a small date/month label and a vertical stack of event rows.
  - Keep past events lower on the page, but do not over-invest there.
- **Mirror**: `app/[locale]/events/page.tsx:317-343` current upcoming events section.
- **Validate**: visual inspection confirms scan rhythm improved.

### Task 7: Visual QA With Playwright

- **File**: `tmp/visual-audit/events-page-luma-phase-1/`
- **Action**: CREATE local artifacts only
- **Implement**:
  - Start local dev server if needed.
  - Capture desktop and mobile screenshots for `/es/events`.
  - Check for text overflow, card crampedness, empty/fallback visuals, and mobile CTA visibility.
- **Mirror**: Existing screenshot workflow from `tmp/visual-audit/lead-discover-redesign/`.
- **Validate**: screenshots are saved locally and final response links them.

---

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Event cards become too visually heavy | Keep descriptions line-clamped and metadata compact. |
| Missing cover images make the page still feel empty | Use polished deterministic gradient fallbacks with icons/labels. |
| CTA implies direct registration but card only opens detail page | Label can be action-oriented, but destination remains event detail where auth/onboarding/registration logic lives. |
| Timeline grouping creates too much vertical whitespace | Group by month instead of every day if the event list is long. |
| Public page exposes QA events in QA/local screenshots | Do not solve data hygiene in this UI issue unless already filtered elsewhere; note artifact context. |
| Shared event cards diverge | Keep this as public route-specific UX for now; extract later only if reused. |

---

## Validation

```bash
pnpm build
pnpm lint
```

Manual/visual:

```bash
pnpm exec next dev -p 3010
# Capture /es/events at desktop and mobile with Playwright
```

Expected existing lint warnings may remain if unrelated to this change. Build must pass.

---

## Acceptance Criteria

- [ ] `/es/events` keeps existing public data and route behavior.
- [ ] Upcoming events are grouped in a timeline-like structure.
- [ ] Each event feels visually alive through cover image or polished fallback.
- [ ] Each event exposes a clear action label close to the title/content.
- [ ] Event rows remain scannable and do not become long description cards.
- [ ] Mobile layout is stacked, readable, and has no obvious overflow.
- [ ] `pnpm build` passes.
- [ ] `pnpm lint` passes or only reports pre-existing warnings.
- [ ] Desktop and mobile screenshots are saved under `tmp/visual-audit/events-page-luma-phase-1/`.

---

## Out Of Scope For This Plan

- Search and filters.
- Featured/flagship event block for LEAD SPARK.
- Attendee avatar/social proof beyond existing registered count.
- Add-to-calendar or share buttons.
- Event detail redesign.
- Impact Metrics fields or post-event reflection.
