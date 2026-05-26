# Pathway Resource Catalog Working Notes

Status: V1 decision captured; broad catalog deferred
Last updated: 2026-05-25

Implementation note: the V1 event-first slice now uses `event_pathway_metadata`, not a broad `pathway_resource_catalog`. Keep this file as the source of future catalog thinking, SharePoint-grounded taxonomy notes, and non-event resource deferrals.

## Current Thesis

Pathway should serve students first. Its promise should be: "Know your next best LEAD move."

The resource catalog is the missing layer that turns Pathway from generic guidance into real personalization. In V1, Pathway should recommend actual LEAD events, chapter events, profile actions, and proof actions instead of saying only "pick an event or resource." People, programs, and documents can become recommendations later only when the operating workflow is explicit.

Implementation decision after review: V1 should not start with a broad generic catalog table. Because V1 is event-first, use `event_pathway_metadata` as the event-specific recommendation layer. Keep profile, LinkedIn, resume, and growth reflection actions as fixed platform support/fallback actions. Introduce a broader `pathway_resource_catalog` later only when non-event resources become first-class.

## V1 Primary User

V1 should optimize for newly approved chapter members who are interested in LEAD but unsure what to do next.

This is the best first wedge because these students have enough trust/access to act, but still need clarity. Pathway should help them move from "I joined LEAD" to one concrete next step: attend, connect, build proof, update profile, or ask for help.

## V1 Student Win

The first win should be: find one concrete LEAD action and understand why it fits them.

Pathway should not feel like a menu of chores. It should say, in effect: "Based on what you told us, this is your next best LEAD move, here is why, and here is how it helps your growth."

## V1 Recommendation Priority

Pathway should be mainly event-driven.

If there is a relevant upcoming LEAD/platform event or chapter event, the primary recommendation should be that event. Profile, LinkedIn, resume, growth reflection, and proof actions should support the event recommendation rather than replace it.

If there is no relevant active event, Pathway can fall back to a profile/proof action so the student still receives one concrete next move.

Matching priority:

1. Relevant chapter event.
2. Relevant global LEAD event.
3. Profile/proof fallback.

## Product Boundaries

- Pulse asks: "How is your LEAD/chapter experience going?"
- Pathway asks: "What should I do next for my growth?"
- Events give students actions to take.
- Profile, resume, LinkedIn, and proof artifacts make growth visible.
- Company and partner workflows should come later, after the student value is real.

## SharePoint Sources Reviewed

SharePoint confirms that LEAD has three different taxonomy layers. Pathway should keep them separate instead of flattening everything into one generic tag.

Source and program families found under LEAD Peru:

- LEAD Learn Events
- LEAD Explore Events
- LEAD Aspire Events
- LEAD Discover Events
- LEAD Professionals
- LEAD Ambassadors
- LEAD HER
- LEAD Stars
- Eventos realizados
- LEAD Peru Docs

Concrete SharePoint evidence reviewed:

- Agent Innovation Day - Copilot Tour Peru
- LEAD - Discover Day
- LEAD HER Program
- LEAD Ambassador Program
- LEAD Professionals PERU
- HOLA x LEAD Professionals Partnership
- Professionals.xlsx
- Contacto Presis y Vps.xlsx
- Roles Tentativos.docx
- LEAD Mission & Vision 2025.docx
- LEAD_Pitch Deck - EN.pptx
- LEAD_University Tour Feedback.pptx

These are candidates to inspect, not automatically V1 resources. V1 should avoid recommending people/programs that require separate coordination or could create a promise LEAD is not ready to fulfill.

Important findings from SharePoint:

