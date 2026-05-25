# Issues: Event Detail, Ticket, and Lifecycle Experience

Source PRD: `.github/PRDs/events-attendee-experience-detail-ticket-lifecycle.prd.md`

GitHub issues:

- EVT-ATT-01: https://github.com/lead-mindset/leadtalentplatform-latest/issues/243
- EVT-ATT-02: https://github.com/lead-mindset/leadtalentplatform-latest/issues/245
- EVT-ATT-03: https://github.com/lead-mindset/leadtalentplatform-latest/issues/244
- EVT-ATT-04: https://github.com/lead-mindset/leadtalentplatform-latest/issues/246

## Issue: EVT-ATT-01 - Add Event Lifecycle and Calendar Helpers

**Type**: Technical  
**Priority**: High  
**Complexity**: Medium  
**Phase**: Phase 1 - Lifecycle And Calendar Foundation  
**Labels**: technical, frontend, events, testing

### Description

As a platform maintainer, I want event lifecycle and calendar behavior to be derived from shared helpers, so that public event detail, registration confirmation, and student ticket surfaces use consistent states and calendar data.

### Acceptance Criteria

- [ ] Given event time, access model, capacity, and optional registration status, when lifecycle is derived, then the helper returns a student-facing state with label, tone, and action guidance.
- [ ] Given an event with title, start/end, location, meeting URL, and detail URL, when calendar links are generated, then Google Calendar and `.ics` data include the expected fields.
- [ ] Given registered, pending, rejected, cancelled, attended, full, live, and past cases, when tests run, then lifecycle outputs remain stable.
- [ ] Given no new schema changes, when helpers are imported by UI surfaces, then existing service/action contracts remain unchanged.

### Technical Notes

- Likely create `lib/events/lifecycle.ts`.
- Likely create `lib/events/calendar.ts`.
- Add focused tests under `lib/events/__tests__/`.
- Reuse existing event and registration status types where possible.

### Dependencies

- Blocks: EVT-ATT-02, EVT-ATT-03

## Issue: EVT-ATT-02 - Redesign Event Detail Hero and Registration Confirmation

**Type**: Enhancement  
**Priority**: High  
**Complexity**: Large  
**Phase**: Phase 2 - Event Detail Hero And Registration Confirmation  
**Labels**: enhancement, frontend, events, ux

### Description

As a student, I want the event detail page to show the event identity, host, date, location, availability, and main action immediately, so that I can trust the event and know what to do next.

### Acceptance Criteria

- [ ] Given a published event, when a student opens the detail page, then title, host, date/time, location/online status, access model, availability, and primary action are visible in the first viewport on desktop.
- [ ] Given a mobile viewport, when the detail page renders, then the CTA remains clear without horizontal overflow.
- [ ] Given successful open registration, when the server action returns, then the UI shows a confirmation/redirect state with QR and add-to-calendar next steps.
- [ ] Given application, full, live, past, logged-out, or incomplete-profile states, when the page renders, then existing gating behavior remains intact.

### Technical Notes

- Update `app/[locale]/events/[id]/_components/EventContent.tsx`.
- Update `components/events/event-registration-checkout.tsx`.
- Reuse lifecycle and calendar helpers from EVT-ATT-01.
- Keep registration/application actions unchanged unless a narrow return value is needed for confirmation UI.

### Dependencies

- Blocked by: EVT-ATT-01
- Blocks: EVT-ATT-04

## Issue: EVT-ATT-03 - Improve Student Ticket QR Guidance and Lifecycle States

**Type**: Enhancement  
**Priority**: High  
**Complexity**: Medium  
**Phase**: Phase 3 - Ticket Page And Event-Day Guidance  
**Labels**: enhancement, frontend, events, ux

### Description

As a registered student, I want my QR ticket page to explain what code to show, what status I am in, and what to do if QR scanning fails, so that event-day check-in is faster and less stressful.

### Acceptance Criteria

- [ ] Given a registered future event, when the student opens `My events`, then the QR is labeled as an event check-in code and includes compact arrival guidance.
- [ ] Given pending, rejected, cancelled, attended, and past registrations, when the ticket card renders, then the UI does not imply the QR is valid.
- [ ] Given a registered future event, when the student views the ticket, then add-to-calendar actions are available.
- [ ] Given the existing check-in scanner, when QR guidance changes, then check-in action behavior remains unchanged.

### Technical Notes

- Update `app/[locale]/student/events/page.tsx`.
- Consider a reusable `components/events/event-calendar-actions.tsx`.
- Consider a reusable `components/events/event-day-guidance.tsx`.
- Reuse lifecycle and calendar helpers from EVT-ATT-01.

### Dependencies

- Blocked by: EVT-ATT-01
- Blocks: EVT-ATT-04

## Issue: EVT-ATT-04 - Validate Attendee Experience Across Desktop, Mobile, and Event Ops

**Type**: Technical  
**Priority**: High  
**Complexity**: Medium  
**Phase**: Phase 4 - QA And Polish  
**Labels**: technical, qa, frontend, events

### Description

As a platform maintainer, I want the improved attendee experience validated through automated checks and visual review, so that the shipped flow is both operationally safe and visually polished.

### Acceptance Criteria

- [ ] Given the implementation branch, when `pnpm test` runs, then event helper and relevant regression tests pass.
- [ ] Given the implementation branch, when `pnpm run event-ops:readiness` runs, then existing event operations still pass.
- [ ] Given the event detail and student events pages, when viewed on desktop and mobile, then no major text overflow, CTA ambiguity, or QR layout issue is visible.
- [ ] Given validation is complete, when the implementation report is written, then it includes commands run, results, screenshots or visual notes, and remaining risks.

### Technical Notes

- Use the Codex Desktop visual loop from `docs/handbook/UI_UX.md`.
- Prefer Browser plugin for local visual QA once a dev server is running.
- Do not include unrelated funding changes in reports or commits.

### Dependencies

- Blocked by: EVT-ATT-02, EVT-ATT-03
