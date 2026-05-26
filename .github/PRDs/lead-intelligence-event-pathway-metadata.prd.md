# LEAD Intelligence: Event Pathway Metadata PRD

Implementation status: V1 branch implemented on `codex/lead-intelligence-pathway-prd` across issues #248-#252. Validation evidence and remaining QA follow-up are recorded in `docs/runbooks/lead-intelligence-event-pathway-v1-validation.md`.

## 1. Executive Summary

LEAD Intelligence V1 turns Pathway from generic advice into a student-first next-move system. A newly approved member should complete a short Pathway Check-In and receive one real, available, explainable LEAD action.

The MVP does not build a broad AI layer, a full resource catalog, or a Pulse personalization system. It adds event-specific Pathway metadata so chapter-created events can become eligible for personalized recommendations when they have clear OKR, pillar, audience, outcome, CTA, proof, and safety fields.

The core product promise is:

> A student logs in, completes Pathway, and gets one next LEAD move that is real, measurable, and connected to their growth.

## 2. Mission

Help students understand what to do next in LEAD, while building the evidence foundation for future chapter insights, impact reporting, funding decisions, and AI-assisted organizational learning.

Core principles:

- Student value comes first. Students should not feel like data sources for dashboards.
- A recommendation must have a measurable CTA.
- Chapter teams should have freedom to make events Pathway-eligible without admin approval for normal chapter events.
- Structured fields, not approval queues, are the V1 quality guardrail.
- Events remain operational records; Pathway metadata owns recommendation meaning.
- Pulse remains aggregate/anonymity-first and does not personalize student recommendations in V1.
- Growth reflections are private by default.
- AI comes later, only after structured evidence exists.

## 3. Target Users

### Newly Approved Chapter Members

Students who have joined LEAD but do not yet know what to do next. They need a clear next action, not a menu of vague opportunities.

### Chapter Event Creators

Chapter e-board members and event operators who create events. They need freedom to publish events and a lightweight way to mark an event as Pathway-eligible when it is useful for student growth.

### Chapter Operators

Presidents, vice presidents, directors, and approved e-board members who want to understand what members need and whether their event programming matches those needs.

### LEAD Admin / Digital Transformation

Admins need a clean foundation for future intelligence, impact metrics, funding evidence, and Pulse-informed planning without breaking privacy or overbuilding before Pathway proves value.

### Recruiters / Companies

Out of scope for V1. Recruiters should not see Pathway stage, private reflections, Pulse responses, or internal readiness signals.

## 4. MVP Scope

### In Scope

- [ ] Define shared LEAD taxonomy constants for OKRs, pillars, Pathway focuses, student outcomes, CTA types, proof outcomes, evidence signals, and recommendation safety.
- [ ] Add `event_pathway_metadata` as a 1:1 metadata table for events.
- [ ] Let chapter event creators mark normal chapter events as Pathway-eligible by completing required structured metadata.
- [ ] Keep admin approval out of normal V1 event recommendation eligibility.
- [ ] Make application events recommendable only as apply/postulate actions, not guaranteed access.
- [ ] Match Pathway Check-In answers to eligible events.
- [ ] Preserve recommendation source traceability on `pathway_recommendation`.
- [ ] Replace generic "talk to chapter leader / VP / area director" recommendations.
- [ ] Keep profile, LinkedIn, resume, and Growth Reflection actions as fixed fallback/support actions.
- [ ] Add proof-loop behavior: recommendation -> action -> Growth Reflection -> recommendation/progress update.
- [ ] Keep Growth Reflection private by default.
- [ ] Add service-layer tests for metadata validation, matching, traceability, and proof progress.
- [ ] Add visual QA for chapter event metadata and student Pathway recommendation flows.

### Out of Scope

- [ ] Broad `pathway_resource_catalog` table for V1.
- [ ] AI recommendation engine.
- [ ] SharePoint ingestion into runtime recommendations.
- [ ] Pulse-to-student personalization.
- [ ] Recruiter-facing readiness score.
- [ ] Public chapter rankings.
- [ ] Admin approval queue for normal chapter event recommendation eligibility.
- [ ] LEAD Professionals mentor/contact recommendations.
- [ ] LEAD HER, Ambassadors, or special programs unless they are normal active events with clear availability and owner workflow.
- [ ] Past event materials as self-study recommendations.
- [ ] Auto-posting or scraping LinkedIn.

## 5. User Stories