- LEAD's high-level motion is Learn, Explore, Aspire, Discover. This should describe the student journey/source family, not the only tag.
- The stronger content taxonomy is the seven LEAD impact pillars. For platform consistency, use the existing funding keys: `lead_academia`, `academic_excellence`, `womens_excellence`, `professional_development`, `leadership_development`, `community_outreach`, and `chapter_development`. SharePoint wording uses `Latina Excellence` / `Excelencia Femenina`; the platform key `womens_excellence` is the internal normalized key.
- Agent Innovation Day is a Learn-style resource: AI literacy, enterprise problem solving, design sprint, pitching, teamwork, and a proof artifact.
- IBM Explore Day and corporate visits are Explore-style resources: company exposure, industries, professional culture, networking context, and career paths.
- Discover Day is a Discover/LEAD Academia resource: STEM exposure, leadership introduction, chapter collaboration, showcase, and certificates.
- University Tour feedback says new members need a recap of mission, vision, LEAD mindset, and pillar purpose. This is a direct signal that Pathway V1 needs orientation/belonging tags, not only career tags.
- Roles Tentativos says data should support chapters without toxic ranking or pressure. Pathway recommendations should explain fit and support, not compare chapters or judge students.
- Professionals, Ambassadors, and LEAD HER are meaningful future source families, but they should not be V1 recommendations until the platform has explicit availability, eligibility, and coordination rules.

## OKR Grounding

Pathway catalog tags should be OKR-first. A resource should not enter the catalog just because it exists in SharePoint. It should enter only when it helps LEAD move a student, chapter, or event toward a measurable organizational objective.

The platform already uses four OKR categories in the funding flow: `inspire`, `unite`, `empower`, and `elevate`. Pathway should reuse those instead of creating a separate OKR vocabulary.

Working OKR definitions for Pathway:

| OKR | Pathway meaning | Good V1 evidence |
| --- | --- | --- |
| `inspire` | Help students understand LEAD's mission, see possible futures, and feel motivated to participate. | Mission recap completed, event registration, reflection showing clarity or motivation, Discover-style participation. |
| `unite` | Help students feel part of a chapter/community and participate across LEAD. | Chapter event attendance, cross-chapter event attendance, belonging reflection, repeated participation. |
| `empower` | Help students build concrete skills, confidence, and operating habits. | Workshop attendance, skill/proof artifact, profile update, resume bullet, growth reflection. |
| `elevate` | Help students become more opportunity-ready and visible for future leadership, partner, or professional opportunities. | Corporate visit attendance, LinkedIn update, pitch deck, certificate, recruiter-visible profile readiness, portfolio/proof link. |

SharePoint OKR language from Agent Innovation Day maps into these four platform OKRs:

| SharePoint OKR language | Pathway OKR mapping |
| --- | --- |
| Expand access to high-impact educational opportunities | `inspire`, `empower` |
| Strengthen LEAD's talent development ecosystem | `empower`, `elevate` |
| Build strong multi-sector partnerships | `elevate` |
| Increase national visibility | `inspire`, `elevate` |
| Equip students with frontier skills | `empower`, `elevate` |

OKRs are not the same thing as pillars:

- OKR answers: "Which organizational objective does this support?"
- Impact pillar answers: "Which LEAD content area does this belong to?"
- Student outcome answers: "What does the student gain?"
- Evidence answers: "How will we know it happened?"

## OKR-To-Tag Map

Use this as the canonical matching layer:

| OKR | Best-fit source families | Best-fit impact pillars | Strong student outcomes |
| --- | --- | --- | --- |
| `inspire` | discover, chapter, learn | lead_academia, leadership_development, chapter_development | mission_orientation, career_exposure, leadership_confidence |
| `unite` | chapter, discover, completed_event only for reporting | chapter_development, community_outreach, lead_academia | belonging, community_service, mission_orientation |
| `empower` | learn, aspire, chapter, profile_action, proof_action | academic_excellence, leadership_development, professional_development | technical_skill, leadership_confidence, professional_readiness, proof_artifact |
| `elevate` | explore, aspire, profile_action, proof_action | professional_development, leadership_development, womens_excellence | career_exposure, profile_visibility, professional_readiness, innovation_project |

