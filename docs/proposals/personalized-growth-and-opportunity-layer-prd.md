# PRD: Personalized Growth and Opportunity Layer

**Product:** LEAD Talent Platform / Frontier  
**Date:** 2026-05-11  
**Status:** Draft for product and engineering review  
**Source Context:** Product gap analysis against the LEAD Talent Platform community value proposition  

---

## Problem Statement

LEAD Talent Platform currently provides a strong operational foundation for accounts, profiles, chapter membership, events, QR check-in, recruiter visibility, and admin workflows. This supports LEAD as an event, membership, and recruiter-access platform.

However, the emerging community proposition is larger:

> LEAD Talent Platform helps Latino students turn ambition into direction, direction into proof, and proof into opportunity.

The current product does not yet fully deliver that promise. Students can complete profiles, register for events, apply to chapters, and become visible to recruiters, but the platform does not yet tell them where they are in their growth, what pathway they are on, what they should do next, what proof they are building, or how each LEAD experience moves them closer to opportunity.

The result is a gap between the strategic promise and the product experience:

- Students are managed, but not yet guided.
- Events are operated, but not yet connected to pathways.
- Recruiters can view profiles, but not yet see structured readiness evidence.
- Admins can monitor operations, but not yet understand growth and impact.
- LEAD can collect data, but not yet consistently use it to personalize service.

## Solution

Build a personalized growth and opportunity layer on top of the existing LEAD Talent Platform foundation.

This layer will introduce:

- **Growth stages** that describe where a student is in their development.
- **Pathway interests** that connect students to LEAD programs, pillars, and opportunities.
- **Next Three Moves** recommendations that make the student dashboard feel personal and actionable.
- **Event pathway metadata** that connects events to pillars, skills, target growth stages, and proof.
- **Proof-of-Growth Passport** entries that convert participation into evidence.
- **Recruiter readiness signals** that show why a student is opportunity-ready.
- **Impact intelligence foundations** that prepare LEAD to connect Pulse, Impact Metrics, and Talent Platform data.

The first release should be intentionally small. The goal is not to build a full AI recommendation system. The goal is to prove that LEAD can use existing and new student data to give better next steps.

## MVP Boundary

### V1 Must Ship

V1 must include only the pieces required to prove the core loop:

1. 3-minute LEAD Pathway Check-In.
2. Growth stage result.
3. Primary focus result.
4. Learn + Connect + Prove recommendations.
5. Student dashboard card showing the current next moves.
6. Ability to mark a next move as started or completed.
7. Optional Growth Reflection prompt.
8. Basic progress summary.
9. Aggregate pilot metrics for admins or chapter leaders.

### V1 Should Not Ship

V1 should not include:

- AI recommendations
- recruiter-facing growth stage
- public proof portfolio
- awards or recognition system
- complete Pulse integration
- complete Impact Metrics Report automation
- complex pathway progression rules
- mentorship marketplace
- partner-facing talent reports

These are expansion paths, not first proof.

### V1 Success Definition

V1 succeeds if a new student can:

1. complete the check-in in under 3 minutes
2. understand their result without explanation from a leader
3. see exactly three next moves
4. complete at least one next move within 14 days
5. optionally create one Growth Reflection

## Office Hours Decisions

The first wedge is intentionally narrow:

**A new student who just joined LEAD and feels lost.**

The painful moment:

> I joined LEAD, but I do not know what to do next to get closer to my career goals.

The current workaround:

> They wait for announcements, attend whatever sounds useful, and try to figure out the rest alone.

The MVP:

**A 3-minute LEAD Pathway Check-In that gives the student a growth stage and their Next Three Moves.**

The check-in should optimize for:

**Opportunity readiness, delivered through community.**

The first proof artifact:

**LEAD Growth Reflection.**

The recommendation structure:

**Learn + Connect + Prove.**

The product principle:

**Progressive guidance, not exhaustive onboarding.**

The most important anti-goal:

**Do not make students feel evaluated before they feel supported.**

## Review Applied

This PRD was reviewed through three lenses:

- **CEO/product review:** Is the wedge sharp enough and does it create real pull?
- **Engineering review:** Are the states, data boundaries, and rollout constraints clear enough to build?
- **QA/adoption review:** Can we prove real students use it, not just that the feature exists?