1. As a newly approved member, I want to complete a short Check-In, so that LEAD can understand what kind of next move would help me.
2. As a student, I want one clear recommended action, so that I know what to do next without comparing many disconnected options.
3. As a student, I want to know why an event is recommended, so that the recommendation feels trustworthy and relevant.
4. As a student, I want application-based events to be clearly labeled as apply/postulate, so that I do not think access is guaranteed.
5. As a student, I want to capture what I learned after an event or recommendation, so that my participation becomes private proof of growth.
6. As a chapter event creator, I want to mark my event as Pathway-eligible using structured fields, so that members can discover it through Pathway without waiting for admin approval.
7. As a chapter operator, I want Pathway metadata to use consistent OKR and pillar values, so that event programming can later be analyzed.
8. As an admin, I want recommendations to preserve source traceability, so that we can audit why a student received a recommendation.

## 6. Core Architecture & Patterns

Use a vertical slice following the Service Layer Pattern.

Database:

- `event` remains the operational source of truth.
- `event_pathway_metadata` owns event recommendation meaning.
- `pathway_check_in` continues to store student Check-In answers.
- `pathway_recommendation` stores student-facing recommendations and V1 traceability fields.
- `growth_reflection` stores private proof/reflection linked to an event and/or recommendation.

Services:

- `lib/services/lead-taxonomy.service.ts`
- `lib/services/event-pathway-metadata.service.ts`
- `lib/services/pathway-intelligence.service.ts`
- Existing `PathwayCheckInService` should delegate matching logic instead of generating hardcoded generic recommendations.
- Existing `GrowthReflectionService` remains the proof-loop write path.

Actions:

- Event create/update actions remain thin controllers.
- Pathway Check-In action remains the student submission controller.
- Growth Reflection action remains the proof submission controller.

UI:

- Chapter event create/edit gets a Pathway fit section.
- Student dashboard gets event-backed recommendations.
- Growth Reflection page can accept both `eventId` and `recommendationId`.

## 7. Tools / Features

### Pathway Check-In

Check-In is the logged-in student questionnaire that answers: "What do you need next?"

Current fields:

| Field | Meaning |
| --- | --- |
| `looking_for` | Student's main growth goal. |
| `current_blocker` | What is stopping them from moving forward. |
| `study_interest` | Free-text interest area such as AI, finance, engineering, product, etc. |
| `confidence_level` | 1-5 self-rating used to understand support need. |
| `monthly_time_commitment` | Realistic time available this month. |
| `growth_stage` | System-derived stage such as explorer, builder, candidate, leader, emerging professional. |
| `primary_focus` | System-derived focus such as career exploration, technical experience, opportunity readiness, community/mentorship, leadership. |

### Event Pathway Metadata

Chapter event creators can toggle: "Make this event eligible for Pathway."

Required when eligible:

- primary OKR
- pillar keys
- student audience
- Pathway focus / student goal
- student outcomes
- CTA type
- proof outcome
- evidence signal
- recommendation safety

Normal event publishing should not require this metadata. Only Pathway eligibility requires it.

### Recommendation Matching

Pathway should prefer:

1. Eligible chapter event matching the student's focus.
2. Eligible cross-chapter/global event matching the student's focus.
3. Fixed support/fallback action: LinkedIn, resume, profile, or Growth Reflection.

Recommendation copy must explain:

- what to do
- why it fits
- what outcome it supports
- what proof/action comes after

### Proof Loop

The proof loop is:

```text
Check-In -> recommendation -> student action -> Growth Reflection -> progress/evidence
```

Growth Reflection fields:

- `participated_in`
- `learned`
- `skill_or_mindset`
- `goal_connection`
- `next_move`
- `event_id`
- `recommendation_id`
- `visibility = private`

Expected behavior:

- If a student registers/applies from a recommendation, mark the recommendation as `started`.
- If the student completes a linked Growth Reflection, mark the recommendation as `completed` when appropriate.
- Student dashboard increments completed reflections and proof items.
- Reflection remains private unless a later explicit sharing workflow exists.

### Chapter Event Metadata UX

The Pathway section should be short and structured:

1. What is the main OKR?
2. Which LEAD pillar does this support?
3. Who is this best for?
4. What should the student gain?
5. What should the student do after?
6. Is the CTA register or apply/postulate?

No long strategic questionnaire. No admin approval for normal chapter events.

## 8. Technology Stack

- Next.js 15 App Router.
- React 19 server components by default.
- Supabase Postgres, RLS, and generated database types.
- Service Layer Pattern in `lib/services`.
- Server Actions in `lib/actions`.
- Tailwind CSS 4 and existing UI components.
- `next-intl` locale routing.
- Vitest for service-layer logic.
- Browser/Playwright visual QA for critical student and chapter flows.

## 9. Security & Configuration

Authorization:

- Chapter users must have event management permission to create/update event Pathway metadata.
- Students can only read/update their own Check-In, recommendations, and Growth Reflections.
- Admin retains global override through existing admin role.
- Recruiters do not access Pathway metadata, Check-In, private reflections, or internal progress signals.