V1 should prefer resources that serve at least one primary OKR and one measurable student outcome. If a resource cannot name either, it is not ready for Pathway.

## SharePoint-Grounded Tag Model

The old `pillar` field was too broad because it mixed source folders, programs, student outcomes, and proof actions. The better model is multi-axis:

- `okr_alignment`: inspire, unite, empower, elevate
- `primary_okr`: inspire, unite, empower, elevate
- `okr_evidence_signal`: event_registration, event_attendance, check_in_completed, mission_recap_completed, profile_updated, proof_submitted, reflection_completed, certificate_earned, linkedin_updated, resume_updated
- `measurement_source`: platform_event, platform_profile, pathway_check_in, growth_reflection, chapter_event_roster, manual_admin_entry
- `okr_confidence`: direct, inferred, weak
- `source_family`: learn, explore, aspire, discover, chapter, completed_event, profile_action, proof_action, future_professionals, future_ambassadors, future_her, future_stars
- `impact_pillar`: lead_academia, academic_excellence, womens_excellence, professional_development, leadership_development, community_outreach, chapter_development
- `event_format`: workshop, corporate_visit, panel_or_fair, leadership_activation, design_sprint, chapter_showcase, networking_or_community, service_project, bootcamp_or_study_night, profile_action, proof_action
- `student_outcome`: belonging, mission_orientation, career_exposure, technical_skill, leadership_confidence, professional_readiness, community_service, innovation_project, profile_visibility, proof_artifact
- `proof_outcome`: none, reflection, resume_bullet, linkedin_update, project_note, pitch_deck, certificate, portfolio_item
- `audience`: newly_approved_member, chapter_member, eboard, event_attendee, high_school_student, women_in_stem_future, professional_future, ambassador_future
- `scope`: chapter, cross_chapter, regional, global
- `availability_status`: draft, active, upcoming, archived
- `coordination_risk`: self_serve, chapter_managed, partner_managed, requires_manual_selection
- `recommendation_safety`: recommendable_now, recommend_only_if_event_active, future_only, never_auto_recommend

Student-facing copy should stay simpler than the internal tags. Students should see the next move, why it fits, and the growth outcome. Admins/editors can see the taxonomy.

## V1 Catalog Fields

- title
- short_description
- resource_type: event, workshop, chapter_event, profile_action, proof_action
- primary_okr: inspire, unite, empower, elevate
- okr_alignment: one or more of inspire, unite, empower, elevate
- okr_evidence_signal: event_registration, event_attendance, check_in_completed, mission_recap_completed, profile_updated, proof_submitted, reflection_completed, certificate_earned, linkedin_updated, resume_updated
- measurement_source: platform_event, platform_profile, pathway_check_in, growth_reflection, chapter_event_roster, manual_admin_entry
- okr_confidence: direct, inferred, weak
- source_family: learn, explore, aspire, discover, chapter, profile_action, proof_action
- impact_pillar: lead_academia, academic_excellence, womens_excellence, professional_development, leadership_development, community_outreach, chapter_development
- event_format: workshop, corporate_visit, panel_or_fair, leadership_activation, design_sprint, chapter_showcase, networking_or_community, service_project, bootcamp_or_study_night, profile_action, proof_action
- student_outcome: belonging, mission_orientation, career_exposure, technical_skill, leadership_confidence, professional_readiness, community_service, innovation_project, profile_visibility, proof_artifact
- proof_outcome: none, reflection, resume_bullet, linkedin_update, project_note, pitch_deck, certificate, portfolio_item
- student_goal: career_exploration, technical_experience, opportunity_readiness, community_mentorship, leadership
- blocker_helped: need_career_prep, need_more_experience, need_clarity, need_people, need_confidence
- growth_stage: explorer, builder, candidate, leader, emerging_professional
- time_commitment: one_hour, two_to_four_hours, five_plus_hours
- audience: newly_approved_member, chapter_member, eboard, event_attendee
- scope: chapter, cross_chapter, regional, global
- chapter_scope: global or chapter id
- availability_status: draft, active, upcoming, archived
- coordination_risk: self_serve, chapter_managed, partner_managed, requires_manual_selection
- recommendation_safety: recommendable_now, recommend_only_if_event_active, future_only, never_auto_recommend
- source_url
- source_system: platform, SharePoint, manual, chapter
- recommendation_text
- proof_prompt

