# PRD: New Student Pathway Check-In

**Product:** LEAD Talent Platform / Frontier  
**Date:** 2026-05-11  
**Status:** V2 PRD for planning  
**Primary Wedge:** Help a new LEAD student know and complete one real next step  

---

## Problem Statement

New LEAD students often join with ambition, curiosity, and hope, but they do not always know what to do next.

Their current experience is too dependent on announcements, chapter context, social confidence, and informal guidance. A student may attend events, follow WhatsApp or Discord updates, ask older students for advice, or compare themselves on LinkedIn, but they may still feel unsure whether they are actually moving closer to their career goals.

The painful moment is:

> I joined LEAD, but I do not know what to do next to get closer to my career goals.

The current workaround is:

> Students wait for announcements, attend whatever sounds useful, and try to figure out the rest alone.

The current LEAD Talent Platform already has a strong operational foundation: accounts, profiles, chapter membership, events, QR check-in, recruiter visibility, and admin workflows. But it does not yet fully deliver the strategic promise that LEAD helps students turn ambition into direction, direction into proof, and proof into opportunity.

The product gap is not that students lack more features. The gap is that they need guidance at the moment they feel lost.

## Solution

Build a lightweight **New Student Pathway Check-In** that gives each new student:

1. A simple 3-minute check-in.
2. A growth stage result.
3. A primary focus result.
4. Three recommendations organized as Learn + Connect + Prove.
5. A student dashboard card that keeps those next moves visible.
6. A way to mark recommendations as started or completed.
7. An optional LEAD Growth Reflection that turns participation into proof.

The first version should not try to build the entire talent platform. It should prove one core behavior:

**A new student completes the check-in, receives clear guidance, and completes at least one recommended next move within 14 days.**

The product principle is:

**Progressive guidance, not exhaustive onboarding.**

The core adoption rule is:

**Give a next step before asking for more data. Give proof before asking for visibility. Give clarity before asking for commitment.**

## North Star

Every new student should be able to say:

> I am seen. I am guided. I am growing. I am closer to opportunity.

## User Stories

1. As a new student, I want to answer a short check-in, so that I can get guidance without feeling overwhelmed.
2. As a new student, I want the check-in to take around 3 minutes, so that it feels easy to complete.
3. As a new student, I want to share what I am looking for in LEAD, so that the platform can guide me toward relevant next steps.
4. As a new student, I want to share what feels hardest right now, so that LEAD can respond to my actual blocker.
5. As a new student, I want to share what I am studying or interested in, so that my recommendations are not generic.
6. As a new student, I want to rate my confidence about my next step, so that LEAD can understand how much guidance I need.
7. As a new student, I want to share how much time I can commit this month, so that my recommendations feel realistic.
8. As a new student, I want to receive a growth stage, so that I understand where I am in my LEAD journey.
9. As a new student, I want to receive a primary focus, so that I understand what kind of growth LEAD is helping me prioritize.
10. As a new student, I want exactly three next moves, so that I am not overwhelmed by a large dashboard or long task list.
11. As a new student, I want my next moves organized into Learn, Connect, and Prove, so that I know how to grow through action.
12. As a new student, I want one recommended learning action, so that I know what event, workshop, program, or resource can help me.
13. As a new student, I want one recommended connection action, so that I do not feel like I have to navigate LEAD alone.
14. As a new student, I want one recommended proof action, so that I can start turning participation into evidence.
15. As a new student, I want to mark a recommendation as started, so that I can create momentum.
16. As a new student, I want to mark a recommendation as completed, so that I can see progress.
17. As a new student, I want to see my next moves on my dashboard, so that I remember what to do after onboarding.
18. As a new student, I want the platform to explain why a recommendation was suggested, so that the guidance feels trustworthy.
19. As a new student, I want to dismiss a recommendation that does not fit, so that the system does not feel rigid.
20. As a new student, I want a short Growth Reflection prompt after a LEAD activity, so that I can process what I learned.
21. As a new student, I want my Growth Reflection to be private by default, so that proof-building feels safe.
22. As a new student, I want my reflection to later become a resume bullet, LinkedIn post, interview story, or proof highlight, so that LEAD helps me communicate my growth.
23. As a new student, I want the platform to avoid ranking me against other students, so that I feel supported rather than judged.
24. As a new student, I want the platform to avoid promising internships or jobs, so that expectations stay honest.

