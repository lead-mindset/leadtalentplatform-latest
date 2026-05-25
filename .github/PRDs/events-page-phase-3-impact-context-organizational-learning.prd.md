# PRD: Events Page Phase 3 - Impact Context and Organizational Learning

## Problem Statement

After Phase 1 makes the Events page feel more alive and Phase 2 makes it easier to navigate through search, filters, flagship placement, and mobile polish, LEAD will still need a stronger bridge between event activity and organizational impact.

Today, an event can answer basic operational questions: what is happening, when it is happening, where it is happening, who is hosting it, and whether someone can register or apply. But LEAD's long-term vision requires events to also support more strategic questions:

- What problem or need did this event address?
- Which LEAD value or impact pillar does it connect to?
- What did students learn or build through it?
- What evidence of impact did the chapter generate?
- How does this event contribute to LEAD's broader mission, OKRs, and organizational maturity?

This phase exists to begin connecting public event discovery with LEAD's future Impact Metrics Report and organizational learning system, while keeping the student-facing Events page simple, motivating, and action-oriented.

The Events page should not become a reporting dashboard. Instead, it should surface impact context in a student-friendly way and prepare the underlying product model for deeper impact capture over time.

## Solution

Add lightweight, student-facing impact context to events and define how event activity can begin feeding future Impact Metrics workflows.

Phase 3 should focus on showing the “why” behind events without overwhelming students. It should help students understand not only that an event exists, but what kind of growth, purpose, and contribution it represents.

This phase should introduce or prepare for:

1. Student-facing impact context on event cards and/or event detail pages.
2. Clear connection between events and LEAD pillars, values, programs, or learning outcomes.
3. A foundation for future post-event reflection and chapter learning workflows.
4. A path for events to feed Impact Metrics dashboards and reports later.
5. Optional connection points for LEAD Pulse in future phases, without implementing Pulse inside the Events page yet.

The page should still answer the student question: “What can I attend or apply to next?” But it should also start answering: “Why does this opportunity matter?”

## User Stories

1. As a student, I want to understand the purpose of an event, so that I know why it may be valuable to attend.
2. As a student, I want to see what skills or growth areas an event supports, so that I can choose opportunities aligned with my goals.
3. As a student, I want to see whether an event connects to career, leadership, community, technology, entrepreneurship, or impact, so that I can quickly understand its theme.
4. As a student, I want event impact language to be simple and motivating, so that I am not overwhelmed by organizational reporting terms.
5. As a student, I want to understand how attending events can help me build my LEAD path, so that participation feels connected to growth rather than isolated activities.
6. As a chapter leader, I want to connect my event to a purpose, pillar, or intended outcome, so that my team thinks beyond “we did an event.”
7. As a chapter leader, I want to define what success looks like before the event, so that the team can execute with more intention.
8. As a chapter leader, I want to capture what happened after the event, so that the chapter can learn and improve.
9. As a chapter leader, I want post-event reflection to be structured but lightweight, so that it supports learning without becoming bureaucratic.
10. As a chapter leader, I want event impact data to be reusable later, so that it can support recognition, reports, and chapter development.
11. As an admin, I want events to be associated with impact pillars or categories, so that LEAD can understand what kinds of impact chapters are generating.
12. As an admin, I want event impact metadata to be consistent, so that future dashboards do not depend on messy free-text data.
13. As an admin, I want to distinguish operational metrics from impact context, so that registration counts are not mistaken for full impact.
14. As an admin, I want to see which chapters are consistently creating events with clear purpose and reflection, so that we can support stronger chapter maturity.
15. As a board member, I want event activity to eventually feed Impact Metrics reporting, so that LEAD can show tangible progress to partners, companies, and sponsors.
16. As a board member, I want impact reporting to include both activity and quality, so that we do not reward only event volume.
17. As a board member, I want event metrics to connect to LEAD's values and pillars, so that execution stays aligned with mission.
18. As a program owner, I want events to connect to programs like LEAD HER, Stars, Frontier, Discover Day, and LEAD SPARK, so that program impact can be measured over time.
19. As a future sponsor, I want to understand the kinds of opportunities LEAD creates for students, so that partnership value is clearer.
20. As the platform maintainer, I want impact context to be added in phases, so that the Events page does not become too complex too quickly.
21. As the platform maintainer, I want any structured impact fields to have clear ownership, so that chapter editors know what they are responsible for entering.
22. As the platform maintainer, I want free-text reflection to be separated from structured impact fields, so that we can preserve both nuance and reporting quality.
23. As the platform maintainer, I want Phase 3 to avoid implementing full Impact Metrics dashboards prematurely, so that we first validate the capture model.
24. As the platform maintainer, I want the student-facing UI to remain clean, so that impact context supports decisions rather than distracting from registration.
25. As the platform maintainer, I want future LEAD Pulse integration to remain conceptually compatible, so that event impact and community health can later be analyzed together.