Do not use these as V1 values in `resource_type`: mentor, contact, program, guide. Those can return later when the operating workflow is real enough to avoid false promises.

## Mapping Current Pathway Inputs To LEAD Tags

The current Pathway check-in can still work, but its internal mapping should become more LEAD-native:

- `career_exploration` should prefer `primary_okr: inspire` or `elevate`, `source_family: explore` or `discover`, `impact_pillar: professional_development` or `lead_academia`, and outcomes like `career_exposure` or `mission_orientation`.
- `technical_experience` should prefer `primary_okr: empower`, `source_family: learn`, `impact_pillar: academic_excellence` or `professional_development`, and outcomes like `technical_skill`, `innovation_project`, or `proof_artifact`.
- `opportunity_readiness` should prefer `primary_okr: elevate`, `source_family: aspire` or `explore`, `impact_pillar: professional_development`, and outcomes like `professional_readiness`, `profile_visibility`, or `resume_bullet`.
- `community_mentorship` should not recommend people in V1. It should prefer `primary_okr: unite`, `impact_pillar: chapter_development`, `event_format: networking_or_community` or `chapter_showcase`, and outcomes like `belonging` or `mission_orientation`.
- `leadership` should prefer `primary_okr: empower` or `inspire`, `impact_pillar: leadership_development` or `chapter_development`, and outcomes like `leadership_confidence`, `teamwork`, and `reflection`.

The important shift: Pathway can ask students in plain language, but the catalog should recommend using LEAD's own event/pillar language.

## V1 Seed Examples From SharePoint

- Agent Innovation Day: `primary_okr: empower`, `okr_alignment: empower/elevate`, `source_family: learn`, `impact_pillar: academic_excellence/professional_development`, `event_format: design_sprint`, `student_outcome: technical_skill/innovation_project/proof_artifact`, `proof_outcome: pitch_deck/linkedin_update`, `okr_evidence_signal: proof_submitted/reflection_completed`.
- IBM Explore Day: `primary_okr: elevate`, `okr_alignment: inspire/elevate`, `source_family: explore`, `impact_pillar: professional_development`, `event_format: corporate_visit`, `student_outcome: career_exposure/professional_readiness`, `proof_outcome: reflection/linkedin_update`, `okr_evidence_signal: event_attendance/reflection_completed`.
- Discover Day: `primary_okr: inspire`, `okr_alignment: inspire/unite`, `source_family: discover`, `impact_pillar: lead_academia/leadership_development/chapter_development`, `event_format: chapter_showcase`, `student_outcome: mission_orientation/leadership_confidence/career_exposure`, `proof_outcome: certificate/reflection`, `okr_evidence_signal: event_attendance/certificate_earned`.
- New member mission recap action: `primary_okr: unite`, `okr_alignment: inspire/unite`, `source_family: chapter`, `impact_pillar: chapter_development`, `event_format: profile_action`, `student_outcome: mission_orientation/belonging`, `proof_outcome: reflection`, `okr_evidence_signal: mission_recap_completed/reflection_completed`.
- LinkedIn/profile support action after an event: `primary_okr: elevate`, `okr_alignment: empower/elevate`, `source_family: profile_action`, `impact_pillar: professional_development`, `event_format: profile_action`, `student_outcome: profile_visibility`, `proof_outcome: linkedin_update/resume_bullet`, `okr_evidence_signal: linkedin_updated/resume_updated`.

## Matching Logic Sketch

Start rule-based and explainable:

- +4 when the resource matches the student's primary OKR need.
- +3 when the resource has direct `okr_confidence`.
- +3 when it has a platform-measurable `okr_evidence_signal`.
- +3 when the resource matches the student's selected goal.
- +3 when the resource helps the student's blocker.
- +2 when it fits the student's growth stage.
- +2 when it fits the student's time commitment.
- +2 when it is global or belongs to the student's chapter.
- +1 when it is active/upcoming.
- +3 when the resource is an upcoming event, because V1 is event-first.
- +2 when the event belongs to the student's chapter, because V1 should help newly approved members become active locally.
- +2 when the resource supports `mission_orientation` or `belonging` for a newly approved member.
- +2 when the resource creates a concrete `proof_outcome`.
- -5 when archived, unavailable, or missing a clear next action.
- -5 when `coordination_risk` is `requires_manual_selection` and there is no explicit approval/selection workflow.
- -5 when `okr_confidence` is weak and there is no measurable evidence signal.
- -10 when `recommendation_safety` is `future_only` or `never_auto_recommend`.

Pathway should return one primary recommendation plus two support actions:

1. Next best LEAD move.
2. Profile/proof support action.
3. Optional follow-up action only if it is clearly available.

## Recommendation Safety Rules

- Do recommend active/upcoming student-facing events that have a clear date, audience, and next action.
- Do recommend application-based events only when the next action is clearly framed as apply/postulate, not guaranteed access.
- Do recommend only resources that name at least one OKR and one evidence signal.
- Do recommend chapter events when they are visible to the student's chapter and do not require a private manual invitation.
- Do recommend profile/proof actions as support, especially after an event.
- Do not recommend individual people, officers, VPs, or area directors as a next step in V1.
- Do not recommend Professionals, Ambassadors, LEAD HER, or Stars until those have explicit platform workflows, availability, eligibility, and owner approval.
- Do not recommend completed-event folders as self-study in V1.
- Do not recommend finance, legal, board, contact spreadsheets, or internal role docs to students.
- Do not use Pathway data to rank chapters or make students feel behind. Use it to explain fit and suggest one next move.

## Student-Facing Tag Language

Internal tags should stay structured, but the student should see friendly language:

- `mission_orientation` -> "Understand LEAD and where you fit"
- `belonging` -> "Meet the community"
- `career_exposure` -> "Explore careers and companies"
- `technical_skill` -> "Build a practical skill"
- `leadership_confidence` -> "Practice leadership"
- `professional_readiness` -> "Prepare for opportunities"
- `profile_visibility` -> "Make your growth visible"
- `proof_artifact` -> "Create something you can show"

## OKR Reporting View

Pathway should eventually produce an admin view like this:

| OKR | What Pathway can report without overclaiming |
| --- | --- |
| `inspire` | New members who completed mission orientation, registered for a Discover/Learn event, or wrote a reflection showing clearer direction. |
| `unite` | New members who attended a chapter/cross-chapter event, completed a belonging reflection, or returned for a second LEAD action. |
| `empower` | Members who completed a skill-building event, submitted a proof artifact, updated their profile, or converted an experience into a resume/LinkedIn proof. |
| `elevate` | Members who attended company/career exposure events, updated opportunity-facing profile fields, created visible proof, or opted into future opportunity readiness workflows. |

This matters because Pathway should not become another feature with isolated usage metrics. It should become the student-level evidence layer for LEAD OKRs.

## V1 Seed Catalog Proposal

This is a planning seed, not a migration. The first catalog should be small enough to review by humans and concrete enough to test the matching logic.

Seed source rules:

- Prefer active/upcoming events that already exist in the platform event catalog.
- Use SharePoint as taxonomy and event-design evidence, not as an automatic student-facing source.
- Treat past SharePoint events like IBM Explore Day, Discover Day 2025, and Agent Innovation Day as templates/patterns unless a new active event exists in the platform.
- Add profile/proof actions as platform-generated catalog entries, because they are always available and help every event become measurable.