25. As a chapter leader, I want new members to complete a lightweight check-in, so that I understand what they need before planning support.
26. As a chapter leader, I want aggregate check-in insights, so that I can plan better events and member touchpoints.
27. As a chapter leader, I want to see common blockers among new students, so that I can respond with relevant programming.
28. As a chapter leader, I want to see which next moves students are completing, so that I know whether programming is actually helping.
29. As a chapter leader, I want post-event Growth Reflections to create chapter-level learning, so that events improve over time.
30. As a chapter leader, I want private student reflections protected, so that trust is not broken.

31. As an admin, I want to enable the check-in by chapter, so that we can pilot before rolling out to everyone.
32. As an admin, I want to see check-in completion rates, so that I know whether students are adopting the flow.
33. As an admin, I want to see next-move completion rates, so that I know whether the flow changes behavior.
34. As an admin, I want to see Growth Reflection completion rates, so that I know whether students are creating proof.
35. As an admin, I want to see failure metrics, so that I can identify when the pilot is not working.
36. As an admin, I want the data model to keep growth guidance separate from membership status, so that product concepts do not get mixed.
37. As an admin, I want rollout controls, so that unfinished workflows are not forced across all chapters.

38. As a future recruiter, I want proof and readiness signals to be consent-aware, so that student trust is protected.
39. As LEAD leadership, I want this feature to connect to the broader Talent Platform strategy, so that Pulse, Impact Metrics, and student growth can eventually reinforce each other.
40. As LEAD leadership, I want the first version to stay narrow, so that we prove real student behavior before expanding into dashboards, awards, and partner reports.

## Implementation Decisions

- The first user is a new student who joined LEAD and feels lost.
- V1 optimizes for opportunity readiness delivered through community.
- V1 should be additive to the existing platform and should not destabilize account, event, membership, recruiter, or admin workflows.
- The first experience is a 3-minute check-in, not a full talent profile.
- The check-in should ask only five questions:
  - What are you mainly looking for in LEAD right now?
  - What feels hardest right now?
  - What are you studying or interested in?
  - How confident do you feel about your next step?
  - How much time can you commit this month?
- The output should include:
  - growth stage
  - primary focus
  - Learn recommendation
  - Connect recommendation
  - Prove recommendation
  - optional Growth Reflection prompt
- Growth stage must be separate from chapter membership status.
- Growth stage must not grant permissions, recruiter access, chapter access, or official status.
- Recommendations should be deterministic and explainable in V1.
- Every active recommendation set must include one Learn move, one Connect move, and one Prove move.
- Recommendations must support these states:
  - active
  - started
  - completed
  - dismissed
- Check-in state should support:
  - not_started
  - in_progress
  - completed
- Growth stage should support:
  - explorer
  - builder
  - leader
  - candidate
  - emerging_professional
- Proof state should support:
  - private
  - student_selected_for_profile
  - recruiter_visible
  - archived
- Reflection state should support:
  - draft
  - completed
  - transformed
- The first proof artifact should be a LEAD Growth Reflection, not a resume bullet.
- Growth Reflections should be private by default.
- A Growth Reflection should ask:
  - What did I participate in?
  - What did I learn?
  - What skill or mindset did I practice?
  - How does this connect to my goals?
  - What is my next move?
- Growth Reflections can later be transformed into:
  - resume bullets
  - LinkedIn posts
  - interview stories
  - recruiter-visible growth signals
  - chapter impact insights