### CEO Review Findings

The strongest version of this product is not "a better student dashboard."

It is:

**the first place a new LEAD student goes when they do not know what to do next.**

The PRD should therefore protect the first wedge from platform creep. Recruiter readiness, impact intelligence, awards, partner reports, and advanced proof are strategically important, but they should not dominate V1.

V1 must win one moment:

**A student joins LEAD feeling lost, completes a short check-in, and leaves with one clear next step they actually complete.**

If that moment works, LEAD has permission to expand.

If that moment does not work, the rest of the platform becomes decoration.

### Engineering Review Findings

The current platform already has a strong operational foundation:

- account identity
- `person_profile`
- chapter membership
- event registration
- event application flow
- recruiter visibility
- admin operations

The new layer should not destabilize those workflows.

Engineering should treat this as an additive capability:

- growth guidance is not membership
- pathway interest is not permission
- proof is private by default
- recommendations are explainable and rules-based in V1
- event metadata should enhance events, not block event creation
- recruiter visibility remains opt-in and should not automatically expose growth data

The highest-risk implementation mistake would be mixing growth stage with chapter status or recruiter readiness. These must remain separate concepts.

### QA and Adoption Review Findings

The riskiest assumption is that students will use this because it exists.

They will not.

Usage must be attached to existing student moments:

- joining LEAD
- registering for an event
- attending an event
- wanting internship readiness
- wanting proof for resumes or LinkedIn
- receiving chapter guidance

The product must be tested as a behavior loop, not a static feature.

The first QA question is not:

**Can a student complete the check-in?**

The first QA question is:

**Does completing the check-in increase the chance that a student takes a real next step?**

## Adoption Strategy

The product will not be adopted because LEAD asks students to use it.

It will be adopted if it attaches to moments students already care about:

- joining LEAD
- registering for events
- feeling behind
- wanting internships or opportunities
- wanting community or mentorship
- wanting proof for resumes, LinkedIn, interviews, or recruiters
- wanting recognition for work they are already doing

The platform must always give value before asking for more data.

Core adoption rule:

**Give a next step before asking for more data. Give proof before asking for visibility. Give clarity before asking for commitment.**

### Usage Loop

The first usage loop should be:

1. Student joins LEAD.
2. Student completes the 3-minute Pathway Check-In.
3. Student receives Learn + Connect + Prove recommendations.
4. Student registers for or attends one recommended event or activity.
5. Student completes a short Growth Reflection.
6. Reflection becomes proof of growth.
7. Platform gives an updated recommendation.

This loop is the product.

The dashboard, profile, proof passport, and recruiter visibility are all supporting surfaces around this loop.

### Product Hooks

#### Hook 1: Joining LEAD

The first experience should not be framed as profile completion.

It should be framed as:

**Let's find your first step in LEAD.**

The student answers five questions and immediately receives useful guidance.

#### Hook 2: Event Registration

When students register for relevant events, the platform can ask one lightweight question:

**What are you hoping to get from this event?**

This creates context without overwhelming the student.

#### Hook 3: Post-Event Reflection

After an event, the platform should prompt:

**Turn this experience into growth.**

The student completes a short Growth Reflection that can later become a resume bullet, LinkedIn post, interview story, proof-of-growth entry, or recruiter-visible highlight.

#### Hook 4: Chapter Leader Rituals

Students follow people, not platforms.

Chapter leaders should be able to use the product as part of real chapter behavior:

- New Member Check-In
- Post-Event Growth Reflection
- Monthly Next Move Update
- Chapter Growth Review
- Semester Opportunity Readiness Review

These rituals make the platform part of how LEAD operates, not a separate tool students forget.

#### Hook 5: Visible Progress

The student dashboard should show small, meaningful progress:

- next moves completed
- Growth Reflections completed
- events attended
- skills practiced
- proof created
- current stage

This should feel calm and professional, not childish or overly gamified.

#### Hook 6: Useful Proof

Proof must help students outside LEAD.

Growth Reflections should be transformable into:

- resume bullets
- LinkedIn posts
- interview stories
- recruiter-visible proof highlights
- chapter impact insights
- future awards or recognition signals