Privacy:

- Growth Reflection remains `private` by default.
- Pulse is not used for individual recommendations.
- Pathway data must not rank students or chapters publicly.

Configuration:

- Reuse existing Pathway feature flags:
  - `enable_check_in`
  - `enable_recommendation_card`
  - `enable_growth_reflection`
  - `enable_chapter_insights`
- No new external environment variables expected.

## 10. API / Action Specification

Prefer Server Actions and service methods over public APIs.

### Event Metadata Service

`saveEventPathwayMetadata(input)`

- Validates actor can manage event.
- Upserts metadata for an event.
- Enforces required fields when `is_pathway_eligible = true`.

`getEventPathwayMetadata(eventId)`

- Loads metadata for event edit/detail views.

`listEligibleEventsForPathway(input)`

- Returns published upcoming events with complete metadata.
- Filters by chapter/cross-chapter/global scope and availability.

### Pathway Intelligence Service

`generateRecommendationsForCheckIn(input)`

- Accepts user id, chapter id, Check-In classification.
- Finds eligible matching events.
- Falls back to fixed support actions.
- Returns recommendation records with source traceability.

### Pathway Recommendation Traceability

V1 should add simple fields to `pathway_recommendation`:

- `source_type`
- `source_event_id`
- `cta_type`
- `evidence_signal`
- `matched_reasons`

Use a separate `pathway_recommendation_source` table only if multiple source candidates need to be stored per displayed recommendation.

### Growth Reflection Action

`submitGrowthReflection(formData)`

- Already exists.
- Should accept `event_id` and `recommendation_id`.
- Should save private reflection.
- Should update linked recommendation/progress when the reflection is completed.

## 11. Success Criteria

Student success:

- At least 40% of eligible pilot members complete Check-In.
- At least 25% of generated next moves are started or completed within 14 days.
- Students can explain why the recommended event/action fits them.
- Reflection completion increases after event recommendations.

Chapter success:

- Chapter editors can make an event Pathway-eligible without admin help.
- Metadata completion does not block normal event creation.
- Events without metadata still publish normally.

System success:

- Recommendations preserve source traceability.
- Application events are never presented as guaranteed access.
- Private reflections remain private.
- Service tests cover matching, validation, and proof-loop behavior.
- Mobile and desktop UI do not overflow or confuse Pathway vs Pulse.

## 12. Implementation Phases

### Phase 1: Taxonomy And Schema

- Add shared taxonomy module.
- Add `event_pathway_metadata` migration and RLS.
- Add traceability fields to `pathway_recommendation`.
- Regenerate Supabase types.

### Phase 2: Services And Tests

- Add `EventPathwayMetadataService`.
- Add `PathwayIntelligenceService`.
- Refactor `PathwayCheckInService` to delegate recommendation matching.
- Add Vitest coverage for metadata validation, matching priority, fallback actions, and privacy/proof behavior.

### Phase 3: Chapter Event UX

- Add Pathway eligibility section to event create/edit.
- Validate required metadata only when eligibility is enabled.
- Keep Spanish-first labels and helper text.

### Phase 4: Student Recommendation UX

- Show event-backed next move on student dashboard.
- Add register/apply/profile/reflection CTAs.
- Pass `eventId` and `recommendationId` into Growth Reflection.
- Update recommendation status through action/proof loop.

### Phase 5: QA And Documentation

- Run lint/typecheck/tests.
- Run visual/browser QA for chapter metadata and student proof loop.
- Update proposal docs/runbook with final decisions.

## 13. Future Considerations

- Broad `pathway_resource_catalog` for non-event resources.
- Lead signal spine for cross-module analytics.
- Pulse aggregate integration for chapter action plans.
- Funding-to-event impact loop.
- Admin intelligence dashboard.
- AI summaries with citations.
- Student-selected proof sharing into profile/portfolio.
- Recruiter-visible readiness only with explicit consent.

## 14. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Event creators over-tag every event. | Use controlled required fields and student-facing explanations; review aggregate quality after pilot. |
| Metadata makes event creation feel bureaucratic. | Keep Pathway metadata optional unless eligibility is enabled. |
| Recommendations look smart but cannot be audited. | Store source type, source event id, CTA type, evidence signal, and matched reasons. |
| Students confuse Pathway with Pulse. | Keep copy distinct: Pathway is personal next move; Pulse is anonymous/aggregate experience feedback. |
| Application events overpromise access. | Always use apply/postulate CTA language and never "reserved seat" language. |
| Private reflections leak into admin/recruiter surfaces. | Preserve private-by-default RLS and do not add recruiter/admin reflection views in V1. |
| Broad intelligence scope delays student value. | Ship event-metadata-backed Pathway first; defer AI, Pulse integration, and generic catalog. |

