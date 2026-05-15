# PRD: Student-Oriented Chapter Profiles and Chapter Directory

## Problem Statement

LEAD Talent Platform already has strong foundations for events, chapters, members, roles, onboarding, and chapter operations. However, students do not yet have a polished, first-class way to discover chapters as communities.

Today, chapter pages exist technically, but they are not yet treated as a core student-facing discovery layer. A student can discover events, and internal users can manage chapters, but there is still a gap between "I found LEAD" and "I understand which chapter I should follow, join, attend events with, or eventually help lead."

This matters because LEAD is chapter-driven. Chapters are where students experience community, events, leadership practice, professional growth, and the "first internship" operating model that LEAD wants to build. If events are the visible activity layer, chapters are the identity and belonging layer.

The platform should help students answer:

- Which LEAD chapters exist?
- Which chapter is relevant to my university, city, or country?
- What is this chapter doing?
- Who leads or represents it?
- What events can I attend?
- How can I apply, follow, or stay connected?

This also matters strategically for LEAD SPARK, LEAD Impact Metrics, LEAD Pulse, and future company-facing talent visibility. If chapter pages become structured and trustworthy, they can later become the place where activity, health, impact, and leadership maturity become visible without forcing the team to maintain separate spreadsheets or static pages.

## Solution

Create a student-oriented chapter discovery experience inspired by modern community/calendar pages like Luma, but adapted to LEAD's mission, Spanish-first internal operating model, and chapter-based organizational structure.

The solution should evolve the existing public chapter detail route into a polished chapter profile and later add a chapter directory for browsing across countries, cities, and universities.

The MVP should make each chapter page feel like a mini-home for that LEAD community:

- Strong chapter identity header.
- University, city, region, and country context when available.
- Clear student CTAs such as view events, apply/join, and follow updates.
- Upcoming events as proof of activity.
- Past/highlighted activity when available.
- Leadership/team preview when data is trustworthy.
- Location/social context.
- Honest empty states for chapters with limited activity.

The experience should be student-first. It should not become an admin dashboard, sponsor report, or Impact Metrics page in the first version. However, the structure should be future-ready so Impact Metrics, Pulse, recognition, and chapter health indicators can be added later.

## User Stories