If proof is useful beyond the platform, students have a reason to create it.

### Chapter Adoption

Chapter leaders need value too.

The platform should give chapter leaders aggregate insights such as:

- what new members are looking for
- which blockers are most common
- which pathways students care about
- what events produce reflections
- what skills students say they are practicing
- what support members are asking for

If the platform helps chapter leaders plan better events, they will drive student adoption naturally.

### Pilot Strategy

Do not roll this out to every chapter first.

Start with one or two active chapters with strong leadership and real student activity.

Recommended 30-day pilot:

- 50 students
- all students complete the 3-minute check-in
- each student receives Learn + Connect + Prove recommendations
- at least one event connects to Growth Reflection
- chapter leaders review aggregate insights
- students answer a before/after clarity question

Pilot success criteria:

- 70% check-in completion
- 40% complete at least one recommended next move within 14 days
- 25% complete at least one Growth Reflection
- clarity score improves by 30%
- chapter leaders report that insights helped programming decisions

## North Star

Every student in LEAD should be able to say:

> I am seen. I am guided. I am growing. I am closer to opportunity.

## User Stories

1. As a student, I want to understand my current growth stage, so that I know where I am in my LEAD journey.
2. As a student, I want the platform to recommend my next three moves, so that I know what to do after completing my profile.
3. As a student, I want recommendations based on my goals, skills, interests, and chapter status, so that LEAD feels personal instead of generic.
4. As a student, I want to choose a pathway interest, so that I can receive more relevant events, programs, and opportunities.
5. As a student, I want to see which events match my stage or pathway, so that I spend time on experiences that help me grow.
6. As a student, I want to understand what skill or proof an event helps me build, so that I can connect attendance to personal growth.
7. As a student, I want to add proof-of-growth items after events or programs, so that I can build a record of what I have done.
8. As a student, I want to attach links or reflections to proof items, so that my growth is visible beyond attendance.
9. As a student, I want to see a summary of my proof, skills, and LEAD contributions, so that I can use it for resumes, LinkedIn, interviews, and recruiter visibility.
10. As a student, I want my recruiter-visible profile to show verified evidence of my growth, so that companies understand more than my basic profile.
11. As a student, I want to control recruiter visibility and proof visibility, so that I can decide what is shared externally.
12. As a student, I want clear language explaining why LEAD asks for certain profile information, so that data collection feels like service, not surveillance.

13. As a chapter member, I want chapter events to be connected to LEAD pillars, so that I understand why each experience matters.
14. As a chapter member, I want post-event prompts that help me reflect on what I learned, so that events become part of my development.
15. As a chapter member, I want the platform to recognize leadership contributions, so that chapter work becomes visible proof.

16. As a chapter editor, I want to tag events with pillars, pathways, target stages, and skills, so that chapter programming connects to LEAD's development model.
17. As a chapter editor, I want to define expected proof for an event, so that students know what they should leave with.
18. As a chapter editor, I want to see which students are Explorer, Builder, Leader, Candidate, or Emerging Professional, so that I can design better chapter experiences.
19. As a chapter editor, I want to see aggregate student needs and pathway interests, so that my chapter can create programming based on member demand.
20. As a chapter editor, I want event impact metadata to feed future reports, so that reporting does not become duplicated work.
21. As a chapter editor, I want simple impact prompts after events, so that my team learns to think beyond attendance.

22. As an admin, I want to configure growth stages and pathway options, so that LEAD can evolve the development model over time.
23. As an admin, I want to see pathway participation across chapters, so that LEAD can understand student demand.
24. As an admin, I want to see proof-of-growth activity, so that LEAD can identify whether students are building evidence.
25. As an admin, I want to see events by pillar and pathway, so that LEAD can understand where programming is strong or weak.
26. As an admin, I want to see chapter-level growth and impact indicators, so that LEAD can support chapters more strategically.
27. As an admin, I want the new data model to prepare for future LEAD Pulse and Impact Metrics integration, so that the platform can become an intelligence layer.
28. As an admin, I want to avoid creating heavy reporting work for chapters, so that the system remains useful and sustainable.