## 15. Appendix

Related docs:

- `docs/proposals/lead-intelligence-layer-integration-plan.md`
- `docs/proposals/pathway-resource-catalog-working-notes.md`
- `docs/proposals/new-student-pathway-check-in-prd-v2.md`
- `docs/proposals/personalized-growth-and-opportunity-layer-prd.md`
- `docs/adr/001-service-layer-pattern.md`
- `docs/adr/004-chapter-scoped-roles-permissions.md`

### SharePoint Grounding Audit

Audit date: 2026-05-25

Verdict: the V1 direction is grounded in LEAD SharePoint, with one important caveat: Pulse is verified as an anonymous/aggregate listening tool, but the full question bank should be exported or reviewed from the live survey before implementation hardcodes questions.

| PRD claim | SharePoint grounding | Decision impact |
| --- | --- | --- |
| Use `inspire`, `unite`, `empower`, and `elevate` as shared OKR keys. | `LEAD 2025 OKRs and Budget Guidelines.docx` defines these four OKRs and ties events/funding to OKR alignment, post-event impact, and dashboard reporting. | Keep. These are not invented Pathway terms; they are LEAD strategy terms. |
| Event metadata should capture OKR, outcomes, CTA, proof, and evidence signals. | `English Playbook - Agent Innovation Day.docx` includes target audience, learning outcomes, metrics, OKRs, proof artifacts, pitches, certificates, LinkedIn visibility, and judging rubrics. `Draft Agenda.docx` for IBM Explore Day also includes learning outcomes, networking, career resources, and next steps. | Keep. Event Pathway metadata is a focused way to make existing event-design thinking usable by the platform. |
| LEAD source families should include Learn, Explore, Aspire, and Discover. | `LEAD Mission & Vision 2025.docx` names Learn, Explore, Aspire, Discover as LEAD's identity. `LEAD_Digital_Transformation_roadmap.pptx` uses the same four-part frame. SharePoint event folders also show Learn, Explore, and Discover event families. | Keep as `source_family`, not as the only taxonomy. |
| Pillar keys should be separate from OKRs. | `LEAD Mission & Vision 2025.docx` describes seven chapter pillars: Chapter Development, Leadership, Academic Excellence, Professional Development, Community Outreach, Latina/Excelencia Femenina, and LEAD Academia/Junior. | Keep. Platform key `womens_excellence` should be treated as the internal key for the SharePoint wording `Latina Excellence` / `Excelencia Femenina`. |
| New members need orientation/belonging support, not only career recommendations. | `LEAD_University Tour Feedback.pptx` says new members need mission, vision, LEAD mindset, and pillar purpose recap, and that chapters want stronger cross-chapter connection and best-practice sharing. | Keep. This supports `mission_orientation`, `belonging`, and chapter-development recommendations. |
| Pulse should stay aggregate/anonymity-first and not personalize individual student recommendations in V1. | `LEAD Pulse.docx` positions Pulse as anonymous feedback for understanding student/community experience. `DB query.txt` stores survey answers as JSON with chapter/role/session, and `feedback.txt` calls for optional open questions, required markers, CTA, keywords, and open/close dates. | Keep, but do not use raw Pulse answers for individual recommendations. Add aggregation thresholds before leadership dashboards use Pulse data. |
| Data and insights should support chapters without toxic ranking. | `Roles Tentativos.docx` describes Data & Insights as strategic support for chapters and explicitly warns against toxic competition, public rankings, reducing chapters to metrics, and pressure without context. | Keep. Chapter insights should be contextual, private to authorized leaders, and action-oriented. |
| Professionals, Ambassadors, and special programs are future resources, not V1 recommendations. | `LEAD Ambassador Program.docx` and Professionals-related SharePoint artifacts show real program value, but they also imply governance, nomination, reporting, and eligibility workflows. | Keep out of V1 unless a program owner defines eligibility, availability, and contact workflow in the platform. |

Grounding caveats:

- The full LEAD Pulse question bank was only partially visible in the SharePoint DOCX extraction/screenshots. Verified visible examples include general chapter/role context, personal-experience Likert questions, and open feedback prompts. Before implementing Pulse forms, export the live survey schema or review the original form builder.
- SharePoint is a source of taxonomy, event patterns, and operating evidence. It should not be ingested directly into student recommendations without curation, source approval, and student-safe copy.
- Past SharePoint events should be treated as templates unless a matching active event exists in the platform.

Key V1 decisions:

- Student-first promise.
- Real next moves only; measurable CTA required.
- Chapter freedom with structured metadata validation.
- `event_pathway_metadata` before broad catalog.
- Traceability on recommendations.
- Growth Reflection private by default.
- Pulse aggregate-only and out of individual personalization.