1. As a student, I want to browse LEAD chapters, so that I can understand where I might belong.
2. As a student, I want to see chapters by university, so that I can find the chapter closest to my academic community.
3. As a student, I want to see chapters by city or country, so that I can understand LEAD's presence in my region.
4. As a student, I want each chapter page to explain what the chapter is, so that I do not need internal context before engaging.
5. As a student, I want to see upcoming chapter events, so that I can take action immediately.
6. As a student, I want to see whether a chapter has active events, so that I know if the community is currently moving.
7. As a student, I want to see past or highlighted events, so that I can understand what the chapter has already built.
8. As a student, I want to follow or subscribe to a chapter, so that I can receive updates before I am ready to apply.
9. As a student, I want to apply or express interest in a chapter, so that I can move from discovery to membership.
10. As a student, I want to see a chapter's location context, so that I know whether it is relevant to me.
11. As a student, I want chapter pages to work well on mobile, so that I can explore LEAD from my phone.
12. As a student, I want chapter pages to feel alive and credible, so that LEAD feels like an active community rather than a static organization.
13. As a public participant, I want to discover a chapter without creating an account first, so that I can decide whether LEAD is relevant to me.
14. As a public participant, I want to register for public events from a chapter page, so that event discovery and chapter discovery connect naturally.
15. As a public participant, I want to subscribe to chapter updates without being approved as a member yet, so that I can stay close to LEAD before joining.
16. As a current member, I want to see my chapter represented professionally, so that I feel proud to share it.
17. As a current member, I want my chapter's events to be visible, so that other students can join what we are building.
18. As a chapter leader, I want my chapter page to show upcoming events, so that students can engage with our work.
19. As a chapter leader, I want the page to make joining/following clear, so that recruitment is easier.
20. As a chapter leader, I want the page to show chapter leadership or team carefully, so that the right people are represented.
21. As a chapter leader, I want empty states to look intentional, so that a new or rebuilding chapter does not look broken.
22. As a chapter leader, I want the page to reuse platform data, so that I do not have to manually maintain another page.
23. As an operations leader, I want a chapter directory, so that LEAD has a clear source of truth for active chapters.
24. As an operations leader, I want chapter pages to separate public identity from internal permissions, so that chapter pages do not leak admin concepts.
25. As an operations leader, I want chapters to have consistent presentation, so that LEAD looks organized across countries and universities.
26. As an executive leader, I want chapter pages to show LEAD's geographic and university footprint, so that the organization's growth is visible.
27. As an executive leader, I want the directory to support Peru, Colombia, Ecuador, Dallas, and future locations, so that LEAD's expansion can be represented clearly.
28. As an executive leader, I want chapter pages to eventually connect to Impact Metrics, so that activity can become evidence of organizational impact.
29. As an executive leader, I want chapter pages to eventually support recognition, so that LEAD GALA and awards can consider real activity and contribution.
30. As a future sponsor or partner, I want to see active chapters and events, so that LEAD feels credible and organized.
31. As a future company representative, I want chapter context to help me understand where student talent is coming from, so that recruiting feels more grounded.
32. As an admin, I want the public chapter profile to use approved and public-safe data, so that member privacy is protected.
33. As an admin, I want chapter pages to avoid showing unreliable stats, so that the platform does not overstate activity.
34. As an admin, I want chapter pages to degrade gracefully when there are no upcoming events, no Instagram link, or incomplete data, so that every chapter page remains usable.
35. As an admin, I want chapter pages to use service-layer data fetching, so that chapter profile logic can be tested and maintained.
36. As the platform maintainer, I want chapter profile data to be resolved through a deep service module, so that UI components do not own business rules.
37. As the platform maintainer, I want a chapter directory model that can support filters later, so that we do not rewrite the page when countries/cities grow.
38. As the platform maintainer, I want visual QA for chapter pages, so that the experience is actually polished on desktop and mobile.
39. As the platform maintainer, I want this work to reuse existing chapter/event data, so that the MVP is fast and low-risk.
40. As the platform maintainer, I want Impact Metrics and Pulse to stay out of MVP implementation, so that the first release stays focused on discovery and action.

## Implementation Decisions

- The first implementation should evolve the existing chapter detail route rather than introducing a second competing chapter profile route.
- A future chapter directory should be introduced as the browse entry point for all active/public chapters.
- The chapter profile should be student-oriented, not admin-oriented.
- The MVP should reuse existing chapter, event, membership, and person profile data.
- A dedicated chapter profile service should resolve public-safe chapter profile data, including chapter identity, upcoming events, activity counts, team preview, and empty-state flags.
- A dedicated chapter directory service should resolve browseable chapter cards and basic filter data when the directory phase begins.
- Public chapter pages should not rely on direct database queries inside the page long term. Server components/actions should delegate business logic to the service layer.
- Chapter profile pages should only show trustworthy public-safe information. Avoid showing private member data, internal admin roles, or unapproved memberships.
- Team/leadership display should be conservative until chapter positions are standardized and validated. If position data is not trustworthy, show a "chapter community" preview instead of implying official leadership hierarchy.
- Stats should be limited to data the platform can calculate reliably, such as upcoming published events and approved member count. Avoid vanity metrics unless the data is validated.
- The chapter profile should include clear CTAs for students:
  - View upcoming events.
  - Apply or express interest in the chapter.
  - Follow/subscribe to chapter updates.
