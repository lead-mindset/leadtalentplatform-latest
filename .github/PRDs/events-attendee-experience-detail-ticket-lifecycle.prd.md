# PRD: Event Detail, Ticket, and Lifecycle Experience

## Executive Summary

LEAD Talent Platform already has the core event operations needed for a controlled pilot: public event discovery, event detail pages, open registration, application-based registration, QR tickets, cancellation, application review, and check-in. The next product gap is attendee confidence.

Students should not merely be able to register. They should immediately understand why the event matters, who is hosting it, what happens after they register, how to add it to their calendar, and what to do when they arrive.

This PRD defines a Luma-inspired improvement pass focused on five agreed upgrades:

- Event detail hero with stronger first-screen clarity.
- Real add-to-calendar support.
- Post-registration confirmation experience.
- Event-day QR and arrival guidance.
- Consistent event lifecycle states across discovery, detail, ticket, and check-in flows.

The goal is not to copy Luma visually. The goal is to make LEAD events feel trustworthy, current, and easy to attend while preserving the platform's stronger chapter operations model.

## Mission

Make every published LEAD event feel clear enough to trust and simple enough to attend.

Core principles:

- Student-facing surfaces should be simpler than the underlying operations.
- The event detail page should answer: "Do I want to go, and what do I do next?"
- The ticket page should answer: "Am I ready to enter?"
- Lifecycle states should remove uncertainty instead of exposing internal process complexity.
- Operational workflows must remain service-layer backed and permission-safe.

## Target Users

### Student Participant

Pain points:

- Unsure whether an event is worth attending.
- Unsure what happens after registration.
- Unsure what to show at the door.
- Forgets to add events to a calendar.
- Gets confused by registration, application, pending, full, live, and past states.

Needs:

- A persuasive event detail page.
- A simple confirmation moment.
- Calendar support.
- Clear QR guidance.
- Consistent state labels.

### Chapter Event Organizer

Pain points:

- Students ask repeated logistical questions.
- Attendees arrive without QR codes ready.
- Event pages can feel too operational and not enough like a public invitation.
- Published events need to look credible even without custom assets.

Needs:

- Better public event presentation.
- Structured event-day instructions.
- Fewer support questions.
- Cleaner lifecycle states across the flow.

### Check-In Operator

Pain points:

- Attendees do not know what code to show.
- Students confuse event QR with member identity.
- Manual search fallback is needed when QR fails.

Needs:

- Student QR page that prepares attendees before they reach the desk.
- State labels that clearly distinguish valid, cancelled, pending, rejected, attended, and expired tickets.

## MVP Scope

### In Scope

- [ ] Redesign the event detail first viewport as a stronger hero.
- [ ] Add clear event metadata near the hero: date, time, location/online status, host chapter, access model, capacity/availability, and lifecycle state.
- [ ] Preserve the existing registration/application actions and onboarding gates.
- [ ] Add add-to-calendar actions after registration and from the event detail/ticket context.
- [ ] Add a post-registration confirmation experience before or alongside the QR redirect.
- [ ] Improve the student ticket/QR page with event-day instructions.
- [ ] Add consistent lifecycle state labels and helper copy across public events, event detail, student events, and check-in-related states.
- [ ] Handle open-registration and application-required events distinctly.
- [ ] Keep cancellation behavior intact.
- [ ] Run browser visual QA for desktop and mobile.

### Out of Scope

- Direct registration from public event cards.
- New public attendee identity or attendee avatar stacks.
- Payments, ticket tiers, waitlists, promo codes, or external ticket providers.
- New event recommendation algorithms.
- Public map view.
- Calendar sidebar on the events listing page.
- Host profile database model unless an existing user/chapter source is enough.
- Changes to chapter permissions, RLS policy design, or check-in authorization.
- Company/recruiter event workflows.
- Impact Metrics, LEAD Pulse, or post-event analytics dashboards.

## User Stories

1. As a student, I want the event detail page to show the event title, host, date, location, and main action immediately, so that I can decide quickly whether to attend.
2. As a student, I want the page to tell me whether I can register now, apply, join a full event later, or only view details, so that I know what action is possible.
3. As a student, I want to add the event to my calendar after registering, so that I do not forget to attend.
4. As a student, I want a confirmation state after registering, so that I know my registration worked and what to do next.
5. As a student, I want my QR ticket page to explain exactly what to show at the door, so that check-in is less stressful.
6. As a student, I want clear guidance when my event is pending review, rejected, cancelled, live, attended, or past, so that I do not misread my status.
7. As a chapter organizer, I want the event page to look like a credible invitation, so that students take the event seriously.
8. As a chapter organizer, I want calendar and arrival instructions to reduce repetitive questions, so that my team can focus on running the event.
9. As a check-in operator, I want attendees to arrive with the correct event QR ready, so that check-in moves faster.
10. As a platform maintainer, I want lifecycle states centralized or consistently derived, so that public pages, tickets, and check-in do not drift.

## Core Architecture & Patterns

This work should preserve the current service-layer architecture:

- Business rules stay in `lib/services/`.
- Server Actions in `lib/actions/events/` remain thin controllers.
- Event detail and student ticket UI live in App Router page/component surfaces.
- New UI helper logic may be extracted into small pure functions if it reduces duplication.

Likely surfaces:

- `app/[locale]/events/[id]/_components/EventContent.tsx`
- `components/events/event-registration-checkout.tsx`
- `app/[locale]/student/events/page.tsx`
- `components/events/registration-status-badge.tsx`
- `components/events/cancel-registration-dialog.tsx`
- `lib/actions/events/register.ts`
- `lib/services/event.service.ts`

Recommended helper candidates:

- `lib/events/lifecycle.ts` for deriving event and registration lifecycle labels.
- `lib/events/calendar.ts` for generating Google Calendar, Outlook, and `.ics` payloads/URLs.
- `components/events/event-calendar-actions.tsx` for reusable calendar UI.
- `components/events/event-day-guidance.tsx` for ticket/check-in guidance.

Avoid introducing a new data model unless structured event-day instructions cannot be handled safely with existing event fields.

## Tools And Features

### 1. Event Detail Hero

The event detail page should present the event as a public invitation, not just an operations record.

Requirements:

- Show cover image or polished LEAD fallback visual.
- Show title, host chapter, collaborators when useful, date/time, location/online status, access model, and lifecycle badge above or beside the main CTA.
- Keep registration/application CTA highly visible on desktop and mobile.
- Preserve existing onboarding and login branching.
- Make past/live/full states obvious without hiding the event's public record.

Acceptance criteria:

- A first-time visitor can identify event title, date, host, location, and next action without scrolling on common desktop viewports.
- On mobile, the CTA and primary state remain visible without horizontal overflow.
- Missing cover image still looks intentional.

### 2. Add-To-Calendar

Students should be able to add confirmed events to their calendar.

Requirements:

- Provide calendar actions after successful registration.
- Show calendar actions on the student ticket page for registered future events.
- Support at least Google Calendar and downloadable `.ics`.
- Outlook web link is recommended if low-risk.
- Calendar payload should include title, start/end time, location or meeting URL, and event detail URL.

Acceptance criteria:

- Registered future event exposes an add-to-calendar action.
- `.ics` download uses valid event title, start/end dates, and location.
- Calendar action is not shown as primary for pending/rejected/cancelled states.

### 3. Post-Registration Confirmation

The current flow redirects students to the QR page after registration. That is useful, but the product needs a clearer confirmation moment.

Requirements:

- After open registration succeeds, show "You're registered" confirmation with:
  - Event title.
  - Date/time.
  - QR/ticket next step.
  - Add-to-calendar action.
  - Event-day reminder guidance.
- This can be implemented as an inline success state before redirect, a confirmation panel on the ticket page, or a query-param-driven success highlight.
- Preserve the QR redirect because it is operationally valuable.

Acceptance criteria:

- Student receives visible confirmation in-product after registration.
- Confirmation includes the next most useful actions: view QR and add to calendar.
- Error and capacity-race behavior remain intact.

### 4. Event-Day QR Guidance

The ticket page should reduce day-of confusion.

Requirements:

- Clearly label the QR as the "Event Check-in Code."
- Explain that it is valid only for that event.
- Tell attendees to keep brightness high.
- Explain fallback: if QR fails, the check-in team can search by name/email.
- Distinguish event check-in QR from any future member identity QR.
- Keep guidance compact enough to be useful at the door.

Acceptance criteria:

- QR card includes event-specific label and arrival guidance.
- Registered future event displays guidance near QR.
- Pending/rejected/cancelled registrations do not imply a valid QR.

### 5. Lifecycle States

Lifecycle states should be consistent across public listing, event detail, student events, and check-in-adjacent screens.

Recommended event states:

- Draft: internal only.
- Published upcoming: public and actionable.
- Registration open: open event can accept registrations.
- Application required: application event can accept submissions.
- Full: capacity reached.
- Live: event is currently happening.
- Past: event has ended.
- Cancelled registration: user's registration inactive.
- Pending review: application submitted, not yet approved.
- Approved/registered: valid ticket exists.
- Rejected: application not selected.
- Attended: check-in completed.

Requirements:

- Avoid inconsistent labels such as "registered," "approved," and "ticket ready" meaning different things in different places.
- Use student-friendly copy while keeping internal status names unchanged.
- Event lifecycle should combine event time, publication, access model, capacity, and user's registration status.

Acceptance criteria:

- Public event detail, student ticket cards, and registration panel use compatible state language.
- Full/live/past states block or redirect actions correctly.
- Application states do not show QR until approved.

## Technology Stack

Use the existing stack:

- Next.js 15 App Router.
- React 19.
- Supabase with generated types in `lib/database.generated.ts`.
- Server Actions for registration/application/cancel flows.
- Tailwind CSS 4.
- Existing UI primitives in `components/ui`.
- Vitest for service/helper logic when extracted.
- Browser visual QA for rendered product.

Possible dependency decisions:

- Prefer no new dependency for calendar links.
- Generate `.ics` content locally with a small helper unless a proven dependency is already present and clearly justified.

## Security & Configuration

Security rules:

- Do not expose unpublished event data publicly.
- Do not expose private attendee data publicly.
- Do not make pending/rejected/cancelled registrations look valid for check-in.
- Calendar payload should only include public event detail data or user-authorized ticket context.
- QR token handling remains existing behavior; do not place QR token in public event detail URLs.

Configuration:

- No new environment variables expected.
- Calendar event URLs should derive from the current site origin or existing routing helpers.

## API Specification

No new external API is required for MVP.

Potential internal helpers:

```ts
type EventLifecycleState =
  | 'registration_open'
  | 'application_required'
  | 'full'
  | 'live'
  | 'past'
  | 'registered'
  | 'pending_review'
  | 'rejected'
  | 'cancelled'
  | 'attended'

type CalendarEventInput = {
  title: string
  description?: string | null
  startAt: string
  endAt: string
  location?: string | null
  meetingUrl?: string | null
  detailUrl: string
}
```

If an `.ics` download route is needed, prefer a narrow route such as:

```txt
GET /api/events/:eventId/calendar.ics
```

The route must only return calendar data for published events or events the signed-in user is authorized to view.

## Success Criteria

MVP is successful when:

- A student can understand the event's identity, date, host, location, and next action from the first screen.
- A registered student can add the event to a calendar in one obvious action.
- Registration success produces a clear in-product confirmation moment.
- The QR/ticket page gives enough event-day guidance to reduce check-in confusion.
- Lifecycle labels are consistent across event detail, student ticket, and registration states.
- Existing service-level event operations still pass.
- Desktop and mobile visual QA show no major overflow, CTA ambiguity, or broken QR layout.

Suggested metrics after launch:

- Increase event-detail-to-registration conversion.
- Reduce repeated logistical questions to chapter organizers.
- Reduce manual check-in fallback rate caused by students not finding QR.
- Increase percentage of registered attendees who open the ticket page before event start.

## Implementation Phases

### Phase 1: Lifecycle And Calendar Foundation

Deliverables:

- Define lifecycle helper or shared state mapping.
- Add unit tests for lifecycle derivation if extracted.
- Add calendar helper for Google Calendar and `.ics`.
- Add tests for calendar payload generation if extracted.

### Phase 2: Event Detail Hero And Registration Confirmation

Deliverables:

- Redesign event detail first viewport.
- Add confirmation state after successful open registration.
- Preserve application flow and onboarding redirects.
- Verify mobile CTA behavior.

### Phase 3: Ticket Page And Event-Day Guidance

Deliverables:

- Improve student events QR/ticket card.
- Add event-specific QR labeling.
- Add arrival/check-in guidance.
- Add calendar actions to registered future event tickets.

### Phase 4: QA And Polish

Deliverables:

- Run `pnpm run event-ops:readiness`.
- Run relevant Vitest coverage for event helpers/services.
- Run lint/build if implementation touches code.
- Perform browser visual QA on event detail and student events pages at desktop and mobile widths.
- Capture before/after screenshots where feasible.

## Future Considerations

- Optional host/person profiles on event detail pages.
- Structured "What to know" fields in event creation.
- Waitlist support for full events.
- Reminder emails before the event.
- Calendar cancellation/update support.
- Apple Wallet/Google Wallet ticket support.
- Public agenda/speaker blocks.
- Post-event recap and reflection prompts.
- Event-specific contact host workflow.

## Risks & Mitigations

### Risk: Calendar links drift from event edits

Mitigation:

- Generate calendar data from current event fields at render/request time.
- Avoid storing stale calendar payloads.

### Risk: Lifecycle helper becomes too abstract

Mitigation:

- Keep helper focused on labels/actions needed by current UI surfaces.
- Do not model every future state until needed.

### Risk: Confirmation step slows down QR access

Mitigation:

- Keep QR redirect or QR link prominent.
- Treat confirmation as clarity, not friction.

### Risk: Event detail redesign breaks registration/application behavior

Mitigation:

- Preserve existing actions.
- Keep service/action contracts unchanged unless absolutely necessary.
- Run event ops readiness after implementation.

### Risk: QR guidance becomes too verbose at the door

Mitigation:

- Use short, scannable bullet guidance.
- Put detailed instructions below the QR, not above the primary code.

## Appendix

Related files:

- `.github/PRDs/events-page-luma-inspired-phase-1.prd.md`
- `.github/PRDs/events-page-phase-2-search-flagship-mobile.prd.md`
- `.github/PRDs/events-page-phase-3-impact-context-organizational-learning.prd.md`
- `PRODUCT-STRATEGY.md`
- `docs/handbook/EVENT-OPERATIONS-CHECKLIST.md`
- `app/[locale]/events/page.tsx`
- `app/[locale]/events/[id]/_components/EventContent.tsx`
- `components/events/event-registration-checkout.tsx`
- `app/[locale]/student/events/page.tsx`
- `app/[locale]/chapter/events/_components/checkin-scanner.tsx`
- `lib/actions/events/register.ts`
- `lib/services/event.service.ts`

Current validation baseline:

- `pnpm run event-ops:readiness` passed locally with 8/8 flows before this PRD was written.