29. As a recruiter, I want to see student readiness signals, so that I understand why a candidate may be a strong fit.
30. As a recruiter, I want to see proof-of-growth highlights, so that I can evaluate students beyond major and graduation year.
31. As a recruiter, I want to filter or scan for skills with evidence, so that talent discovery is more credible.
32. As a recruiter, I want to see LEAD-verified involvement, so that I understand the student's engagement with the ecosystem.
33. As a recruiter, I want proof signals to be consent-aware, so that student trust and privacy are protected.

34. As LEAD leadership, I want Talent Platform to connect Pulse, Impact Metrics, and student growth, so that LEAD can listen, learn, and personalize.
35. As LEAD leadership, I want to measure transformation rather than only activity, so that LEAD can prove impact to partners.
36. As LEAD leadership, I want to recognize chapters based on growth and impact, so that awards and recognition reward quality, not just volume.
37. As LEAD leadership, I want a scalable model that starts simple, so that the platform can evolve without overbuilding.
38. As a new student, I want the first check-in to take only a few minutes, so that I do not feel overwhelmed before receiving value.
39. As a new student, I want to answer a small number of simple questions, so that the platform can guide me without making onboarding feel like an application.
40. As a new student, I want my recommendations organized into Learn, Connect, and Prove, so that I know how to grow without receiving a long task list.
41. As a new student, I want my first proof artifact to be a reflection, so that I can process what I learned before turning it into a resume bullet, LinkedIn post, or interview story.
42. As a new student, I want proof-building to feel supportive rather than performative, so that I do not feel judged before I feel guided.
43. As a new student, I want the platform to connect my check-in to real events or community actions, so that my next steps feel immediately usable.
44. As a new student, I want to see progress after completing a next move, so that I feel momentum instead of just completing tasks.
45. As a chapter leader, I want aggregate check-in insights, so that I can understand what new members need before planning programming.
46. As a chapter leader, I want post-event Growth Reflections to produce chapter-level learning, so that events become easier to improve.
47. As LEAD leadership, I want adoption metrics tied to student behavior, so that we know whether the platform is actually moving students forward.

## Implementation Decisions

### Product Modules To Build Or Modify

- **Student profile and onboarding**
  - Extend profile capture with growth-oriented fields.
  - Keep existing `person_profile` responsibilities intact.
  - Do not collapse membership status and growth stage into one concept.

- **Student dashboard**
  - Add a growth-stage display.
  - Add a "Next Three Moves" recommendation card.
  - Add pathway interest and proof-of-growth entry points.

- **Recommendation engine**
  - Start with deterministic rules based on profile completeness, membership status, growth stage, pathway interest, recruiter visibility, event participation, and proof activity.
  - Keep the interface simple enough to replace or enhance later with AI.

- **3-minute LEAD Pathway Check-In**
  - Ask only the minimum questions needed to create useful guidance.
  - Produce a growth stage, primary focus, and Next Three Moves.
  - Avoid making the first experience feel like a long application.
  - Earn the right to ask more questions after giving value.

- **Events**
  - Add strategic metadata for pillar, pathway, target stage, skills, expected proof, and recommended next step.
  - Keep current event registration and application workflows stable.

- **Proof-of-Growth Passport**
  - Add a student-owned record of proof items.
  - Allow proof items to optionally link to events, pathways, pillars, and skills.
  - Support link-based evidence before supporting complex file workflows.

- **Recruiter/company portal**
  - Add readiness and proof highlights to student profiles.
  - Keep recruiter visibility consent as a hard boundary.

- **Admin and chapter intelligence**
  - Add basic reporting surfaces for pathway participation, proof activity, event pillar distribution, and chapter growth indicators.
  - Design these as foundations for future Pulse and Impact Metrics integration.

### Data Model Implications

The implementation will likely require new tables or fields for:

- student growth stage
- pathway interest
- recommendation records or computed recommendation output
- event pillar/pathway metadata
- proof-of-growth items
- proof visibility settings

Growth stage should be separate from chapter membership status.

Pathways should be configurable enough to support future programs such as LEAD HER, Frontier, STARS, LEAD Academia, and chapter leadership pathways.

Proof items should be student-owned, consent-aware, and optionally verifiable by LEAD staff or chapter editors in later phases.

### Required V1 State Model

V1 should define these states explicitly:

#### Check-In State

- not_started
- in_progress
- completed

#### Growth Stage

- explorer
- builder
- leader
- candidate
- emerging_professional

Growth stage describes development context only. It must not grant permissions, recruiter access, chapter access, or official status.

#### Recommendation State

- active
- started
- completed
- dismissed

Each active recommendation set must contain:

- one Learn move
- one Connect move
- one Prove move

#### Proof State

- private
- student_selected_for_profile
- recruiter_visible
- archived

Proof must start private by default.

#### Reflection State

- draft
- completed
- transformed

Transformed means the reflection has been used to create another output such as a resume bullet, LinkedIn draft, interview story, or proof highlight.

### Data Boundaries

The product should preserve these boundaries:

- `person_profile` remains the basic identity and profile layer.
- Chapter membership remains the source of chapter approval and official member status.
- Growth stage should live in a separate growth or guidance layer.
- Recommendations should be generated from profile and activity data, but stored or logged enough to measure action.
- Proof items should be student-owned and permissioned separately from profile visibility.
- Recruiter visibility should never imply automatic proof visibility.

The first proof artifact should be a **LEAD Growth Reflection**, not a resume bullet.

Recommended reflection structure:

1. What did I participate in?
2. What did I learn?
3. What skill or mindset did I practice?
4. How does this connect to my goals?
5. What is my next move?

The reflection can later be transformed into:

- resume bullet
- LinkedIn post
- interview story
- recruiter-visible growth signal
- chapter impact insight

### Recommendation Rules

The first version should prioritize clarity over intelligence.

The first experience should ask only five questions:

1. What are you mainly looking for in LEAD right now?
2. What feels hardest right now?
3. What are you studying or interested in?
4. How confident do you feel about your next step?
5. How much time can you commit this month?

The output should include:

- current growth stage
- primary focus
- Next Three Moves
- optional Growth Reflection prompt

Example recommendation categories:

- Complete profile
- Apply to a chapter
- Attend a relevant event
- Upload or link proof
- Improve recruiter readiness
- Join a pathway
- Explore mentorship
- Update resume or LinkedIn
- Participate in LEAD HER, LEAD Academia, Frontier, or another program

Recommendations should be explainable. A student should understand why each next move appears.

Every recommendation set should include exactly one move in each category:

- **Learn:** one event, workshop, program, or resource.
- **Connect:** one mentor, chapter touchpoint, peer action, or community step.
- **Prove:** one tiny artifact, reflection, project step, or career-readiness action.

Example:

- Learn: Attend one career-readiness or AI workshop this month.
- Connect: Message your chapter lead and ask about one beginner-friendly role.
- Prove: Write a 5-minute Growth Reflection after your next LEAD activity.

### Capability Constraints

- Existing account, profile, membership, event, and recruiter workflows must continue working.
- Recruiter visibility must remain opt-in.
- Membership status must remain controlled by chapter approval.
- Growth stage must not grant permissions by itself.
- Pathway interest should guide recommendations, not restrict participation.
- Proof visibility must respect student consent.
- Impact tracking should reduce duplicate reporting work, not add another heavy process.
- Students must receive value before being asked to complete a full profile.
- Students must never be ranked against other students in V1.
- Chapter leaders should receive aggregate insights, not private student reflections by default.
- Recommendations must always be explainable in simple student-facing language.
- The platform must support a pilot rollout without requiring all chapters to adopt the workflow.

### Rollout Flags

V1 should be controllable by rollout configuration:

- enable check-in by chapter
- enable recommendation card by chapter
- enable Growth Reflection by event or chapter
- enable chapter aggregate insights for pilot chapters

This prevents a half-proven workflow from being forced across all chapters.

## Testing Decisions

Tests should focus on external behavior and product rules, not implementation details.

### Modules To Test

- Growth stage classification or persistence.
- Recommendation generation.
- Student dashboard data assembly.
- Event metadata validation.
- Proof-of-growth creation and visibility rules.
- Recruiter profile readiness/proof visibility.
- Admin or chapter aggregation logic.

### Existing Testing Patterns To Reuse

The repository already uses:

- Vitest for unit tests.
- Service-layer tests.
- Auth and permission helper tests.
- Onboarding helper tests.
- Architecture tests.