- Follow/subscribe may be a later phase if newsletter subscription flows need additional work. The MVP may show the CTA only if it connects to an existing safe flow.
- Event cards on chapter pages should reuse the event discovery language and location correctness work from the public Events page.
- Chapter pages should avoid decorative visual patterns that conflict with current UI guidelines. The experience should feel energetic and student-facing without using random gradient/orb decoration.
- Luma should be treated as inspiration for information architecture and community/calendar patterns, not as a visual clone.
- The directory should support browsing by chapter, country, city, and university over time.
- Spanish-first labels should be used for student/internal operational surfaces, with English support preserved through locale routing where practical.
- The initial release should not require a schema migration unless a missing field is absolutely necessary for public chapter identity.
- If chapter mission/description is not present in the schema, the first phase should use safe generated/structured fallback copy rather than blocking implementation.
- If richer chapter descriptions, cover images, or public status controls are needed, those should be defined as a separate follow-up schema issue.
- Impact Metrics, Pulse, OKRs, awards, and chapter health indicators should be future-ready but not implemented in the MVP.

## Testing Decisions

- Tests should focus on external behavior and business rules rather than implementation details.
- The chapter profile service should have unit tests for:
  - Chapter found.
  - Chapter missing.
  - Chapter with upcoming events.
  - Chapter with no upcoming events.
  - Chapter with approved members.
  - Chapter with no approved members.
  - Public-safe team preview behavior.
  - Reliable activity counts.
- The chapter directory service should have unit tests when directory implementation begins:
  - Active chapters returned in stable order.
  - Country/city/university filter metadata produced correctly.
  - Empty directory state.
  - Chapters with missing optional fields still render.
- UI validation should include desktop and mobile visual QA for:
  - A chapter with upcoming events.
  - A chapter with no upcoming events.
  - A chapter with social/location data.
  - A chapter with sparse data.
- Browser QA should verify:
  - No horizontal overflow on mobile.
  - CTAs are visible and understandable.
  - Event links route to public event detail pages.
  - Chapter profile pages do not expose private member emails by default.
  - Empty states are clear and polished.
- Accessibility checks should verify heading order, alt text, keyboard focus, contrast, and usable link/button labels.
- Required validation should include lint and build.
- Prior art includes existing event service tests, chapter service tests, public Events visual QA, and the current chapter page components.

## Out of Scope

- Full Impact Metrics dashboard.
- LEAD Pulse integration.
- OKR tracking.
- LEAD GALA awards scoring.
- Company-facing chapter analytics.
- Self-serve chapter creation.
- Public editing tools for chapter leaders.
- New chapter description/cover-image schema unless approved separately.
- Full member roster exposure.
- Showing private member emails publicly.
- Showing unapproved memberships publicly.
- Replacing chapter editor/admin dashboards.
- Rebuilding onboarding.
- Rebuilding event registration or application flows.
- Building a full newsletter/follow system unless an existing safe subscription path can be reused.
- Copying Luma's visual design directly.

## Further Notes

This PRD is inspired by Luma-style community and city event pages, especially the way they make a community or location feel like a living event calendar with a clear subscribe action. The useful pattern for LEAD is not the exact visual design; it is the product idea that a community page should combine identity, upcoming activity, and a simple way to stay connected.

Relevant inspiration:

- Luma Build Club community calendar: https://luma.com/buildercommunityanz
- Luma Atlanta city calendar: https://luma.com/atlanta

For LEAD, the equivalent should be chapter-first:

- Chapter identity.
- Chapter events.
- Chapter team/community.
- Chapter follow/join action.
- Later, chapter impact and organizational health.

The recommended implementation path is phased:

1. Polish the existing public chapter detail page.
2. Add a chapter directory.
3. Add follow/subscribe or interest capture.
4. Add validated chapter impact/activity signals.

This belongs after the Events page foundation work because events are the primary proof of chapter activity. It also connects naturally to the LEAD Talent Platform activation roadmap because chapter pages can help existing and new members understand where they fit before LEAD SPARK and future flagship programming.
