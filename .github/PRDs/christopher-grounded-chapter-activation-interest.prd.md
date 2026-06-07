# Christopher-Grounded Chapter Activation Interest PRD

## 1. Executive Summary

Christopher's review surfaced a product gap in the current student experience: students who are curious about bringing LEAD to their university need a guided first conversation, not a competitive application or a confusing chapter membership request. The current launch-ready student dashboard supports existing chapter applications, but it does not clearly answer what LEAD is, what activating LEAD at a university implies, whether a student can start alone, or what happens after they submit interest.

The MVP goal is to add a Spanish-first, source-grounded chapter activation interest path for active launch users. This path should collect reviewer-useful context without creating official chapter membership, chapter permissions, alumni state, or company/recruiter scope.

## 2. Mission

Help a student who is new to LEAD understand the opportunity in concrete language and start a low-pressure conversation about bringing LEAD to their university.

Core principles:

- Treat this as a first conversation, not a competitive application.
- Avoid internal-first terminology such as "chapter", "pilares", "LEAD Americas", or role jargon until explained.
- Be honest that bringing LEAD to a university requires active leadership, team-building, weekly time, and ongoing follow-up.
- Do not imply prior leadership experience is required.
- Keep chapter activation interest separate from approved chapter membership.
- Preserve the canonical account model: `chapter_membership` owns membership in an existing chapter; activation interest is a separate intake signal.

## 3. Target Users

### Student Exploring LEAD for the First Time

Pain points:

- They may not know if LEAD is a club, program, community, or something else.
- They may be blocked by broad questions about vision or impact.
- They may assume they need prior leadership experience.

Needs:

- A concrete explanation of LEAD.
- Examples of events, mentorship, opportunities, and peer community.
- Clear reassurance that initiative and willingness to learn matter more than a perfect plan.

### Student Interested in Bringing LEAD to Their University

Pain points:

- They may not know whether they can start alone.
- They may not understand the commitment level.
- They may not know what team structure is expected.

Needs:

- A realistic explanation of active leadership and team-building expectations.
- Questions that help them describe their university context and potential first steps.
- A clear "what happens next" promise.

### LEAD Reviewer

Pain points:

- They do not need a perfect plan from the student.
- They need enough context to decide whether the student needs orientation or is ready for activation steps.

Needs:

- Student identity and motivation.
- University and local context.
- Why LEAD may create value there.
- Whether the student already knows other interested people.
- Activities, problems, or opportunities the student sees.
- Willingness to assume long-term leadership and building.

## 4. MVP Scope

### In Scope

- [ ] Add a separate `chapter_activation_interest` table for first-conversation intake.
- [ ] Add a service-layer API for submitting and listing a user's activation interest.
- [ ] Add a thin server action for authenticated student submissions.
- [ ] Add Spanish-first student dashboard copy grounded in Christopher's recommendations.
- [ ] Add a form that asks reviewer-useful, concrete questions.
- [ ] Add "what happens next" copy after submission.
- [ ] Add tests for the service-layer business rules.
- [ ] Add focused validation for lint, type check, and service tests.

### Out of Scope

- [ ] Alumni experience.
- [ ] Company/recruiter flows.
- [ ] English copy polish beyond minimal non-broken fallback.
- [ ] Automated approval or chapter creation.
- [ ] Chapter leadership permissions.
- [ ] Adding a public anonymous activation form.
- [ ] Replacing existing chapter membership application for known chapters.

## 5. User Stories

1. As a student new to LEAD, I want a concrete explanation of what LEAD is, so that I understand whether it is relevant to my university.

2. As a student interested in bringing LEAD to my university, I want to understand the commitment, so that I do not submit interest based on a vague idea.

3. As a student without prior leadership experience, I want reassurance that initiative and willingness to learn are enough to start a conversation, so that I do not self-disqualify.

4. As a student exploring alone, I want to say whether I already know other interested people, so that LEAD can understand whether I need orientation or activation support.

5. As a LEAD reviewer, I want structured answers about motivation, university context, value, team status, opportunities, and long-term willingness, so that I can triage the next step.

6. As a student after submitting interest, I want to know what happens next, so that I am not left uncertain.

## 6. Core Architecture & Patterns

### Existing Patterns to Follow

- Server Actions stay thin: auth, validation, service call, revalidation.
- Business logic lives in `lib/services/`.
- Student dashboard uses server components for main data and client components only for interactive forms.
- Supabase schema changes use migrations and generated database types.
- Service tests live in `lib/services/__tests__/`.

### Proposed Files

```text
supabase/migrations/{timestamp}_add_chapter_activation_interest.sql
lib/services/chapter-activation-interest.service.ts
lib/services/__tests__/chapter-activation-interest.service.test.ts
lib/actions/student/chapter-activation-interest.ts
app/[locale]/student/_components/chapter-activation-interest-card.tsx
app/[locale]/student/page.tsx
.github/plans/...
.github/reports/...
```

## 7. Tools/Features

### Feature: Activation Interest Data Model

Create `chapter_activation_interest` as a separate intake table.

Recommended columns:

- `id`
- `user_id`
- `university_name`
- `motivation`
- `university_context`
- `lead_value`
- `team_status`
- `interested_people_context`
- `opportunities`
- `long_term_commitment`
- `status`
- `review_notes`
- `created_at`
- `updated_at`

Allowed statuses:

- `submitted`
- `orientation_needed`
- `ready_for_activation`
- `closed`

### Feature: First-Conversation Form

Spanish-first fields:

- "Que te motivo a acercarte a LEAD?"
- "En que universidad estudias y como describirias tu contexto?"
- "Por que crees que LEAD podria aportar valor en tu comunidad universitaria?"
- "Ya conoces a otras personas interesadas o estas explorando la idea de manera individual?"
- "Que actividades, problemas u oportunidades ves en tu universidad?"
- "Que tan dispuesto/a estas a asumir un rol de liderazgo y construccion a largo plazo?"

### Feature: Student-Friendly Copy

The dashboard should explain:

- LEAD as a student community with events, mentorship, opportunities, and network.
- Bringing LEAD requires active leadership, building a team, weekly time, and follow-up.
- Students can begin the conversation even without prior organization leadership.
- The form is not a competitive application.
- After submission, LEAD reviews, contacts the student, and guides the next step.

## 8. Technology Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Supabase
- Tailwind CSS 4
- Radix/custom UI primitives
- Vitest
- pnpm

## 9. Security & Configuration

- Only authenticated users can submit activation interest in MVP.
- A user can have one active submitted interest at a time.
- Submitting activation interest does not create membership, permissions, member ID, or chapter identity.
- Student can view their own latest submitted interest.
- Admin review UI is deferred unless explicitly scoped later.

## 10. API Specification

### Server Action: `submitChapterActivationInterest(formData)`

Input fields:

- `university_name`
- `motivation`
- `university_context`
- `lead_value`
- `team_status`
- `interested_people_context`
- `opportunities`
- `long_term_commitment`

Success:

```ts
{ success: true }
```

Failure:

```ts
{ success: false; error: string }
```

### Service: `ChapterActivationInterestService.submitInterest`

Behavior:

- Validates user id and required fields.
- Rejects duplicate active submitted interest.
- Inserts a `submitted` row.
- Returns structured success/failure.

## 11. Success Criteria

- Student dashboard clearly distinguishes existing chapter application from bringing LEAD to a new university.
- Students see a concrete explanation of LEAD before the form.
- Students see realistic commitment expectations before submitting.
- Students are reassured that prior leadership experience is not required.
- Submitted interest is stored outside `chapter_membership`.
- Service tests cover success, duplicate active interest, and validation failure.
- `pnpm exec tsc --noEmit`, `pnpm lint`, and focused Vitest pass.

## 12. Implementation Phases

### Phase 1: Product and Issue Setup

- Create this PRD.
- Create implementation issues.
- Attach source-of-truth references from SharePoint and Christopher's reviewer feedback.

### Phase 2: Data and Service Foundation

- Add migration/table.
- Update generated types.
- Add service and tests.

### Phase 3: Student Dashboard First-Conversation UX

- Add client form component.
- Add server action.
- Update dashboard copy and layout.

### Phase 4: Validation and Documentation

- Run focused validation.
- Add implementation report.
- Update issues and PR comments.

## 13. Future Considerations

- Admin review queue for submitted activation interests.
- Email notification to LEAD staff after submission.
- Orientation scheduling.
- Conversion from activation interest to formal chapter creation workflow.
- Public anonymous "bring LEAD to my university" landing flow.
- English copy polish after Spanish-first launch.

## 14. Risks & Mitigations

### Risk: Confusing Activation Interest With Membership

Mitigation: Use a separate table and explicitly state that this does not create a chapter membership.

### Risk: Form Feels Like Competitive Application

Mitigation: Use first-conversation copy and question wording directly grounded in Christopher's feedback.

### Risk: Students Underestimate Commitment

Mitigation: Include concrete expectation copy before submission.

### Risk: Internal Terms Confuse New Students

Mitigation: Define LEAD in plain language before using "capitulo" or other internal terms.

### Risk: Scope Creep Into Admin Review

Mitigation: Store reviewer-ready data now; defer admin queue unless separately planned.

## 15. Appendix

### Christopher Feedback Inputs

- Students ask what LEAD is when descriptions are too abstract.
- Students need clarity on commitment to bring LEAD to a university.
- Students need to know whether they can start alone and what team structure is expected.
- Broad vision/impact questions can block early-stage students.
- Internal terms can confuse newcomers.
- Prior leadership experience should not be implied as required.
- Reviewers need motivation, university context, expected value, team status, opportunities, and long-term willingness.
- Students need a clear explanation of what happens after submission.
- The form should feel like a first conversation, not a competitive application.

### SharePoint Source References

- `LEAD Mission & Vision 2025.docx`
  `Shared Documents/LEAD Peru/0. LEAD Marketing & Presentations/Content/Mission & Vision/`
- `FINAL Lead Bylaws.docx`
  `Shared Documents/LEAD Peru/LEAD Peru Docs/Chapters/Onboarding/`
- `FINAL Chapter Agreement  LEAD.docx`
  `Shared Documents/LEAD Peru/LEAD Peru Docs/Chapters/Onboarding/`
- `LEAD Talent Platform.docx`
  `Shared Documents/LEAD Americas Board/Digital transformation/`
- `Validacion.docx` and `Informa de validacion.pdf`
  `Shared Documents/LEAD Americas Board/Digital transformation/Talent platform/`
- `LEAD - Discover Day.docx`
  `Shared Documents/LEAD Peru/8. LEAD Discover Events/July 2025/`