The new work should follow the same pattern:

- Put business logic in service modules.
- Keep server actions thin.
- Test service behavior directly.
- Add route or UI tests only where user flow risk is high.

### Key Test Cases

- A participant without a completed profile receives profile-completion recommendations.
- A participant with a profile but no chapter membership receives chapter or event recommendations.
- An official member with skills and pathway interest receives pathway/event/proof recommendations.
- A student with no proof receives a proof-building recommendation.
- A student who has not opted into recruiter visibility does not expose proof to recruiters.
- A recruiter sees only proof highlights that are allowed for recruiter visibility.
- An event cannot be saved with invalid pillar/pathway metadata.
- Admin aggregation excludes private proof unless explicitly allowed.
- A new student can complete the 3-minute check-in without completing a full talent profile.
- Every generated recommendation set contains one Learn, one Connect, and one Prove move.
- Completing a recommended move updates the student's visible progress.
- Completing a Growth Reflection creates a private proof item by default.
- Chapter leaders can view aggregate check-in insights without seeing private student reflections unless permissions allow it.

## Success Metrics

### Primary Activation Metric

**Percentage of new students who complete at least one recommended next move within 14 days.**

This is the strongest signal that the platform is not only inspiring students, but helping them move.

### Supporting Metrics

- check-in start rate
- check-in completion rate
- recommendation click-through or action-start rate
- Growth Reflection completion rate
- event-to-reflection conversion rate
- student clarity score before and after check-in
- 30-day return rate
- number of proof items created
- chapter leader insight usage
- percentage of students who complete Learn + Connect + Prove within a semester

### Retention Metric

**Percentage of students who return to update progress or complete another reflection within 30 days.**

### Chapter Adoption Metric

**Percentage of pilot chapter leaders who use aggregate insights to plan or adjust at least one event or member touchpoint.**

### Failure Metrics

The pilot should be considered at risk if:

- fewer than 50% of invited students complete the check-in
- fewer than 20% complete one next move within 14 days
- students report that the check-in feels like a form instead of guidance
- chapter leaders do not use the aggregate insights
- Growth Reflections feel like homework rather than useful proof
- recommendations repeatedly point students to unavailable events or unclear actions

### Instrumentation Requirements

The product must log enough events to evaluate the loop:

- check-in started
- check-in completed
- recommendation set generated
- recommendation viewed
- recommendation started
- recommendation completed
- recommendation dismissed
- event registered from recommendation
- Growth Reflection prompted
- Growth Reflection completed
- proof item created
- dashboard returned within 30 days

These events should support chapter-level aggregation without exposing private student content.

## Out of Scope

The first release should not include:

- Full AI-powered recommendation engine.
- Full LEAD Pulse integration.
- Full Impact Metrics Report automation.
- Awards and gala recognition system.
- Semantic resume parsing.
- Complex recruiter matching algorithms.
- Mentor marketplace.
- Payment, sponsorship, or partner campaign system.
- File-heavy proof portfolio beyond simple links and text.
- Complex pathway prerequisites or locked progression.
- Full profile completion before value is delivered.
- Public proof artifacts by default.
- Recruiter-facing growth stages in the first release.
- Ranking or scoring students against each other.
- Any promise of internships, jobs, or guaranteed outcomes.
- A large dashboard that asks students to process too many options at once.

## Further Notes

This PRD should be treated as the bridge between the current operational platform and the new strategic proposition.

The most important product shift is:

**from managing participation to guiding growth.**

The fastest meaningful release is:

1. Growth stage.
2. Pathway interest.
3. Next Three Moves.
4. Event pathway metadata.
5. Proof-of-Growth Passport MVP.

If only one thing ships first, it should be **Next Three Moves** on the student dashboard, powered by simple rules. That is the first visible moment where the platform begins to feel personalized.

After office hours, the sharper MVP is:

1. 3-minute LEAD Pathway Check-In.
2. Growth stage result.
3. Learn + Connect + Prove recommendations.
4. Optional LEAD Growth Reflection.
5. Student dashboard card that keeps the next moves visible.

The MVP should be judged by one primary metric:

**Percentage of new students who complete at least one recommended next move within 14 days.**
