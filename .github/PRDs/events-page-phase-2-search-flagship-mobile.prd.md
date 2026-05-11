# PRD: Events Page Phase 2 - Search, Flagship Placement, and Mobile Polish

## Problem Statement

After Phase 1 improves the Events page with richer event cards, timeline grouping, clearer action labels, and polished event visuals, students will still need stronger ways to navigate a growing event catalog. As LEAD scales across chapters, programs, and countries, a plain chronological list will not be enough for students to quickly find the right opportunity.

The Events page must support faster discovery without becoming overwhelming. Students should be able to search and filter events by what matters to them, while major flagship events like LEAD SPARK should receive intentional placement instead of appearing as just another event row.

The page also needs a more refined mobile-first experience. Many students will discover LEAD opportunities through WhatsApp, Instagram, Discord, LinkedIn, or direct mobile links, so the mobile version must be highly scannable, responsive, and action-oriented.

## Solution

Build Phase 2 of the public Events page by adding student-oriented search, filters, flagship event placement, stronger scannability rules, and mobile-first interaction polish.

This phase should build on the Phase 1 Events page redesign and add four improvements:

1. Search and filters so students can find events by chapter, format, access model, topic/program, country/city, and date.
2. Flagship event placement so LEAD SPARK or other major opportunities can be visually elevated above the standard timeline.
3. Scannability refinements so event rows remain compact, clear, and easy to compare even as metadata grows.
4. Mobile-first layout improvements so browsing, filtering, and opening events works naturally from a phone.

The page should remain student-first. Filters should use language students understand, not internal operating language. The goal is to help students answer: “Which opportunity is right for me right now?”

## User Stories

1. As a student, I want to search events by title, so that I can quickly find a specific opportunity.
2. As a student, I want to search by chapter, so that I can find events from my university or local community.
3. As a student, I want to search by city or country, so that I can find events near me or relevant to my region.
4. As a student, I want to filter by event format, so that I can choose between in-person, online, and hybrid events.
5. As a student, I want to filter by access model, so that I can distinguish open registration from application-based opportunities.
6. As a student, I want to filter by date range, so that I can find events happening soon, this month, or later.
7. As a student, I want to filter by topic or program, so that I can find opportunities related to career, leadership, tech, impact, LEAD HER, LEAD SPARK, Stars, Frontier, or Discover Day.
8. As a student, I want active filters to be visible, so that I know why I am seeing a certain set of events.
9. As a student, I want to clear filters easily, so that I can return to all events without friction.
10. As a student, I want an empty state that explains what to do next, so that a failed search does not feel like a dead end.
11. As a student, I want flagship events to stand out, so that I do not miss high-priority opportunities like LEAD SPARK.
12. As a student, I want the flagship event block to clearly show date, location, chapter/program, and action, so that I can quickly decide whether to open it.
13. As a student, I want flagship placement to feel intentional but not overpower the rest of the page, so that regular chapter events still matter.
14. As a student on mobile, I want filters to be easy to open and close, so that the page does not become cluttered.
15. As a student on mobile, I want the event cards to remain readable after filters are applied, so that I can compare options quickly.
16. As a student on mobile, I want the main action to remain visible without awkward horizontal scrolling, so that I can continue to the event detail page easily.
17. As a chapter leader, I want students to be able to filter for my chapter, so that my chapter's events are discoverable.
18. As a chapter leader, I want my events to remain visually fair even when a flagship event is featured, so that smaller chapter events do not disappear.
19. As a program owner, I want events connected to a program to be discoverable by program/topic, so that initiatives like LEAD HER, Stars, Frontier, and Discover Day have clearer visibility.
20. As an admin, I want filter behavior to use existing event data when possible, so that we do not add unnecessary schema complexity.
21. As an admin, I want the flagship event logic to be deterministic and maintainable, so that the team can control what appears featured.
22. As an admin, I want test/QA events to avoid polluting the student-facing experience, so that public discovery feels credible.
23. As a platform maintainer, I want search and filtering logic to be isolated and testable if it becomes non-trivial, so that UI changes do not create hidden behavior bugs.
24. As a platform maintainer, I want visual QA across desktop and mobile, so that we catch overflow, cramped filters, and poor CTA placement before shipping.
25. As a future sponsor casually browsing, I want major LEAD opportunities to look credible and active, so that LEAD feels organized and high-momentum.

## Implementation Decisions

- Phase 2 builds on Phase 1 and should not be implemented before the Phase 1 base experience exists.
- The public Events page remains the main surface for event discovery and action.
- Event detail pages remain responsible for actual registration, application, onboarding checks, and QR-related behavior.
- Search should include event title, description, chapter name, location, and possibly program/topic metadata if available.
- Filters should prioritize student-facing categories: chapter, format, access model, date, location, and topic/program.
- If topic/program data is not yet structured in the schema, Phase 2 may use a conservative temporary approach based on title/description/program naming, but this should be clearly marked as transitional.
- Flagship placement should support LEAD SPARK first, but the design should be flexible enough for future flagship events.
- The flagship block should be visually distinct from regular events, but still use the same event source and link to the same event detail route.
- The implementation should avoid hardcoding fragile event IDs unless no better event metadata exists. Prefer title/program matching only as a short-term bridge.
- Filter state can initially live in client state. URL query persistence is optional for Phase 2 unless it is simple and low-risk.
- Empty states should be student-friendly and explain how to clear filters or broaden search.
- Mobile filters should use a compact trigger or drawer/sheet pattern rather than permanently occupying page space.
- The desktop experience may show filters inline or as a compact toolbar if it remains visually clean.
- This phase should not add direct registration from the list page.
- This phase should not change published event visibility rules.
- This phase should not add new database tables unless product requirements for topics/programs cannot be met safely with existing data.

## Testing Decisions

- `pnpm build` must pass.
- `pnpm lint` must pass or only show unrelated pre-existing warnings.
- If search/filter logic is extracted into pure functions, tests should validate external behavior:
  - search matches title, description, chapter, and location
  - format filters include the right events
  - access model filters distinguish open registration and application-required events
  - date filters include/exclude the correct events
  - clearing filters restores the unfiltered list
  - flagship selection returns the intended event and does not duplicate it in the standard list unless intentionally allowed
- Visual QA must include desktop and mobile screenshots.
- Mobile QA should verify filter opening/closing, text fit, event card readability, and no horizontal overflow.
- Desktop QA should verify the flagship block, filters, timeline/list relationship, and empty state.
- Test/QA event pollution should be checked in local/QA screenshots and handled either through data cleanup, filtering, or clear environment notes.

## Out of Scope

- Event detail page redesign.
- Direct registration from event cards.
- Add-to-calendar buttons.
- Share buttons.
- Attendee avatar stacks.
- Public attendee identity display.
- Map view.
- Calendar sidebar.
- Host/speaker profile cards.
- Impact Metrics fields.
- LEAD Pulse integration.
- OKR alignment.
- Post-event reflection.
- Company/recruiter event integration.
- New event creation workflows.
- Changes to event application review, QR check-in, auth, onboarding, or permissions.

## Further Notes

Phase 2 should make the Events page feel more like an active student opportunity hub while preserving LEAD's operational model.

The guiding product question is:

“Can a student quickly find the right LEAD opportunity for them?”

Phase 1 makes the page more alive.
Phase 2 makes the page easier to navigate.
Phase 3 can later connect events to impact, reflection, reporting, and organizational intelligence.