Minimum viable catalog row:

| Field | Purpose |
| --- | --- |
| `catalog_key` | Stable internal key for the resource. |
| `title` | Student-facing title. |
| `resource_type` | event, chapter_event, profile_action, proof_action. |
| `linked_event_id` | Platform event id when the resource is an event. |
| `primary_okr` | One of inspire, unite, empower, elevate. |
| `okr_alignment` | Secondary OKRs, if any. |
| `impact_pillar` | One or more platform pillar keys. |
| `student_outcome` | What the student gains. |
| `proof_outcome` | What evidence the student can create. |
| `evidence_signal` | What the platform can measure without overclaiming. |
| `audience` | Which student segment should see it. |
| `availability_status` | active, upcoming, archived, draft. |
| `recommendation_safety` | recommendable_now, recommend_only_if_event_active, future_only, never_auto_recommend. |

First seed rows to review:

| Catalog key | Title | Source | Primary OKR | Pillar | Student outcome | Evidence signal | Safety |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `mission-recap-new-member` | Understand LEAD and where you fit | platform action | unite | chapter_development | mission_orientation, belonging | mission_recap_completed, reflection_completed | recommendable_now |
| `event-92000000-0000-4000-8000-000000000016` | Taller de Liderazgo para Nuevos Miembros | platform event, 2026-06-12 | empower | leadership_development, chapter_development | leadership_confidence, belonging | event_registration, event_attendance, reflection_completed | recommend_only_if_event_active |
| `event-92000000-0000-4000-8000-000000000017` | Product Sprint LEAD | platform event, 2026-06-20 | empower | professional_development, academic_excellence | innovation_project, proof_artifact | event_registration, proof_submitted, reflection_completed | recommend_only_if_event_active |
| `event-92000000-0000-4000-8000-000000000019` | Pitch Lab para Emprendedores | platform event, 2026-07-11 | elevate | professional_development, leadership_development | professional_readiness, profile_visibility | event_registration, proof_submitted, linkedin_updated | recommend_only_if_event_active |
| `event-92000000-0000-4000-8000-000000000020` | Data Analytics Bootcamp | platform event, 2026-07-25 | empower | academic_excellence, professional_development | technical_skill, proof_artifact | event_registration, proof_submitted, reflection_completed | recommend_only_if_event_active |
| `event-92000000-0000-4000-8000-000000000021` | Networking Intercapitulos Lima | platform event, 2026-08-06 | unite | chapter_development | belonging, career_exposure | event_registration, event_attendance, reflection_completed | recommend_only_if_event_active |
| `event-92000000-0000-4000-8000-000000000022` | Career Readiness Clinic | platform event, 2026-08-15 | elevate | professional_development | professional_readiness, profile_visibility | event_registration, resume_updated, linkedin_updated | recommend_only_if_event_active |
| `event-92000000-0000-4000-8000-000000000023` | AI for Social Impact | platform event, 2026-08-28 | empower | academic_excellence, community_outreach | technical_skill, community_service | event_registration, reflection_completed, proof_submitted | recommend_only_if_event_active |
| `event-92000000-0000-4000-8000-000000000026` | Public Speaking Lab | platform event, 2026-10-03 | empower | leadership_development | leadership_confidence, professional_readiness | event_registration, reflection_completed | recommend_only_if_event_active |
| `event-92000000-0000-4000-8000-000000000027` | Community Impact Challenge | platform event, 2026-10-17 | unite | community_outreach, leadership_development | community_service, proof_artifact | event_registration, proof_submitted, reflection_completed | recommend_only_if_event_active |
| `event-92000000-0000-4000-8000-000000000030` | Simulacion de Entrevistas | platform event, 2026-11-21 | elevate | professional_development | professional_readiness, leadership_confidence | event_registration, reflection_completed, resume_updated | recommend_only_if_event_active |
| `profile-linkedin-after-event` | Turn this experience into a LinkedIn update | platform action | elevate | professional_development | profile_visibility | linkedin_updated | recommendable_now |
| `profile-resume-after-event` | Turn this experience into a resume bullet | platform action | elevate | professional_development | profile_visibility, proof_artifact | resume_updated | recommendable_now |
| `growth-reflection-after-event` | Capture what you learned | platform action | empower | leadership_development, professional_development | proof_artifact, leadership_confidence | reflection_completed | recommendable_now |

