# PRD: Luma-Inspired Events Page Phase 1

## Problem Statement

The current public Events page in LEAD Talent Platform is operationally useful, but it does not yet feel as alive, scannable, or action-oriented as modern event discovery experiences like Luma. Students can see events, dates, chapters, locations, availability, and detail links, but the page still reads more like a structured listing than a student-facing opportunity hub.

For LEAD's next stage, especially with flagship events like LEAD SPARK and the broader goal of helping students participate, grow, and lead, the Events page should make opportunities feel tangible. A student should be able to quickly understand what is happening, when it is happening, who is hosting it, whether they can register or apply, and why the event might matter to them.

The platform already has strong underlying event operations: public events, open registration, application-based events, QR check-in, chapter ownership, registered counts, capacity, and event detail pages. This PRD focuses on improving the public Events page UI/UX so that this existing functionality is presented with stronger clarity, energy, and conversion intent.

## Solution

Redesign the public Events page as a Luma-inspired, LEAD-branded event discovery surface focused on student action.

This first phase will improve four things:

1. Make events feel alive through richer cards, visual hierarchy, chapter/location metadata, and social/operational signals like registrations and capacity.
2. Introduce a timeline-like structure so events are easier to scan chronologically.
3. Place the primary action close to each event so students can immediately understand whether to register, apply, or view details.
4. Add event imagery or polished LEAD-branded fallback visuals so events without cover images still feel intentional rather than unfinished.

The page should remain student-oriented. It should not become an internal admin dashboard, Impact Metrics surface, or sponsor report. Those systems matter later, but the Events page's first job is to help students find and take action on opportunities.

## User Stories

1. As a student, I want to quickly see upcoming LEAD events, so that I can decide where to participate next.
2. As a student, I want event cards to feel visually clear and engaging, so that I can tell which events are worth opening.
3. As a student, I want to see whether an event is open registration or application-based, so that I know what action is expected.
4. As a student, I want to see the main action near each event, so that I do not have to hunt for how to register or apply.
5. As a student, I want to see the event date and time clearly, so that I can quickly decide if I am available.
6. As a student, I want to see the event location or online status, so that I know whether the event is accessible to me.
7. As a student, I want to see which chapter is hosting an event, so that I can understand the community behind it.
8. As a student, I want to see registration counts and capacity when available, so that I can understand event momentum and urgency.
9. As a student, I want events to be grouped by date or month, so that I can browse the calendar more naturally.
10. As a student, I want events without custom images to still look polished, so that the platform feels trustworthy and complete.
11. As a student on mobile, I want event cards to stack cleanly, so that I can browse comfortably from my phone.
12. As a student on mobile, I want the action label to remain visible and understandable, so that I can move from browsing to registration quickly.
13. As a new public participant, I want the page to explain opportunities without requiring me to understand LEAD's internal structure, so that I can start from action rather than context overload.
14. As a chapter leader, I want my event to appear professionally on the public Events page, so that students take the opportunity seriously.
15. As a chapter leader, I want events without cover images to have a good fallback visual, so that a missing image does not make the event look incomplete.
16. As a chapter leader, I want capacity and registration status to be visible, so that students understand when an event is open, full, or application-based.
17. As a chapter leader, I want the public event list to send students to the correct event detail page, so that existing registration and application rules remain intact.
18. As an admin, I want the Events page redesign to reuse existing event data, so that we do not add unnecessary operational complexity.
19. As an admin, I want the page to preserve published/unpublished behavior, so that private or draft events do not become public accidentally.
20. As an admin, I want the page to keep past events separate from upcoming events, so that the public record remains useful without distracting from current opportunities.
21. As a future sponsor or partner casually browsing, I want LEAD events to look active and credible, so that the organization feels alive and well-operated.
22. As the platform maintainer, I want this redesign to be implemented in a contained way, so that we do not destabilize registration, application, check-in, or admin flows.
23. As the platform maintainer, I want visual QA screenshots for desktop and mobile, so that we can judge the actual rendered experience rather than only reviewing code.
24. As the platform maintainer, I want the page to pass type checks and lint validation, so that the change remains maintainable.
25. As the platform maintainer, I want this work to be scoped to Phase 1, so that search, filters, flagship placement, and Impact Metrics are not mixed into the first pass.

## Implementation Decisions

- The redesign will focus on the existing public Events page rather than the event detail page.
- The event detail page will remain the destination for actual registration, application, onboarding checks, and QR-related flows.
- The event list cards may use action-oriented labels such as “Registrarme” or “Postular,” but clicking the card should still route to the event detail page for the real flow.
- The redesign should reuse existing published event data, including title, description, cover image, start/end date, event type, capacity, access model, chapter, location, and registration count.
- No database schema changes are required for Phase 1.
- No changes to event registration, application review, QR check-in, company access, or admin permissions are included in this PRD.
- The public Events page should keep upcoming and past events separate.
- Upcoming events should be grouped in a timeline-like structure. The recommended grouping is by month for longer LEAD calendars, with date/time still visible inside each event card.
- Event cards should include a polished visual area. If an event has a cover image, render it. If not, render a deterministic LEAD-branded fallback using subtle gradients and icons.
- Fallback visuals should avoid loud placeholder colors and should not show generic “No image” text.
- Event cards should remain compact and scannable. Descriptions should be line-clamped.
- Mobile layout should be stacked and readable, not a cramped desktop row compressed into a phone viewport.
- This PRD should follow the visual direction already established in the redesigned Discover page, while keeping the Events page more action-oriented.
- Existing localization patterns should be preserved. Spanish and English copy should continue to be handled through the existing local copy object on the page for this phase.
- The implementation should remain contained unless a reusable helper becomes obviously beneficial.

## Testing Decisions

- The primary validation for this PRD is build/type safety plus visual QA.
- `pnpm build` must pass.
- `pnpm lint` must pass or only show unrelated pre-existing warnings.
- Browser screenshots should be captured for desktop and mobile views of the public Events page.
- Visual QA should verify that event cards do not overflow, text remains readable, CTAs are visible, fallback visuals look intentional, and the timeline grouping is easy to scan.
- Business logic tests are not required unless implementation extracts non-trivial pure helpers for timeline grouping, action label selection, or fallback visual selection.
- If pure helpers are extracted, tests should validate behavior rather than implementation details. Good test targets would include event grouping, action label resolution, and fallback visual selection.
- Existing event service tests are prior art for event business logic, but this PRD should not modify the event service unless necessary.
- Manual QA should verify both upcoming and past event sections when data exists.

## Out of Scope

- Search and filters on the Events page.
- A special featured/flagship event block for LEAD SPARK.
- Attendee avatar stacks or public attendee identity display.
- Add-to-calendar buttons.
- Share buttons.
- Event detail page redesign.
- Host/speaker profile cards.
- Map view or calendar sidebar.
- Country/chapter browsing, which belongs more naturally to Discover.
- Impact Metrics fields, post-event reflection, OKR alignment, or LEAD Pulse integration.
- Direct registration from the list page.
- Any database migration.
- Any change to auth, onboarding, registration, application review, or check-in behavior.

## Further Notes

This is Phase 1 of an Events page UX improvement. The goal is not to copy Luma literally, but to borrow the strongest event discovery practices and translate them into LEAD's student-oriented product language.

The Events page should answer: “What can I attend or apply to next?”

The Discover page should answer: “Where can I participate, grow, and lead inside LEAD?”

The event detail page should answer: “Do I want this specific event, and what do I need to do now?”

Keeping those jobs separate will make the platform clearer and easier to evolve.