## Implementation Decisions

- Phase 3 depends on Phase 1 and Phase 2. It should not be the first Events page improvement shipped.
- The Events page should remain student-oriented and action-oriented.
- Impact context should be expressed in student-friendly language such as skills, purpose, growth area, community need, or opportunity type.
- Internal terms like OKRs, reporting, organizational intelligence, and Impact Metrics should not dominate the public student-facing UI.
- Structured impact metadata should be introduced cautiously and only when the team is ready to define canonical values.
- Potential structured fields may include impact pillar, LEAD value, program association, intended outcome, audience served, and post-event reflection status.
- If structured impact fields require schema changes, those should be specified in a dedicated implementation issue after the data model is agreed.
- If schema is not ready, Phase 3 may start with UI placeholders or documented product requirements rather than shipping incomplete fields.
- Public event cards should not become crowded. Impact context should be short and selectively shown.
- Event detail pages are a better place for richer purpose, learning outcomes, and post-event context than the event list page.
- Chapter editor event creation/editing flows will eventually need impact fields if the data is to be captured at the source.
- Post-event reflection should eventually live in chapter/editor workflows, not on the public Events page.
- Admin/board reporting should be future work after capture quality is validated.
- LEAD Pulse integration should remain conceptual in this PRD. Pulse measures member/community health; Impact Metrics measures event/activity/output impact. Later dashboards may compare both.
- Company/recruiter visibility should not be affected by this phase.
- No student profile visibility or company access behavior should change in this phase.

## Testing Decisions

- If Phase 3 introduces only UI display of existing data, validation should focus on build, lint, and visual QA.
- If Phase 3 introduces structured impact helpers, those helpers should be tested as pure logic.
- Good test targets include:
  - mapping impact pillar values to student-facing labels
  - mapping LEAD values to display labels
  - selecting which impact context appears on event cards versus detail pages
  - ensuring missing impact context does not break the public page
  - ensuring private/internal reflection does not appear publicly
- If schema changes are introduced later, service-layer tests should validate creation, update, and read behavior for structured impact fields.
- Visual QA should confirm that impact labels do not clutter event cards or overflow on mobile.
- Manual QA should verify that events with no impact metadata still render cleanly.
- Manual QA should verify that events with impact metadata communicate value without sounding like internal reporting.

## Out of Scope

- Full Impact Metrics dashboard.
- LEAD Pulse implementation.
- OKR dashboard.
- Awards or LEAD GALA recognition system.
- Sponsor-facing export/report generator.
- Company/recruiter matching changes.
- Direct registration from event cards.
- Search and filters, which belong to Phase 2.
- Flagship event placement, which belongs to Phase 2.
- Event detail visual redesign beyond displaying impact context if needed.
- Full post-event reflection workflow unless separately scoped.
- Full schema migration unless approved in a follow-up technical issue.
- Automated impact scoring.
- Public ranking of chapters.
- Public display of sensitive internal chapter performance data.

## Further Notes

Phase 3 is the bridge between “events as activities” and “events as evidence of growth, learning, and impact.”

The product principle is:

Students should see opportunity and purpose.
Chapter leaders should learn to plan and reflect strategically.
Admins and board should eventually gain reliable organizational intelligence.

This phase should be careful and intentional. The wrong implementation could make the Events page feel bureaucratic. The right implementation will make LEAD feel more purposeful while preserving the student-first experience.

Long-term, this phase supports the LEAD Impact Metrics Report by creating a path for events to capture purpose, pillars, outcomes, participation, reflection, and learning. It also remains compatible with LEAD Pulse by keeping event impact and organizational health as separate but eventually connectable dimensions.