Rows to hold out of V1:

| Resource | Why hold it |
| --- | --- |
| LEAD HER / Women in STEM special programs | User decision: special programs are not V1 unless they become normal active events with clear availability and owner approval. |
| LEAD Professionals / mentor contacts | Requires manual coordination and creates a promise the platform cannot fulfill yet. |
| LEAD Ambassadors | Same issue: meaningful future layer, but not a self-serve recommendation today. |
| Completed event folders | Useful for taxonomy and reporting, but not self-study recommendations in V1. |
| Finance, legal, board, contacts, role docs | Internal operating material, not student Pathway resources. |

## Seed Matching Examples

These examples show what Pathway should return, not exact UI copy:

| Student signal | Primary recommendation | Support action | OKR reason |
| --- | --- | --- | --- |
| New approved member, needs clarity, low confidence | Understand LEAD and where you fit | Growth reflection | `unite` + `inspire`: orient the student before asking them to chase opportunities. |
| Wants leadership and community | Taller de Liderazgo para Nuevos Miembros | Reflection after event | `empower` + `unite`: leadership practice plus chapter belonging. |
| Wants technical experience | Data Analytics Bootcamp or AI for Social Impact | Project/proof reflection | `empower`: concrete skill and artifact. |
| Wants career readiness | Career Readiness Clinic or Simulacion de Entrevistas | Resume or LinkedIn action | `elevate`: opportunity readiness and visible proof. |
| Wants people/community but V1 cannot recommend humans | Networking Intercapitulos Lima | Belonging reflection | `unite`: community through an event, not an unmanaged person-introduction promise. |
| Wants to create impact | Community Impact Challenge | Proof reflection | `unite` + `empower`: service plus actionable proposal. |

## Seed Review Questions

Before implementation, review these by hand:

1. Are `inspire`, `unite`, `empower`, and `elevate` the correct OKR names to reuse for Pathway, or should Pathway only reference them internally?
2. Which of the seeded 2026 events are real launch candidates versus QA/demo data?
3. Decision: application-based events can be recommended only as apply/postulate actions, not as guaranteed seats or access.
4. Who approves each catalog row: national admin, chapter editor, or event owner?
5. What is the minimum evidence signal required before an event is allowed into Pathway?

## V1 Resource Type Decision

Use these in the first catalog seed:

- Upcoming LEAD/platform events.
- Chapter events.
- Application-based events only when the CTA is apply/postulate and the student is not promised selection.
- Profile, LinkedIn, and resume update actions.
- Growth reflection/proof actions.

Do not include these in V1:

- Talk to your chapter leader, VP, area director, or another named person.
- LEAD Professionals mentor/contact opportunities.
- LEAD HER, Ambassadors, or special programs.
- Past event materials as self-study.
- Random SharePoint documents.
- Sensitive internal, finance, legal, or board materials.

## Open Questions For Abigail

1. Which student segment should Pathway help first: new members, approved members, e-board, event attendees, or students applying to join? Decision: newly approved chapter members who are interested but unsure what to do next.
2. Which resource types are real enough to recommend today: events, documents, mentors, chapter leaders, WhatsApp/community actions, LinkedIn/profile actions, or proof actions?
3. Who is allowed to curate and approve catalog resources?
4. Should catalog resources be global-first, chapter-first, or both from day one?
5. What is the "one next move" students would immediately understand as valuable?
6. Which SharePoint folders are trustworthy sources versus messy archives?
7. What should never be recommended automatically?