- Student dashboard should show the current next moves and simple progress.
- Progress should feel calm and professional, not childish or overly gamified.
- Chapter leaders should see aggregate insights, not private student reflections by default.
- The feature should support pilot rollout through configuration:
  - enable check-in by chapter
  - enable recommendation card by chapter
  - enable Growth Reflection by event or chapter
  - enable chapter aggregate insights for pilot chapters

## V1 Scope

### V1 Must Ship

1. 3-minute LEAD Pathway Check-In.
2. Growth stage result.
3. Primary focus result.
4. Learn + Connect + Prove recommendations.
5. Student dashboard card showing current next moves.
6. Ability to mark a next move as started or completed.
7. Optional Growth Reflection prompt.
8. Basic student progress summary.
9. Aggregate pilot metrics for admins or chapter leaders.
10. Rollout flags for pilot chapters.

### V1 Should Not Ship

- AI recommendations.
- Recruiter-facing growth stage.
- Public proof portfolio.
- Awards or recognition system.
- Complete LEAD Pulse integration.
- Complete Impact Metrics Report automation.
- Complex pathway progression rules.
- Mentorship marketplace.
- Partner-facing talent reports.
- Student ranking or scoring.
- Job or internship guarantees.

## Success Metrics

### Primary Activation Metric

**Percentage of new students who complete at least one recommended next move within 14 days.**

### Supporting Metrics

- check-in start rate
- check-in completion rate
- recommendation viewed rate
- recommendation started rate
- recommendation completed rate
- recommendation dismissed rate
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
- chapter leaders do not use aggregate insights
- Growth Reflections feel like homework rather than useful proof
- recommendations repeatedly point students to unavailable events or unclear actions

## Instrumentation Requirements

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

Instrumentation should support chapter-level aggregation without exposing private student content.

## Testing Decisions

Tests should verify external behavior and product rules, not implementation details.

Modules that should be tested:

- check-in state and submission behavior
- growth stage classification or persistence
- recommendation generation
- recommendation state transitions
- student dashboard data assembly
- Growth Reflection creation
- proof privacy defaults
- chapter aggregate insight logic
- rollout flag behavior

Key test cases:

- A new student can complete the check-in without completing a full talent profile.
- A completed check-in produces exactly one Learn, one Connect, and one Prove recommendation.
- A recommendation can move from active to started to completed.
- A recommendation can be dismissed without deleting historical data.
- A Growth Reflection is private by default.
- A student can see their active next moves on the dashboard.
- Completing a recommended move updates visible progress.
- Chapter leaders can view aggregate check-in insights without seeing private student reflections.
- Growth stage does not grant chapter permissions or recruiter visibility.
- Recruiter visibility does not automatically expose proof items.
- Rollout flags can enable the feature for one chapter without enabling it globally.

The codebase already has useful testing patterns through Vitest, service-layer tests, auth helper tests, onboarding helper tests, and architecture tests. New business logic should follow the same pattern: put product rules in testable services and keep server actions thin.

## Out of Scope

The first release should not include:

- full AI recommendation engine
- full LEAD Pulse integration
- full Impact Metrics Report automation
- awards and gala recognition
- recruiter-facing growth stages
- semantic resume parsing
- complex recruiter matching
- mentor marketplace
- payment, sponsorship, or partner campaign workflows
- file-heavy proof portfolio
- public proof artifacts by default
- full profile completion before value is delivered
- ranking or scoring students against one another
- internship, job, or opportunity guarantees
- large dashboards that ask students to process too many options

## Further Notes

The strongest version of this product is not a better dashboard.

It is the first place a new LEAD student goes when they do not know what to do next.

V1 must win one moment:

**A student joins LEAD feeling lost, completes a short check-in, and leaves with one clear next step they actually complete.**

If that moment works, LEAD earns permission to expand into richer pathways, proof portfolios, impact intelligence, recruiter readiness, partner reporting, awards, and Pulse integration.

If that moment does not work, the rest of the platform risks becoming decoration.

